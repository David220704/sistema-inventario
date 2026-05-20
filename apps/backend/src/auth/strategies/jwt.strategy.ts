import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/database/prisma.service";

/**
 * JwtStrategy
 * Passport strategy that extracts and validates JWT tokens from the Authorization
 * header (Bearer scheme). On validation, it queries the database to confirm the
 * user still exists and returns the user payload (userId, email, tenant_id, role)
 * attached to the request object.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  /**
   * Validates the JWT payload by confirming the user exists in the database.
   * @param payload - Decoded JWT payload (sub, email, tenant_id)
   * @returns User context object attached to request.user
   */
  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id,
      role: user.role,
    };
  }
}
