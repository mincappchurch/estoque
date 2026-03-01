import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  categories,
  Category,
  InsertCategory,
  teams,
  Team,
  InsertTeam,
  units,
  Unit,
  InsertUnit,
  products,
  Product,
  InsertProduct,
  movements,
  Movement,
  InsertMovement,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return null;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    return null;
  }
}

// ============================================
// CATEGORIES
// ============================================

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function createCategory(data: InsertCategory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ============================================
// TEAMS
// ============================================

export async function getAllTeams(): Promise<Team[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teams).orderBy(teams.name);
}

export async function getTeamById(id: number): Promise<Team | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result[0] || null;
}

export async function createTeam(data: InsertTeam): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teams).values(data);
  return result[0].insertId;
}

export async function updateTeam(id: number, data: Partial<InsertTeam>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(teams).set(data).where(eq(teams.id, id));
}

export async function deleteTeam(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(teams).where(eq(teams.id, id));
}

// ============================================
// UNITS
// ============================================

export async function getAllUnits(): Promise<Unit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units).orderBy(units.name);
}

export async function getUnitById(id: number): Promise<Unit | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return result[0] || null;
}

export async function createUnit(data: InsertUnit): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(units).values(data);
  return result[0].insertId;
}

export async function deleteUnit(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(units).where(eq(units.id, id));
}

// ============================================
// PRODUCTS
// ============================================

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.name);
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0] || null;
}

export async function getProductsByCategory(categoryId: number): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(products.name);
}

export async function getLowStockProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  const allProducts = await db.select().from(products);
  return allProducts.filter(p => parseFloat(p.currentQuantity) <= parseFloat(p.minimumStock));
}

export async function createProduct(data: InsertProduct): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return result[0].insertId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(products).where(eq(products.id, id));
}

export async function updateProductQuantity(productId: number, newQuantity: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ currentQuantity: newQuantity }).where(eq(products.id, productId));
}

// ============================================
// MOVEMENTS
// ============================================

export async function getAllMovements(): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(movements).orderBy(movements.createdAt);
}

export async function getMovementById(id: number): Promise<Movement | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(movements).where(eq(movements.id, id)).limit(1);
  return result[0] || null;
}

export async function getMovementsByProduct(productId: number, limit?: number): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(movements).where(eq(movements.productId, productId)).orderBy(movements.createdAt);
  if (limit) {
    query = query.limit(limit) as any;
  }
  return query;
}

export async function getMovementsByDateRange(startDate: Date, endDate: Date): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];
  const allMovements = await db.select().from(movements);
  return allMovements.filter(m => {
    const movementDate = new Date(m.createdAt);
    return movementDate >= startDate && movementDate <= endDate;
  });
}

export async function getMovementsByServiceTime(serviceTime: string, date?: Date): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];
  const allMovements = await db.select().from(movements);
  const filtered = allMovements.filter(m => m.serviceTime === serviceTime);
  
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return allMovements.filter(m => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= startOfDay && movementDate <= endOfDay;
    });
  }
  
  return allMovements;
}

export async function getMovementsByTeam(teamId: number, startDate?: Date, endDate?: Date): Promise<Movement[]> {
  const db = await getDb();
  if (!db) return [];
  const allMovements = await db.select().from(movements).where(eq(movements.teamId, teamId));
  
  if (startDate && endDate) {
    return allMovements.filter(m => {
      const movementDate = new Date(m.createdAt);
      return movementDate >= startDate && movementDate <= endDate;
    });
  }
  
  return allMovements;
}

export async function getTodayWithdrawals(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const allMovements = await db.select().from(movements);
  const todayMovements = allMovements.filter(m => {
    const movementDate = new Date(m.createdAt);
    return movementDate >= today && movementDate < tomorrow && m.type === 'withdrawal';
  });
  
  return todayMovements.length;
}

export async function createMovement(data: InsertMovement): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create movement record
  const result = await db.insert(movements).values(data);
  const movementId = result[0].insertId;
  
  // Update product quantity
  const product = await getProductById(data.productId);
  if (!product) throw new Error("Product not found");
  
  const currentQty = parseFloat(product.currentQuantity);
  const changeQty = parseFloat(data.quantity);
  const newQty = data.type === 'entry' 
    ? currentQty + changeQty 
    : currentQty - changeQty;
  
  await updateProductQuantity(data.productId, newQty.toString());
  
  return movementId;
}

// ============================================
// SEED DATA
// ============================================

export async function seedDefaultUnits(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const defaultUnits: InsertUnit[] = [
    { name: "Unidade", abbreviation: "un" },
    { name: "Quilograma", abbreviation: "kg" },
    { name: "Litro", abbreviation: "L" },
    { name: "Metro", abbreviation: "m" },
    { name: "Pacote", abbreviation: "pct" },
    { name: "Caixa", abbreviation: "cx" },
    { name: "Garrafa", abbreviation: "gf" },
  ];
  
  for (const unit of defaultUnits) {
    await createUnit(unit);
  }
}

// ============================================
// DASHBOARD
// ============================================

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalProducts: 0,
      lowStockCount: 0,
      todayWithdrawals: 0,
    };
  }

  const allProducts = await getAllProducts();
  const lowStock = await getLowStockProducts();
  const todayWithdrawals = await getTodayWithdrawals();

  return {
    totalProducts: allProducts.length,
    lowStockCount: lowStock.length,
    todayWithdrawals,
  };
}

export async function getMovementsByPeriod(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const allMovements = await getAllMovements();
  return allMovements.filter((m) => {
    const movDate = new Date(m.createdAt);
    return movDate >= start && movDate <= end;
  });
}
