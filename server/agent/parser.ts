/**
 * Data Parser Module
 * وحدة تحليل وتحويل البيانات
 */

import type { FetchedData } from "./fetcher";

export interface ParsedCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number;
  code?: string;
}

export interface ParsedInvoice {
  invoiceNumber: string;
  customerName: string;
  date: Date;
  amount: number;
  status: string;
  items?: any[];
}

export interface ParsedPayment {
  paymentId: string;
  customerName: string;
  date: Date;
  amount: number;
  method: string;
}

export interface ParsedProduct {
  productCode: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface ParsedData {
  customers: ParsedCustomer[];
  invoices: ParsedInvoice[];
  payments: ParsedPayment[];
  products: ParsedProduct[];
}

export class DataParser {
  /**
   * تحليل جميع البيانات
   */
  parse(fetchedData: FetchedData): ParsedData {
    console.log("[Agent Parser] Starting data parsing...");

    const parsed: ParsedData = {
      customers: this.parseCustomers(fetchedData.customers),
      invoices: this.parseInvoices(fetchedData.invoices),
      payments: this.parsePayments(fetchedData.payments),
      products: this.parseProducts(fetchedData.products),
    };

    console.log("[Agent Parser] Data parsing completed");
    console.log(`[Agent Parser] Parsed ${parsed.customers.length} customers`);
    console.log(`[Agent Parser] Parsed ${parsed.invoices.length} invoices`);
    console.log(`[Agent Parser] Parsed ${parsed.payments.length} payments`);
    console.log(`[Agent Parser] Parsed ${parsed.products.length} products`);

    return parsed;
  }

  /**
   * تحليل العملاء
   */
  private parseCustomers(rawCustomers: any[]): ParsedCustomer[] {
    return rawCustomers.map((raw) => {
      const balance = this.parseNumber(raw.balance);

      return {
        name: this.cleanString(raw.name),
        phone: this.cleanPhone(raw.phone),
        email: this.cleanEmail(raw.email),
        address: this.cleanString(raw.address),
        balance,
        code: raw.code || this.generateCustomerCode(raw.name),
      };
    }).filter((customer) => customer.name && customer.phone);
  }

  /**
   * تحليل الفواتير
   */
  private parseInvoices(rawInvoices: any[]): ParsedInvoice[] {
    return rawInvoices.map((raw) => {
      const amount = this.parseNumber(raw.amount);
      const date = this.parseDate(raw.date);

      return {
        invoiceNumber: this.cleanString(raw.invoiceNumber),
        customerName: this.cleanString(raw.customerName),
        date,
        amount,
        status: this.normalizeStatus(raw.status),
        items: raw.items || [],
      };
    }).filter((invoice) => invoice.invoiceNumber && invoice.customerName);
  }

  /**
   * تحليل المدفوعات
   */
  private parsePayments(rawPayments: any[]): ParsedPayment[] {
    return rawPayments.map((raw) => {
      const amount = this.parseNumber(raw.amount);
      const date = this.parseDate(raw.date);

      return {
        paymentId: this.cleanString(raw.paymentId),
        customerName: this.cleanString(raw.customerName),
        date,
        amount,
        method: this.normalizePaymentMethod(raw.method),
      };
    }).filter((payment) => payment.paymentId && payment.customerName);
  }

  /**
   * تحليل المنتجات
   */
  private parseProducts(rawProducts: any[]): ParsedProduct[] {
    return rawProducts.map((raw) => {
      const price = this.parseNumber(raw.price);
      const quantity = this.parseNumber(raw.quantity);

      return {
        productCode: this.cleanString(raw.productCode),
        name: this.cleanString(raw.name),
        price,
        quantity,
        category: this.cleanString(raw.category),
      };
    }).filter((product) => product.productCode && product.name);
  }

  /**
   * تنظيف النصوص
   */
  private cleanString(value: any): string {
    if (!value) return "";
    return String(value).trim().replace(/\s+/g, " ");
  }

  /**
   * تنظيف رقم الهاتف
   */
  private cleanPhone(phone: any): string {
    if (!phone) return "";

    // إزالة جميع الأحرف غير الرقمية
    let cleaned = String(phone).replace(/\D/g, "");

    // إضافة 966 إذا لم يكن موجوداً
    if (cleaned.startsWith("0")) {
      cleaned = "966" + cleaned.substring(1);
    } else if (!cleaned.startsWith("966")) {
      cleaned = "966" + cleaned;
    }

    return cleaned;
  }

  /**
   * تنظيف البريد الإلكتروني
   */
  private cleanEmail(email: any): string | undefined {
    if (!email) return undefined;

    const cleaned = String(email).trim().toLowerCase();

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(cleaned)) {
      return cleaned;
    }

    return undefined;
  }

  /**
   * تحويل النص إلى رقم
   */
  private parseNumber(value: any): number {
    if (typeof value === "number") return value;
    if (!value) return 0;

    // إزالة الفواصل والرموز
    const cleaned = String(value)
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * تحويل النص إلى تاريخ
   */
  private parseDate(value: any): Date {
    if (value instanceof Date) return value;
    if (!value) return new Date();

    // محاولة تحويل النص إلى تاريخ
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // محاولة تحليل التواريخ العربية
    const arabicMonths: Record<string, number> = {
      "يناير": 0, "فبراير": 1, "مارس": 2, "أبريل": 3,
      "مايو": 4, "يونيو": 5, "يوليو": 6, "أغسطس": 7,
      "سبتمبر": 8, "أكتوبر": 9, "نوفمبر": 10, "ديسمبر": 11,
    };

    const str = String(value);
    for (const [month, index] of Object.entries(arabicMonths)) {
      if (str.includes(month)) {
        const parts = str.split(/\s+/);
        const day = parseInt(parts[0]) || 1;
        const year = parseInt(parts[2]) || new Date().getFullYear();
        return new Date(year, index, day);
      }
    }

    return new Date();
  }

  /**
   * توحيد حالة الفاتورة
   */
  private normalizeStatus(status: any): string {
    if (!status) return "pending";

    const str = String(status).toLowerCase();

    if (str.includes("paid") || str.includes("مدفوع")) return "paid";
    if (str.includes("pending") || str.includes("معلق")) return "pending";
    if (str.includes("cancelled") || str.includes("ملغي")) return "cancelled";
    if (str.includes("overdue") || str.includes("متأخر")) return "overdue";

    return "pending";
  }

  /**
   * توحيد طريقة الدفع
   */
  private normalizePaymentMethod(method: any): string {
    if (!method) return "cash";

    const str = String(method).toLowerCase();

    if (str.includes("cash") || str.includes("نقد")) return "cash";
    if (str.includes("card") || str.includes("بطاقة")) return "card";
    if (str.includes("transfer") || str.includes("تحويل")) return "transfer";
    if (str.includes("check") || str.includes("شيك")) return "check";

    return "cash";
  }

  /**
   * توليد كود عميل
   */
  private generateCustomerCode(name: string): string {
    if (!name) return `C${Date.now()}`;

    // استخدام أول حرفين من الاسم + timestamp
    const prefix = name.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);

    return `${prefix}${timestamp}`;
  }

  /**
   * تصدير البيانات إلى JSON
   */
  toJSON(parsedData: ParsedData): string {
    return JSON.stringify(parsedData, null, 2);
  }

  /**
   * حفظ البيانات في ملف JSON
   */
  async saveToFile(parsedData: ParsedData, filepath: string): Promise<void> {
    const fs = await import("fs/promises");
    const json = this.toJSON(parsedData);
    await fs.writeFile(filepath, json, "utf-8");
    console.log(`[Agent Parser] Data saved to: ${filepath}`);
  }
}
