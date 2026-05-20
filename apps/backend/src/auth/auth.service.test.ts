import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { PrismaService } from "@/database/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue("hashed-password"),
  compare: vi.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    password: "hashed-password",
    role: "ADMIN",
    tenant_id: "tenant-123",
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const mockJwt = {
      sign: vi.fn().mockReturnValue("mock-jwt-token"),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should create user and return token", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.access_token).toBe("mock-jwt-token");
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "test@example.com",
            name: "Test User",
            tenant_id: expect.stringContaining("tenant_"),
            role: "ADMIN",
          }),
        }),
      );
    });

    it("should use provided tenant_id when given", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      await service.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        tenant_id: "custom-tenant",
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenant_id: "custom-tenant",
          }),
        }),
      );
    });

    it("should throw ConflictException when email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: "test@example.com",
          password: "password123",
          name: "Test User",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("should hash password before storing", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      await service.register({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: "hashed-password",
          }),
        }),
      );
    });
  });

  describe("login", () => {
    it("should return user and token on valid credentials", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.access_token).toBe("mock-jwt-token");
    });

    it("should throw UnauthorizedException for invalid email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password123",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for invalid password", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: "test@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should generate JWT with correct payload", async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "user-123",
        email: "test@example.com",
        tenant_id: "tenant-123",
      });
    });
  });

  describe("getProfile", () => {
    it("should return user profile", async () => {
      const profileData = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
        tenant_id: "tenant-123",
        created_at: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(profileData);

      const result = await service.getProfile("user-123");

      expect(result.email).toBe("test@example.com");
      expect(result.tenant_id).toBe("tenant-123");
    });

    it("should throw UnauthorizedException when user not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("nonexistent")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should not return password in profile", async () => {
      const profileUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "ADMIN",
        tenant_id: "tenant-123",
        created_at: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(profileUser);

      const result = await service.getProfile("user-123");

      expect(result).not.toHaveProperty("password");
      expect(result.email).toBe("test@example.com");
      expect(result.name).toBe("Test User");
    });
  });
});
