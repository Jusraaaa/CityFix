using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CityFix.Data;
using CityFix.DTOs;
using CityFix.Enums;
using CityFix.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CityFix.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(ApplicationDbContext dbContext, IConfiguration configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var emailExists = await dbContext.Users.AnyAsync(x => x.Email == normalizedEmail);

        if (emailExists)
        {
            return Conflict("Email is already registered.");
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Citizen,
            MunicipalityId = null,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Users.AddAsync(user);
        await dbContext.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == normalizedEmail);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(CreateAuthResponse(user));
    }

    private AuthResponse CreateAuthResponse(AppUser user)
    {
        return new AuthResponse
        {
            Token = GenerateJwtToken(user),
            Role = user.Role.ToString(),
            FullName = user.FullName,
            MunicipalityId = user.MunicipalityId
        };
    }

    private string GenerateJwtToken(AppUser user)
    {
        var jwtKey = configuration["Jwt:Key"];
        var jwtIssuer = configuration["Jwt:Issuer"];
        var jwtAudience = configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException("JWT key is not configured.");
        }

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.MunicipalityId.HasValue)
        {
            claims.Add(new Claim("municipalityId", user.MunicipalityId.Value.ToString()));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
