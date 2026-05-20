import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { Public } from "../common/decorators/public.decorator";

/**
 * AuthController
 * Handles authentication endpoints (register, login, profile).
 * Register and login are public (@Public()); profile requires JwtAuthGuard.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user account.
   * @param registerDto - New user credentials and profile data
   * @returns Created user profile and JWT access token
   */
  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    console.log("[AUTH] POST /auth/register called");
    console.log("[AUTH] registerDto:", registerDto);
    const result = await this.authService.register(registerDto);
    console.log("[AUTH] Registration successful, returning result");
    return result;
  }

  /**
   * Authenticates a user with email and password.
   * @param loginDto - Login credentials
   * @returns User profile and JWT access token
   */
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Returns the authenticated user's profile.
   * Protected by JwtAuthGuard — requires a valid Bearer token.
   * @param req - Express request object with user from JwtStrategy
   * @returns User profile
   */
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }
}
