import { describe, it, expect, vi, beforeEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { StockController } from "./stock.controller";
import { StockService } from "./stock.service";

const mockService = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findByProduct: vi.fn(),
};

const mockUser = { userId: "user-123", tenant_id: "tenant-123" };

const mockStock = {
  id: "stock-1",
  product_id: "prod-1",
  quantity: 10,
  location: "Warehouse A",
  product: { id: "prod-1", name: "Arduino", price: 35 },
};

describe("StockController", () => {
  let controller: StockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockService }],
    }).compile();

    controller = module.get<StockController>(StockController);
    vi.clearAllMocks();
  });

  describe("GET /stocks", () => {
    it("returns all stocks for the tenant", async () => {
      mockService.findAll.mockResolvedValue([mockStock]);

      const result = await controller.getAll({} as any, mockUser as any);

      expect(result).toEqual([mockStock]);
      expect(mockService.findAll).toHaveBeenCalledWith({}, "tenant-123");
    });

    it("passes query params to service", async () => {
      mockService.findAll.mockResolvedValue([]);

      await controller.getAll(
        { product_id: "prod-1", location: "A" } as any,
        mockUser as any,
      );

      expect(mockService.findAll).toHaveBeenCalledWith(
        { product_id: "prod-1", location: "A" },
        "tenant-123",
      );
    });
  });

  describe("GET /stocks/:id", () => {
    it("returns single stock", async () => {
      mockService.findOne.mockResolvedValue(mockStock);

      const result = await controller.getOne("stock-1", mockUser as any);

      expect(result).toEqual(mockStock);
      expect(mockService.findOne).toHaveBeenCalledWith("stock-1", "tenant-123");
    });
  });

  describe("POST /stocks", () => {
    it("creates stock with dto", async () => {
      const dto = { product_id: "prod-1", quantity: 5, location: "A" };
      const created = { id: "stock-new", ...dto, product: { id: "prod-1", name: "Arduino" } };
      mockService.create.mockResolvedValue(created);

      const result = await controller.create(dto as any, mockUser as any);

      expect(result).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith(dto, "tenant-123");
    });
  });

  describe("PATCH /stocks/:id", () => {
    it("updates stock", async () => {
      const dto = { quantity: 20 };
      const updated = { ...mockStock, quantity: 20 };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update("stock-1", dto as any, mockUser as any);

      expect(result).toEqual(updated);
      expect(mockService.update).toHaveBeenCalledWith("stock-1", dto, "tenant-123");
    });
  });

  describe("DELETE /stocks/:id", () => {
    it("removes stock", async () => {
      mockService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove("stock-1", mockUser as any);

      expect(result).toEqual({ deleted: true });
      expect(mockService.remove).toHaveBeenCalledWith("stock-1", "tenant-123");
    });
  });

  describe("GET /stocks/product/:productId", () => {
    it("returns stocks by product", async () => {
      mockService.findByProduct.mockResolvedValue([mockStock]);

      const result = await controller.getByProduct("prod-1", mockUser as any);

      expect(result).toEqual([mockStock]);
      expect(mockService.findByProduct).toHaveBeenCalledWith("prod-1", "tenant-123");
    });
  });
});
