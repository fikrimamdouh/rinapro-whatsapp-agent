/**
 * Excel Parser Service
 * Auto-detect headers and parse Excel files for different modules
 */

import * as XLSX from "xlsx";

export interface ParsedRow {
  [key: string]: any;
}

export interface ParseResult {
  success: boolean;
  data: ParsedRow[];
  headers: string[];
  totalRows: number;
  errors: string[];
}

/**
 * Normalize Arabic/English headers to standard field names
 */
const HEADER_MAPPINGS: Record<string, Record<string, string>> = {
  sales: {
    // Arabic
    "الصنف": "itemName",
    "اسم الصنف": "itemName",
    "المنتج": "itemName",
    "الكمية": "quantity",
    "العدد": "quantity",
    "السعر": "unitPrice",
    "سعر الوحدة": "unitPrice",
    "الإجمالي": "totalPrice",
    "المجموع": "totalPrice",
    "التاريخ": "saleDate",
    "تاريخ البيع": "saleDate",
    "العميل": "customerName",
    "اسم العميل": "customerName",
    "ملاحظات": "notes",
    // English
    "item": "itemName",
    "product": "itemName",
    "quantity": "quantity",
    "qty": "quantity",
    "price": "unitPrice",
    "unit price": "unitPrice",
    "total": "totalPrice",
    "date": "saleDate",
    "customer": "customerName",
    "notes": "notes",
  },
  inventory: {
    // Arabic
    "الكود": "sku",
    "رمز المنتج": "sku",
    "الصنف": "itemName",
    "اسم الصنف": "itemName",
    "الفئة": "category",
    "التصنيف": "category",
    "الكمية": "stockQuantity",
    "المخزون": "stockQuantity",
    "السعر": "unitPrice",
    "سعر الوحدة": "unitPrice",
    "القيمة": "totalValue",
    "القيمة الإجمالية": "totalValue",
    "ملاحظات": "notes",
    // English
    "sku": "sku",
    "code": "sku",
    "item": "itemName",
    "name": "itemName",
    "category": "category",
    "quantity": "stockQuantity",
    "stock": "stockQuantity",
    "price": "unitPrice",
    "value": "totalValue",
    "notes": "notes",
  },
  cashbox: {
    // Arabic
    "النوع": "transactionType",
    "نوع العملية": "transactionType",
    "المبلغ": "amount",
    "القيمة": "amount",
    "التاريخ": "transactionDate",
    "الوصف": "description",
    "البيان": "description",
    "التصنيف": "category",
    "الفئة": "category",
    "ملاحظات": "notes",
    // English
    "type": "transactionType",
    "amount": "amount",
    "date": "transactionDate",
    "description": "description",
    "category": "category",
    "notes": "notes",
  },
};

/**
 * Detect and normalize headers
 */
function normalizeHeaders(headers: string[], module: string): string[] {
  const mapping = HEADER_MAPPINGS[module] || {};
  return headers.map((header) => {
    const normalized = header.trim().toLowerCase();
    return mapping[normalized] || mapping[header.trim()] || header;
  });
}

/**
 * Convert string to number (handle Arabic/English numbers)
 */
function parseNumber(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  
  // Remove commas and spaces
  const cleaned = String(value).replace(/[,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse date from various formats
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  // Try parsing as Excel serial date
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  
  // Try parsing as string
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Remove empty rows
 */
function removeEmptyRows(rows: any[]): any[] {
  return rows.filter((row) => {
    return Object.values(row).some((value) => value !== null && value !== undefined && value !== "");
  });
}

/**
 * Parse Excel file for specific module
 */
export function parseExcelFile(
  fileBuffer: Buffer,
  module: string
): ParseResult {
  const errors: string[] = [];
  
  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        data: [],
        headers: [],
        totalRows: 0,
        errors: ["الملف فارغ أو لا يحتوي على أوراق عمل"],
      };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (rawData.length === 0) {
      return {
        success: false,
        data: [],
        headers: [],
        totalRows: 0,
        errors: ["الملف فارغ"],
      };
    }
    
    // Extract headers (first row)
    const rawHeaders = rawData[0].map((h: any) => String(h || "").trim());
    const headers = normalizeHeaders(rawHeaders, module);
    
    // Extract data rows (skip header)
    const dataRows = rawData.slice(1);
    
    // Remove empty rows
    const cleanedRows = removeEmptyRows(
      dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      })
    );
    
    // Process rows based on module
    const processedData = cleanedRows.map((row, index) => {
      try {
        return processRow(row, module);
      } catch (error: any) {
        errors.push(`خطأ في الصف ${index + 2}: ${error.message}`);
        return null;
      }
    }).filter(Boolean) as ParsedRow[];
    
    return {
      success: true,
      data: processedData,
      headers,
      totalRows: cleanedRows.length,
      errors,
    };
  } catch (error: any) {
    return {
      success: false,
      data: [],
      headers: [],
      totalRows: 0,
      errors: [`خطأ في قراءة الملف: ${error.message}`],
    };
  }
}

/**
 * Process individual row based on module
 */
function processRow(row: any, module: string): ParsedRow {
  switch (module) {
    case "sales":
      return {
        itemName: row.itemName || "",
        quantity: parseNumber(row.quantity),
        unitPrice: Math.round(parseNumber(row.unitPrice) * 100), // Convert to halalas
        totalPrice: Math.round(parseNumber(row.totalPrice) * 100),
        saleDate: parseDate(row.saleDate),
        customerName: row.customerName || "",
        notes: row.notes || "",
      };
      
    case "inventory":
      return {
        sku: row.sku || "",
        itemName: row.itemName || "",
        category: row.category || "",
        stockQuantity: parseNumber(row.stockQuantity),
        unitPrice: Math.round(parseNumber(row.unitPrice) * 100),
        totalValue: Math.round(parseNumber(row.totalValue) * 100),
        notes: row.notes || "",
      };
      
    case "cashbox":
      const type = String(row.transactionType || "").toLowerCase();
      const transactionType = type.includes("دخل") || type.includes("income") || type.includes("إيراد")
        ? "income"
        : "expense";
      
      return {
        transactionType,
        amount: Math.round(parseNumber(row.amount) * 100),
        transactionDate: parseDate(row.transactionDate) || new Date(),
        description: row.description || "",
        category: row.category || "",
        notes: row.notes || "",
      };
      
    default:
      return row;
  }
}

/**
 * Generate Excel template for module
 */
export function generateTemplate(module: string): Buffer {
  const templates: Record<string, any[][]> = {
    sales: [
      ["اسم الصنف", "الكمية", "سعر الوحدة", "الإجمالي", "التاريخ", "اسم العميل", "ملاحظات"],
      ["منتج تجريبي", 10, 50.00, 500.00, "2024-01-01", "عميل تجريبي", ""],
    ],
    inventory: [
      ["الكود", "اسم الصنف", "الفئة", "الكمية", "سعر الوحدة", "القيمة الإجمالية", "ملاحظات"],
      ["SKU001", "منتج تجريبي", "فئة أ", 100, 25.00, 2500.00, ""],
    ],
    cashbox: [
      ["النوع", "المبلغ", "التاريخ", "الوصف", "التصنيف", "ملاحظات"],
      ["دخل", 1000.00, "2024-01-01", "إيراد مبيعات", "مبيعات", ""],
      ["مصروف", 500.00, "2024-01-01", "مصروف تشغيلي", "تشغيل", ""],
    ],
  };
  
  const data = templates[module] || templates.sales;
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
