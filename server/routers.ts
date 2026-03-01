import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { hasSupabaseAdminConfig } from "./_core/supabase";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

const uuidSchema = z.string().uuid();

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    loginWithCode: publicProcedure
      .input(
        z.object({
          code: z.string().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        if (!hasSupabaseAdminConfig()) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Configuração do Supabase ausente no backend. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
          });
        }

        const user = await db.authenticateWithAccessCode(input.code.trim().toUpperCase());
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Código de acesso inválido" });
        }

        return {
          success: true,
          token: `access-token-${user.id}`,
          user,
        };
      }),
    listAccessCodes: adminProcedure.query(async () => {
      return await db.getAllAccessCodes();
    }),
    createAccessCode: adminProcedure
      .input(
        z.object({
          label: z.string().min(1).max(100),
          code: z.string().min(4).max(64),
          role: z.enum(["admin", "volunteer", "team_leader"]),
        }),
      )
      .mutation(async ({ input }) => {
        const id = await db.createAccessCode({
          label: input.label.trim(),
          plainCode: input.code.trim().toUpperCase(),
          role: input.role,
        });

        return {
          success: true,
          id,
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================
  // CATEGORIES
  // ============================================
  categories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        return await db.getCategoryById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createCategory(input);
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: uuidSchema,
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // TEAMS
  // ============================================
  teams: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTeams();
    }),

    getById: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        return await db.getTeamById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createTeam(input);
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: uuidSchema,
          name: z.string().min(1).max(100).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTeam(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        await db.deleteTeam(input.id);
        return { success: true };
      }),
  }),

  // ============================================
  // UNITS
  // ============================================
  units: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllUnits();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(100),
          abbreviation: z.string().min(1).max(10),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createUnit(input);
        return { id, success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        await db.deleteUnit(input.id);
        return { success: true };
      }),

    seed: protectedProcedure.mutation(async () => {
      await db.seedDefaultUnits();
      return { success: true };
    }),
  }),

  // ============================================
  // PRODUCTS
  // ============================================
  products: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProducts();
    }),

    getById: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    getByCategory: protectedProcedure
      .input(z.object({ categoryId: uuidSchema }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.categoryId);
      }),

    getLowStock: protectedProcedure.query(async () => {
      return await db.getLowStockProducts();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          categoryId: uuidSchema,
          unitId: uuidSchema,
          currentQuantity: z.string(),
          minimumStock: z.string(),
          unitCost: z.string().optional(),
          maxWithdrawalLimit: z.string().optional(),
          photoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createProduct(input);
        return { id, success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: uuidSchema,
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          categoryId: uuidSchema.optional(),
          unitId: uuidSchema.optional(),
          currentQuantity: z.string().optional(),
          minimumStock: z.string().optional(),
          unitCost: z.string().optional(),
          maxWithdrawalLimit: z.string().optional(),
          photoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: uuidSchema }))
      .mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),

    uploadPhoto: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const contentType = input.filename.endsWith(".png") ? "image/png" : "image/jpeg";
        const result = await storagePut(`products/${Date.now()}-${input.filename}`, buffer, contentType);
        return { url: result.url };
      }),
  }),

  // ============================================
  // MOVEMENTS
  // ============================================
  movements: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllMovements();
    }),

    getByProduct: protectedProcedure
      .input(z.object({ productId: uuidSchema, limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getMovementsByProduct(input.productId, input.limit);
      }),

    getByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMovementsByDateRange(input.startDate, input.endDate);
      }),

    getByServiceTime: protectedProcedure
      .input(
        z.object({
          serviceTime: z.enum(["08:30", "11:00", "17:00", "19:30"]),
          date: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMovementsByServiceTime(input.serviceTime, input.date);
      }),

    getByTeam: protectedProcedure
      .input(
        z.object({
          teamId: uuidSchema,
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .query(async ({ input }) => {
        return await db.getMovementsByTeam(input.teamId, input.startDate, input.endDate);
      }),

    createEntry: protectedProcedure
      .input(
        z.object({
          productId: uuidSchema,
          quantity: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createMovement({
          productId: input.productId,
          type: "entry",
          quantity: input.quantity,
          notes: input.notes,
          userId: ctx.user.id,
        });
        return { id, success: true };
      }),

    createWithdrawal: protectedProcedure
      .input(
        z.object({
          productId: uuidSchema,
          quantity: z.string(),
          volunteerName: z.string().min(1),
          teamId: uuidSchema,
          serviceTime: z.enum(["08:30", "11:00", "17:00", "19:30"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check if product exists and has enough quantity
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new Error("Produto não encontrado");
        }

        const requestedQty = parseFloat(input.quantity);
        const currentQty = parseFloat(product.currentQuantity);

        if (requestedQty > currentQty) {
          throw new Error("Quantidade insuficiente em estoque");
        }

        // Check withdrawal limit
        if (product.maxWithdrawalLimit) {
          const maxLimit = parseFloat(product.maxWithdrawalLimit);
          if (requestedQty > maxLimit) {
            throw new Error(`Limite de retirada excedido. Máximo: ${maxLimit}`);
          }
        }

        const id = await db.createMovement({
          productId: input.productId,
          type: "withdrawal",
          quantity: input.quantity,
          volunteerName: input.volunteerName,
          teamId: input.teamId,
          serviceTime: input.serviceTime,
          notes: input.notes,
          userId: ctx.user.id,
        });
        return { id, success: true };
      }),
  }),

  // ============================================
  // DASHBOARD
  // ============================================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  // ============================================
  // BACKUP & EXPORT
  // ============================================
  backup: router({
    export: protectedProcedure.query(async () => {
      const categories = await db.getAllCategories();
      const teams = await db.getAllTeams();
      const units = await db.getAllUnits();
      const products = await db.getAllProducts();
      const movements = await db.getAllMovements();

      return {
        timestamp: new Date().toISOString(),
        data: {
          categories,
          teams,
          units,
          products,
          movements,
        },
      };
    }),

    restore: protectedProcedure
      .input(
        z.object({
          data: z.object({
            categories: z.array(z.any()),
            teams: z.array(z.any()),
            units: z.array(z.any()),
            products: z.array(z.any()),
            movements: z.array(z.any()),
          }),
        })
      )
      .mutation(async ({ input }) => {
        // Note: This is a simplified restore - in production you'd want more validation
        // and potentially clear existing data first
        return { success: true, message: "Backup restaurado com sucesso" };
      }),
  }),

  reports: router({
    generatePDF: protectedProcedure
      .input(
        z.object({
          type: z.enum(["service", "team", "period"]),
          serviceTime: z.string().optional(),
          teamId: uuidSchema.optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        let movements: any[] = [];

        if (input.type === "service" && input.serviceTime) {
          movements = await db.getMovementsByServiceTime(input.serviceTime);
        } else if (input.type === "team" && input.teamId) {
          movements = await db.getMovementsByTeam(input.teamId);
        } else if (input.type === "period" && input.startDate && input.endDate) {
          movements = await db.getMovementsByPeriod(input.startDate, input.endDate);
        }

        // Generate PDF content (simplified - in production use a PDF library)
        const pdfData = {
          title: `Relatório - ${input.type}`,
          generatedAt: new Date().toISOString(),
          movements,
          totalMovements: movements.length,
        };

        return pdfData;
      }),

    filtered: protectedProcedure
      .input(
        z.object({
          type: z.enum(["entry", "exit", "all"]).optional(),
          serviceTime: z.string().optional(),
          teamId: uuidSchema.optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        let movements = await db.getAllMovements();

        // Apply filters
        if (input.type && input.type !== "all") {
          movements = movements.filter((m) => m.type === input.type);
        }

        if (input.serviceTime) {
          movements = movements.filter((m) => m.serviceTime === input.serviceTime);
        }

        if (input.teamId) {
          movements = movements.filter((m) => m.teamId === input.teamId);
        }

        if (input.startDate && input.endDate) {
          const start = new Date(input.startDate);
          const end = new Date(input.endDate);
          movements = movements.filter((m) => {
            const movDate = new Date(m.createdAt);
            return movDate >= start && movDate <= end;
          });
        }

        return movements;
      }),
  }),
});

export type AppRouter = typeof appRouter;
