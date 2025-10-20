namespace MarketPlatz_Notification_Helper.Models;

public class JobFilter
{
    public int Id { get; set; }
    public int MonitorJobId { get; set; }
    public string FilterType { get; set; } = string.Empty; // e.g., "AttributeRange", "AttributeById", "AttributeByKey", "Query", etc.
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;

    // Navigation property
    public MonitorJob MonitorJob { get; set; } = null!;
}
