import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/database/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user with email, name, and password.
   * Hashes the password with bcrypt, creates the user in the database,
   * and returns a signed JWT access token along with user profile data.
   * @param registerDto - Registration payload (email, password, name, optional tenant_id)
   * @returns Object containing user profile and access_token
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name, tenant_id } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant if not provided (single-tenant app)
    const finalTenantId = tenant_id || `tenant_${Date.now()}`;

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          tenant_id: finalTenantId,
          role: "ADMIN", // First user is admin
        },
      });

      // Generate JWT
      const token = this.generateToken(user.id, user.email, user.tenant_id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenant_id: user.tenant_id,
        },
        access_token: token,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticates an existing user by email and password.
   * Validates credentials against the stored bcrypt hash and returns
   * a signed JWT access token on success.
   * @param loginDto - Login payload (email, password)
   * @returns Object containing user profile and access_token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.tenant_id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
      access_token: token,
    };
  }

  /**
   * Retrieves the profile of the authenticated user by ID.
   * @param userId - The user's unique identifier
   * @returns User profile (id, email, name, role, tenant_id, created_at)
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenant_id: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  /**
   * Generates a signed JWT token for the given user.
   * @param userId - The user's unique identifier (set as sub claim)
   * @param email - The user's email
   * @param tenantId - The user's tenant ID for multi-tenant scoping
   * @returns Signed JWT string
   */
  private generateToken(
    userId: string,
    email: string,
    tenantId: string,
  ): string {
    const payload = {
      sub: userId,
      email,
      tenant_id: tenantId,
    };

    return this.jwtService.sign(payload);
  }
}
