using System.Text.RegularExpressions;

namespace VixClinic.Application.Helpers;

public static class TelefoneFormatter
{
    public static string Format(string telefone)
    {
        if (string.IsNullOrWhiteSpace(telefone))
            return string.Empty;
        
        return Regex.Replace(telefone, @"\D", "");
    }

    public static string Display(string telefone)
    {
        if (string.IsNullOrWhiteSpace(telefone))
            return string.Empty;
        
        if (telefone.Length == 11)
            return Regex.Replace(telefone, @"(\d{2})(\d{5})(\d{4})", "($1) $2-$3");
        else if (telefone.Length == 10)
            return Regex.Replace(telefone, @"(\d{2})(\d{4})(\d{4})", "($1) $2-$3");
        
        return telefone;
    }

    public static bool Validate(string telefone)
    {
        if (string.IsNullOrWhiteSpace(telefone))
            return false;
        
        telefone = Format(telefone);
        return telefone.Length is 10 or 11 && Regex.IsMatch(telefone, @"^\d{10,11}$");
    }
}
