using System.Text.RegularExpressions;

namespace VixClinic.Application.Helpers;

public static class CpfFormatter
{
    public static string Format(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return string.Empty;
        
        return Regex.Replace(cpf, @"\D", "");
    }

    public static string Display(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf) || cpf.Length != 11)
            return cpf;
        
        return Regex.Replace(cpf, @"(\d{3})(\d{3})(\d{3})(\d{2})", "$1.$2.$3-$4");
    }

    public static bool Validate(string cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return false;
        
        cpf = Format(cpf);
        return cpf.Length == 11 && Regex.IsMatch(cpf, @"^\d{11}$");
    }
}
