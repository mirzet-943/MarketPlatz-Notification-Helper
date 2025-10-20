namespace MarketPlatz_Notification_Helper.Models;

public class ListingLog
{
    public int Id { get; set; }
    public int MonitorJobId { get; set; }
    public string ListingId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? Url { get; set; }
    public DateTime ListingCreatedAt { get; set; }
    public DateTime NotifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public MonitorJob MonitorJob { get; set; } = null!;
}
