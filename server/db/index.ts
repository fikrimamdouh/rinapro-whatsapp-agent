/**
 * Database Layer
 * Implements Drizzle ORM with MySQL, falls back to SQLite
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, desc, and, like, lte } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import * as sqliteDb from "./sqlite";

let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;
let usingSQLite = false;

export async function initDatabase() {
  if (db) return db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log("[DB] No DATABASE_URL - using SQLite fallback");
    sqliteDb.initSQLite();
    usingSQLite = true;
    return null;
  }

  try {
    // Check if PostgreSQL
    if (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://")) {
      console.log("[DB] PostgreSQL detected - using SQLite with persistent storage");
      sqliteDb.initSQLite();
      usingSQLite = true;
      return null;
    }
    
    pool = mysql.createPool(connectionString);
    
    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    
    db = drizzle(pool, { schema, mode: "default" });
    console.log("[DB] MySQL connected successfully");
    return db;
  } catch (error) {
    console.warn("[DB] MySQL connection failed, using SQLite fallback");
    sqliteDb.initSQLite();
    usingSQLite = true;
    return null;
  }
}

export function getDb() {
  return db;
}

export function isUsingSQLite(): boolean {
  return usingSQLite;
}

// ============ Settings CRUD ============

export async function getSetting(key: string): Promise<string | null> {
  if (usingSQLite) {
    return sqliteDb.getSetting(key);
  }
  if (!db) return null;
  
  try {
    const result = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.settingKey, key))
      .limit(1);
    
    return result[0]?.settingValue ?? null;
  } catch (error) {
    console.error("[DB] getSetting error:", error);
    return null;
  }
}

export async function setSetting(key: string, value: string, description?: string): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.setSetting(key, value, description);
  }
  if (!db) return;

  try {
    const existing = await getSetting(key);
    
    if (existing !== null) {
      await db
        .update(schema.settings)
        .set({ settingValue: value, description })
        .where(eq(schema.settings.settingKey, key));
    } else {
      await db.insert(schema.settings).values({
        settingKey: key,
        settingValue: value,
        description,
      });
    }
  } catch (error) {
    console.error("[DB] setSetting error:", error);
  }
}

export async function getAllSettings(): Promise<schema.Setting[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM settings").all() as schema.Setting[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.settings);
  } catch (error) {
    console.error("[DB] getAllSettings error:", error);
    return [];
  }
}

// ============ Message Logging ============

export async function logMessage(data: {
  messageFrom: string;
  messageTo?: string;
  messageType: "incoming" | "outgoing";
  messageContent?: string;
  command?: string;
  response?: string;
}): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.logMessage(data);
  }
  if (!db) return;

  try {
    await db.insert(schema.messageLogs).values(data);
  } catch (error) {
    console.error("[DB] logMessage error:", error);
  }
}

export async function getMessageLogs(limit = 100): Promise<schema.MessageLog[]> {
  if (usingSQLite) {
    return sqliteDb.getMessageLogs(limit) as schema.MessageLog[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.messageLogs)
      .orderBy(desc(schema.messageLogs.timestamp))
      .limit(limit);
  } catch (error) {
    console.error("[DB] getMessageLogs error:", error);
    return [];
  }
}

// ============ WhatsApp Stats ============

export async function getWhatsAppStats(): Promise<schema.WhatsAppStats | null> {
  if (usingSQLite) {
    return sqliteDb.getWhatsAppStats() as schema.WhatsAppStats | null;
  }
  if (!db) return null;

  try {
    const result = await db.select().from(schema.whatsappStats).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getWhatsAppStats error:", error);
    return null;
  }
}

export async function updateWhatsAppStats(data: Partial<schema.InsertWhatsAppStats>): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.updateWhatsAppStats(data);
  }
  if (!db) return;

  try {
    const existing = await getWhatsAppStats();
    
    if (existing) {
      await db.update(schema.whatsappStats).set(data).where(eq(schema.whatsappStats.id, existing.id));
    } else {
      await db.insert(schema.whatsappStats).values(data as schema.InsertWhatsAppStats);
    }
  } catch (error) {
    console.error("[DB] updateWhatsAppStats error:", error);
  }
}

// ============ Connection Status ============

export async function getConnectionStatus(): Promise<schema.ConnectionStatus | null> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return null;
    const row = sqlite.prepare("SELECT * FROM connectionStatus LIMIT 1").get();
    return (row as schema.ConnectionStatus) || null;
  }
  if (!db) return null;

  try {
    const result = await db.select().from(schema.connectionStatus).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getConnectionStatus error:", error);
    return null;
  }
}

export async function updateConnectionStatus(data: Partial<schema.InsertConnectionStatus>): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    
    const existing = sqlite.prepare("SELECT * FROM connectionStatus LIMIT 1").get();
    if (existing) {
      const updates = Object.entries(data)
        .map(([k]) => `${k} = ?`)
        .join(", ");
      sqlite.prepare(`UPDATE connectionStatus SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(...Object.values(data), (existing as any).id);
    } else {
      sqlite.prepare("INSERT INTO connectionStatus (status) VALUES (?)").run(data.status || "disconnected");
    }
    return;
  }
  if (!db) return;

  try {
    const existing = await getConnectionStatus();
    
    if (existing) {
      await db.update(schema.connectionStatus).set(data).where(eq(schema.connectionStatus.id, existing.id));
    } else {
      await db.insert(schema.connectionStatus).values({
        status: "disconnected",
        ...data,
      });
    }
  } catch (error) {
    console.error("[DB] updateConnectionStatus error:", error);
  }
}

// ============ Customers CRUD ============

export async function getCustomers(): Promise<schema.Customer[]> {
  if (usingSQLite) {
    return sqliteDb.getCustomers() as schema.Customer[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.customers).orderBy(desc(schema.customers.createdAt));
  } catch (error) {
    console.error("[DB] getCustomers error:", error);
    return [];
  }
}

export async function getCustomerById(id: number): Promise<schema.Customer | null> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return null;
    return sqlite.prepare("SELECT * FROM customers WHERE id = ?").get(id) as schema.Customer | null;
  }
  if (!db) return null;
  
  try {
    const result = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getCustomerById error:", error);
    return null;
  }
}

export async function searchCustomers(query: string): Promise<schema.Customer[]> {
  if (usingSQLite) {
    return sqliteDb.searchCustomers(query) as schema.Customer[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.customers)
      .where(like(schema.customers.name, `%${query}%`))
      .limit(50);
  } catch (error) {
    console.error("[DB] searchCustomers error:", error);
    return [];
  }
}

export async function createCustomer(data: schema.InsertCustomer): Promise<number> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return 0;
    const result = sqlite.prepare(`
      INSERT INTO customers (name, phone, email, address, city, balance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.phone || null, data.email || null, data.address || null, data.city || null, data.balance || 0, data.notes || null);
    return result.lastInsertRowid as number;
  }
  if (!db) return 0;
  
  try {
    const result = await db.insert(schema.customers).values(data);
    return Number(result[0].insertId);
  } catch (error) {
    console.error("[DB] createCustomer error:", error);
    return 0;
  }
}

export async function updateCustomer(id: number, data: Partial<schema.InsertCustomer>): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
    sqlite.prepare(`UPDATE customers SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...Object.values(data), id);
    return;
  }
  if (!db) return;
  
  try {
    await db.update(schema.customers).set(data).where(eq(schema.customers.id, id));
  } catch (error) {
    console.error("[DB] updateCustomer error:", error);
  }
}

export async function deleteCustomer(id: number): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM customers WHERE id = ?").run(id);
    return;
  }
  if (!db) return;
  
  try {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
  } catch (error) {
    console.error("[DB] deleteCustomer error:", error);
  }
}

// ============ Suppliers CRUD ============

export async function getSuppliers(): Promise<schema.Supplier[]> {
  if (usingSQLite) {
    return sqliteDb.getSuppliers() as schema.Supplier[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.suppliers).orderBy(desc(schema.suppliers.createdAt));
  } catch (error) {
    console.error("[DB] getSuppliers error:", error);
    return [];
  }
}

export async function searchSuppliers(query: string): Promise<schema.Supplier[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM suppliers WHERE name LIKE ? LIMIT 50").all(`%${query}%`) as schema.Supplier[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.suppliers)
      .where(like(schema.suppliers.name, `%${query}%`))
      .limit(50);
  } catch (error) {
    console.error("[DB] searchSuppliers error:", error);
    return [];
  }
}

export async function createSupplier(data: schema.InsertSupplier): Promise<number> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return 0;
    const result = sqlite.prepare(`
      INSERT INTO suppliers (name, phone, email, address, city, balance, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.name, data.phone || null, data.email || null, data.address || null, data.city || null, data.balance || 0, data.notes || null);
    return result.lastInsertRowid as number;
  }
  if (!db) return 0;
  
  try {
    const result = await db.insert(schema.suppliers).values(data);
    return Number(result[0].insertId);
  } catch (error) {
    console.error("[DB] createSupplier error:", error);
    return 0;
  }
}

export async function deleteSupplier(id: number): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
    return;
  }
  if (!db) return;
  
  try {
    await db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
  } catch (error) {
    console.error("[DB] deleteSupplier error:", error);
  }
}

export async function getSupplierById(id: number): Promise<schema.Supplier | null> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return null;
    return sqlite.prepare("SELECT * FROM suppliers WHERE id = ?").get(id) as schema.Supplier | null;
  }
  if (!db) return null;
  
  try {
    const result = await db.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getSupplierById error:", error);
    return null;
  }
}

export async function updateSupplier(id: number, data: Partial<schema.InsertSupplier>): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
    sqlite.prepare(`UPDATE suppliers SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...Object.values(data), id);
    return;
  }
  if (!db) return;
  
  try {
    await db.update(schema.suppliers).set(data).where(eq(schema.suppliers.id, id));
  } catch (error) {
    console.error("[DB] updateSupplier error:", error);
  }
}

// ============ Invoices CRUD ============

export async function getInvoices(): Promise<schema.Invoice[]> {
  if (usingSQLite) {
    return sqliteDb.getInvoices() as schema.Invoice[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
  } catch (error) {
    console.error("[DB] getInvoices error:", error);
    return [];
  }
}

export async function getInvoiceById(id: number): Promise<schema.Invoice | null> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return null;
    return sqlite.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as schema.Invoice | null;
  }
  if (!db) return null;
  
  try {
    const result = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getInvoiceById error:", error);
    return null;
  }
}

export async function createInvoice(data: schema.InsertInvoice): Promise<number> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return 0;
    const result = sqlite.prepare(`
      INSERT INTO invoices (invoiceNumber, customerId, invoiceDate, totalAmount, paidAmount, remainingAmount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.invoiceNumber,
      data.customerId,
      data.invoiceDate instanceof Date ? data.invoiceDate.toISOString() : data.invoiceDate,
      data.totalAmount,
      data.paidAmount || 0,
      data.remainingAmount,
      data.status || "unpaid",
      data.notes || null
    );
    return result.lastInsertRowid as number;
  }
  if (!db) return 0;
  
  try {
    const result = await db.insert(schema.invoices).values(data);
    return Number(result[0].insertId);
  } catch (error) {
    console.error("[DB] createInvoice error:", error);
    return 0;
  }
}

export async function updateInvoice(id: number, data: Partial<schema.InsertInvoice>): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
    sqlite.prepare(`UPDATE invoices SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...Object.values(data), id);
    return;
  }
  if (!db) return;
  
  try {
    await db.update(schema.invoices).set(data).where(eq(schema.invoices.id, id));
  } catch (error) {
    console.error("[DB] updateInvoice error:", error);
  }
}

export async function deleteInvoice(id: number): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    return;
  }
  if (!db) return;
  
  try {
    await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
  } catch (error) {
    console.error("[DB] deleteInvoice error:", error);
  }
}

// ============ Installments CRUD ============

export async function getInstallments(): Promise<schema.Installment[]> {
  if (usingSQLite) {
    return sqliteDb.getInstallments() as schema.Installment[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.installments).orderBy(desc(schema.installments.dueDate));
  } catch (error) {
    console.error("[DB] getInstallments error:", error);
    return [];
  }
}

export async function getOverdueInstallments(): Promise<schema.Installment[]> {
  if (usingSQLite) {
    return sqliteDb.getOverdueInstallments() as schema.Installment[];
  }
  if (!db) return [];
  
  try {
    const now = new Date();
    return await db
      .select()
      .from(schema.installments)
      .where(and(
        eq(schema.installments.status, "pending"),
        lte(schema.installments.dueDate, now)
      ))
      .orderBy(schema.installments.dueDate);
  } catch (error) {
    console.error("[DB] getOverdueInstallments error:", error);
    return [];
  }
}

export async function createInstallment(data: schema.InsertInstallment): Promise<number> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return 0;
    const result = sqlite.prepare(`
      INSERT INTO installments (invoiceId, customerId, amount, dueDate, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.invoiceId,
      data.customerId,
      data.amount,
      data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate,
      data.status || "pending",
      data.notes || null
    );
    return result.lastInsertRowid as number;
  }
  if (!db) return 0;
  
  try {
    const result = await db.insert(schema.installments).values(data);
    return Number(result[0].insertId);
  } catch (error) {
    console.error("[DB] createInstallment error:", error);
    return 0;
  }
}

export async function updateInstallment(id: number, data: Partial<schema.InsertInstallment>): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
    sqlite.prepare(`UPDATE installments SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(...Object.values(data), id);
    return;
  }
  if (!db) return;
  
  try {
    await db.update(schema.installments).set(data).where(eq(schema.installments.id, id));
  } catch (error) {
    console.error("[DB] updateInstallment error:", error);
  }
}

export async function deleteInstallment(id: number): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM installments WHERE id = ?").run(id);
    return;
  }
  if (!db) return;
  
  try {
    await db.delete(schema.installments).where(eq(schema.installments.id, id));
  } catch (error) {
    console.error("[DB] deleteInstallment error:", error);
  }
}

// ============ Account Balances Import ============

export async function importAccountBalances(balances: schema.InsertAccountBalance[]): Promise<{ success: number; failed: number }> {
  if (!db && !usingSQLite) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const balance of balances) {
    try {
      if (usingSQLite) {
        const sqlite = sqliteDb.getSQLiteDb();
        if (sqlite) {
          sqlite.prepare(`
            INSERT INTO accountBalances (accountCode, accountName, openingDebitBalance, openingCreditBalance, debitMovement, creditMovement, debitBalance, creditBalance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            balance.accountCode || null,
            balance.accountName || null,
            balance.openingDebitBalance || 0,
            balance.openingCreditBalance || 0,
            balance.debitMovement || 0,
            balance.creditMovement || 0,
            balance.debitBalance || 0,
            balance.creditBalance || 0
          );
          success++;
        }
      } else if (db) {
        await db.insert(schema.accountBalances).values(balance);
        success++;
      }
    } catch (error) {
      failed++;
    }
  }

  return { success, failed };
}

// ============ Event Logs ============

export async function logEvent(data: schema.InsertEventLog): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare(`
      INSERT INTO eventLogs (eventName, eventPayload, status, retryCount, maxRetries)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.eventName, data.eventPayload, data.status || "pending", data.retryCount || 0, data.maxRetries || 3);
    return;
  }
  if (!db) return;
  
  try {
    await db.insert(schema.eventLogs).values(data);
  } catch (error) {
    console.error("[DB] logEvent error:", error);
  }
}

export async function getRecentEvents(limit = 50): Promise<schema.EventLog[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM eventLogs ORDER BY createdAt DESC LIMIT ?").all(limit) as schema.EventLog[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.eventLogs)
      .orderBy(desc(schema.eventLogs.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("[DB] getRecentEvents error:", error);
    return [];
  }
}

// ============ Dashboard Stats ============

export async function getDashboardStats(): Promise<{
  totalCustomers: number;
  totalSuppliers: number;
  totalInvoices: number;
  pendingInstallments: number;
  overdueInstallments: number;
  totalRevenue: number;
  totalPending: number;
}> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) {
      return {
        totalCustomers: 0,
        totalSuppliers: 0,
        totalInvoices: 0,
        pendingInstallments: 0,
        overdueInstallments: 0,
        totalRevenue: 0,
        totalPending: 0,
      };
    }
    
    const customers = sqlite.prepare("SELECT COUNT(*) as count FROM customers").get() as { count: number };
    const suppliers = sqlite.prepare("SELECT COUNT(*) as count FROM suppliers").get() as { count: number };
    const invoices = sqlite.prepare("SELECT COUNT(*) as count FROM invoices").get() as { count: number };
    const pending = sqlite.prepare("SELECT COUNT(*) as count FROM installments WHERE status = 'pending'").get() as { count: number };
    const overdue = sqlite.prepare("SELECT COUNT(*) as count FROM installments WHERE status = 'pending' AND dueDate <= datetime('now')").get() as { count: number };
    const revenue = sqlite.prepare("SELECT COALESCE(SUM(paidAmount), 0) as total FROM invoices").get() as { total: number };
    const pendingAmount = sqlite.prepare("SELECT COALESCE(SUM(remainingAmount), 0) as total FROM invoices WHERE status != 'paid'").get() as { total: number };
    
    return {
      totalCustomers: customers.count,
      totalSuppliers: suppliers.count,
      totalInvoices: invoices.count,
      pendingInstallments: pending.count,
      overdueInstallments: overdue.count,
      totalRevenue: revenue.total,
      totalPending: pendingAmount.total,
    };
  }
  
  // Return zeros if no database
  return {
    totalCustomers: 0,
    totalSuppliers: 0,
    totalInvoices: 0,
    pendingInstallments: 0,
    overdueInstallments: 0,
    totalRevenue: 0,
    totalPending: 0,
  };
}

// ============ Accounts CRUD ============

export interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId?: number;
  level: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAccounts(): Promise<Account[]> {
  if (usingSQLite) {
    return sqliteDb.getAccounts() as Account[];
  }
  return [];
}

export async function createAccount(data: { code: string; name: string; type?: string; parentId?: number; notes?: string }): Promise<number> {
  if (usingSQLite) {
    return sqliteDb.createAccount(data);
  }
  return 0;
}

export async function updateAccount(id: number, data: Partial<{ code: string; name: string; type: string; parentId: number; notes: string }>): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.updateAccount(id, data);
  }
}

export async function deleteAccount(id: number): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAccount(id);
  }
}

// ============ Reset/Delete All ============

export async function deleteAllCustomers(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAllCustomers();
  }
  if (!db) return;
  try {
    await db.delete(schema.customers);
  } catch (error) {
    console.error("[DB] deleteAllCustomers error:", error);
  }
}

export async function deleteAllSuppliers(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAllSuppliers();
  }
  if (!db) return;
  try {
    await db.delete(schema.suppliers);
  } catch (error) {
    console.error("[DB] deleteAllSuppliers error:", error);
  }
}

export async function deleteAllInvoices(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAllInvoices();
  }
  if (!db) return;
  try {
    await db.delete(schema.invoices);
  } catch (error) {
    console.error("[DB] deleteAllInvoices error:", error);
  }
}

export async function deleteAllInstallments(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAllInstallments();
  }
  if (!db) return;
  try {
    await db.delete(schema.installments);
  } catch (error) {
    console.error("[DB] deleteAllInstallments error:", error);
  }
}

export async function deleteAllAccounts(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.deleteAllAccounts();
  }
}

export async function resetAllData(): Promise<void> {
  if (usingSQLite) {
    return sqliteDb.resetAllData();
  }
  if (!db) return;
  try {
    await db.delete(schema.customers);
    await db.delete(schema.suppliers);
    await db.delete(schema.invoices);
    await db.delete(schema.installments);
    await db.delete(schema.messageLogs);
    await db.delete(schema.whatsappStats);
    await db.delete(schema.eventLogs);
  } catch (error) {
    console.error("[DB] resetAllData error:", error);
  }
}

// ============ Customer by Phone ============

export async function getCustomerByPhone(phone: string): Promise<schema.Customer | null> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return null;
    const normalizedPhone = phone.replace(/[\s+()-]/g, "");
    return sqlite.prepare("SELECT * FROM customers WHERE phone LIKE ? LIMIT 1").get(`%${normalizedPhone}%`) as schema.Customer | null;
  }
  if (!db) return null;
  
  try {
    const result = await db
      .select()
      .from(schema.customers)
      .where(like(schema.customers.phone, `%${phone}%`))
      .limit(1);
    return result[0] ?? null;
  } catch (error) {
    console.error("[DB] getCustomerByPhone error:", error);
    return null;
  }
}

// ============ Invoices by Customer ============

export async function getInvoicesByCustomerId(customerId: number): Promise<schema.Invoice[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM invoices WHERE customerId = ? ORDER BY invoiceDate DESC LIMIT 10").all(customerId) as schema.Invoice[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.customerId, customerId))
      .orderBy(desc(schema.invoices.invoiceDate))
      .limit(10);
  } catch (error) {
    console.error("[DB] getInvoicesByCustomerId error:", error);
    return [];
  }
}

// ============ Installments by Customer ============

export async function getInstallmentsByCustomerId(customerId: number): Promise<schema.Installment[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM installments WHERE customerId = ? AND status != 'paid' ORDER BY dueDate LIMIT 10").all(customerId) as schema.Installment[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.installments)
      .where(eq(schema.installments.customerId, customerId))
      .orderBy(schema.installments.dueDate)
      .limit(10);
  } catch (error) {
    console.error("[DB] getInstallmentsByCustomerId error:", error);
    return [];
  }
}

// ============ Customer Balances CRUD ============

export async function getCustomerBalances(): Promise<schema.CustomerBalance[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM customerBalances ORDER BY customerName").all() as schema.CustomerBalance[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.customerBalances);
  } catch (error) {
    console.error("[DB] getCustomerBalances error:", error);
    return [];
  }
}

export async function searchCustomerBalances(query: string): Promise<schema.CustomerBalance[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM customerBalances WHERE customerName LIKE ? OR customerCode LIKE ? ORDER BY customerName LIMIT 50").all(`%${query}%`, `%${query}%`) as schema.CustomerBalance[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.customerBalances)
      .where(like(schema.customerBalances.customerName, `%${query}%`))
      .limit(50);
  } catch (error) {
    console.error("[DB] searchCustomerBalances error:", error);
    return [];
  }
}

export async function createCustomerBalance(data: {
  customerCode: string;
  customerName: string;
  previousBalance: number;
  debit: number;
  credit: number;
  currentBalance: number;
  phone?: string;
}): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    // Use INSERT OR REPLACE to update existing records
    sqlite.prepare(`
      INSERT OR REPLACE INTO customerBalances (customerCode, customerName, previousBalance, debit, credit, currentBalance, phone, importDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(data.customerCode, data.customerName, data.previousBalance, data.debit, data.credit, data.currentBalance, data.phone || null);
    return;
  }
  if (!db) return;
  
  try {
    await db.insert(schema.customerBalances).values({
      customerCode: data.customerCode,
      customerName: data.customerName,
      previousBalance: data.previousBalance,
      debit: data.debit,
      credit: data.credit,
      currentBalance: data.currentBalance,
      phone: data.phone,
    });
  } catch (error) {
    console.error("[DB] createCustomerBalance error:", error);
  }
}

export async function deleteAllCustomerBalances(): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM customerBalances").run();
    return;
  }
  if (!db) return;
  try {
    await db.delete(schema.customerBalances);
  } catch (error) {
    console.error("[DB] deleteAllCustomerBalances error:", error);
  }
}

// ============ Account Balances CRUD ============

export async function getAccountBalances(): Promise<schema.AccountBalance[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM accountBalances ORDER BY accountCode").all() as schema.AccountBalance[];
  }
  if (!db) return [];
  
  try {
    return await db.select().from(schema.accountBalances);
  } catch (error) {
    console.error("[DB] getAccountBalances error:", error);
    return [];
  }
}

export async function searchAccountBalances(query: string): Promise<schema.AccountBalance[]> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return [];
    return sqlite.prepare("SELECT * FROM accountBalances WHERE accountName LIKE ? OR accountCode LIKE ? ORDER BY accountCode LIMIT 50").all(`%${query}%`, `%${query}%`) as schema.AccountBalance[];
  }
  if (!db) return [];
  
  try {
    return await db
      .select()
      .from(schema.accountBalances)
      .where(like(schema.accountBalances.accountName, `%${query}%`))
      .limit(50);
  } catch (error) {
    console.error("[DB] searchAccountBalances error:", error);
    return [];
  }
}

export async function createAccountBalance(data: {
  accountCode: string;
  accountName: string;
  openingDebitBalance: number;
  openingCreditBalance: number;
  debitMovement: number;
  creditMovement: number;
  debitBalance: number;
  creditBalance: number;
}): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    // Use INSERT OR REPLACE to update existing records
    sqlite.prepare(`
      INSERT OR REPLACE INTO accountBalances (accountCode, accountName, openingDebitBalance, openingCreditBalance, debitMovement, creditMovement, debitBalance, creditBalance, importDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(data.accountCode, data.accountName, data.openingDebitBalance, data.openingCreditBalance, data.debitMovement, data.creditMovement, data.debitBalance, data.creditBalance);
    return;
  }
  if (!db) return;
  
  try {
    await db.insert(schema.accountBalances).values(data);
  } catch (error) {
    console.error("[DB] createAccountBalance error:", error);
  }
}

export async function deleteAllAccountBalances(): Promise<void> {
  if (usingSQLite) {
    const sqlite = sqliteDb.getSQLiteDb();
    if (!sqlite) return;
    sqlite.prepare("DELETE FROM accountBalances").run();
    return;
  }
  if (!db) return;
  try {
    await db.delete(schema.accountBalances);
  } catch (error) {
    console.error("[DB] deleteAllAccountBalances error:", error);
  }
}

export { schema };
