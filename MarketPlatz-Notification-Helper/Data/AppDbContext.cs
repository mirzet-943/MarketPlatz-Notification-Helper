using MarketPlatz_Notification_Helper.Models;
using Microsoft.EntityFrameworkCore;

namespace MarketPlatz_Notification_Helper.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<MonitorJob> MonitorJobs { get; set; }
    public DbSet<JobFilter> JobFilters { get; set; }
    public DbSet<ListingLog> ListingLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<MonitorJob>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EmailTo).IsRequired().HasMaxLength(500);
            entity.HasMany(e => e.Filters)
                .WithOne(e => e.MonitorJob)
                .HasForeignKey(e => e.MonitorJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<JobFilter>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FilterType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Key).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Value).IsRequired().HasMaxLength(500);
        });

        modelBuilder.Entity<ListingLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ListingId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.MonitorJob)
                .WithMany()
                .HasForeignKey(e => e.MonitorJobId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.MonitorJobId, e.ListingId });
        });
    }
}
