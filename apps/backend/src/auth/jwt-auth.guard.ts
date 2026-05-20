import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JwtAuthGuard
 * Passport JWT authentication guard. Extends the default passport-jwt guard
 * to protect routes from unauthenticated access. All routes under auth/
 * controllers use this guard unless marked with @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
