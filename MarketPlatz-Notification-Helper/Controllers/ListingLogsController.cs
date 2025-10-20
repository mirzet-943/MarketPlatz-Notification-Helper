using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketPlatz_Notification_Helper.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingLogsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public ListingLogsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<ListingLog>>> GetAll([FromQuery] int? jobId = null, [FromQuery] int limit = 100)
    {
        var query = _dbContext.ListingLogs.AsQueryable();

        if (jobId.HasValue)
        {
            query = query.Where(l => l.MonitorJobId == jobId.Value);
        }

        var logs = await query
            .OrderByDescending(l => l.NotifiedAt)
            .Take(limit)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<object>> GetStats()
    {
        var totalListings = await _dbContext.ListingLogs.CountAsync();
        var last24Hours = await _dbContext.ListingLogs
            .Where(l => l.NotifiedAt >= DateTime.UtcNow.AddHours(-24))
            .CountAsync();

        var byJob = await _dbContext.ListingLogs
            .GroupBy(l => l.MonitorJobId)
            .Select(g => new
            {
                JobId = g.Key,
                Count = g.Count(),
                LastNotified = g.Max(l => l.NotifiedAt)
            })
            .ToListAsync();

        return Ok(new
        {
            TotalListings = totalListings,
            Last24Hours = last24Hours,
            ByJob = byJob
        });
    }
}
