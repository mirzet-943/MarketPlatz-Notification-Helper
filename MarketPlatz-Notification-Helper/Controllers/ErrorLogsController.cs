using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketPlatz_Notification_Helper.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ErrorLogsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public ErrorLogsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<ErrorLog>>> GetAll([FromQuery] int limit = 100)
    {
        var logs = await _dbContext.ErrorLogs
            .OrderByDescending(l => l.Timestamp)
            .Take(limit)
            .ToListAsync();

        return Ok(logs);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var log = await _dbContext.ErrorLogs.FindAsync(id);
        if (log == null)
            return NotFound();

        _dbContext.ErrorLogs.Remove(log);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("clear")]
    public async Task<ActionResult> ClearAll()
    {
        await _dbContext.Database.ExecuteSqlRawAsync("DELETE FROM ErrorLogs");
        return NoContent();
    }
}
