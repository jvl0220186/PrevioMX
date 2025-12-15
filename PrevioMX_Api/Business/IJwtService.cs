using PrevioMX_Api.DTO;
using System.Security.Claims;

namespace PrevioMX_Api.Business;

public interface IJwtService
{
    string GenerateToken(LoginResultDto user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

