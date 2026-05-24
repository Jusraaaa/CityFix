using System.ComponentModel.DataAnnotations;

namespace CityFix.DTOs;

public class CreateAdminRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public Guid MunicipalityId { get; set; }

    public bool IsActive { get; set; } = true;
}
