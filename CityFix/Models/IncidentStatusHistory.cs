using CityFix.Enums;

namespace CityFix.Models;

public class IncidentStatusHistory
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }

    public Incident? Incident { get; set; }

    public IncidentStatus OldStatus { get; set; }

    public IncidentStatus NewStatus { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public Guid? ChangedByUserId { get; set; }

    public AppUser? ChangedByUser { get; set; }

    public string? AdminNote { get; set; }
}
