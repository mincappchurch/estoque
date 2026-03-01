import type { Express } from "express";
import * as db from "./db";

export function registerSeedRoute(app: Express) {
  app.post("/api/seed-data", async (req, res) => {
    try {
      console.log("🌱 Iniciando seed do banco de dados...");

      // Seed default units
      await db.seedDefaultUnits();
      console.log("✅ Unidades de medida criadas");

      // Seed categories
      const categories = [
        { name: "Alimentos", description: "Produtos alimentícios" },
        { name: "Bebidas", description: "Bebidas em geral" },
        { name: "Limpeza", description: "Produtos de limpeza" },
        { name: "Descartáveis", description: "Itens descartáveis" },
        { name: "Decoração", description: "Itens de decoração" },
        { name: "Material de Escritório", description: "Papelaria e escritório" },
      ];

      for (const cat of categories) {
        try {
          await db.createCategory(cat);
        } catch (e) {
          // Ignore duplicates
        }
      }
      console.log("✅ Categorias criadas");

      // Seed teams
      const teams = [
        { name: "Louvor", description: "Equipe de louvor e adoração" },
        { name: "Recepção", description: "Equipe de recepção" },
        { name: "Kids", description: "Ministério infantil" },
        { name: "Mídia", description: "Equipe de som e imagem" },
        { name: "Intercessão", description: "Equipe de oração" },
        { name: "Café", description: "Equipe do café" },
      ];

      for (const team of teams) {
        try {
          await db.createTeam(team);
        } catch (e) {
          // Ignore duplicates
        }
      }
      console.log("✅ Times criados");

      // Get all units, categories, and teams
      const allUnits = await db.getAllUnits();
      const allCategories = await db.getAllCategories();
      const allTeams = await db.getAllTeams();

      const unitUn = allUnits.find((u) => u.abbreviation === "un")?.id || 1;
      const unitKg = allUnits.find((u) => u.abbreviation === "kg")?.id || 2;
      const unitPct = allUnits.find((u) => u.abbreviation === "pct")?.id || 5;

      const catAlimentos = allCategories.find((c) => c.name === "Alimentos")?.id || 1;
      const catBebidas = allCategories.find((c) => c.name === "Bebidas")?.id || 2;
      const catLimpeza = allCategories.find((c) => c.name === "Limpeza")?.id || 3;
      const catDescartaveis = allCategories.find((c) => c.name === "Descartáveis")?.id || 4;

      // Seed products
      const products = [
        {
          name: "Café em Pó",
          description: "Café tradicional para o café da manhã",
          categoryId: catAlimentos,
          unitId: unitKg,
          currentQuantity: "5",
          minimumStock: "2",
          unitCost: "25.00",
          maxWithdrawalLimit: "1",
        },
        {
          name: "Açúcar",
          description: "Açúcar refinado",
          categoryId: catAlimentos,
          unitId: unitKg,
          currentQuantity: "10",
          minimumStock: "3",
          unitCost: "4.50",
          maxWithdrawalLimit: "2",
        },
        {
          name: "Água Mineral",
          description: "Garrafas de água mineral 500ml",
          categoryId: catBebidas,
          unitId: unitUn,
          currentQuantity: "50",
          minimumStock: "20",
          unitCost: "1.50",
          maxWithdrawalLimit: "24",
        },
        {
          name: "Copos Descartáveis 200ml",
          description: "Pacote com 100 unidades",
          categoryId: catDescartaveis,
          unitId: unitPct,
          currentQuantity: "8",
          minimumStock: "5",
          unitCost: "8.00",
          maxWithdrawalLimit: "3",
        },
        {
          name: "Detergente",
          description: "Detergente líquido neutro",
          categoryId: catLimpeza,
          unitId: unitUn,
          currentQuantity: "15",
          minimumStock: "5",
          unitCost: "2.50",
          maxWithdrawalLimit: "5",
        },
        {
          name: "Papel Higiênico",
          description: "Pacote com 12 rolos",
          categoryId: catLimpeza,
          unitId: unitPct,
          currentQuantity: "3",
          minimumStock: "5",
          unitCost: "18.00",
          maxWithdrawalLimit: "2",
        },
        {
          name: "Biscoito",
          description: "Biscoito tipo cream cracker",
          categoryId: catAlimentos,
          unitId: unitPct,
          currentQuantity: "20",
          minimumStock: "10",
          unitCost: "3.50",
          maxWithdrawalLimit: "5",
        },
        {
          name: "Suco em Pó",
          description: "Suco artificial sabores variados",
          categoryId: catBebidas,
          unitId: unitUn,
          currentQuantity: "12",
          minimumStock: "8",
          unitCost: "2.00",
          maxWithdrawalLimit: "4",
        },
      ];

      for (const product of products) {
        try {
          await db.createProduct(product);
        } catch (e) {
          // Ignore duplicates
        }
      }
      console.log("✅ Produtos criados");

      console.log("🎉 Seed concluído com sucesso!");

      res.json({
        success: true,
        message: "Banco de dados populado com sucesso!",
        data: {
          units: allUnits.length,
          categories: allCategories.length,
          teams: allTeams.length,
          products: products.length,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao fazer seed:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });
}
