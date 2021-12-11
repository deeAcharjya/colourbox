using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;


namespace Utilities
{
    public static partial class UtilityExtensions
    {
        public static string GetUserId(this ControllerBase controller)
        {
            return GetUserId(controller.HttpContext);
        }

        public static string GetUserId(this IHttpContextAccessor httpContextAccessor)
        {
            return GetUserId(httpContextAccessor.HttpContext);
        }

        public static string GetUserId(this HttpContext httpContext)
        {
            return GetUserId(httpContext?.User);
        }

        public static string GetUserId(this ClaimsPrincipal user)
        {
            if (!(user?.Identity?.IsAuthenticated ?? false))
                return null;

            /* We idenify NOT by name
            if (!string.IsNullOrWhiteSpace(user?.Identity?.Name))
                return user.Identity.Name;
            */

            return user.FindFirst(ClaimTypes.NameIdentifier).Value;
        }


    }
}
