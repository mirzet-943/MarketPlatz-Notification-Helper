using System.Text.Json.Serialization;

namespace MarketPlatz_Notification_Helper.Models;

public class MarktplaatsSearchResponse
{
    [JsonPropertyName("listings")]
    public List<MarktplaatsListing> Listings { get; set; } = new();

    [JsonPropertyName("totalResultCount")]
    public int TotalResultCount { get; set; }
}

public class MarktplaatsListing
{
    [JsonPropertyName("itemId")]
    public string ItemId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("priceInfo")]
    public PriceInfo? PriceInfo { get; set; }

    [JsonPropertyName("imageUrls")]
    public List<string> ImageUrls { get; set; } = new();

    [JsonPropertyName("vipUrl")]
    public string VipUrl { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;
}

public class PriceInfo
{
    [JsonPropertyName("priceCents")]
    public int? PriceCents { get; set; }

    [JsonPropertyName("priceType")]
    public string PriceType { get; set; } = string.Empty;
}
