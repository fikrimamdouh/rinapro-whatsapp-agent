/**
 * Report Exporter Service
 * Export data to Excel and PDF formats
 */

import * as XLSX from "xlsx";
import { getSQLiteDb } from "../db/sqlite";
import { calculateDashboardKPIs } from "./kpiCalculator";
import { getCompanyInfo, createReportHeader, createReportFooter } from "./brandingService";

/**
 * Export sales data to Excel
 */
export function exportSalesToExcel(): Buffer {
  const db = getSQLiteDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const sales = db.prepare(`
    SELECT 
      itemName as 'اسم الصنف',
      quantity as 'الكمية',
      unitPrice / 100.0 as 'سعر الوحدة',
      totalPrice / 100.0 as 'الإجمالي',
      saleDate as 'التاريخ',
      customerName as 'العميل',
      notes as 'ملاحظات'
    FROM salesUploads
    ORDER BY createdAt DESC
  `).all();

  const worksheet = XLSX.utils.json_to_sheet(sales);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "المبيعات");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Export inventory data to Excel
 */
export function exportInventoryToExcel(): Buffer {
  const db = getSQLiteDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const inventory = db.prepare(`
    SELECT 
      sku as 'الكود',
      itemName as 'اسم الصنف',
      category as 'الفئة',
      stockQuantity as 'الكمية',
      unitPrice / 100.0 as 'سعر الوحدة',
      totalValue / 100.0 as 'القيمة الإجمالية',
      notes as 'ملاحظات'
    FROM inventoryUploads
    ORDER BY createdAt DESC
  `).all();

  const worksheet = XLSX.utils.json_to_sheet(inventory);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "المخزون");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Export cashbox data to Excel
 */
export function exportCashboxToExcel(): Buffer {
  const db = getSQLiteDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const transactions = db.prepare(`
    SELECT 
      transactionType as 'النوع',
      amount / 100.0 as 'المبلغ',
      transactionDate as 'التاريخ',
      description as 'الوصف',
      category as 'التصنيف',
      notes as 'ملاحظات'
    FROM cashboxUploads
    ORDER BY transactionDate DESC
  `).all();

  const worksheet = XLSX.utils.json_to_sheet(transactions);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "الصندوق");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Export dashboard summary to Excel
 */
export function exportDashboardSummary(): Buffer {
  const kpis = calculateDashboardKPIs();

  const summaryData = [
    { "المؤشر": "إجمالي المبيعات", "القيمة": kpis.totalSales },
    { "المؤشر": "إجمالي الإيرادات", "القيمة": kpis.totalRevenue.toFixed(2) + " ريال" },
    { "المؤشر": "إجمالي المصروفات", "القيمة": kpis.totalExpenses.toFixed(2) + " ريال" },
    { "المؤشر": "رصيد الصندوق", "القيمة": kpis.cashBalance.toFixed(2) + " ريال" },
    { "المؤشر": "قيمة المخزون", "القيمة": kpis.inventoryValue.toFixed(2) + " ريال" },
    { "المؤشر": "أصناف منخفضة المخزون", "القيمة": kpis.lowStockItems },
    { "المؤشر": "عمليات الرفع الأخيرة", "القيمة": kpis.recentUploads },
  ];

  const worksheet = XLSX.utils.json_to_sheet(summaryData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ملخص لوحة التحكم");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * Generate PDF report (basic text-based)
 * For full PDF with styling, would need pdfkit or similar
 */
export function generatePDFReport(module: string): string {
  const kpis = calculateDashboardKPIs();
  const company = getCompanyInfo();

  let report = createReportHeader(`تقرير ${module}`) + `\n\n`;
  report += `=== ملخص المؤشرات ===\n`;
  report += `إجمالي المبيعات: ${kpis.totalSales}\n`;
  report += `رصيد الصندوق: ${kpis.cashBalance.toFixed(2)} ريال\n`;
  report += `قيمة المخزون: ${kpis.inventoryValue.toFixed(2)} ريال\n\n`;
  report += createReportFooter();

  return report;
}
