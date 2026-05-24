using CityFix.Enums;

namespace CityFix.DTOs;

public class IncidentStatusHistoryResponse
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }

    public IncidentStatus OldStatus { get; set; }

    public IncidentStatus NewStatus { get; set; }

    public DateTime ChangedAt { get; set; }

    public Guid? ChangedByUserId { get; set; }

    public string? AdminNote { get; set; }
}
