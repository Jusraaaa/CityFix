using CityFix.Data;
using CityFix.DTOs;
using CityFix.Enums;
using CityFix.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityFix.Controllers;

[ApiController]
[Route("api/admins")]
[Authorize(Roles = "SuperAdmin")]
public class AdminsController(ApplicationDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetAdmins()
    {
        var admins = await dbContext.Users
            .Where(x => x.Role == UserRole.MunicipalityAdmin)
            .OrderBy(x => x.FullName)
            .Select(x => new AdminUserResponse
            {
                Id = x.Id,
                FullName = x.FullName,
                Email = x.Email,
                MunicipalityId = x.MunicipalityId,
                MunicipalityName = x.Municipality != null ? x.Municipality.Name : string.Empty,
                Role = x.Role.ToString(),
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return Ok(admins);
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserResponse>> CreateAdmin(CreateAdminRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await dbContext.Users.AnyAsync(x => x.Email == normalizedEmail);
        if (emailExists)
        {
            return Conflict("Email is already registered.");
        }

        var municipalityExists = await dbContext.Municipalities.AnyAsync(x => x.Id == request.MunicipalityId);
        if (!municipalityExists)
        {
            return BadRequest("Municipality does not exist.");
        }

        var admin = new AppUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.MunicipalityAdmin,
            MunicipalityId = request.MunicipalityId,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Users.AddAsync(admin);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAdmins), new { id = admin.Id }, await CreateResponse(admin.Id));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminUserResponse>> UpdateAdmin(Guid id, UpdateAdminRequest request)
    {
        var admin = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id && x.Role == UserRole.MunicipalityAdmin);
        if (admin is null)
        {
            return NotFound();
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await dbContext.Users.AnyAsync(x => x.Id != id && x.Email == normalizedEmail);
        if (emailExists)
        {
            return Conflict("Email is already registered.");
        }

        var municipalityExists = await dbContext.Municipalities.AnyAsync(x => x.Id == request.MunicipalityId);
        if (!municipalityExists)
        {
            return BadRequest("Municipality does not exist.");
        }

        admin.FullName = request.FullName.Trim();
        admin.Email = normalizedEmail;
        admin.MunicipalityId = request.MunicipalityId;
        admin.IsActive = request.IsActive;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            if (request.Password.Length < 6)
            {
                return BadRequest("Password must be at least 6 characters.");
            }

            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await dbContext.SaveChangesAsync();

        return Ok(await CreateResponse(admin.Id));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeactivateAdmin(Guid id)
    {
        var admin = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == id && x.Role == UserRole.MunicipalityAdmin);
        if (admin is null)
        {
            return NotFound();
        }

        admin.IsActive = false;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private async Task<AdminUserResponse> CreateResponse(Guid id)
    {
        return await dbContext.Users
            .Where(x => x.Id == id)
            .Select(x => new AdminUserResponse
            {
                Id = x.Id,
                FullName = x.FullName,
                Email = x.Email,
                MunicipalityId = x.MunicipalityId,
                MunicipalityName = x.Municipality != null ? x.Municipality.Name : string.Empty,
                Role = x.Role.ToString(),
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .FirstAsync();
    }
}
