namespace CityFix.DTOs;

public class CreateIncidentRequest
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public Guid MunicipalityId { get; set; }

    public Guid CategoryId { get; set; }
}
