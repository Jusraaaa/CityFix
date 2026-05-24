using CityFix.Enums;

namespace CityFix.DTOs;

public class UpdateIncidentStatusRequest
{
    public IncidentStatus Status { get; set; }

    public string? AdminNote { get; set; }

    public string? ResolutionNote { get; set; }

    public string? ResolutionImageUrl { get; set; }

    public PriorityLevel? PriorityLevel { get; set; }

    public Department? Department { get; set; }
}
