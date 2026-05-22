namespace CityFix.DTOs;

public class DashboardSummaryResponse
{
    public int TotalIncidents { get; set; }

    public int PendingIncidents { get; set; }

    public int InProgressIncidents { get; set; }

    public int ResolvedIncidents { get; set; }

    public int TotalMunicipalities { get; set; }

    public int TotalCategories { get; set; }
}
