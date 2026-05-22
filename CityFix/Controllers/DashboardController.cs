using CityFix.Data;
using CityFix.DTOs;
using CityFix.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary()
    {
        var response = new DashboardSummaryResponse
        {
            TotalIncidents = await dbContext.Incidents.CountAsync(),
            PendingIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.Pending),
            InProgressIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.InProgress),
            ResolvedIncidents = await dbContext.Incidents.CountAsync(x => x.Status == IncidentStatus.Resolved),
            TotalMunicipalities = await dbContext.Municipalities.CountAsync(),
            TotalCategories = await dbContext.Categories.CountAsync()
        };

        return Ok(response);
    }

    [HttpGet("incidents-by-category")]
    public async Task<ActionResult<IEnumerable<DashboardGroupCountResponse>>> GetIncidentsByCategory()
    {
        var response = await dbContext.Categories
            .Select(category => new DashboardGroupCountResponse
            {
                Id = category.Id,
                Name = category.Name,
                IncidentCount = dbContext.Incidents.Count(incident => incident.CategoryId == category.Id)
            })
            .OrderByDescending(x => x.IncidentCount)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return Ok(response);
    }

    [HttpGet("incidents-by-municipality")]
    public async Task<ActionResult<IEnumerable<DashboardGroupCountResponse>>> GetIncidentsByMunicipality()
    {
        var response = await dbContext.Municipalities
            .Select(municipality => new DashboardGroupCountResponse
            {
                Id = municipality.Id,
                Name = municipality.Name,
                IncidentCount = dbContext.Incidents.Count(incident => incident.MunicipalityId == municipality.Id)
            })
            .OrderByDescending(x => x.IncidentCount)
            .ThenBy(x => x.Name)
            .ToListAsync();

        return Ok(response);
    }
}
