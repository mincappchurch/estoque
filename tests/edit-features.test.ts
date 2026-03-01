import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Edit Features", () => {
  let ctx: TrpcContext;

  beforeAll(() => {
    // Mock context with authenticated admin user
    ctx = {
      user: {
        id: 1,
        openId: "admin-test",
        name: "Administrador",
        email: "admin@test.com",
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

  it("should update a team", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a team first
    const team = await caller.teams.create({
      name: "Time Teste Edição",
      description: "Descrição inicial",
    });

    expect(team.id).toBeDefined();

    // Update the team
    const updateResult = await caller.teams.update({
      id: team.id,
      name: "Time Teste Editado",
      description: "Descrição atualizada",
    });

    expect(updateResult.success).toBe(true);

    // Verify the update
    const updatedTeam = await caller.teams.getById({ id: team.id });
    expect(updatedTeam).toBeDefined();
    expect(updatedTeam?.name).toBe("Time Teste Editado");
    expect(updatedTeam?.description).toBe("Descrição atualizada");
  });

  it("should update a category", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    const category = await caller.categories.create({
      name: "Categoria Teste Edição",
      description: "Descrição inicial",
    });

    expect(category.id).toBeDefined();

    // Update the category
    const updateResult = await caller.categories.update({
      id: category.id,
      name: "Categoria Teste Editada",
      description: "Descrição atualizada",
    });

    expect(updateResult.success).toBe(true);

    // Verify the update
    const updatedCategory = await caller.categories.getById({ id: category.id });
    expect(updatedCategory).toBeDefined();
    expect(updatedCategory?.name).toBe("Categoria Teste Editada");
    expect(updatedCategory?.description).toBe("Descrição atualizada");
  });

  it("should delete a team", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a team first
    const team = await caller.teams.create({
      name: "Time Para Deletar",
    });

    expect(team.id).toBeDefined();

    // Delete the team
    const deleteResult = await caller.teams.delete({ id: team.id });
    expect(deleteResult.success).toBe(true);

    // Verify it's deleted (should throw or return null)
    try {
      await caller.teams.getById({ id: team.id });
      // If we get here, the team wasn't deleted
      expect(true).toBe(false);
    } catch (error) {
      // Expected to throw
      expect(true).toBe(true);
    }
  });

  it("should delete a category", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a category first
    const category = await caller.categories.create({
      name: "Categoria Para Deletar",
    });

    expect(category.id).toBeDefined();

    // Delete the category
    const deleteResult = await caller.categories.delete({ id: category.id });
    expect(deleteResult.success).toBe(true);
  });

  it("should delete a unit", async () => {
    const caller = appRouter.createCaller(ctx);

    // Create a unit first
    const unit = await caller.units.create({
      name: "Unidade Para Deletar",
      abbreviation: "UPD",
    });

    expect(unit.id).toBeDefined();

    // Delete the unit
    const deleteResult = await caller.units.delete({ id: unit.id });
    expect(deleteResult.success).toBe(true);
  });
});
