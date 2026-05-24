using System.Security.Claims;
using CityFix.Data;
using CityFix.DTOs;
using CityFix.Enums;
using CityFix.Models;
using Microsoft.AspNetCore.Authorization;
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
        var incidents = await ApplyMunicipalityScope(dbContext.Incidents)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new IncidentResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                AdminNote = x.AdminNote,
                ResolutionNote = x.ResolutionNote,
                ResolutionImageUrl = x.ResolutionImageUrl,
                ResolvedAt = x.ResolvedAt,
                ResolvedByUserId = x.ResolvedByUserId,
                CreatedByUserId = x.CreatedByUserId,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Status = x.Status,
                PriorityLevel = x.PriorityLevel,
                Department = x.Department,
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
        var incident = await ApplyMunicipalityScope(dbContext.Incidents)
            .Where(x => x.Id == id)
            .Select(x => new IncidentResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                AdminNote = x.AdminNote,
                ResolutionNote = x.ResolutionNote,
                ResolutionImageUrl = x.ResolutionImageUrl,
                ResolvedAt = x.ResolvedAt,
                ResolvedByUserId = x.ResolvedByUserId,
                CreatedByUserId = x.CreatedByUserId,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Status = x.Status,
                PriorityLevel = x.PriorityLevel,
                Department = x.Department,
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

    [HttpGet("{id:guid}/status-history")]
    public async Task<ActionResult<IEnumerable<IncidentStatusHistoryResponse>>> GetIncidentStatusHistory(Guid id)
    {
        var incidentExists = await ApplyMunicipalityScope(dbContext.Incidents).AnyAsync(x => x.Id == id);
        if (!incidentExists)
        {
            return NotFound();
        }

        var statusHistory = await dbContext.IncidentStatusHistory
            .Where(x => x.IncidentId == id)
            .OrderByDescending(x => x.ChangedAt)
            .Select(x => new IncidentStatusHistoryResponse
            {
                Id = x.Id,
                IncidentId = x.IncidentId,
                OldStatus = x.OldStatus,
                NewStatus = x.NewStatus,
                ChangedAt = x.ChangedAt,
                ChangedByUserId = x.ChangedByUserId,
                AdminNote = x.AdminNote
            })
            .ToListAsync();

        return Ok(statusHistory);
    }

    [HttpGet("my-reports")]
    [Authorize(Roles = "Citizen")]
    public async Task<ActionResult<IEnumerable<IncidentResponse>>> GetMyReports()
    {
        var currentUserId = GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized();
        }

        var incidents = await dbContext.Incidents
            .Where(x => x.CreatedByUserId == currentUserId.Value)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new IncidentResponse
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                ImageUrl = x.ImageUrl,
                AdminNote = x.AdminNote,
                ResolutionNote = x.ResolutionNote,
                ResolutionImageUrl = x.ResolutionImageUrl,
                ResolvedAt = x.ResolvedAt,
                ResolvedByUserId = x.ResolvedByUserId,
                CreatedByUserId = x.CreatedByUserId,
                Latitude = x.Latitude,
                Longitude = x.Longitude,
                Status = x.Status,
                PriorityLevel = x.PriorityLevel,
                Department = x.Department,
                CreatedAt = x.CreatedAt,
                MunicipalityId = x.MunicipalityId,
                MunicipalityName = x.Municipality != null ? x.Municipality.Name : string.Empty,
                CategoryId = x.CategoryId,
                CategoryName = x.Category != null ? x.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(incidents);
    }

    [HttpPost]
    [Authorize(Roles = "Citizen,SuperAdmin")]
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

        if (!Enum.IsDefined(request.PriorityLevel))
        {
            return BadRequest("Invalid priority level.");
        }

        if (!Enum.IsDefined(request.Department))
        {
            return BadRequest("Invalid department.");
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
            PriorityLevel = request.PriorityLevel,
            Department = request.Department,
            CreatedByUserId = GetCurrentUserId(),
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Incidents.AddAsync(incident);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incident);
    }

    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "MunicipalityAdmin,SuperAdmin")]
    public async Task<IActionResult> UpdateIncidentStatus(Guid id, UpdateIncidentStatusRequest request)
    {
        if (!Enum.IsDefined(request.Status))
        {
            return BadRequest("Invalid incident status.");
        }

        if (request.PriorityLevel.HasValue && !Enum.IsDefined(request.PriorityLevel.Value))
        {
            return BadRequest("Invalid priority level.");
        }

        if (request.Department.HasValue && !Enum.IsDefined(request.Department.Value))
        {
            return BadRequest("Invalid department.");
        }

        var incident = await ApplyMunicipalityScope(dbContext.Incidents)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (incident is null)
        {
            return NotFound();
        }

        var oldStatus = incident.Status;
        var adminNote = string.IsNullOrWhiteSpace(request.AdminNote)
            ? null
            : request.AdminNote.Trim();
        var currentUserId = GetCurrentUserId();

        incident.Status = request.Status;
        incident.AdminNote = adminNote;

        if (request.PriorityLevel.HasValue)
        {
            incident.PriorityLevel = request.PriorityLevel.Value;
        }

        if (request.Department.HasValue)
        {
            incident.Department = request.Department.Value;
        }

        if (request.Status == IncidentStatus.Resolved)
        {
            incident.ResolutionNote = string.IsNullOrWhiteSpace(request.ResolutionNote)
                ? null
                : request.ResolutionNote.Trim();
            incident.ResolutionImageUrl = string.IsNullOrWhiteSpace(request.ResolutionImageUrl)
                ? null
                : request.ResolutionImageUrl;
            incident.ResolvedAt = DateTime.UtcNow;
            incident.ResolvedByUserId = currentUserId;
        }

        await dbContext.IncidentStatusHistory.AddAsync(new IncidentStatusHistory
        {
            Id = Guid.NewGuid(),
            IncidentId = incident.Id,
            OldStatus = oldStatus,
            NewStatus = request.Status,
            ChangedAt = DateTime.UtcNow,
            ChangedByUserId = currentUserId,
            AdminNote = adminNote
        });

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

    private Guid? GetCurrentUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userId, out var parsedUserId) ? parsedUserId : null;
    }

    private IQueryable<Incident> ApplyMunicipalityScope(IQueryable<Incident> query)
    {
        if (User.IsInRole(UserRole.MunicipalityAdmin.ToString()))
        {
            return TryGetCurrentUserMunicipalityId(out var municipalityId)
                ? query.Where(x => x.MunicipalityId == municipalityId)
                : query.Where(x => false);
        }

        if (User.IsInRole(UserRole.Citizen.ToString()))
        {
            var currentUserId = GetCurrentUserId();
            return currentUserId.HasValue
                ? query.Where(x => x.CreatedByUserId == currentUserId.Value)
                : query.Where(x => false);
        }

        return query;
    }

    private bool TryGetCurrentUserMunicipalityId(out Guid municipalityId)
    {
        var municipalityClaim = User.FindFirstValue("municipalityId");
        return Guid.TryParse(municipalityClaim, out municipalityId);
    }
}
