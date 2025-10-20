namespace MarketPlatz_Notification_Helper.Middleware;

public class AuthMiddleware
{
    private readonly RequestDelegate _next;

    public AuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Allow these paths without authentication
        if (path.StartsWith("/api/auth") ||
            path == "/" ||
            path.StartsWith("/css") ||
            path.StartsWith("/js") ||
            path.StartsWith("/index.html"))
        {
            await _next(context);
            return;
        }

        // Check if user is authenticated for API calls
        if (path.StartsWith("/api/"))
        {
            var isAuthenticated = context.Session.GetString("IsAuthenticated") == "true";

            if (!isAuthenticated)
            {
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"error\": \"Unauthorized. Please login first.\"}");
                return;
            }
        }

        await _next(context);
    }
}
