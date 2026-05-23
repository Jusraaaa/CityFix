using CityFix.Data;
using CityFix.DTOs;
using CityFix.Enums;
using CityFix.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Controllers;

[ApiController]
[Route("api/incidents")]
public class IncidentsController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<IncidentResponse>>> GetIncidents()
    {
        var incidents = await dbContext.Incidents
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new IncidentResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                MunicipalityId = x.MunicipalityId,
                MunicipalityName = x.Municipality != null ? x.Municipality.Name : string.Empty,
                CategoryId = x.CategoryId,
                CategoryName = x.Category != null ? x.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(incidents);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<IncidentResponse>> GetIncident(Guid id)
    {
        var incident = await dbContext.Incidents
            .Where(x => x.Id == id)
            .Select(x => new IncidentResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Status = x.Status,
                CreatedAt = x.CreatedAt,
                MunicipalityId = x.MunicipalityId,
                MunicipalityName = x.Municipality != null ? x.Municipality.Name : string.Empty,
                CategoryId = x.CategoryId,
                CategoryName = x.Category != null ? x.Category.Name : string.Empty
            })
            .FirstOrDefaultAsync();

        if (incident is null)
        {
            return NotFound();
        }

        return Ok(incident);
    }

    [HttpPost]
    public async Task<ActionResult<Incident>> CreateIncident(CreateIncidentRequest request)
    {
        var municipalityExists = await dbContext.Municipalities.AnyAsync(x => x.Id == request.MunicipalityId);
        if (!municipalityExists)
        {
            return BadRequest("Municipality does not exist.");
        }

        var categoryExists = await dbContext.Categories.AnyAsync(x => x.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Category does not exist.");
        }

        var incident = new Incident
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            MunicipalityId = request.MunicipalityId,
            CategoryId = request.CategoryId,
            Status = IncidentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Incidents.AddAsync(incident);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateIncidentStatus(Guid id, UpdateIncidentStatusRequest request)
    {
        if (!Enum.IsDefined(request.Status))
        {
            return BadRequest("Invalid incident status.");
        }

        var incident = await dbContext.Incidents.FindAsync(id);

        if (incident is null)
        {
            return NotFound();
        }

        incident.Status = request.Status;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteIncident(Guid id)
    {
        var incident = await dbContext.Incidents.FindAsync(id);

        if (incident is null)
        {
            return NotFound();
        }

        dbContext.Incidents.Remove(incident);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }
}
