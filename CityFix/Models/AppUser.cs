using System.ComponentModel.DataAnnotations;
using CityFix.Enums;

namespace CityFix.Models;

public class AppUser
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.Citizen;

    public Guid? MunicipalityId { get; set; }

    public Municipality? Municipality { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
