using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Models;
using Microsoft.EntityFrameworkCore;

namespace MarketPlatz_Notification_Helper.Services;

public class MonitorService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MonitorService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);
    private readonly TimeSpan _maxListingAge = TimeSpan.FromHours(24); // Only notify about listings from last 24 hours (API already filters to today)

    public MonitorService(IServiceProvider serviceProvider, ILogger<MonitorService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Monitor Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAllJobsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in monitor service");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task CheckAllJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var apiClient = scope.ServiceProvider.GetRequiredService<MarktplaatsApiClient>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
        var telegramService = scope.ServiceProvider.GetRequiredService<TelegramService>();

        var activeJobs = await dbContext.MonitorJobs
            .Include(j => j.Filters)
            .Where(j => j.IsActive)
            .ToListAsync(cancellationToken);

        _logger.LogInformation("Checking {Count} active jobs", activeJobs.Count);

        foreach (var job in activeJobs)
        {
            try
            {
                await CheckJobAsync(job, dbContext, apiClient, emailService, telegramService, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking job {JobId} - {JobName}", job.Id, job.Name);
                await LogErrorAsync(dbContext, $"Job check failed: {ex.Message}", "MonitorService", job.Id, ex.StackTrace);
            }
        }
    }

    private async Task CheckJobAsync(
        MonitorJob job,
        AppDbContext dbContext,
        MarktplaatsApiClient apiClient,
        EmailService emailService,
        TelegramService telegramService,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Checking job {JobId} - {JobName}", job.Id, job.Name);

        var searchResponse = await apiClient.SearchListingsAsync(job.Filters, cancellationToken);

        if (searchResponse?.Listings == null || !searchResponse.Listings.Any())
        {
            _logger.LogWarning("No listings found for job {JobId} - {JobName}", job.Id, job.Name);
            job.LastRunAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        // Get already notified listings for this job
        var notifiedListingIds = await dbContext.ListingLogs
            .Where(l => l.MonitorJobId == job.Id)
            .Select(l => l.ListingId)
            .ToListAsync(cancellationToken);

        var now = DateTime.Now;
        var oldestAllowedDate = now - _maxListingAge;

        // Filter out listings we've already seen AND listings that are too old
        var newListings = searchResponse.Listings
            .Where(l => !notifiedListingIds.Contains(l.ItemId))
            .Select(l => new { Listing = l, ParsedDate = ParseListingDate(l.Date) })
            .Where(x => x.ParsedDate >= oldestAllowedDate)
            .Select(x => x.Listing)
            .ToList();

        _logger.LogInformation("Found {Count} new listings from last {Hours} hours",
            newListings.Count, _maxListingAge.TotalHours);

        // Check if this is the first run (initial setup)
        var isFirstRun = job.LastRunAt == null;

        if (newListings.Any())
        {
            _logger.LogInformation("Found {Count} new listings for job {JobId} - {JobName}",
                newListings.Count, job.Id, job.Name);

            // If first run and found many listings (>10), skip email but log them
            // This prevents spam when setting up a new job
            var shouldSendEmail = !isFirstRun || newListings.Count <= 10;

            if (shouldSendEmail)
            {
                // Send email notification
                await emailService.SendNewListingNotificationAsync(job.EmailTo, job, newListings);
                _logger.LogInformation("Email notification sent to {Email}", job.EmailTo);

                // Send Telegram notification
                await telegramService.SendNewListingNotificationAsync(job.TelegramChatId, job, newListings);
            }
            else
            {
                _logger.LogInformation("First run with {Count} listings - skipping notifications, will notify on next run", newListings.Count);
            }

            // Log the new listings
            foreach (var listing in newListings)
            {
                var listingLog = new ListingLog
                {
                    MonitorJobId = job.Id,
                    ListingId = listing.ItemId,
                    Title = listing.Title,
                    Description = listing.Description ?? "",
                    Price = listing.PriceInfo?.PriceCents / 100.0m,
                    ImageUrl = listing.ImageUrls?.FirstOrDefault(),
                    Url = $"https://www.marktplaats.nl{listing.VipUrl}",
                    ListingCreatedAt = ParseListingDate(listing.Date),
                    NotifiedAt = DateTime.UtcNow
                };

                dbContext.ListingLogs.Add(listingLog);
            }

            // Update job with last listing info
            var latestListing = newListings.First();
            job.LastListingId = latestListing.ItemId;
            job.LastListingDate = ParseListingDate(latestListing.Date);
        }
        else
        {
            _logger.LogInformation("No new listings for job {JobId} - {JobName}", job.Id, job.Name);
        }

        job.LastRunAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private DateTime ParseListingDate(string dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString))
            return DateTime.UtcNow;

        var now = DateTime.Now;
        dateString = dateString.Trim().ToLower();

        try
        {
            // "Vandaag HH:mm" (Today)
            if (dateString.StartsWith("vandaag"))
            {
                var timePart = dateString.Replace("vandaag", "").Trim();
                if (TimeSpan.TryParse(timePart, out var time))
                {
                    return new DateTime(now.Year, now.Month, now.Day, time.Hours, time.Minutes, 0);
                }
                return now;
            }

            // "Gisteren HH:mm" (Yesterday)
            if (dateString.StartsWith("gisteren"))
            {
                var timePart = dateString.Replace("gisteren", "").Trim();
                var yesterday = now.AddDays(-1);
                if (TimeSpan.TryParse(timePart, out var time))
                {
                    return new DateTime(yesterday.Year, yesterday.Month, yesterday.Day, time.Hours, time.Minutes, 0);
                }
                return yesterday;
            }

            // "DD mmm" format like "20 jan", "5 jun"
            var parts = dateString.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2 && int.TryParse(parts[0], out var day))
            {
                var monthStr = parts[1].ToLower();
                var monthMap = new Dictionary<string, int>
                {
                    {"jan", 1}, {"feb", 2}, {"mrt", 3}, {"maa", 3}, {"apr", 4}, {"mei", 5}, {"jun", 6},
                    {"jul", 7}, {"aug", 8}, {"sep", 9}, {"okt", 10}, {"nov", 11}, {"dec", 12}
                };

                if (monthMap.TryGetValue(monthStr, out var month))
                {
                    var year = now.Year;
                    // If the month is in the future, it must be from last year
                    if (month > now.Month || (month == now.Month && day > now.Day))
                    {
                        year--;
                    }
                    return new DateTime(year, month, day, 0, 0, 0);
                }
            }
        }
        catch
        {
            // If parsing fails, return current time
        }

        return DateTime.UtcNow;
    }

    private async Task LogErrorAsync(AppDbContext dbContext, string message, string source, int? jobId = null, string? stackTrace = null)
    {
        try
        {
            var errorLog = new ErrorLog
            {
                Timestamp = DateTime.UtcNow,
                Level = "Error",
                Message = message,
                StackTrace = stackTrace,
                Source = source,
                MonitorJobId = jobId
            };

            dbContext.ErrorLogs.Add(errorLog);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log error to database");
        }
    }
}
