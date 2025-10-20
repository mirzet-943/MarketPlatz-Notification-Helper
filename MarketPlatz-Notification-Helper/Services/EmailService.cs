using MailKit.Net.Smtp;
using MimeKit;
using MarketPlatz_Notification_Helper.Models;

namespace MarketPlatz_Notification_Helper.Services;

public class EmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendNewListingNotificationAsync(string toEmail, MonitorJob job, List<MarktplaatsListing> newListings)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _configuration["Email:FromName"] ?? "Marktplaats Monitor",
                _configuration["Email:FromAddress"] ?? "noreply@example.com"
            ));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = $"New Car Listings Alert - {job.Name}";

            var bodyBuilder = new BodyBuilder();
            var htmlBody = BuildHtmlBody(job, newListings);
            bodyBuilder.HtmlBody = htmlBody;

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            var smtpHost = _configuration["Email:SmtpHost"];
            var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            var smtpUser = _configuration["Email:SmtpUser"];
            var smtpPass = _configuration["Email:SmtpPassword"];

            if (string.IsNullOrEmpty(smtpHost))
            {
                _logger.LogWarning("SMTP not configured. Email would be sent to {Email}", toEmail);
                _logger.LogInformation("Email content: {Subject}", message.Subject);
                return;
            }

            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);

            if (!string.IsNullOrEmpty(smtpUser) && !string.IsNullOrEmpty(smtpPass))
            {
                await client.AuthenticateAsync(smtpUser, smtpPass);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email} for job {JobName}", toEmail, job.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", toEmail);
        }
    }

    private string BuildHtmlBody(MonitorJob job, List<MarktplaatsListing> listings)
    {
        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #e30613; color: white; padding: 20px; text-align: center; }}
        .listing {{ border: 1px solid #ddd; margin: 20px 0; padding: 15px; border-radius: 5px; }}
        .listing img {{ max-width: 100%; height: auto; }}
        .price {{ font-size: 24px; color: #e30613; font-weight: bold; }}
        .button {{ background-color: #e30613; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>New Car Listings Found!</h1>
            <p>Job: {job.Name}</p>
        </div>
        <p>We found {listings.Count} new car listing(s) matching your criteria:</p>";

        foreach (var listing in listings)
        {
            var price = listing.PriceInfo?.PriceCents != null
                ? $"€{listing.PriceInfo.PriceCents / 100.0:N2}"
                : "Price not available";

            var imageUrl = listing.ImageUrls?.FirstOrDefault() ?? "";
            var imageHtml = !string.IsNullOrEmpty(imageUrl)
                ? $"<img src='{imageUrl}' alt='{listing.Title}' />"
                : "";

            var description = !string.IsNullOrEmpty(listing.Description) && listing.Description.Length > 200
                ? listing.Description.Substring(0, 200) + "..."
                : listing.Description ?? "";

            html += $@"
        <div class='listing'>
            {imageHtml}
            <h2>{listing.Title}</h2>
            <p class='price'>{price}</p>
            <p>{description}</p>
            <p><strong>Posted:</strong> {listing.Date}</p>
            <a href='https://www.marktplaats.nl{listing.VipUrl}' class='button'>View Listing</a>
        </div>";
        }

        html += @"
    </div>
</body>
</html>";

        return html;
    }
}
