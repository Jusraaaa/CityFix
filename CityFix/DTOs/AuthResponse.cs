namespace CityFix.DTOs;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string FullName { get; set; } = string.Empty;

    public Guid? MunicipalityId { get; set; }
}
