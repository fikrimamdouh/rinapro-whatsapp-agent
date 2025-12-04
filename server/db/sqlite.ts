/**
 * SQLite Fallback Database
 * Used when MySQL is not available
 */

import Database from "better-sqlite3";
import path from "path";

let sqliteDb: Database.Database | null = null;

export function initSQLite(): Database.Database {
  if (sqliteDb) return sqliteDb;

  const dbPath = path.join(process.cwd(), "data", "rinapro.db");
  
  // Ensure data directory exists
  const fs = require("fs");
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  sqliteDb = new Database(dbPath);
  
  // Create tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      taxNumber TEXT,
      welcomeMessage TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyId INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      whatsappGroupId TEXT,
      whatsappGroupName TEXT,
      managerPhone TEXT,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (companyId) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settingKey TEXT UNIQUE NOT NULL,
      settingValue TEXT,
      description TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      openingDebitBalance INTEGER DEFAULT 0,
      openingCreditBalance INTEGER DEFAULT 0,
      debitMovement INTEGER DEFAULT 0,
      creditMovement INTEGER DEFAULT 0,
      closingDebitBalance INTEGER DEFAULT 0,
      closingCreditBalance INTEGER DEFAULT 0,
      previousBalance INTEGER DEFAULT 0,
      debit INTEGER DEFAULT 0,
      credit INTEGER DEFAULT 0,
      balance INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      balance INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT UNIQUE NOT NULL,
      customerId INTEGER NOT NULL,
      invoiceDate DATETIME NOT NULL,
      totalAmount INTEGER NOT NULL,
      paidAmount INTEGER DEFAULT 0,
      remainingAmount INTEGER NOT NULL,
      status TEXT DEFAULT 'unpaid',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS installments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL,
      customerId INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      dueDate DATETIME NOT NULL,
      paidDate DATETIME,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customerInstallments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      installmentNumber TEXT UNIQUE NOT NULL,
      customerCode TEXT NOT NULL,
      customerName TEXT NOT NULL,
      customerPhone TEXT,
      totalAmount INTEGER NOT NULL,
      paidAmount INTEGER DEFAULT 0,
      remainingAmount INTEGER NOT NULL,
      installmentAmount INTEGER NOT NULL,
      dueDate DATETIME NOT NULL,
      paidDate DATETIME,
      status TEXT DEFAULT 'pending',
      paymentMethod TEXT,
      receiptNumber TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bonds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bondNumber TEXT UNIQUE NOT NULL,
      bondType TEXT NOT NULL,
      customerCode TEXT,
      customerName TEXT,
      amount INTEGER NOT NULL,
      bondDate DATETIME NOT NULL,
      description TEXT,
      paymentMethod TEXT,
      referenceNumber TEXT,
      status TEXT DEFAULT 'active',
      attachmentPath TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messageLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      messageFrom TEXT NOT NULL,
      messageTo TEXT,
      messageType TEXT NOT NULL,
      messageContent TEXT,
      command TEXT,
      response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS connectionStatus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT DEFAULT 'disconnected',
      lastConnected DATETIME,
      sessionData TEXT,
      qrCode TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS whatsappStats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      messagesSent INTEGER DEFAULT 0,
      messagesReceived INTEGER DEFAULT 0,
      messagesFailed INTEGER DEFAULT 0,
      successRate INTEGER DEFAULT 0,
      avgResponseTime INTEGER DEFAULT 0,
      activeGroups INTEGER DEFAULT 0,
      lastActivity TEXT,
      lastActivityTime DATETIME,
      lastActivityType TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS eventLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventName TEXT NOT NULL,
      eventPayload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error TEXT,
      retryCount INTEGER DEFAULT 0,
      maxRetries INTEGER DEFAULT 3,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastAttemptAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'asset',
      parentId INTEGER,
      level INTEGER DEFAULT 1,
      isActive INTEGER DEFAULT 1,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS accountBalances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountCode TEXT NOT NULL UNIQUE,
      accountName TEXT,
      openingDebitBalance INTEGER DEFAULT 0,
      openingCreditBalance INTEGER DEFAULT 0,
      debitMovement INTEGER DEFAULT 0,
      creditMovement INTEGER DEFAULT 0,
      debitBalance INTEGER DEFAULT 0,
      creditBalance INTEGER DEFAULT 0,
      importDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customerBalances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerCode TEXT NOT NULL UNIQUE,
      customerName TEXT NOT NULL,
      previousBalance INTEGER DEFAULT 0,
      debit INTEGER DEFAULT 0,
      credit INTEGER DEFAULT 0,
      currentBalance INTEGER DEFAULT 0,
      phone TEXT,
      importDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fileUploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      fileType TEXT NOT NULL,
      originalFilename TEXT NOT NULL,
      storedFilename TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      totalRows INTEGER DEFAULT 0,
      successRows INTEGER DEFAULT 0,
      failedRows INTEGER DEFAULT 0,
      errorMessage TEXT,
      uploadedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      processedAt DATETIME
    );

    CREATE TABLE IF NOT EXISTS salesUploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploadId INTEGER NOT NULL,
      itemName TEXT,
      quantity INTEGER DEFAULT 0,
      unitPrice INTEGER DEFAULT 0,
      totalPrice INTEGER DEFAULT 0,
      saleDate DATETIME,
      customerName TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventoryUploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploadId INTEGER NOT NULL,
      sku TEXT,
      itemName TEXT NOT NULL,
      category TEXT,
      stockQuantity INTEGER DEFAULT 0,
      unitPrice INTEGER DEFAULT 0,
      totalValue INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cashboxUploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploadId INTEGER NOT NULL,
      transactionType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      transactionDate DATETIME NOT NULL,
      description TEXT,
      category TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reportSnapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploadId INTEGER,
      reportType TEXT NOT NULL,
      reportData TEXT NOT NULL,
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentNumber TEXT UNIQUE NOT NULL,
      customerId INTEGER,
      customerName TEXT,
      driverId INTEGER,
      vehicleId INTEGER,
      status TEXT DEFAULT 'pending',
      origin TEXT,
      destination TEXT,
      scheduledDate DATETIME,
      deliveredDate DATETIME,
      totalCost INTEGER DEFAULT 0,
      distance INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      licenseNumber TEXT,
      licenseExpiry DATETIME,
      status TEXT DEFAULT 'active',
      rating INTEGER DEFAULT 0,
      totalDeliveries INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plateNumber TEXT UNIQUE NOT NULL,
      model TEXT,
      year INTEGER,
      capacity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      lastMaintenanceDate DATETIME,
      nextMaintenanceDate DATETIME,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS maintenanceRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestNumber TEXT UNIQUE NOT NULL,
      assetType TEXT NOT NULL,
      assetId INTEGER,
      assetName TEXT,
      issueDescription TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      technicianId INTEGER,
      scheduledDate DATETIME,
      completedDate DATETIME,
      estimatedCost INTEGER DEFAULT 0,
      actualCost INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS technicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      specialization TEXT,
      status TEXT DEFAULT 'active',
      rating INTEGER DEFAULT 0,
      totalJobs INTEGER DEFAULT 0,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS spareParts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partNumber TEXT UNIQUE NOT NULL,
      partName TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 0,
      unitPrice INTEGER DEFAULT 0,
      minStockLevel INTEGER DEFAULT 0,
      supplier TEXT,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paymentNumber TEXT UNIQUE NOT NULL,
      paymentType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paymentDate DATETIME NOT NULL,
      paymentMethod TEXT,
      referenceNumber TEXT,
      customerId INTEGER,
      supplierId INTEGER,
      description TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receiptNumber TEXT UNIQUE NOT NULL,
      receiptType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      receiptDate DATETIME NOT NULL,
      paymentMethod TEXT,
      referenceNumber TEXT,
      customerId INTEGER,
      description TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bankTransactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transactionNumber TEXT UNIQUE NOT NULL,
      bankName TEXT NOT NULL,
      accountNumber TEXT,
      transactionType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      transactionDate DATETIME NOT NULL,
      description TEXT,
      reconciled INTEGER DEFAULT 0,
      reconciledDate DATETIME,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkNumber TEXT UNIQUE NOT NULL,
      checkType TEXT NOT NULL,
      amount INTEGER NOT NULL,
      issueDate DATETIME NOT NULL,
      dueDate DATETIME NOT NULL,
      bankName TEXT,
      customerId INTEGER,
      supplierId INTEGER,
      status TEXT DEFAULT 'pending',
      clearedDate DATETIME,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("[SQLite] Database initialized at:", dbPath);
  return sqliteDb;
}

export function getSQLiteDb(): Database.Database | null {
  return sqliteDb;
}

// SQLite CRUD operations that mirror MySQL operations

export function getSetting(key: string): string | null {
  if (!sqliteDb) return null;
  const stmt = sqliteDb.prepare("SELECT settingValue FROM settings WHERE settingKey = ?");
  const row = stmt.get(key) as { settingValue: string } | undefined;
  return row?.settingValue ?? null;
}

export function setSetting(key: string, value: string, description?: string): void {
  if (!sqliteDb) return;
  const stmt = sqliteDb.prepare(`
    INSERT INTO settings (settingKey, settingValue, description)
    VALUES (?, ?, ?)
    ON CONFLICT(settingKey) DO UPDATE SET settingValue = ?, description = ?, updatedAt = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value, description || null, value, description || null);
}

export function getCustomers(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM customers ORDER BY createdAt DESC").all();
}

export function searchCustomers(query: string): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? LIMIT 50").all(`%${query}%`, `%${query}%`);
}

export function getInvoices(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM invoices ORDER BY createdAt DESC").all();
}

export function getInstallments(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM installments ORDER BY dueDate DESC").all();
}

export function getOverdueInstallments(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare(`
    SELECT * FROM installments 
    WHERE status = 'pending' AND dueDate <= datetime('now')
    ORDER BY dueDate
  `).all();
}

export function logMessage(data: {
  messageFrom: string;
  messageTo?: string;
  messageType: string;
  messageContent?: string;
  command?: string;
  response?: string;
}): void {
  if (!sqliteDb) return;
  const stmt = sqliteDb.prepare(`
    INSERT INTO messageLogs (messageFrom, messageTo, messageType, messageContent, command, response)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.messageFrom, data.messageTo || null, data.messageType, data.messageContent || null, data.command || null, data.response || null);
}

export function getMessageLogs(limit = 100): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM messageLogs ORDER BY timestamp DESC LIMIT ?").all(limit);
}

export function getWhatsAppStats(): any | null {
  if (!sqliteDb) return null;
  const row = sqliteDb.prepare("SELECT * FROM whatsappStats LIMIT 1").get();
  return row || null;
}

export function updateWhatsAppStats(data: Partial<{
  messagesSent: number;
  messagesReceived: number;
  messagesFailed: number;
  lastActivity: string;
}>): void {
  if (!sqliteDb) return;
  
  const existing = getWhatsAppStats();
  if (existing) {
    const updates: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
    
    if (updates.length > 0) {
      values.push(existing.id);
      sqliteDb.prepare(`UPDATE whatsappStats SET ${updates.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
    }
  } else {
    sqliteDb.prepare(`
      INSERT INTO whatsappStats (messagesSent, messagesReceived, messagesFailed, successRate, avgResponseTime, activeGroups)
      VALUES (0, 0, 0, 100, 0, 0)
    `).run();
  }
}

export function getSuppliers(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM suppliers ORDER BY createdAt DESC").all();
}

export function getAccounts(): any[] {
  if (!sqliteDb) return [];
  return sqliteDb.prepare("SELECT * FROM accounts ORDER BY code").all();
}

export function createAccount(data: { code: string; name: string; type?: string; parentId?: number; notes?: string }): number {
  if (!sqliteDb) return 0;
  const result = sqliteDb.prepare(`
    INSERT INTO accounts (code, name, type, parentId, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.code, data.name, data.type || "asset", data.parentId || null, data.notes || null);
  return result.lastInsertRowid as number;
}

export function updateAccount(id: number, data: any): void {
  if (!sqliteDb) return;
  const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
  sqliteDb.prepare(`UPDATE accounts SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...Object.values(data), id);
}

export function deleteAccount(id: number): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM accounts WHERE id = ?").run(id);
}

export function deleteAllCustomers(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM customers").run();
}

export function deleteAllSuppliers(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM suppliers").run();
}

export function deleteAllInvoices(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM invoices").run();
}

export function deleteAllInstallments(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM installments").run();
}

export function deleteAllAccounts(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM accounts").run();
}

export function resetAllData(): void {
  if (!sqliteDb) return;
  sqliteDb.prepare("DELETE FROM customers").run();
  sqliteDb.prepare("DELETE FROM suppliers").run();
  sqliteDb.prepare("DELETE FROM invoices").run();
  sqliteDb.prepare("DELETE FROM installments").run();
  sqliteDb.prepare("DELETE FROM accounts").run();
  sqliteDb.prepare("DELETE FROM messageLogs").run();
  sqliteDb.prepare("DELETE FROM whatsappStats").run();
  sqliteDb.prepare("DELETE FROM eventLogs").run();
}

export function db(): Database.Database {
  if (!sqliteDb) {
    throw new Error("SQLite database not initialized. Call initSQLite() first.");
  }
  return sqliteDb;
}
