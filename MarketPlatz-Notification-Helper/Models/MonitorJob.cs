namespace MarketPlatz_Notification_Helper.Models;

public class MonitorJob
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmailTo { get; set; } = string.Empty;
    public string? TelegramChatId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastRunAt { get; set; }
    public string? LastListingId { get; set; }
    public DateTime? LastListingDate { get; set; }

    // Navigation property
    public List<JobFilter> Filters { get; set; } = new();
}
