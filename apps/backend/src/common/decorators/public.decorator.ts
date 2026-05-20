import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by JwtAuthGuard to identify public (non-protected) routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Public
 * Custom decorator that marks a route handler as publicly accessible,
 * bypassing the global JwtAuthGuard. Use on auth endpoints like login and register.
 *
 * @example
 * @Public()
 * @Post("login")
 * async login(@Body() dto: LoginDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
