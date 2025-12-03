/**
 * Anomaly Detection Service
 * Basic fraud detection and unusual pattern identification
 */

import { getSQLiteDb } from "../db/sqlite";

export interface Anomaly {
  type: "high_value" | "duplicate" | "unusual_time" | "rapid_transactions" | "negative_balance";
  severity: "low" | "medium" | "high";
  description: string;
  data: any;
  detectedAt: Date;
}

/**
 * Detect anomalies in sales data
 */
export function detectSalesAnomalies(): Anomaly[] {
  const db = getSQLiteDb();
  if (!db) return [];

  const anomalies: Anomaly[] = [];

  // Detect unusually high-value transactions
  const avgSale = db.prepare(`
    SELECT AVG(totalPrice) as avg FROM salesUploads
  `).get() as { avg: number };

  if (avgSale.avg) {
    const highValueSales = db.prepare(`
      SELECT * FROM salesUploads
      WHERE totalPrice > ?
      ORDER BY totalPrice DESC
      LIMIT 5
    `).all(avgSale.avg * 3) as any[];

    highValueSales.forEach(sale => {
      anomalies.push({
        type: "high_value",
        severity: "medium",
        description: `عملية بيع بقيمة عالية غير معتادة: ${(sale.totalPrice / 100).toFixed(2)} ريال`,
        data: sale,
        detectedAt: new Date(),
      });
    });
  }

  // Detect duplicate transactions (same item, quantity, price within 1 hour)
  const duplicates = db.prepare(`
    SELECT itemName, quantity, unitPrice, COUNT(*) as count
    FROM salesUploads
    WHERE saleDate >= datetime('now', '-1 hour')
    GROUP BY itemName, quantity, unitPrice
    HAVING count > 1
  `).all() as any[];

  duplicates.forEach(dup => {
    anomalies.push({
      type: "duplicate",
      severity: "high",
      description: `معاملات مكررة محتملة: ${dup.itemName} (${dup.count} مرات)`,
      data: dup,
      detectedAt: new Date(),
    });
  });

  return anomalies;
}

/**
 * Detect anomalies in cashbox transactions
 */
export function detectCashboxAnomalies(): Anomaly[] {
  const db = getSQLiteDb();
  if (!db) return [];

  const anomalies: Anomaly[] = [];

  // Detect large expenses
  const avgExpense = db.prepare(`
    SELECT AVG(amount) as avg FROM cashboxUploads
    WHERE transactionType = 'expense'
  `).get() as { avg: number };

  if (avgExpense.avg) {
    const largeExpenses = db.prepare(`
      SELECT * FROM cashboxUploads
      WHERE transactionType = 'expense' AND amount > ?
      ORDER BY amount DESC
      LIMIT 5
    `).all(avgExpense.avg * 5) as any[];

    largeExpenses.forEach(expense => {
      anomalies.push({
        type: "high_value",
        severity: "high",
        description: `مصروف كبير غير معتاد: ${(expense.amount / 100).toFixed(2)} ريال - ${expense.description}`,
        data: expense,
        detectedAt: new Date(),
      });
    });
  }

  // Detect rapid transactions (more than 10 in 1 hour)
  const rapidTransactions = db.prepare(`
    SELECT COUNT(*) as count
    FROM cashboxUploads
    WHERE transactionDate >= datetime('now', '-1 hour')
  `).get() as { count: number };

  if (rapidTransactions.count > 10) {
    anomalies.push({
      type: "rapid_transactions",
      severity: "medium",
      description: `عدد كبير من المعاملات في وقت قصير: ${rapidTransactions.count} معاملة في الساعة الأخيرة`,
      data: { count: rapidTransactions.count },
      detectedAt: new Date(),
    });
  }

  // Check for negative balance
  const balance = db.prepare(`
    SELECT 
      SUM(CASE WHEN transactionType = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN transactionType = 'expense' THEN amount ELSE 0 END) as expense
    FROM cashboxUploads
  `).get() as { income: number; expense: number };

  if (balance.income - balance.expense < 0) {
    anomalies.push({
      type: "negative_balance",
      severity: "high",
      description: `رصيد الصندوق سالب: ${((balance.income - balance.expense) / 100).toFixed(2)} ريال`,
      data: balance,
      detectedAt: new Date(),
    });
  }

  return anomalies;
}

/**
 * Detect anomalies in inventory
 */
export function detectInventoryAnomalies(): Anomaly[] {
  const db = getSQLiteDb();
  if (!db) return [];

  const anomalies: Anomaly[] = [];

  // Detect items with zero or negative stock
  const zeroStock = db.prepare(`
    SELECT * FROM inventoryUploads
    WHERE stockQuantity <= 0
  `).all() as any[];

  zeroStock.forEach(item => {
    anomalies.push({
      type: "negative_balance",
      severity: "high",
      description: `صنف بمخزون صفر أو سالب: ${item.itemName}`,
      data: item,
      detectedAt: new Date(),
    });
  });

  // Detect items with unusually high value
  const avgValue = db.prepare(`
    SELECT AVG(totalValue) as avg FROM inventoryUploads
  `).get() as { avg: number };

  if (avgValue.avg) {
    const highValueItems = db.prepare(`
      SELECT * FROM inventoryUploads
      WHERE totalValue > ?
      ORDER BY totalValue DESC
      LIMIT 3
    `).all(avgValue.avg * 10) as any[];

    highValueItems.forEach(item => {
      anomalies.push({
        type: "high_value",
        severity: "low",
        description: `صنف بقيمة عالية: ${item.itemName} - ${(item.totalValue / 100).toFixed(2)} ريال`,
        data: item,
        detectedAt: new Date(),
      });
    });
  }

  return anomalies;
}

/**
 * Get all anomalies
 */
export function getAllAnomalies(): Anomaly[] {
  return [
    ...detectSalesAnomalies(),
    ...detectCashboxAnomalies(),
    ...detectInventoryAnomalies(),
  ];
}
