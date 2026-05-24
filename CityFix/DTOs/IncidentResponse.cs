using CityFix.Enums;

namespace CityFix.DTOs;

public class IncidentResponse
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public string? AdminNote { get; set; }

    public string? ResolutionNote { get; set; }

    public string? ResolutionImageUrl { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public Guid? ResolvedByUserId { get; set; }

    public Guid? CreatedByUserId { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public IncidentStatus Status { get; set; }

    public PriorityLevel PriorityLevel { get; set; }

    public Department Department { get; set; }

    public DateTime CreatedAt { get; set; }

    public Guid MunicipalityId { get; set; }

    public string MunicipalityName { get; set; } = string.Empty;

    public Guid CategoryId { get; set; }

    public string CategoryName { get; set; } = string.Empty;
}
