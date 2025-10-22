using MarketPlatz_Notification_Helper.Models;
using Telegram.Bot;
using Telegram.Bot.Types.Enums;

namespace MarketPlatz_Notification_Helper.Services;

public class TelegramService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TelegramService> _logger;
    private readonly TelegramBotClient? _botClient;

    public TelegramService(IConfiguration configuration, ILogger<TelegramService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var botToken = _configuration["Telegram:BotToken"];
        if (!string.IsNullOrEmpty(botToken) && botToken != "YOUR_BOT_TOKEN_HERE")
        {
            _botClient = new TelegramBotClient(botToken);
        }
    }

    public async Task SendNewListingNotificationAsync(string? chatId, MonitorJob job, List<MarktplaatsListing> newListings)
    {
        try
        {
            // Use job-specific chat ID if provided, otherwise fall back to default
            var targetChatId = !string.IsNullOrEmpty(chatId)
                ? chatId
                : _configuration["Telegram:DefaultChatId"];

            if (string.IsNullOrEmpty(targetChatId) || targetChatId == "YOUR_CHAT_ID_HERE")
            {
                _logger.LogWarning("Telegram chat ID not configured for job {JobName}. Notification skipped.", job.Name);
                return;
            }

            if (_botClient == null)
            {
                _logger.LogWarning("Telegram bot not configured. Notification would be sent to chat {ChatId}", targetChatId);
                return;
            }

            var message = BuildMessage(job, newListings);

            await _botClient.SendMessage(
                chatId: targetChatId,
                text: message,
                parseMode: ParseMode.Html
            );

            _logger.LogInformation("Telegram notification sent successfully to {ChatId} for job {JobName}", targetChatId, job.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending Telegram notification to chat {ChatId}", chatId);
        }
    }

    private string BuildMessage(MonitorJob job, List<MarktplaatsListing> listings)
    {
        var message = $"🚗 <b>New Car Listings Found!</b>\n";
        message += $"📋 Job: <b>{job.Name}</b>\n";
        message += $"📊 Found {listings.Count} new listing(s)\n\n";

        foreach (var listing in listings.Take(10)) // Limit to 10 to avoid message being too long
        {
            var price = listing.PriceInfo?.PriceCents != null
                ? $"€{listing.PriceInfo.PriceCents / 100.0:N2}"
                : "Price not available";

            var description = !string.IsNullOrEmpty(listing.Description) && listing.Description.Length > 150
                ? listing.Description.Substring(0, 150) + "..."
                : listing.Description ?? "";

            // Remove HTML tags from description
            description = System.Text.RegularExpressions.Regex.Replace(description, "<.*?>", string.Empty);

            message += $"━━━━━━━━━━━━━━━━━━━━\n";
            message += $"<b>{listing.Title}</b>\n";
            message += $"💰 <b>{price}</b>\n";
            message += $"📅 {listing.Date}\n";
            if (!string.IsNullOrEmpty(description))
            {
                message += $"\n{description}\n";
            }
            message += $"\n🔗 <a href=\"https://www.marktplaats.nl{listing.VipUrl}\">View Listing</a>\n\n";
        }

        if (listings.Count > 10)
        {
            message += $"... and {listings.Count - 10} more listings\n";
        }

        return message;
    }
}
