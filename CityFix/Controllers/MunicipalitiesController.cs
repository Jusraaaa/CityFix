using CityFix.Data;
using CityFix.DTOs;
using CityFix.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Controllers;

[ApiController]
[Route("api/municipalities")]
public class MunicipalitiesController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Municipality>>> GetMunicipalities()
    {
        var municipalities = await dbContext.Municipalities
            .OrderBy(x => x.Name)
            .ToListAsync();

        return Ok(municipalities);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Municipality>> GetMunicipality(Guid id)
    {
        var municipality = await dbContext.Municipalities.FindAsync(id);

        if (municipality is null)
        {
            return NotFound();
        }

        return Ok(municipality);
    }

    [HttpPost]
    public async Task<ActionResult<Municipality>> CreateMunicipality(CreateMunicipalityRequest request)
    {
        var municipality = new Municipality
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Region = request.Region,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Municipalities.AddAsync(municipality);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMunicipality), new { id = municipality.Id }, municipality);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMunicipality(Guid id)
    {
        var municipality = await dbContext.Municipalities.FindAsync(id);

        if (municipality is null)
        {
            return NotFound();
        }

        dbContext.Municipalities.Remove(municipality);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }
}
