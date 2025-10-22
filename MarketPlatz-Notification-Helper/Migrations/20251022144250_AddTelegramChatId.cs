using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MarketPlatz_Notification_Helper.Migrations
{
    /// <inheritdoc />
    public partial class AddTelegramChatId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ErrorLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Level = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    StackTrace = table.Column<string>(type: "TEXT", nullable: true),
                    Source = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    MonitorJobId = table.Column<int>(type: "INTEGER", nullable: true),
                    StatusCode = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ErrorLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MonitorJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    EmailTo = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    TelegramChatId = table.Column<string>(type: "TEXT", nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    LastRunAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastListingId = table.Column<string>(type: "TEXT", nullable: true),
                    LastListingDate = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonitorJobs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "JobFilters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MonitorJobId = table.Column<int>(type: "INTEGER", nullable: false),
                    FilterType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Value = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobFilters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobFilters_MonitorJobs_MonitorJobId",
                        column: x => x.MonitorJobId,
                        principalTable: "MonitorJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ListingLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MonitorJobId = table.Column<int>(type: "INTEGER", nullable: false),
                    ListingId = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Price = table.Column<decimal>(type: "TEXT", nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    Url = table.Column<string>(type: "TEXT", nullable: true),
                    ListingCreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NotifiedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ListingLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ListingLogs_MonitorJobs_MonitorJobId",
                        column: x => x.MonitorJobId,
                        principalTable: "MonitorJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ErrorLogs_Timestamp",
                table: "ErrorLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_JobFilters_MonitorJobId",
                table: "JobFilters",
                column: "MonitorJobId");

            migrationBuilder.CreateIndex(
                name: "IX_ListingLogs_MonitorJobId_ListingId",
                table: "ListingLogs",
                columns: new[] { "MonitorJobId", "ListingId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ErrorLogs");

            migrationBuilder.DropTable(
                name: "JobFilters");

            migrationBuilder.DropTable(
                name: "ListingLogs");

            migrationBuilder.DropTable(
                name: "MonitorJobs");
        }
    }
}
