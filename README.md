# Marktplaats Notification Helper

A powerful notification system for monitoring new car listings on Marktplaats.nl with automatic email alerts.

## Features

- **Multiple Monitor Jobs**: Create unlimited monitoring jobs with custom filters
- **Background Monitoring**: Automatically checks for new listings every 5 minutes
- **Email Notifications**: Sends beautiful HTML emails when new listings are found
- **Flexible Filtering**: Support for various filters including price range, categories, postcodes, and search queries
- **Modern Web UI**: Easy-to-use interface for managing monitor jobs
- **SQLite Database**: Lightweight database for storing jobs and listing logs
- **RESTful API**: Full CRUD API for programmatic access

## Prerequisites

- .NET 8.0 SDK
- A modern web browser

## Installation

1. Clone the repository or navigate to the project directory:
```bash
cd MarketPlatz-Notification-Helper
```

2. Restore NuGet packages:
```bash
dotnet restore
```

3. Configure email settings (optional) in `appsettings.json`:
```json
"Email": {
  "SmtpHost": "smtp.gmail.com",
  "SmtpPort": "587",
  "SmtpUser": "your-email@gmail.com",
  "SmtpPassword": "your-app-password",
  "FromAddress": "your-email@gmail.com",
  "FromName": "Marktplaats Monitor"
}
```

**Note**: If you don't configure SMTP settings, emails won't be sent, but you can still see new listings in the logs section of the UI.

## Running the Application

1. Run the application:
```bash
cd MarketPlatz-Notification-Helper
dotnet run
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. You'll see the dashboard with options to:
   - View statistics (total listings, last 24 hours, active jobs)
   - Create new monitor jobs
   - View recent listing logs

## Creating a Monitor Job

1. Click the **"+ Add New Job"** button
2. Fill in the job details:
   - **Job Name**: A descriptive name for your monitor (e.g., "Volkswagen Golf Monitor")
   - **Email Address**: Where to receive notifications
   - **Active**: Toggle to enable/disable the job

3. Configure your filters using either **Quick Filters** or **Advanced Filters**:

### Quick Filters (Recommended)

The Quick Filters tab provides an easy-to-use interface for the most common search criteria:

#### **Brand**
Select from popular car brands like:
- Volkswagen, BMW, Mercedes-Benz, Audi
- Ford, Opel, Peugeot, Renault
- Toyota, Kia, Hyundai, Nissan
- And many more...

#### **Fuel Type** (Multiple selection)
- Benzine (Gasoline) - ID: 473
- Diesel - ID: 474
- Elektrisch (Electric) - ID: 11756
- Hybride Elektrisch/Benzine - ID: 13838
- Hybride Elektrisch/Diesel - ID: 13839
- LPG - ID: 475
- CNG (Aardgas) - ID: 13840
- Waterstof (Hydrogen) - ID: 13841

#### **Construction Year (Bouwjaar)**
Range selector from 1900 to 2025
- Example: 2020 to 2024 for recent models

#### **Price Range**
Enter min and max in EUR (automatically converted to cents)
- Example: €5,000 to €20,000

#### **Mileage (Kilometerstand)**
Select ranges in kilometers:
- 0 km to 300,000 km
- Popular ranges: 0-50k, 50k-100k, 100k-150k

#### **Transmission** (Multiple selection)
- Automatic (Automaat) - ID: 534
- Manual (Handgeschakeld) - ID: 535

#### **Body Type (Carrosserie)** (Multiple selection)
- Cabriolet - ID: 485
- Coupé - ID: 486
- Hatchback - ID: 481
- MPV - ID: 482
- Sedan - ID: 483
- Stationwagon - ID: 484
- SUV or Terreinwagen - ID: 488

#### **Postcode (Location)**
Enter a Dutch postcode for location-based search
- Example: 1012AB (Amsterdam)

#### **Search Keywords**
Free text search in title and description
- Example: "volkswagen golf gti"

### Advanced Filters

For power users who need custom filters not covered by Quick Filters:

| Filter Type | Description | Example Value |
|-------------|-------------|---------------|
| **Attribute Range** | Range filters (year, mileage, price) | `constructionYear:2020:2024` |
| **Attribute By ID** | Filter by specific attribute IDs | `473` (Benzine) |
| **Attribute By Key** | Key-value pair filters | `offeredSince:Altijd` |
| **L1 Category ID** | Main category (always 91 for cars) | `91` |
| **L2 Category ID** | Brand/subcategory | `157` (Volkswagen) |
| **Postcode** | Location search | `3316EH` |
| **Search Query** | Text search | `volkswagen golf` |

### Example Filter Configurations

#### Example 1: Volkswagen Golf 2020-2024, Benzine, under €15,000
**Using Quick Filters:**
- Brand: Volkswagen
- Fuel Type: Benzine
- Construction Year: 2020 to 2024
- Price Range: €0 to €15,000
- Search Keywords: golf

#### Example 2: Electric SUVs near Amsterdam
**Using Quick Filters:**
- Fuel Type: Elektrisch
- Body Type: SUV or Terreinwagen
- Postcode: 1012AB
- Price Range: €20,000 to €40,000

#### Example 3: Diesel Stationwagons with low mileage
**Using Quick Filters:**
- Fuel Type: Diesel
- Body Type: Stationwagon
- Mileage: 0 to 100,000 km
- Transmission: Automatic
- Construction Year: 2018 to 2024

#### Example 4: BMW or Mercedes-Benz (Using Multiple Jobs)
Create two separate jobs:
- **Job 1**: Brand: BMW, your other filters...
- **Job 2**: Brand: Mercedes-Benz, your other filters...

## How It Works

1. **Background Service**: The application runs a background service that checks all active monitor jobs every 5 minutes
2. **API Call**: For each job, it calls the Marktplaats API with the configured filters
3. **New Listing Detection**: It compares the results with previously logged listings to identify new cars
4. **Email Notification**: When new listings are found, an email is sent with:
   - Car title and description
   - Price
   - Photos
   - Direct link to the listing
5. **Logging**: All new listings are stored in the database for tracking

## API Endpoints

### Monitor Jobs
- `GET /api/monitorjobs` - Get all monitor jobs
- `GET /api/monitorjobs/{id}` - Get specific job
- `POST /api/monitorjobs` - Create new job
- `PUT /api/monitorjobs/{id}` - Update job
- `DELETE /api/monitorjobs/{id}` - Delete job
- `POST /api/monitorjobs/{id}/toggle` - Toggle active status

### Listing Logs
- `GET /api/listinglogs` - Get all listing logs (supports `?jobId={id}&limit={n}`)
- `GET /api/listinglogs/stats` - Get statistics

## Database

The application uses SQLite to store data in `marktplaats.db` with three main tables:

1. **MonitorJobs**: Stores monitoring job configurations
2. **JobFilters**: Stores filters for each job
3. **ListingLogs**: Stores all detected new listings

## Troubleshooting

### Email not sending
- Check your SMTP settings in `appsettings.json`
- For Gmail, you need to use an "App Password" instead of your regular password
- Check the application logs for error messages

### No new listings detected
- Verify your filters are correct by testing them on Marktplaats.nl
- Check that the job is marked as "Active"
- Look at the "Last Run" timestamp to ensure the background service is running
- Check the application logs for errors

### Application won't start
- Ensure .NET 8.0 SDK is installed: `dotnet --version`
- Check for port conflicts (default port is 5000)
- Try cleaning and rebuilding: `dotnet clean && dotnet build`

## Tips

1. **Start Simple**: Begin with basic filters (just a search query) and add more filters as needed
2. **Test Your Filters**: Use the Marktplaats website to test your search criteria before creating a job
3. **Monitor Frequency**: The system checks every 5 minutes. You can change this in `Services/MonitorService.cs`
4. **Email Limits**: Be mindful of email sending limits if using free email providers

## Technical Stack

- **Backend**: .NET 8.0 with ASP.NET Core
- **Database**: SQLite with Entity Framework Core
- **Email**: MailKit
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **API Documentation**: Swagger/OpenAPI

## Development

To modify the monitoring interval, edit `Services/MonitorService.cs`:
```csharp
private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Change this value
```

## License

This is a personal project for educational purposes. Please respect Marktplaats.nl's terms of service and use this tool responsibly.

## Support

For issues or questions, please check the application logs and refer to this documentation.
