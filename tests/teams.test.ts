import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Teams API", () => {
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

  it("should create a team and return id with success flag", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.teams.create({
      name: "Time de Teste",
      description: "Descrição do time de teste",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
    expect(result.success).toBe(true);
  });

  it("should create a team without description", async () => {
    const caller = appRouter.createCaller(ctx);

    const result = await caller.teams.create({
      name: "Time Sem Descrição",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should list teams", async () => {
    const caller = appRouter.createCaller(ctx);

    const teams = await caller.teams.list();

    expect(Array.isArray(teams)).toBe(true);
  });
});
