using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Models;
using MarketPlatz_Notification_Helper.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketPlatz_Notification_Helper.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitorJobsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MonitorJobsController> _logger;
    private readonly MarktplaatsApiClient _apiClient;

    public MonitorJobsController(AppDbContext dbContext, ILogger<MonitorJobsController> logger, MarktplaatsApiClient apiClient)
    {
        _dbContext = dbContext;
        _logger = logger;
        _apiClient = apiClient;
    }

    [HttpGet]
    public async Task<ActionResult<List<MonitorJobDto>>> GetAll()
    {
        var jobs = await _dbContext.MonitorJobs
            .Include(j => j.Filters)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        // Map entities to DTOs to avoid circular references
        var jobDtos = jobs.Select(job => new MonitorJobDto
        {
            Id = job.Id,
            Name = job.Name,
            EmailTo = job.EmailTo,
            TelegramChatId = job.TelegramChatId,
            IsActive = job.IsActive,
            CreatedAt = job.CreatedAt,
            LastRunAt = job.LastRunAt,
            LastListingId = job.LastListingId,
            LastListingDate = job.LastListingDate,
            Filters = job.Filters?.Select(f => new JobFilterDto
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList()
        }).ToList();

        return Ok(jobDtos);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MonitorJobDto>> GetById(int id)
    {
        var job = await _dbContext.MonitorJobs
            .Include(j => j.Filters)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null)
            return NotFound();

        // Map entity to DTO to avoid circular references
        var jobDto = new MonitorJobDto
        {
            Id = job.Id,
            Name = job.Name,
            EmailTo = job.EmailTo,
            TelegramChatId = job.TelegramChatId,
            IsActive = job.IsActive,
            CreatedAt = job.CreatedAt,
            LastRunAt = job.LastRunAt,
            LastListingId = job.LastListingId,
            LastListingDate = job.LastListingDate,
            Filters = job.Filters?.Select(f => new JobFilterDto
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList()
        };

        return Ok(jobDto);
    }

    [HttpPost]
    public async Task<ActionResult<MonitorJobDto>> Create([FromBody] MonitorJobDto jobDto)
    {
        // Check if maximum number of jobs (5) has been reached
        var jobCount = await _dbContext.MonitorJobs.CountAsync();
        if (jobCount >= 5)
        {
            return BadRequest(new { error = "Maximum number of jobs (5) has been reached. Please delete an existing job first." });
        }

        var job = new MonitorJob
        {
            Name = jobDto.Name,
            EmailTo = jobDto.EmailTo,
            TelegramChatId = jobDto.TelegramChatId,
            IsActive = jobDto.IsActive,
            CreatedAt = DateTime.UtcNow,
            Filters = jobDto.Filters?.Select(f => new JobFilter
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList() ?? new List<JobFilter>()
        };

        _dbContext.MonitorJobs.Add(job);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created new monitor job: {JobId} - {JobName}", job.Id, job.Name);

        // Map entity back to DTO to avoid circular references
        var resultDto = new MonitorJobDto
        {
            Id = job.Id,
            Name = job.Name,
            EmailTo = job.EmailTo,
            TelegramChatId = job.TelegramChatId,
            IsActive = job.IsActive,
            CreatedAt = job.CreatedAt,
            LastRunAt = job.LastRunAt,
            LastListingId = job.LastListingId,
            LastListingDate = job.LastListingDate,
            Filters = job.Filters?.Select(f => new JobFilterDto
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList()
        };

        return CreatedAtAction(nameof(GetById), new { id = job.Id }, resultDto);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MonitorJobDto>> Update(int id, [FromBody] MonitorJobDto jobDto)
    {
        if (id != jobDto.Id)
            return BadRequest();

        var existingJob = await _dbContext.MonitorJobs
            .Include(j => j.Filters)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (existingJob == null)
            return NotFound();

        existingJob.Name = jobDto.Name;
        existingJob.EmailTo = jobDto.EmailTo;
        existingJob.TelegramChatId = jobDto.TelegramChatId;
        existingJob.IsActive = jobDto.IsActive;

        // Update filters
        _dbContext.JobFilters.RemoveRange(existingJob.Filters);

        existingJob.Filters = jobDto.Filters?.Select(f => new JobFilter
        {
            FilterType = f.FilterType,
            Key = f.Key,
            Value = f.Value
        }).ToList() ?? new List<JobFilter>();

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated monitor job: {JobId} - {JobName}", jobDto.Id, jobDto.Name);

        // Map entity back to DTO to avoid circular references
        var resultDto = new MonitorJobDto
        {
            Id = existingJob.Id,
            Name = existingJob.Name,
            EmailTo = existingJob.EmailTo,
            TelegramChatId = existingJob.TelegramChatId,
            IsActive = existingJob.IsActive,
            CreatedAt = existingJob.CreatedAt,
            LastRunAt = existingJob.LastRunAt,
            LastListingId = existingJob.LastListingId,
            LastListingDate = existingJob.LastListingDate,
            Filters = existingJob.Filters?.Select(f => new JobFilterDto
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList()
        };

        return Ok(resultDto);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var job = await _dbContext.MonitorJobs.FindAsync(id);

        if (job == null)
            return NotFound();

        _dbContext.MonitorJobs.Remove(job);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted monitor job: {JobId} - {JobName}", job.Id, job.Name);

        return NoContent();
    }

    [HttpPost("{id}/toggle")]
    public async Task<ActionResult<MonitorJobDto>> ToggleActive(int id)
    {
        var job = await _dbContext.MonitorJobs
            .Include(j => j.Filters)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null)
            return NotFound();

        job.IsActive = !job.IsActive;
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Toggled monitor job {JobId} to {IsActive}", job.Id, job.IsActive);

        // Map entity to DTO to avoid circular references
        var jobDto = new MonitorJobDto
        {
            Id = job.Id,
            Name = job.Name,
            EmailTo = job.EmailTo,
            TelegramChatId = job.TelegramChatId,
            IsActive = job.IsActive,
            CreatedAt = job.CreatedAt,
            LastRunAt = job.LastRunAt,
            LastListingId = job.LastListingId,
            LastListingDate = job.LastListingDate,
            Filters = job.Filters?.Select(f => new JobFilterDto
            {
                FilterType = f.FilterType,
                Key = f.Key,
                Value = f.Value
            }).ToList()
        };

        return Ok(jobDto);
    }

    [HttpPost("{id}/test")]
    public async Task<ActionResult> TestSearch(int id)
    {
        var job = await _dbContext.MonitorJobs
            .Include(j => j.Filters)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null)
            return NotFound();

        try
        {
            _logger.LogInformation("Testing search for job {JobId} - {JobName}", job.Id, job.Name);

            var searchResponse = await _apiClient.SearchListingsAsync(job.Filters);

            if (searchResponse == null)
            {
                // Log error
                await LogError("API returned null response", "MonitorJobsController.TestSearch", job.Id, null);
                return Ok(new { success = false, error = "API returned null response", listings = Array.Empty<object>() });
            }

            if (searchResponse.Listings == null || !searchResponse.Listings.Any())
            {
                return Ok(new { success = true, message = "No listings found", listings = Array.Empty<object>(), totalCount = 0 });
            }

            _logger.LogInformation("Test search successful: {Count} listings found", searchResponse.Listings.Count);

            return Ok(new
            {
                success = true,
                message = $"Found {searchResponse.Listings.Count} listings",
                totalCount = searchResponse.TotalResultCount,
                listings = searchResponse.Listings.Take(10).Select(l => new
                {
                    itemId = l.ItemId,
                    title = l.Title,
                    description = l.Description,
                    price = l.PriceInfo?.PriceCents / 100.0m,
                    imageUrl = l.ImageUrls?.FirstOrDefault(),
                    url = $"https://www.marktplaats.nl{l.VipUrl}",
                    date = l.Date
                })
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing search for job {JobId}", job.Id);
            await LogError($"Test search failed: {ex.Message}", "MonitorJobsController.TestSearch", job.Id, null, ex.StackTrace);
            return Ok(new { success = false, error = ex.Message, listings = Array.Empty<object>() });
        }
    }

    private async Task LogError(string message, string source, int? jobId = null, int? statusCode = null, string? stackTrace = null)
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
                MonitorJobId = jobId,
                StatusCode = statusCode
            };

            _dbContext.ErrorLogs.Add(errorLog);
            await _dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to log error to database");
        }
    }
}
