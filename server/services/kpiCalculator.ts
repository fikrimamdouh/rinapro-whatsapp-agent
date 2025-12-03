/**
 * KPI Calculator Service
 * Calculate dashboard KPIs from uploaded data
 */

import { getSQLiteDb } from "../db/sqlite";

export interface DashboardKPIs {
  totalSales: number;
  totalRevenue: number;
  totalExpenses: number;
  cashBalance: number;
  inventoryValue: number;
  lowStockItems: number;
  recentUploads: number;
}

/**
 * Calculate all dashboard KPIs
 */
export function calculateDashboardKPIs(): DashboardKPIs {
  const db = getSQLiteDb();
  
  if (!db) {
    return {
      totalSales: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      cashBalance: 0,
      inventoryValue: 0,
      lowStockItems: 0,
      recentUploads: 0,
    };
  }

  // Calculate total sales
  const salesResult = db.prepare(`
    SELECT COUNT(*) as count, SUM(totalPrice) as total
    FROM salesUploads
  `).get() as { count: number; total: number | null };

  // Calculate cashbox balance
  const incomeResult = db.prepare(`
    SELECT SUM(amount) as total
    FROM cashboxUploads
    WHERE transactionType = 'income'
  `).get() as { total: number | null };

  const expenseResult = db.prepare(`
    SELECT SUM(amount) as total
    FROM cashboxUploads
    WHERE transactionType = 'expense'
  `).get() as { total: number | null };

  const totalRevenue = incomeResult.total || 0;
  const totalExpenses = expenseResult.total || 0;
  const cashBalance = totalRevenue - totalExpenses;

  // Calculate inventory value
  const inventoryResult = db.prepare(`
    SELECT SUM(totalValue) as total, COUNT(*) as count
    FROM inventoryUploads
    WHERE stockQuantity < 10
  `).get() as { total: number | null; count: number };

  const inventoryValueResult = db.prepare(`
    SELECT SUM(totalValue) as total
    FROM inventoryUploads
  `).get() as { total: number | null };

  // Count recent uploads (last 7 days)
  const recentUploadsResult = db.prepare(`
    SELECT COUNT(*) as count
    FROM fileUploads
    WHERE createdAt >= datetime('now', '-7 days')
  `).get() as { count: number };

  return {
    totalSales: salesResult.count || 0,
    totalRevenue: totalRevenue / 100, // Convert from halalas
    totalExpenses: totalExpenses / 100,
    cashBalance: cashBalance / 100,
    inventoryValue: (inventoryValueResult.total || 0) / 100,
    lowStockItems: inventoryResult.count || 0,
    recentUploads: recentUploadsResult.count || 0,
  };
}

/**
 * Get sales trend (last 7 days)
 */
export function getSalesTrend(): Array<{ date: string; total: number }> {
  const db = getSQLiteDb();
  if (!db) return [];

  const results = db.prepare(`
    SELECT 
      DATE(saleDate) as date,
      SUM(totalPrice) as total
    FROM salesUploads
    WHERE saleDate >= datetime('now', '-7 days')
    GROUP BY DATE(saleDate)
    ORDER BY date DESC
  `).all() as Array<{ date: string; total: number }>;

  return results.map(r => ({
    date: r.date,
    total: r.total / 100,
  }));
}

/**
 * Get top selling items
 */
export function getTopSellingItems(limit: number = 5): Array<{ itemName: string; quantity: number; revenue: number }> {
  const db = getSQLiteDb();
  if (!db) return [];

  const results = db.prepare(`
    SELECT 
      itemName,
      SUM(quantity) as quantity,
      SUM(totalPrice) as revenue
    FROM salesUploads
    GROUP BY itemName
    ORDER BY revenue DESC
    LIMIT ?
  `).all(limit) as Array<{ itemName: string; quantity: number; revenue: number }>;

  return results.map(r => ({
    itemName: r.itemName,
    quantity: r.quantity,
    revenue: r.revenue / 100,
  }));
}
