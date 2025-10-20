using Microsoft.AspNetCore.Mvc;

namespace MarketPlatz_Notification_Helper.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string AdminUsername = "admin";
    private const string AdminPassword = "admin123";
    private const string SessionKey = "IsAuthenticated";

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (request.Username == AdminUsername && request.Password == AdminPassword)
        {
            HttpContext.Session.SetString(SessionKey, "true");
            return Ok(new { success = true, message = "Login successful" });
        }

        return Unauthorized(new { success = false, message = "Invalid credentials" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return Ok(new { success = true, message = "Logged out" });
    }

    [HttpGet("status")]
    public IActionResult Status()
    {
        var isAuthenticated = HttpContext.Session.GetString(SessionKey) == "true";
        return Ok(new { isAuthenticated });
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
