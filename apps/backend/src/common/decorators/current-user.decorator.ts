/**
 * CurrentUser Decorator
 *
 * Decorador personalizado para extraer el usuario autenticado de la request.
 * El objeto 'user' es populado por JwtStrategy.validate() después de
 * verificar el token JWT.
 *
 * Uso en controladores:
 *   @Get("profile")
 *   getProfile(@CurrentUser() user: { userId: string, email: string }) {
 *     return user;
 *   }
 *
 * El decorador devuelve el payload completo de JwtStrategy:
 *   { userId, email, tenant_id, role }
 *
 * @module CurrentUser
 */

import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * CurrentUser
 * Custom parameter decorator that extracts the authenticated user from the
 * HTTP request object. The `user` property is populated by JwtStrategy.validate()
 * after successful JWT verification.
 *
 * Returns the full JwtStrategy payload: { userId, email, tenant_id, role }
 *
 * @example
 * @Get("profile")
 * getProfile(@CurrentUser() user: CurrentUserPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
