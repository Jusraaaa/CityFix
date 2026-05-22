namespace CityFix.DTOs;

public class DashboardGroupCountResponse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public int IncidentCount { get; set; }
}
