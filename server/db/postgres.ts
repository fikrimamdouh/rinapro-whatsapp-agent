/**
 * PostgreSQL Database Connection
 * Used for persistent data storage in production
 */

import { Pool } from "pg";

let pool: Pool | null = null;

export function initPostgres(): Pool {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  console.log("[Database] PostgreSQL connection initialized");

  return pool;
}

export async function createTables(db: Pool): Promise<void> {
  const client = await db.connect();
  
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        "settingKey" TEXT UNIQUE NOT NULL,
        "settingValue" TEXT,
        description TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        "customerId" TEXT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        city TEXT,
        "openingDebitBalance" INTEGER DEFAULT 0,
        "openingCreditBalance" INTEGER DEFAULT 0,
        "debitMovement" INTEGER DEFAULT 0,
        "creditMovement" INTEGER DEFAULT 0,
        "closingDebitBalance" INTEGER DEFAULT 0,
        "closingCreditBalance" INTEGER DEFAULT 0,
        "previousBalance" INTEGER DEFAULT 0,
        debit INTEGER DEFAULT 0,
        credit INTEGER DEFAULT 0,
        balance INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        "accountCode" TEXT UNIQUE NOT NULL,
        "accountName" TEXT NOT NULL,
        "accountType" TEXT,
        "parentAccount" TEXT,
        "openingDebitBalance" INTEGER DEFAULT 0,
        "openingCreditBalance" INTEGER DEFAULT 0,
        "debitMovement" INTEGER DEFAULT 0,
        "creditMovement" INTEGER DEFAULT 0,
        "closingDebitBalance" INTEGER DEFAULT 0,
        "closingCreditBalance" INTEGER DEFAULT 0,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "customerCode" TEXT,
        "customerName" TEXT,
        date TEXT,
        "dueDate" TEXT,
        amount REAL,
        tax REAL DEFAULT 0,
        total REAL,
        status TEXT DEFAULT 'pending',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "invoiceItems" (
        id SERIAL PRIMARY KEY,
        "invoiceId" INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT,
        quantity INTEGER,
        "unitPrice" REAL,
        total REAL
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        "productCode" TEXT UNIQUE NOT NULL,
        "productName" TEXT NOT NULL,
        category TEXT,
        "unitPrice" REAL,
        quantity INTEGER DEFAULT 0,
        "minStock" INTEGER DEFAULT 0,
        supplier TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        "productCode" TEXT NOT NULL,
        "productName" TEXT,
        quantity INTEGER,
        "unitPrice" REAL,
        "totalValue" REAL,
        location TEXT,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        "transactionType" TEXT NOT NULL,
        "accountCode" TEXT,
        "accountName" TEXT,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        description TEXT,
        date TEXT,
        "referenceNumber" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS installments (
        id SERIAL PRIMARY KEY,
        "customerCode" TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        "customerPhone" TEXT,
        "totalAmount" REAL NOT NULL,
        "installmentAmount" REAL NOT NULL,
        "dueDate" TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        "paidAmount" REAL DEFAULT 0,
        "paidDate" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bonds (
        id SERIAL PRIMARY KEY,
        "bondNumber" TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        "customerName" TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shipments (
        id SERIAL PRIMARY KEY,
        "shipmentNumber" TEXT UNIQUE NOT NULL,
        "customerName" TEXT,
        destination TEXT,
        "shipmentDate" TEXT,
        "deliveryDate" TEXT,
        status TEXT DEFAULT 'pending',
        driver TEXT,
        vehicle TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        "driverCode" TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        "licenseNumber" TEXT,
        status TEXT DEFAULT 'available',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        "vehicleNumber" TEXT UNIQUE NOT NULL,
        type TEXT,
        capacity TEXT,
        status TEXT DEFAULT 'available',
        "lastMaintenance" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "maintenanceRequests" (
        id SERIAL PRIMARY KEY,
        "requestNumber" TEXT UNIQUE NOT NULL,
        equipment TEXT,
        "issueDescription" TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        "requestDate" TEXT,
        "completionDate" TEXT,
        technician TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        "paymentNumber" TEXT UNIQUE NOT NULL,
        "customerName" TEXT,
        amount REAL,
        "paymentMethod" TEXT,
        "paymentDate" TEXT,
        status TEXT DEFAULT 'completed',
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id SERIAL PRIMARY KEY,
        "receiptNumber" TEXT UNIQUE NOT NULL,
        "customerName" TEXT,
        amount REAL,
        "receiptDate" TEXT,
        "paymentMethod" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS checks (
        id SERIAL PRIMARY KEY,
        "checkNumber" TEXT UNIQUE NOT NULL,
        bank TEXT,
        amount REAL,
        "issueDate" TEXT,
        "dueDate" TEXT,
        status TEXT DEFAULT 'pending',
        "payeeName" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("[Database] PostgreSQL tables created successfully");
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error("Database not initialized");
  }
  
  return pool.query(text, params);
}

export function getDb(): Pool {
  if (!pool) {
    throw new Error("Database not initialized");
  }
  return pool;
}
