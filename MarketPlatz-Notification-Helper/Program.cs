using MarketPlatz_Notification_Helper.Data;
using MarketPlatz_Notification_Helper.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
builder.Services.AddScoped<MarktplaatsApiClient>();

// Add Background Service
builder.Services.AddHostedService<MonitorService>();

var app = builder.Build();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseStaticFiles();

app.MapControllers();

// Serve frontend
app.MapFallbackToFile("index.html");

app.Run("http://0.0.0.0:8099");