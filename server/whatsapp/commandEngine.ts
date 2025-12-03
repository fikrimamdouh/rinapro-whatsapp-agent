/**
 * WhatsApp Command Engine
 * Intelligent routing and auto-responses for Arabic commands
 */

import * as db from "../db";
import { calculateDashboardKPIs, getSalesTrend, getTopSellingItems } from "../services/kpiCalculator";
import { getSQLiteDb } from "../db/sqlite";

export interface CommandResult {
  command: string;
  response: string;
  data?: any;
}

const COMMANDS = {
  STATEMENT: ["كشف حساب", "كشف", "حسابي", "رصيدي", "الرصيد"],
  DEBT: ["مديونية", "ديون", "مديون", "علي كم", "كم علي"],
  PAYMENT: ["دفع", "سداد", "دفعت", "سددت"],
  INVOICES: ["فواتير", "فاتورة", "الفواتير"],
  INSTALLMENTS: ["أقساط", "قسط", "الأقساط", "اقساط"],
  SALES_TODAY: ["مبيعات اليوم", "مبيعات", "المبيعات اليوم", "مبيعات يوم"],
  CASHBOX: ["رصيد الصندوق", "الصندوق", "صندوق", "رصيد صندوق"],
  INVENTORY: ["المخزون", "مخزون", "الأصناف", "اصناف"],
  KPIS: ["المؤشرات", "مؤشرات", "تقرير", "ملخص"],
  HELP: ["مساعدة", "قائمة", "الأوامر", "help"],
  HELLO: ["مرحبا", "السلام", "هلا", "اهلا", "صباح", "مساء"],
};

const MENU_TEXT = `📋 *قائمة الأوامر المتاحة:*

*📊 تقارير الأعمال:*
• *مبيعات اليوم* — عرض مبيعات اليوم
• *رصيد الصندوق* — عرض رصيد الصندوق الحالي
• *المخزون* — عرض حالة المخزون
• *المؤشرات* — عرض ملخص المؤشرات

*👤 حسابات العملاء:*
• *كشف حساب* — عرض كشف حسابك
• *مديونية* — معرفة المبلغ المستحق
• *فواتير* — عرض فواتيرك
• *أقساط* — عرض أقساطك المستحقة

💡 يمكنك إرسال رقم هاتفك للبحث عن حسابك`;

const GREETING_TEXT = `مرحباً بك في نظام رينا برو! 👋

أنا مساعدك الآلي، يمكنني مساعدتك في:
• الاستعلام عن رصيدك
• عرض فواتيرك
• متابعة أقساطك

أرسل *قائمة* لعرض الأوامر المتاحة`;

const FALLBACK_TEXT = `تم استلام رسالتك 👌

لا أفهم هذا الطلب بعد — أرسل كلمة *قائمة* لرؤية الخيارات المتاحة`;

export class CommandEngine {
  private static instance: CommandEngine;

  static getInstance(): CommandEngine {
    if (!this.instance) {
      this.instance = new CommandEngine();
    }
    return this.instance;
  }

  /**
   * Detect command type from message text
   */
  detectCommand(text: string): string | null {
    const normalizedText = text.trim().toLowerCase();

    for (const [command, keywords] of Object.entries(COMMANDS)) {
      for (const keyword of keywords) {
        if (normalizedText.includes(keyword.toLowerCase())) {
          return command;
        }
      }
    }

    // Check if it's a phone number
    if (/^[\d\s+()-]{8,}$/.test(normalizedText.replace(/\s/g, ""))) {
      return "PHONE_LOOKUP";
    }

    return null;
  }

  /**
   * Process incoming message and generate response
   */
  async processMessage(
    sender: string,
    text: string
  ): Promise<CommandResult> {
    const command = this.detectCommand(text);

    // Log the message
    await db.logMessage({
      messageFrom: sender,
      messageType: "incoming",
      messageContent: text,
      command: command || "unknown",
    });

    let response: string;
    let data: any;

    switch (command) {
      case "HELLO":
        response = GREETING_TEXT;
        break;

      case "HELP":
        response = MENU_TEXT;
        break;

      case "STATEMENT":
        const statementResult = await this.handleStatement(sender);
        response = statementResult.response;
        data = statementResult.data;
        break;

      case "DEBT":
        const debtResult = await this.handleDebt(sender);
        response = debtResult.response;
        data = debtResult.data;
        break;

      case "INVOICES":
        const invoicesResult = await this.handleInvoices(sender);
        response = invoicesResult.response;
        data = invoicesResult.data;
        break;

      case "INSTALLMENTS":
        const installmentsResult = await this.handleInstallments(sender);
        response = installmentsResult.response;
        data = installmentsResult.data;
        break;

      case "SALES_TODAY":
        const salesResult = await this.handleSalesToday();
        response = salesResult.response;
        data = salesResult.data;
        break;

      case "CASHBOX":
        const cashboxResult = await this.handleCashbox();
        response = cashboxResult.response;
        data = cashboxResult.data;
        break;

      case "INVENTORY":
        const inventoryResult = await this.handleInventory();
        response = inventoryResult.response;
        data = inventoryResult.data;
        break;

      case "KPIS":
        const kpisResult = await this.handleKPIs();
        response = kpisResult.response;
        data = kpisResult.data;
        break;

      case "PAYMENT":
        response = `✅ شكراً لإبلاغنا بالدفع!

سيتم تحديث حسابك خلال 24 ساعة.
للاستفسار، تواصل مع الإدارة.`;
        break;

      case "PHONE_LOOKUP":
        const lookupResult = await this.handlePhoneLookup(text);
        response = lookupResult.response;
        data = lookupResult.data;
        break;

      default:
        response = FALLBACK_TEXT;
    }

    // Log the response
    await db.logMessage({
      messageFrom: "system",
      messageTo: sender,
      messageType: "outgoing",
      messageContent: response,
      command: command || "unknown",
      response,
    });

    return { command: command || "unknown", response, data };
  }

  /**
   * Handle statement request
   */
  private async handleStatement(sender: string): Promise<{ response: string; data?: any }> {
    // Extract phone from sender JID
    const phone = sender.replace("@s.whatsapp.net", "");
    
    const customers = await db.searchCustomers(phone);
    
    if (customers.length === 0) {
      return {
        response: `⚠️ لم نجد حساباً مرتبطاً برقم الهاتف.

يرجى التواصل مع الإدارة لربط حسابك.`,
      };
    }

    const customer = customers[0];
    const balance = customer.balance / 100; // Convert from halalas

    return {
      response: `📊 *كشف حساب*

👤 الاسم: ${customer.name}
💰 الرصيد الحالي: ${balance.toLocaleString("ar-SA")} ر.س
📅 آخر تحديث: ${new Date(customer.updatedAt).toLocaleDateString("ar-SA")}

للحصول على كشف تفصيلي، تواصل مع الإدارة.`,
      data: customer,
    };
  }

  /**
   * Handle debt inquiry
   */
  private async handleDebt(sender: string): Promise<{ response: string; data?: any }> {
    const phone = sender.replace("@s.whatsapp.net", "");
    const customers = await db.searchCustomers(phone);

    if (customers.length === 0) {
      return {
        response: `⚠️ لم نجد حساباً مرتبطاً برقم الهاتف.`,
      };
    }

    const customer = customers[0];
    const balance = customer.balance / 100;

    if (balance <= 0) {
      return {
        response: `✅ *لا توجد مديونية*

حسابك خالي من الديون! 🎉`,
        data: customer,
      };
    }

    return {
      response: `💳 *المديونية المستحقة*

👤 الاسم: ${customer.name}
💰 المبلغ المستحق: ${balance.toLocaleString("ar-SA")} ر.س

للسداد، يرجى التواصل مع الإدارة.`,
      data: customer,
    };
  }

  /**
   * Handle invoices request
   */
  private async handleInvoices(sender: string): Promise<{ response: string; data?: any }> {
    const phone = sender.replace("@s.whatsapp.net", "");
    const customers = await db.searchCustomers(phone);

    if (customers.length === 0) {
      return {
        response: `⚠️ لم نجد حساباً مرتبطاً برقم الهاتف.`,
      };
    }

    const invoices = await db.getInvoices();
    const customerInvoices = invoices
      .filter((inv) => inv.customerId === customers[0].id)
      .slice(0, 5);

    if (customerInvoices.length === 0) {
      return {
        response: `📄 لا توجد فواتير مسجلة لحسابك.`,
        data: [],
      };
    }

    let invoiceList = customerInvoices
      .map((inv, i) => {
        const amount = inv.totalAmount / 100;
        const remaining = inv.remainingAmount / 100;
        const status =
          inv.status === "paid"
            ? "✅ مدفوعة"
            : inv.status === "partial"
              ? "🟡 جزئية"
              : "🔴 غير مدفوعة";
        return `${i + 1}. فاتورة #${inv.invoiceNumber}
   💰 ${amount.toLocaleString("ar-SA")} ر.س — ${status}
   📅 ${new Date(inv.invoiceDate).toLocaleDateString("ar-SA")}`;
      })
      .join("\n\n");

    return {
      response: `📄 *فواتيرك الأخيرة:*

${invoiceList}`,
      data: customerInvoices,
    };
  }

  /**
   * Handle installments request
   */
  private async handleInstallments(sender: string): Promise<{ response: string; data?: any }> {
    const phone = sender.replace("@s.whatsapp.net", "");
    const customers = await db.searchCustomers(phone);

    if (customers.length === 0) {
      return {
        response: `⚠️ لم نجد حساباً مرتبطاً برقم الهاتف.`,
      };
    }

    const installments = await db.getInstallments();
    const customerInstallments = installments
      .filter((inst) => inst.customerId === customers[0].id && inst.status !== "paid")
      .slice(0, 5);

    if (customerInstallments.length === 0) {
      return {
        response: `✅ لا توجد أقساط مستحقة عليك حالياً! 🎉`,
        data: [],
      };
    }

    let installmentList = customerInstallments
      .map((inst, i) => {
        const amount = inst.amount / 100;
        const dueDate = new Date(inst.dueDate);
        const isOverdue = dueDate < new Date();
        const status = isOverdue ? "🔴 متأخر" : "🟡 مستحق";
        return `${i + 1}. قسط ${amount.toLocaleString("ar-SA")} ر.س
   📅 تاريخ الاستحقاق: ${dueDate.toLocaleDateString("ar-SA")}
   ${status}`;
      })
      .join("\n\n");

    return {
      response: `📋 *الأقساط المستحقة:*

${installmentList}`,
      data: customerInstallments,
    };
  }

  /**
   * Handle phone lookup
   */
  private async handlePhoneLookup(phone: string): Promise<{ response: string; data?: any }> {
    const normalizedPhone = phone.replace(/[\s+()-]/g, "");
    const customers = await db.searchCustomers(normalizedPhone);

    if (customers.length === 0) {
      return {
        response: `⚠️ لم نجد حساباً مرتبطاً بهذا الرقم: ${phone}

للمساعدة، تواصل مع الإدارة.`,
      };
    }

    const customer = customers[0];
    const balance = customer.balance / 100;

    return {
      response: `✅ *تم العثور على الحساب*

👤 الاسم: ${customer.name}
📱 الهاتف: ${customer.phone || "غير محدد"}
💰 الرصيد: ${balance.toLocaleString("ar-SA")} ر.س

أرسل *كشف حساب* للتفاصيل`,
      data: customer,
    };
  }

  /**
   * Handle sales today query
   */
  private async handleSalesToday(): Promise<{ response: string; data?: any }> {
    const db = getSQLiteDb();
    if (!db) {
      return { response: "⚠️ قاعدة البيانات غير متاحة حالياً" };
    }

    const today = new Date().toISOString().split("T")[0];
    const sales = db.prepare(`
      SELECT COUNT(*) as count, SUM(totalPrice) as total
      FROM salesUploads
      WHERE DATE(saleDate) = ?
    `).get(today) as { count: number; total: number | null };

    const total = (sales.total || 0) / 100;

    return {
      response: `📊 *مبيعات اليوم*\n\n` +
        `📅 التاريخ: ${new Date().toLocaleDateString("ar-SA")}\n` +
        `🛒 عدد العمليات: ${sales.count}\n` +
        `💰 الإجمالي: ${total.toLocaleString("ar-SA")} ر.س`,
      data: sales,
    };
  }

  /**
   * Handle cashbox query
   */
  private async handleCashbox(): Promise<{ response: string; data?: any }> {
    const kpis = calculateDashboardKPIs();

    return {
      response: `💰 *رصيد الصندوق*\n\n` +
        `💵 الإيرادات: ${kpis.totalRevenue.toLocaleString("ar-SA")} ر.س\n` +
        `💸 المصروفات: ${kpis.totalExpenses.toLocaleString("ar-SA")} ر.س\n` +
        `📊 الرصيد الحالي: ${kpis.cashBalance.toLocaleString("ar-SA")} ر.س`,
      data: kpis,
    };
  }

  /**
   * Handle inventory query
   */
  private async handleInventory(): Promise<{ response: string; data?: any }> {
    const db = getSQLiteDb();
    if (!db) {
      return { response: "⚠️ قاعدة البيانات غير متاحة حالياً" };
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(stockQuantity) as totalQuantity,
        SUM(totalValue) as totalValue,
        COUNT(CASE WHEN stockQuantity < 10 THEN 1 END) as lowStock
      FROM inventoryUploads
    `).get() as { totalItems: number; totalQuantity: number; totalValue: number; lowStock: number };

    const totalValue = (stats.totalValue || 0) / 100;

    return {
      response: `📦 *حالة المخزون*\n\n` +
        `📊 عدد الأصناف: ${stats.totalItems}\n` +
        `📈 إجمالي الكمية: ${stats.totalQuantity}\n` +
        `💰 القيمة الإجمالية: ${totalValue.toLocaleString("ar-SA")} ر.س\n` +
        `⚠️ أصناف منخفضة: ${stats.lowStock}`,
      data: stats,
    };
  }

  /**
   * Handle KPIs query
   */
  private async handleKPIs(): Promise<{ response: string; data?: any }> {
    const kpis = calculateDashboardKPIs();
    const topItems = getTopSellingItems(3);

    let response = `📊 *ملخص المؤشرات*\n\n`;
    response += `🛒 إجمالي المبيعات: ${kpis.totalSales}\n`;
    response += `💰 رصيد الصندوق: ${kpis.cashBalance.toLocaleString("ar-SA")} ر.س\n`;
    response += `📦 قيمة المخزون: ${kpis.inventoryValue.toLocaleString("ar-SA")} ر.س\n`;
    response += `⚠️ تنبيهات المخزون: ${kpis.lowStockItems}\n\n`;

    if (topItems.length > 0) {
      response += `🏆 *الأكثر مبيعاً:*\n`;
      topItems.forEach((item, index) => {
        response += `${index + 1}. ${item.itemName} - ${item.revenue.toLocaleString("ar-SA")} ر.س\n`;
      });
    }

    return {
      response,
      data: { kpis, topItems },
    };
  }
}

export const commandEngine = CommandEngine.getInstance();
