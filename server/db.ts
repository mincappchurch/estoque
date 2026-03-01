import type {
  Category,
  InsertCategory,
  InsertMovement,
  InsertProduct,
  InsertTeam,
  InsertUnit,
  InsertUser,
  Movement,
  Product,
  Team,
  Unit,
  User,
} from "../drizzle/schema";
import { hash } from "bcryptjs";
import { getSupabaseAdminClient } from "./_core/supabase";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SYSTEM_ACCESS_USER_OPEN_ID = "access-user";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

function requiredDb(): any {
  const db = getSupabaseAdminClient();
  if (!db) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return db;
}

function normalizeUser(row: any): User {
  return {
    id: row.id,
    openId: row.open_id,
    name: row.name,
    email: row.email,
    loginMethod: row.login_method,
    role: row.role,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastSignedIn: row.last_signed_in ? new Date(row.last_signed_in) : null,
  };
}

function normalizeCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function normalizeTeam(row: any): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function normalizeUnit(row: any): Unit {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function normalizeProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    unitId: row.unit_id,
    currentQuantity: row.current_quantity,
    minimumStock: row.minimum_stock,
    unitCost: row.unit_cost,
    maxWithdrawalLimit: row.max_withdrawal_limit,
    photoUrl: row.photo_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function normalizeMovement(row: any): Movement {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type,
    quantity: row.quantity,
    volunteerName: row.volunteer_name,
    teamId: row.team_id,
    serviceTime: row.service_time,
    notes: row.notes,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
  };
}

export type AccessCode = {
  id: string;
  label: string;
  role: User["role"];
  isActive: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
};

function normalizeAccessCode(row: any): AccessCode {
  return {
    id: row.id,
    label: row.label,
    role: row.role,
    isActive: row.is_active,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    createdAt: new Date(row.created_at),
  };
}

async function resolveUserId(inputUserId?: string | null): Promise<string> {
  if (inputUserId && isUuid(inputUserId)) {
    return inputUserId;
  }

  const db = requiredDb();
  const nowIso = new Date().toISOString();

  const payload = {
    open_id: SYSTEM_ACCESS_USER_OPEN_ID,
    name: "Usuário",
    email: "usuario@igreja.com",
    login_method: "access_code",
    role: "admin",
    last_signed_in: nowIso,
  };

  const { data, error } = await db
    .from("users")
    .upsert(payload, { onConflict: "open_id" })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to resolve access user");
  }

  return data.id;
}

function toIso(date: Date): string {
  return date.toISOString();
}

export async function getDb() {
  return getSupabaseAdminClient();
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = requiredDb();
  const role = user.role ?? "volunteer";

  const payload = {
    open_id: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    login_method: user.loginMethod ?? "oauth",
    role,
    last_signed_in: user.lastSignedIn ? toIso(new Date(user.lastSignedIn)) : toIso(new Date()),
  };

  const { error } = await db.from("users").upsert(payload, { onConflict: "open_id" });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserByOpenId(openId: string): Promise<User | null> {
  const db = requiredDb();
  const { data, error } = await db
    .from("users")
    .select("id, open_id, name, email, login_method, role, is_active, created_at, updated_at, last_signed_in")
    .eq("open_id", openId)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeUser(data);
}

export async function getUserById(id: string): Promise<User | null> {
  const db = requiredDb();
  const { data, error } = await db
    .from("users")
    .select("id, open_id, name, email, login_method, role, is_active, created_at, updated_at, last_signed_in")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeUser(data);
}

export async function authenticateWithAccessCode(code: string): Promise<User | null> {
  const db = requiredDb();

  const { data: result, error } = await db.rpc("fn_use_access_code", {
    p_plain_code: code,
  });

  if (error || !Array.isArray(result) || result.length === 0) {
    return null;
  }

  const accessCode = result[0] as {
    access_code_id: string;
    role: User["role"];
    label: string;
  };

  if (!accessCode?.access_code_id) {
    return null;
  }

  const openId = `access-code-${accessCode.access_code_id}`;
  const nowIso = toIso(new Date());

  const { error: upsertError } = await db.from("users").upsert(
    {
      open_id: openId,
      name: accessCode.label,
      email: null,
      login_method: "access_code",
      role: accessCode.role,
      last_signed_in: nowIso,
    },
    { onConflict: "open_id" },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return await getUserByOpenId(openId);
}

export async function getAllAccessCodes(): Promise<AccessCode[]> {
  const db = requiredDb();
  const { data, error } = await db
    .from("access_codes")
    .select("id, label, role, is_active, expires_at, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(normalizeAccessCode);
}

export async function createAccessCode(input: {
  label: string;
  plainCode: string;
  role: User["role"];
  expiresAt?: Date | null;
}): Promise<string> {
  const db = requiredDb();
  const codeHash = await hash(input.plainCode, 10);

  const { data, error } = await db
    .from("access_codes")
    .insert({
      label: input.label,
      code_hash: codeHash,
      role: input.role,
      is_active: true,
      expires_at: input.expiresAt ? toIso(input.expiresAt) : null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Falha ao criar código de acesso");
  }

  return data.id;
}

export async function getAllCategories(): Promise<Category[]> {
  const db = requiredDb();
  const { data, error } = await db.from("categories").select("*").order("name");
  if (error || !data) return [];
  return data.map(normalizeCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = requiredDb();
  const { data, error } = await db.from("categories").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizeCategory(data);
}

export async function createCategory(data: InsertCategory): Promise<string> {
  const db = requiredDb();
  const { data: inserted, error } = await db
    .from("categories")
    .insert({ name: data.name, description: data.description ?? null })
    .select("id")
    .single();
  if (error || !inserted?.id) throw new Error(error?.message || "Failed to create category");
  return inserted.id;
}

export async function updateCategory(id: string, data: Partial<InsertCategory>): Promise<void> {
  const db = requiredDb();
  const { error } = await db
    .from("categories")
    .update({
      name: data.name,
      description: data.description ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = requiredDb();
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAllTeams(): Promise<Team[]> {
  const db = requiredDb();
  const { data, error } = await db.from("teams").select("*").order("name");
  if (error || !data) return [];
  return data.map(normalizeTeam);
}

export async function getTeamById(id: string): Promise<Team | null> {
  const db = requiredDb();
  const { data, error } = await db.from("teams").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizeTeam(data);
}

export async function createTeam(data: InsertTeam): Promise<string> {
  const db = requiredDb();
  const { data: inserted, error } = await db
    .from("teams")
    .insert({ name: data.name, description: data.description ?? null })
    .select("id")
    .single();
  if (error || !inserted?.id) throw new Error(error?.message || "Failed to create team");
  return inserted.id;
}

export async function updateTeam(id: string, data: Partial<InsertTeam>): Promise<void> {
  const db = requiredDb();
  const { error } = await db
    .from("teams")
    .update({
      name: data.name,
      description: data.description ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTeam(id: string): Promise<void> {
  const db = requiredDb();
  const { error } = await db.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAllUnits(): Promise<Unit[]> {
  const db = requiredDb();
  const { data, error } = await db.from("units").select("*").order("name");
  if (error || !data) return [];
  return data.map(normalizeUnit);
}

export async function getUnitById(id: string): Promise<Unit | null> {
  const db = requiredDb();
  const { data, error } = await db.from("units").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizeUnit(data);
}

export async function createUnit(data: InsertUnit): Promise<string> {
  const db = requiredDb();
  const { data: inserted, error } = await db
    .from("units")
    .insert({
      name: data.name,
      abbreviation: data.abbreviation,
    })
    .select("id")
    .single();
  if (error || !inserted?.id) throw new Error(error?.message || "Failed to create unit");
  return inserted.id;
}

export async function deleteUnit(id: string): Promise<void> {
  const db = requiredDb();
  const { error } = await db.from("units").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getAllProducts(): Promise<Product[]> {
  const db = requiredDb();
  const { data, error } = await db.from("products").select("*").order("name");
  if (error || !data) return [];
  return data.map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const db = requiredDb();
  const { data, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizeProduct(data);
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const db = requiredDb();
  const { data, error } = await db.from("products").select("*").eq("category_id", categoryId).order("name");
  if (error || !data) return [];
  return data.map(normalizeProduct);
}

export async function getLowStockProducts(): Promise<Product[]> {
  const allProducts = await getAllProducts();
  return allProducts.filter((product) => parseFloat(product.currentQuantity) <= parseFloat(product.minimumStock));
}

export async function createProduct(data: InsertProduct): Promise<string> {
  const db = requiredDb();
  const { data: inserted, error } = await db
    .from("products")
    .insert({
      name: data.name,
      description: data.description ?? null,
      category_id: data.categoryId,
      unit_id: data.unitId,
      current_quantity: data.currentQuantity,
      minimum_stock: data.minimumStock,
      unit_cost: data.unitCost ?? null,
      max_withdrawal_limit: data.maxWithdrawalLimit ?? null,
      photo_url: data.photoUrl ?? null,
    })
    .select("id")
    .single();
  if (error || !inserted?.id) throw new Error(error?.message || "Failed to create product");
  return inserted.id;
}

export async function updateProduct(id: string, data: Partial<InsertProduct>): Promise<void> {
  const db = requiredDb();
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.description !== undefined) payload.description = data.description ?? null;
  if (data.categoryId !== undefined) payload.category_id = data.categoryId;
  if (data.unitId !== undefined) payload.unit_id = data.unitId;
  if (data.currentQuantity !== undefined) payload.current_quantity = data.currentQuantity;
  if (data.minimumStock !== undefined) payload.minimum_stock = data.minimumStock;
  if (data.unitCost !== undefined) payload.unit_cost = data.unitCost ?? null;
  if (data.maxWithdrawalLimit !== undefined) payload.max_withdrawal_limit = data.maxWithdrawalLimit ?? null;
  if (data.photoUrl !== undefined) payload.photo_url = data.photoUrl ?? null;

  const { error } = await db.from("products").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = requiredDb();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateProductQuantity(productId: string, newQuantity: string): Promise<void> {
  const db = requiredDb();
  const { error } = await db.from("products").update({ current_quantity: newQuantity }).eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function getAllMovements(): Promise<Movement[]> {
  const db = requiredDb();
  const { data, error } = await db.from("movements").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(normalizeMovement);
}

export async function getMovementById(id: string): Promise<Movement | null> {
  const db = requiredDb();
  const { data, error } = await db.from("movements").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return normalizeMovement(data);
}

export async function getMovementsByProduct(productId: string, limit?: number): Promise<Movement[]> {
  const db = requiredDb();
  let query = db
    .from("movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(normalizeMovement);
}

export async function getMovementsByDateRange(startDate: Date, endDate: Date): Promise<Movement[]> {
  const db = requiredDb();
  const { data, error } = await db
    .from("movements")
    .select("*")
    .gte("created_at", toIso(startDate))
    .lte("created_at", toIso(endDate))
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map(normalizeMovement);
}

export async function getMovementsByServiceTime(serviceTime: string, date?: Date): Promise<Movement[]> {
  const db = requiredDb();
  let query = db
    .from("movements")
    .select("*")
    .eq("service_time", serviceTime)
    .order("created_at", { ascending: false });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query.gte("created_at", toIso(startOfDay)).lte("created_at", toIso(endOfDay));
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(normalizeMovement);
}

export async function getMovementsByTeam(teamId: string, startDate?: Date, endDate?: Date): Promise<Movement[]> {
  const db = requiredDb();
  let query = db
    .from("movements")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (startDate && endDate) {
    query = query.gte("created_at", toIso(startDate)).lte("created_at", toIso(endDate));
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(normalizeMovement);
}

export async function getTodayWithdrawals(): Promise<number> {
  const db = requiredDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await db
    .from("movements")
    .select("id", { count: "exact", head: true })
    .eq("type", "withdrawal")
    .gte("created_at", toIso(today));

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function createMovement(data: InsertMovement): Promise<string> {
  const db = requiredDb();
  const userId = await resolveUserId(data.userId);

  const { data: movementId, error } = await db.rpc("fn_record_movement", {
    p_product_id: data.productId,
    p_type: data.type,
    p_quantity: data.quantity,
    p_user_id: userId,
    p_volunteer_name: data.volunteerName ?? null,
    p_team_id: data.teamId ?? null,
    p_service_time: data.serviceTime ?? null,
    p_notes: data.notes ?? null,
  });

  if (error || !movementId) {
    throw new Error(error?.message || "Failed to record movement");
  }

  return movementId;
}

export async function seedDefaultUnits(): Promise<void> {
  const db = requiredDb();

  const defaultUnits: Array<Pick<InsertUnit, "name" | "abbreviation">> = [
    { name: "Unidade", abbreviation: "un" },
    { name: "Quilograma", abbreviation: "kg" },
    { name: "Litro", abbreviation: "L" },
    { name: "Metro", abbreviation: "m" },
    { name: "Pacote", abbreviation: "pct" },
    { name: "Caixa", abbreviation: "cx" },
    { name: "Garrafa", abbreviation: "gf" },
  ];

  const { error } = await db.from("units").upsert(defaultUnits, { onConflict: "name" });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardStats() {
  const db = requiredDb();
  const { data, error } = await db.from("vw_dashboard_stats").select("*").limit(1).maybeSingle();

  if (error || !data) {
    return {
      totalProducts: 0,
      lowStockCount: 0,
      todayWithdrawals: 0,
    };
  }

  return {
    totalProducts: data.total_products ?? 0,
    lowStockCount: data.low_stock_count ?? 0,
    todayWithdrawals: data.today_withdrawals ?? 0,
  };
}

export async function getMovementsByPeriod(startDate: string, endDate: string) {
  return getMovementsByDateRange(new Date(startDate), new Date(endDate));
}
