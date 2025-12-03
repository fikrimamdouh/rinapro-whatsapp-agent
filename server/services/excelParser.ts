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
  detectedType?: string;
}

/**
 * Normalize Arabic/English headers to standard field names
 */
const HEADER_MAPPINGS: Record<string, Record<string, string>> = {
  // Trial Balance (ميزان مراجعة)
  trialBalance: {
    "العميل": "customerName",
    "رقم الحساب": "accountNumber",
    "ما قبله": "openingBalance",
    "مدين": "debit",
    "دائن": "credit",
    "الرصيد": "balance",
    "الشيكات": "checks",
    "customer": "customerName",
    "account": "accountNumber",
    "opening": "openingBalance",
    "debit": "debit",
    "credit": "credit",
    "balance": "balance",
  },
  // Chart of Accounts (أرصدة الحسابات)
  chartOfAccounts: {
    "رقم الحساب": "accountNumber",
    "الحساب": "accountName",
    "اول المدة مدين": "openingDebit",
    "اول المدة دائن": "openingCredit",
    "الحركة مدين": "movementDebit",
    "الحركة دائن": "movementCredit",
    "الرصيد مدين": "balanceDebit",
    "الرصيد دائن": "balanceCredit",
    "account number": "accountNumber",
    "account name": "accountName",
    "opening debit": "openingDebit",
    "opening credit": "openingCredit",
    "movement debit": "movementDebit",
    "movement credit": "movementCredit",
    "balance debit": "balanceDebit",
    "balance credit": "balanceCredit",
  },
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
 * Auto-detect file type based on headers
 */
function detectFileType(headers: string[]): string {
  const headerStr = headers.join('|').toLowerCase();
  
  // Trial Balance detection
  if (headerStr.includes('ميزان مراجعه') || 
      (headerStr.includes('مدين') && headerStr.includes('دائن') && headerStr.includes('الرصيد'))) {
    return 'trialBalance';
  }
  
  // Chart of Accounts detection
  if (headerStr.includes('ارصدة الحسابات') || 
      (headerStr.includes('اول المدة') && headerStr.includes('الحركة'))) {
    return 'chartOfAccounts';
  }
  
  // Sales detection
  if (headerStr.includes('الصنف') || headerStr.includes('المنتج') || 
      headerStr.includes('item') || headerStr.includes('product')) {
    return 'sales';
  }
  
  // Inventory detection
  if (headerStr.includes('المخزون') || headerStr.includes('stock') || 
      headerStr.includes('الكود') || headerStr.includes('sku')) {
    return 'inventory';
  }
  
  // Cashbox detection
  if (headerStr.includes('الصندوق') || headerStr.includes('cashbox')) {
    return 'cashbox';
  }
  
  return 'unknown';
}

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
    
    // Find header row (skip title rows)
    let headerRowIndex = 0;
    let rawHeaders: string[] = [];
    
    for (let i = 0; i < Math.min(5, rawData.length); i++) {
      const row = rawData[i];
      const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && cell !== "").length;
      
      // Header row should have multiple non-empty cells
      if (nonEmptyCells >= 3) {
        rawHeaders = row.map((h: any) => String(h || "").trim());
        headerRowIndex = i;
        break;
      }
    }
    
    if (rawHeaders.length === 0) {
      return {
        success: false,
        data: [],
        headers: [],
        totalRows: 0,
        errors: ["لم يتم العثور على صف العناوين"],
      };
    }
    
    // Auto-detect file type if module is 'auto'
    const detectedModule = module === 'auto' ? detectFileType(rawHeaders) : module;
    
    if (detectedModule === 'unknown') {
      errors.push(`⚠️ لم يتم التعرف على نوع الملف تلقائياً. العناوين: ${rawHeaders.join(', ')}`);
    }
    
    const headers = normalizeHeaders(rawHeaders, detectedModule);
    
    // Extract data rows (skip header and any rows before it)
    const dataRows = rawData.slice(headerRowIndex + 1);
    
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
        return processRow(row, detectedModule);
      } catch (error: any) {
        errors.push(`خطأ في الصف ${index + headerRowIndex + 2}: ${error.message}`);
        return null;
      }
    }).filter(Boolean) as ParsedRow[];
    
    return {
      success: true,
      data: processedData,
      headers,
      totalRows: cleanedRows.length,
      errors,
      detectedType: detectedModule,
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
    case "trialBalance":
      return {
        accountNumber: row.accountNumber || "",
        customerName: row.customerName || "",
        openingBalance: parseNumber(row.openingBalance),
        debit: parseNumber(row.debit),
        credit: parseNumber(row.credit),
        balance: parseNumber(row.balance),
        checks: parseNumber(row.checks),
      };
      
    case "chartOfAccounts":
      return {
        accountNumber: row.accountNumber || "",
        accountName: row.accountName || "",
        openingDebit: parseNumber(row.openingDebit),
        openingCredit: parseNumber(row.openingCredit),
        movementDebit: parseNumber(row.movementDebit),
        movementCredit: parseNumber(row.movementCredit),
        balanceDebit: parseNumber(row.balanceDebit),
        balanceCredit: parseNumber(row.balanceCredit),
      };
    
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
