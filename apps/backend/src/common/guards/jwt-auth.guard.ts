import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * JwtAuthGuard
 * Passport JWT authentication guard that protects routes from unauthenticated access.
 * Checks for a valid Bearer token in the Authorization header. Route handlers
 * decorated with @Public() bypass this guard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
