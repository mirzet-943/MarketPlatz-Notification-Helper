namespace MarketPlatz_Notification_Helper.Models;

public class ErrorLog
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    public string Level { get; set; } = string.Empty; // Error, Warning, Info
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Source { get; set; } // MonitorService, API, etc.
    public int? MonitorJobId { get; set; }
    public int? StatusCode { get; set; }
}
