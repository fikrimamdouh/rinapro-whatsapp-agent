import * as XLSX from "xlsx";

export interface ExcelColumn {
  key: string;
  header: string;
  headerIndex?: number;
}

export interface ParseOptions {
  headerRowIndex?: number;
  skipRows?: number;
}

export function parseExcelFile<T>(
  file: File, 
  columns: ExcelColumn[], 
  options: ParseOptions = {}
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const headerRowIndex = options.headerRowIndex ?? 0;
        const skipRows = options.skipRows ?? 0;
        
        if (jsonData.length < headerRowIndex + 2) {
          throw new Error("الملف فارغ أو لا يحتوي على بيانات");
        }
        
        const headers = jsonData[headerRowIndex] as string[];
        const rows = jsonData.slice(headerRowIndex + 1 + skipRows);
        
        const headerMap: Record<string, number> = {};
        columns.forEach((col) => {
          if (col.headerIndex !== undefined) {
            headerMap[col.key] = col.headerIndex;
          } else {
            const idx = headers.findIndex(
              (h) => h?.toString().trim() === col.header || h?.toString().trim() === col.key
            );
            if (idx !== -1) {
              headerMap[col.key] = idx;
            }
          }
        });
        
        const result: T[] = rows
          .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
          .map((row) => {
            const obj: any = {};
            columns.forEach((col) => {
              const idx = headerMap[col.key];
              if (idx !== undefined) {
                let value = row[idx];
                if (value instanceof Date) {
                  value = value.toISOString().split("T")[0];
                } else if (typeof value === "number" && col.key.includes("Date")) {
                  const date = XLSX.SSF.parse_date_code(value);
                  value = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
                }
                obj[col.key] = value;
              }
            });
            return obj as T;
          });
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
    reader.readAsArrayBuffer(file);
  });
}

export function generateExcelFile<T extends Record<string, any>>(
  data: T[],
  columns: ExcelColumn[],
  filename: string
): void {
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) => columns.map((col) => item[col.key] ?? ""));
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  const colWidths = columns.map((col) => ({ wch: Math.max(col.header.length * 2, 15) }));
  worksheet["!cols"] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function generateExcelTemplate(columns: ExcelColumn[], filename: string): void {
  const headers = columns.map((col) => col.header);
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  
  const colWidths = columns.map((col) => ({ wch: Math.max(col.header.length * 2, 15) }));
  worksheet["!cols"] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  
  XLSX.writeFile(workbook, `${filename}_template.xlsx`);
}

export const CUSTOMER_COLUMNS: ExcelColumn[] = [
  { key: "name", header: "الاسم" },
  { key: "phone", header: "الهاتف" },
  { key: "email", header: "البريد الإلكتروني" },
  { key: "address", header: "العنوان" },
  { key: "city", header: "المدينة" },
];

export const CUSTOMER_BALANCE_COLUMNS: ExcelColumn[] = [
  { key: "customerCode", header: "العميل", headerIndex: 0 },
  { key: "customerName", header: "اسم العميل", headerIndex: 1 },
  { key: "previousBalance", header: "ما قبله", headerIndex: 2 },
  { key: "debit", header: "مدين", headerIndex: 3 },
  { key: "credit", header: "دائن", headerIndex: 4 },
  { key: "currentBalance", header: "الرصيد", headerIndex: 5 },
];

export const SUPPLIER_COLUMNS: ExcelColumn[] = [
  { key: "name", header: "الاسم" },
  { key: "phone", header: "الهاتف" },
  { key: "email", header: "البريد الإلكتروني" },
  { key: "address", header: "العنوان" },
  { key: "city", header: "المدينة" },
];

export const INVOICE_COLUMNS: ExcelColumn[] = [
  { key: "invoiceNumber", header: "رقم الفاتورة" },
  { key: "customerId", header: "رقم العميل" },
  { key: "invoiceDate", header: "التاريخ" },
  { key: "totalAmount", header: "المبلغ الإجمالي" },
  { key: "paidAmount", header: "المبلغ المدفوع" },
];

export const INSTALLMENT_COLUMNS: ExcelColumn[] = [
  { key: "invoiceId", header: "رقم الفاتورة" },
  { key: "customerId", header: "رقم العميل" },
  { key: "amount", header: "المبلغ" },
  { key: "dueDate", header: "تاريخ الاستحقاق" },
];

export const ACCOUNT_COLUMNS: ExcelColumn[] = [
  { key: "code", header: "رمز الحساب" },
  { key: "name", header: "اسم الحساب" },
  { key: "type", header: "النوع" },
  { key: "parentId", header: "الحساب الأب" },
];

export const ACCOUNT_BALANCE_COLUMNS: ExcelColumn[] = [
  { key: "accountCode", header: "رقم الحساب", headerIndex: 0 },
  { key: "accountName", header: "الحساب", headerIndex: 1 },
  { key: "openingDebitBalance", header: "اول المدة مدين", headerIndex: 2 },
  { key: "openingCreditBalance", header: "اول المدة دائن", headerIndex: 3 },
  { key: "debitMovement", header: "الحركة مدين", headerIndex: 4 },
  { key: "creditMovement", header: "الحركة دائن", headerIndex: 5 },
  { key: "debitBalance", header: "الرصيد مدين", headerIndex: 6 },
  { key: "creditBalance", header: "الرصيد دائن", headerIndex: 7 },
];

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

export function getBalanceColorClass(debit: number, credit: number): string {
  if (debit > credit) return "text-red-500";
  if (credit > debit) return "text-green-500";
  return "text-gray-400";
}

export function getDebitCreditDisplay(debit: number, credit: number): { value: number; type: "debit" | "credit" | "zero" } {
  if (debit > 0 && credit === 0) return { value: debit, type: "debit" };
  if (credit > 0 && debit === 0) return { value: credit, type: "credit" };
  if (debit > credit) return { value: debit - credit, type: "debit" };
  if (credit > debit) return { value: credit - debit, type: "credit" };
  return { value: 0, type: "zero" };
}
