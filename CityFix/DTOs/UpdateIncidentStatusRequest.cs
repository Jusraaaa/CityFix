using CityFix.Enums;

namespace CityFix.DTOs;

public class UpdateIncidentStatusRequest
{
    public IncidentStatus Status { get; set; }
}
