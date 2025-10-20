using System.Text.Json;
using MarketPlatz_Notification_Helper.Models;

namespace MarketPlatz_Notification_Helper.Services;

public class MarktplaatsApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MarktplaatsApiClient> _logger;

    public MarktplaatsApiClient(HttpClient httpClient, ILogger<MarktplaatsApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<MarktplaatsSearchResponse?> SearchListingsAsync(List<JobFilter> filters, CancellationToken cancellationToken = default)
    {
        try
        {
            var queryParams = BuildQueryString(filters);
            var url = $"https://www.marktplaats.nl/lrp/api/search?{queryParams}";

            _logger.LogInformation("Calling Marktplaats API: {Url}", url);

            var request = new HttpRequestMessage(HttpMethod.Get, url);

            // Add headers to mimic browser request
            request.Headers.Add("Accept", "*/*");
            request.Headers.Add("Accept-Language", "en-US,en;q=0.9");
            request.Headers.Add("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36");
            request.Headers.Add("Referer", "https://www.marktplaats.nl/l/auto-s/");
            
            request.Headers.Add("sec-ch-ua", "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"");
            request.Headers.Add("sec-ch-ua-mobile", "?0");
            request.Headers.Add("sec-ch-ua-platform", "\"macOS\"");
            request.Headers.Add("sec-fetch-dest", "empty");
            request.Headers.Add("sec-fetch-mode", "cors");
            request.Headers.Add("sec-fetch-site", "same-origin");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var result = JsonSerializer.Deserialize<MarktplaatsSearchResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            _logger.LogInformation("Retrieved {Count} listings from Marktplaats", result?.Listings?.Count ?? 0);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Marktplaats API");
            return null;
        }
    }

    private string BuildQueryString(List<JobFilter> filters)
    {
        var queryParams = new List<string>
        {
            "limit=30",
            "offset=0",
            "sortBy=SORT_INDEX",
            "sortOrder=DECREASING",
            "viewOptions=list-view"
        };

        bool hasOfferedSinceFilter = false;

        foreach (var filter in filters)
        {
            switch (filter.FilterType.ToLower())
            {
                case "attributerange":
                    // Transform our format (key:min|max) to Marktplaats format (key:min:max)
                    var parts = filter.Value.Split(':');
                    if (parts.Length == 2)
                    {
                        var key = parts[0];
                        var range = parts[1].Split('|');
                        if (range.Length == 2)
                        {
                            var min = range[0];
                            var max = range[1];

                            // Transform key names and values to match Marktplaats API
                            string apiKey = key;
                            string apiMin = min;
                            string apiMax = max;

                            if (key.Contains("Prijs") || key == "PrijsVan")
                            {
                                // Convert euros to cents
                                apiKey = "PriceCents";
                                if (int.TryParse(min, out var minEuros))
                                    apiMin = (minEuros * 100).ToString();
                                if (int.TryParse(max, out var maxEuros))
                                    apiMax = (maxEuros * 100).ToString();
                            }
                            else if (key == "Bouwjaar")
                            {
                                apiKey = "constructionYear";
                            }

                            queryParams.Add($"attributeRanges[]={Uri.EscapeDataString($"{apiKey}:{apiMin}:{apiMax}")}");
                        }
                    }
                    break;
                case "attributebyid":
                    queryParams.Add($"attributesById[]={Uri.EscapeDataString(filter.Value)}");
                    break;
                case "attributebykey":
                    // Check if this is offeredSince filter and replace with Vandaag
                    if (filter.Value.StartsWith("offeredSince:", StringComparison.OrdinalIgnoreCase))
                    {
                        queryParams.Add($"attributesByKey[]={Uri.EscapeDataString("offeredSince:Vandaag")}");
                        hasOfferedSinceFilter = true;
                    }
                    else
                    {
                        queryParams.Add($"attributesByKey[]={Uri.EscapeDataString(filter.Value)}");
                    }
                    break;
                case "l1categoryid":
                    queryParams.Add($"l1CategoryId={Uri.EscapeDataString(filter.Value)}");
                    break;
                case "l2categoryid":
                    queryParams.Add($"l2CategoryId={Uri.EscapeDataString(filter.Value)}");
                    break;
                case "postcode":
                    queryParams.Add($"postcode={Uri.EscapeDataString(filter.Value)}");
                    break;
                case "query":
                    queryParams.Add($"query={Uri.EscapeDataString(filter.Value)}");
                    queryParams.Add("searchInTitleAndDescription=true");
                    break;
                default:
                    queryParams.Add($"{Uri.EscapeDataString(filter.Key)}={Uri.EscapeDataString(filter.Value)}");
                    break;
            }
        }

        // If no offeredSince filter was provided, add default Vandaag
        if (!hasOfferedSinceFilter)
        {
            queryParams.Add($"attributesByKey[]={Uri.EscapeDataString("offeredSince:Vandaag")}");
        }

        return string.Join("&", queryParams);
    }
}
