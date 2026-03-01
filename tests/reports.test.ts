import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Reports API", () => {
  let ctx: TrpcContext;

  beforeAll(() => {
    // Mock context with authenticated user
    ctx = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        loginMethod: "access-code",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("should fetch movements by date range", async () => {
    const caller = appRouter.createCaller(ctx);

    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = new Date();

    const result = await caller.movements.getByDateRange({
      startDate,
      endDate,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch movements by service time", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.movements.getByServiceTime({
      serviceTime: "08:30",
      date: new Date(),
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should fetch movements by team with date range", async () => {
    const caller = appRouter.createCaller(ctx);

    // First, create a team
    const team = await caller.teams.create({
      name: "Time de Teste para Relatório",
      description: "Time criado para teste de relatório",
    });

    expect(team.id).toBeDefined();

    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = new Date();

    const result = await caller.movements.getByTeam({
      teamId: team.id,
      startDate,
      endDate,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should validate date range filters work correctly", async () => {
    const caller = appRouter.createCaller(ctx);

    // Test with different date ranges
    const ranges = [
      { days: 1, label: "1 day" },
      { days: 7, label: "7 days" },
      { days: 30, label: "30 days" },
    ];

    for (const range of ranges) {
      const startDate = new Date(Date.now() - range.days * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const result = await caller.movements.getByDateRange({
        startDate,
        endDate,
      });

      expect(Array.isArray(result)).toBe(true);
      
      // All movements should be within the date range
      result.forEach((movement) => {
        const movementDate = new Date(movement.createdAt);
        expect(movementDate >= startDate).toBe(true);
        expect(movementDate <= endDate).toBe(true);
      });
    }
  });
});
