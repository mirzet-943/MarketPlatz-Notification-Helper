using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Middleware;
using MarketPlatz_Notification_Helper.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Session support
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromHours(24);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add DbContext with SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=marktplaats.db"));

// Add HttpClient for MarktplaatsApiClient
builder.Services.AddHttpClient<MarktplaatsApiClient>();

// Add Services
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<TelegramService>();
builder.Services.AddScoped<MarktplaatsApiClient>();

// Add Background Service
builder.Services.AddHostedService<MonitorService>();

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Create ErrorLogs table if it doesn't exist
    var connection = db.Database.GetDbConnection();
    connection.Open();
    using var command = connection.CreateCommand();
    command.CommandText = @"
        CREATE TABLE IF NOT EXISTS ErrorLogs (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Timestamp TEXT NOT NULL,
            Level TEXT NOT NULL,
            Message TEXT NOT NULL,
            StackTrace TEXT,
            Source TEXT,
            MonitorJobId INTEGER,
            StatusCode INTEGER
        );
        CREATE INDEX IF NOT EXISTS IX_ErrorLogs_Timestamp ON ErrorLogs(Timestamp);
    ";
    command.ExecuteNonQuery();
    connection.Close();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseSession();

app.UseMiddleware<AuthMiddleware>();

app.UseStaticFiles();

app.MapControllers();

// Serve frontend
app.MapFallbackToFile("index.html");

app.Run("http://0.0.0.0:8099");