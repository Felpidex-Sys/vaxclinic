using BCrypt.Net;

namespace VixClinic.Application.Helpers;

public class PasswordHasher
{
    private const int WorkFactor = 10;

    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
