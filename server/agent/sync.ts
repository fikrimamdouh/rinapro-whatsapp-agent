/**
 * Data Sync Module
 * وحدة مزامنة البيانات مع قاعدة البيانات
 */

import { getDb } from "../db";
import { customers, invoices, receipts, inventory } from "../../drizzle/schema";
import type { ParsedData, ParsedCustomer, ParsedInvoice, ParsedPayment, ParsedProduct } from "./parser";
import { eq, and } from "drizzle-orm";

export interface SyncResult {
  customers: {
    added: number;
    updated: number;
    skipped: number;
  };
  invoices: {
    added: number;
    updated: number;
    skipped: number;
  };
  payments: {
    added: number;
    updated: number;
    skipped: number;
  };
  products: {
    added: number;
    updated: number;
    skipped: number;
  };
  errors: string[];
}

export class DataSync {
  /**
   * مزامنة جميع البيانات
   */
  async syncAll(parsedData: ParsedData): Promise<SyncResult> {
    console.log("[Agent Sync] Starting data synchronization...");

    const result: SyncResult = {
      customers: { added: 0, updated: 0, skipped: 0 },
      invoices: { added: 0, updated: 0, skipped: 0 },
      payments: { added: 0, updated: 0, skipped: 0 },
      products: { added: 0, updated: 0, skipped: 0 },
      errors: [],
    };

    try {
      // مزامنة العملاء
      const customerResult = await this.syncCustomers(parsedData.customers);
      result.customers = customerResult;

      // مزامنة الفواتير
      const invoiceResult = await this.syncInvoices(parsedData.invoices);
      result.invoices = invoiceResult;

      // مزامنة المدفوعات
      const paymentResult = await this.syncPayments(parsedData.payments);
      result.payments = paymentResult;

      // مزامنة المنتجات
      const productResult = await this.syncProducts(parsedData.products);
      result.products = productResult;

      console.log("[Agent Sync] Synchronization completed successfully");
      this.logSyncResult(result);

      return result;
    } catch (error) {
      console.error("[Agent Sync] Synchronization error:", error);
      result.errors.push(String(error));
      return result;
    }
  }

  /**
   * مزامنة العملاء
   */
  private async syncCustomers(parsedCustomers: ParsedCustomer[]): Promise<{
    added: number;
    updated: number;
    skipped: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const customer of parsedCustomers) {
      try {
        // البحث عن عميل موجود بنفس رقم الهاتف
        const existing = await db
          .select()
          .from(customers)
          .where(eq(customers.phone, customer.phone))
          .limit(1);

        if (existing.length > 0) {
          // تحديث العميل الموجود
          const existingCustomer = existing[0];

          // التحقق من تغيير الرصيد
          if (existingCustomer && existingCustomer.balance !== customer.balance) {
            await db
              .update(customers)
              .set({
                balance: customer.balance,
                updatedAt: new Date(),
              })
              .where(eq(customers.id, existingCustomer.id));

            updated++;
            console.log(
              `[Agent Sync] Updated customer: ${customer.name} (balance changed from ${existingCustomer.balance} to ${customer.balance})`
            );
          } else {
            skipped++;
          }
        } else {
          // إضافة عميل جديد
          await db.insert(customers).values({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || null,
            address: customer.address || null,
            balance: customer.balance,
            notes: customer.code ? `كود: ${customer.code}` : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          added++;
          console.log(`[Agent Sync] Added new customer: ${customer.name}`);
        }
      } catch (error) {
        console.error(`[Agent Sync] Error syncing customer ${customer.name}:`, error);
        skipped++;
      }
    }

    return { added, updated, skipped };
  }

  /**
   * مزامنة الفواتير
   */
  private async syncInvoices(parsedInvoices: ParsedInvoice[]): Promise<{
    added: number;
    updated: number;
    skipped: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const invoice of parsedInvoices) {
      try {
        // البحث عن فاتورة موجودة بنفس الرقم
        const existing = await db
          .select()
          .from(invoices)
          .where(eq(invoices.invoiceNumber, invoice.invoiceNumber))
          .limit(1);

        if (existing.length > 0) {
          // تحديث الفاتورة الموجودة
          const existingInvoice = existing[0];

          if (existingInvoice && existingInvoice.status !== invoice.status) {
            const newStatus = invoice.status === "paid" ? "paid" : invoice.status === "pending" ? "unpaid" : "partial";
            await db
              .update(invoices)
              .set({
                status: newStatus,
                updatedAt: new Date(),
              })
              .where(eq(invoices.id, existingInvoice.id));

            updated++;
            console.log(`[Agent Sync] Updated invoice: ${invoice.invoiceNumber}`);
          } else {
            skipped++;
          }
        } else {
          // البحث عن العميل
          const customerResult = await db
            .select()
            .from(customers)
            .where(eq(customers.name, invoice.customerName))
            .limit(1);

          if (customerResult.length === 0) {
            console.warn(
              `[Agent Sync] Customer not found for invoice ${invoice.invoiceNumber}: ${invoice.customerName}`
            );
            skipped++;
            continue;
          }

          // إضافة فاتورة جديدة
          await db.insert(invoices).values({
            invoiceNumber: invoice.invoiceNumber,
            customerId: customerResult[0]!.id,
            invoiceDate: invoice.date,
            totalAmount: invoice.amount,
            paidAmount: invoice.status === "paid" ? invoice.amount : 0,
            remainingAmount: invoice.status === "paid" ? 0 : invoice.amount,
            status: invoice.status === "paid" ? "paid" : "unpaid",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          added++;
          console.log(`[Agent Sync] Added new invoice: ${invoice.invoiceNumber}`);
        }
      } catch (error) {
        console.error(
          `[Agent Sync] Error syncing invoice ${invoice.invoiceNumber}:`,
          error
        );
        skipped++;
      }
    }

    return { added, updated, skipped };
  }

  /**
   * مزامنة المدفوعات
   */
  private async syncPayments(parsedPayments: ParsedPayment[]): Promise<{
    added: number;
    updated: number;
    skipped: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const payment of parsedPayments) {
      try {
        // البحث عن سند موجود بنفس الرقم
        const existing = await db
          .select()
          .from(receipts)
          .where(eq(receipts.receiptNumber, payment.paymentId))
          .limit(1);

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // البحث عن العميل
        const customerResult = await db
          .select()
          .from(customers)
          .where(eq(customers.name, payment.customerName))
          .limit(1);

        if (customerResult.length === 0) {
          console.warn(
            `[Agent Sync] Customer not found for payment ${payment.paymentId}: ${payment.customerName}`
          );
          skipped++;
          continue;
        }

        // إضافة سند جديد
        await db.insert(receipts).values({
          receiptNumber: payment.paymentId,
          customerId: customerResult[0]!.id,
          type: "income",
          amount: payment.amount,
          receiptDate: payment.date,
          description: `تم الاستيراد تلقائياً من النظام الخارجي - طريقة الدفع: ${payment.method}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        added++;
        console.log(`[Agent Sync] Added new payment: ${payment.paymentId}`);
      } catch (error) {
        console.error(
          `[Agent Sync] Error syncing payment ${payment.paymentId}:`,
          error
        );
        skipped++;
      }
    }

    return { added, updated, skipped };
  }

  /**
   * مزامنة المنتجات
   */
  private async syncProducts(parsedProducts: ParsedProduct[]): Promise<{
    added: number;
    updated: number;
    skipped: number;
  }> {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of parsedProducts) {
      try {
        // البحث عن منتج موجود بنفس الكود
        const existing = await db
          .select()
          .from(inventory)
          .where(eq(inventory.itemCode, product.productCode))
          .limit(1);

        if (existing.length > 0) {
          // تحديث المنتج الموجود
          const existingProduct = existing[0];

          if (
            existingProduct &&
            (existingProduct.quantity !== product.quantity ||
              existingProduct.unitPrice !== product.price)
          ) {
            await db
              .update(inventory)
              .set({
                quantity: product.quantity,
                unitPrice: product.price,
                updatedAt: new Date(),
              })
              .where(eq(inventory.id, existingProduct.id));

            updated++;
            console.log(`[Agent Sync] Updated product: ${product.name}`);
          } else {
            skipped++;
          }
        } else {
          // إضافة منتج جديد
          await db.insert(inventory).values({
            itemName: product.name,
            itemCode: product.productCode,
            quantity: product.quantity,
            unitPrice: product.price,
            totalValue: product.price * product.quantity,
            notes: product.category ? `فئة: ${product.category}` : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          added++;
          console.log(`[Agent Sync] Added new product: ${product.name}`);
        }
      } catch (error) {
        console.error(`[Agent Sync] Error syncing product ${product.name}:`, error);
        skipped++;
      }
    }

    return { added, updated, skipped };
  }

  /**
   * طباعة نتيجة المزامنة
   */
  private logSyncResult(result: SyncResult): void {
    console.log("\n[Agent Sync] ========== Sync Summary ==========");
    console.log(`Customers: ${result.customers.added} added, ${result.customers.updated} updated, ${result.customers.skipped} skipped`);
    console.log(`Invoices: ${result.invoices.added} added, ${result.invoices.updated} updated, ${result.invoices.skipped} skipped`);
    console.log(`Payments: ${result.payments.added} added, ${result.payments.updated} updated, ${result.payments.skipped} skipped`);
    console.log(`Products: ${result.products.added} added, ${result.products.updated} updated, ${result.products.skipped} skipped`);
    if (result.errors.length > 0) {
      console.log(`Errors: ${result.errors.length}`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
    console.log("===============================================\n");
  }

  /**
   * إنشاء تقرير نصي للمزامنة
   */
  generateReport(result: SyncResult): string {
    const total = {
      added:
        result.customers.added +
        result.invoices.added +
        result.payments.added +
        result.products.added,
      updated:
        result.customers.updated +
        result.invoices.updated +
        result.payments.updated +
        result.products.updated,
      skipped:
        result.customers.skipped +
        result.invoices.skipped +
        result.payments.skipped +
        result.products.skipped,
    };

    return `
📊 *تقرير المزامنة التلقائية*

✅ *العملاء*
   • تم الإضافة: ${result.customers.added}
   • تم التحديث: ${result.customers.updated}
   • تم التجاهل: ${result.customers.skipped}

📄 *الفواتير*
   • تم الإضافة: ${result.invoices.added}
   • تم التحديث: ${result.invoices.updated}
   • تم التجاهل: ${result.invoices.skipped}

💰 *المدفوعات*
   • تم الإضافة: ${result.payments.added}
   • تم التحديث: ${result.payments.updated}
   • تم التجاهل: ${result.payments.skipped}

📦 *المنتجات*
   • تم الإضافة: ${result.products.added}
   • تم التحديث: ${result.products.updated}
   • تم التجاهل: ${result.products.skipped}

📈 *الإجمالي*
   • إجمالي الإضافات: ${total.added}
   • إجمالي التحديثات: ${total.updated}
   • إجمالي التجاهل: ${total.skipped}

${result.errors.length > 0 ? `⚠️ *أخطاء*: ${result.errors.length}` : "✅ *لا توجد أخطاء*"}

⏰ *وقت المزامنة*: ${new Date().toLocaleString("ar-SA")}
    `.trim();
  }
}
