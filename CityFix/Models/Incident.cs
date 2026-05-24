using CityFix.Enums;

namespace CityFix.Models;

public class Incident
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

    public AppUser? ResolvedByUser { get; set; }

    public Guid? CreatedByUserId { get; set; }

    public AppUser? CreatedByUser { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public Guid MunicipalityId { get; set; }

    public Municipality? Municipality { get; set; }

    public Guid CategoryId { get; set; }

    public Category? Category { get; set; }

    public IncidentStatus Status { get; set; } = IncidentStatus.Pending;

    public PriorityLevel PriorityLevel { get; set; } = PriorityLevel.Low;

    public Department Department { get; set; } = Department.Sanitation;

    public ICollection<IncidentStatusHistory> StatusHistory { get; set; } = new List<IncidentStatusHistory>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
