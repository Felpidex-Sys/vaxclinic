namespace VixClinic.Application.DTOs;

public class LoginDto
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginResponseDto
{
    public string Token { get; set; } = null!;
    public UserInfoDto User { get; set; } = null!;
}

public class UserInfoDto
{
    public int Id { get; set; }
    public string Email { get; set; } = null!;
    public string Nome { get; set; } = null!;
    public string? Cargo { get; set; }
}
