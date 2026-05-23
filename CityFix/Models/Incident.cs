using CityFix.Enums;

namespace CityFix.Models;

public class Incident
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public Guid MunicipalityId { get; set; }

    public Municipality? Municipality { get; set; }

    public Guid CategoryId { get; set; }

    public Category? Category { get; set; }

    public IncidentStatus Status { get; set; } = IncidentStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
