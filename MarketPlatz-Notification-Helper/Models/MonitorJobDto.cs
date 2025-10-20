namespace MarketPlatz_Notification_Helper.Models;

public class MonitorJobDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmailTo { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastRunAt { get; set; }
    public string? LastListingId { get; set; }
    public DateTime? LastListingDate { get; set; }
    public List<JobFilterDto>? Filters { get; set; }
}

public class JobFilterDto
{
    public string FilterType { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
