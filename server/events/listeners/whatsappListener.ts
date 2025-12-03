/**
 * WhatsApp Event Listener
 * يستقبل جميع الأحداث ويرسلها فوراً إلى WhatsApp
 */

import { eventBus } from "../eventBus";
import { EventNames } from "../eventTypes";
import type {
  SalesInvoiceCreatedEvent,
  SalesInvoiceUpdatedEvent,
  SalesInvoiceCancelledEvent,
  PurchaseInvoiceCreatedEvent,
  PurchaseReturnCreatedEvent,
  InventoryItemAddedEvent,
  InventoryItemRemovedEvent,
  InventoryTransferEvent,
  InventoryAuditEvent,
  InventoryStockUpdatedEvent,
  ReceiptCreatedEvent,
  PaymentCreatedEvent,
  DailyBalanceUpdatedEvent,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerBalanceUpdatedEvent,
  SupplierCreatedEvent,
  SupplierUpdatedEvent,
  SupplierBalanceUpdatedEvent,
  InstallmentPaidEvent,
  BondCreatedEvent,
  CustomerOverdueAlertEvent,
  SystemErrorEvent,
} from "../eventTypes";
import { getWhatsAppService } from "../../whatsapp/whatsappService";
import * as db from "../../db";

/**
 * إرسال رسالة إلى WhatsApp
 */
async function sendWhatsAppMessage(message: string, isError: boolean = false): Promise<void> {
  try {
    const service = getWhatsAppService();

    if (!service.isConnected()) {
      console.warn("[WhatsApp Listener] WhatsApp not connected, skipping message");
      return;
    }

    // إرسال للمدير
    const managerNumber = await db.getSetting("MANAGER_NUMBER");
    if (managerNumber) {
      await service.sendMessage(managerNumber, message);
    }

    // إرسال للجروب (إلا إذا كان خطأ)
    if (!isError) {
      const groupName = await db.getSetting("GROUP_NAME");
      if (groupName) {
        try {
          await service.sendMessageToGroup(groupName, message);
        } catch (error) {
          console.warn("[WhatsApp Listener] Could not send to group:", error);
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Listener] Failed to send message:", error);
  }
}

/**
 * تنسيق التاريخ بالعربي
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * تنسيق الأرقام بالعربي
 */
function formatNumber(num: number): string {
  return num.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==================== Sales Event Handlers ====================
async function handleSalesInvoiceCreated(event: SalesInvoiceCreatedEvent): Promise<void> {
  const message =
    `🧾 *فاتورة مبيعات جديدة*\n\n` +
    `📝 رقم الفاتورة: ${event.invoiceNumber}\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 الإجمالي: ${formatNumber(event.totalAmount)} ريال\n` +
    `💵 المدفوع: ${formatNumber(event.paidAmount)} ريال\n` +
    `📊 المتبقي: ${formatNumber(event.remainingAmount)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleSalesInvoiceUpdated(event: SalesInvoiceUpdatedEvent): Promise<void> {
  const message =
    `✏️ *تعديل فاتورة مبيعات*\n\n` +
    `📝 رقم الفاتورة: ${event.invoiceNumber}\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 الإجمالي القديم: ${formatNumber(event.oldTotal)} ريال\n` +
    `💰 الإجمالي الجديد: ${formatNumber(event.newTotal)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleSalesInvoiceCancelled(event: SalesInvoiceCancelledEvent): Promise<void> {
  const message =
    `❌ *إلغاء فاتورة مبيعات*\n\n` +
    `📝 رقم الفاتورة: ${event.invoiceNumber}\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 المبلغ: ${formatNumber(event.totalAmount)} ريال\n` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Purchase Event Handlers ====================
async function handlePurchaseInvoiceCreated(event: PurchaseInvoiceCreatedEvent): Promise<void> {
  const message =
    `📦 *فاتورة مشتريات جديدة*\n\n` +
    `📝 رقم الفاتورة: ${event.invoiceNumber}\n` +
    `🏪 المورد: ${event.supplierName}\n` +
    `💰 الإجمالي: ${formatNumber(event.totalAmount)} ريال\n` +
    `💵 المدفوع: ${formatNumber(event.paidAmount)} ريال\n` +
    `📊 المتبقي: ${formatNumber(event.remainingAmount)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handlePurchaseReturnCreated(event: PurchaseReturnCreatedEvent): Promise<void> {
  const message =
    `↩️ *مردود مشتريات*\n\n` +
    `📝 رقم المردود: ${event.returnNumber}\n` +
    `🏪 المورد: ${event.supplierName}\n` +
    `💰 المبلغ: ${formatNumber(event.totalAmount)} ريال\n` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Inventory Event Handlers ====================
async function handleInventoryItemAdded(event: InventoryItemAddedEvent): Promise<void> {
  const message =
    `📥 *إضافة مخزون*\n\n` +
    `📦 الصنف: ${event.itemName}\n` +
    `🔢 الكمية: ${event.quantity}\n` +
    `${event.warehouseName ? `🏢 المخزن: ${event.warehouseName}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleInventoryItemRemoved(event: InventoryItemRemovedEvent): Promise<void> {
  const message =
    `📤 *صرف مخزون*\n\n` +
    `📦 الصنف: ${event.itemName}\n` +
    `🔢 الكمية: ${event.quantity}\n` +
    `${event.warehouseName ? `🏢 المخزن: ${event.warehouseName}\n` : ""}` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleInventoryTransfer(event: InventoryTransferEvent): Promise<void> {
  const message =
    `🔄 *تحويل مخزون*\n\n` +
    `📦 الصنف: ${event.itemName}\n` +
    `🔢 الكمية: ${event.quantity}\n` +
    `📍 من: ${event.fromWarehouse}\n` +
    `📍 إلى: ${event.toWarehouse}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleInventoryAudit(event: InventoryAuditEvent): Promise<void> {
  const message =
    `🔍 *جرد مخزون*\n\n` +
    `${event.warehouseName ? `🏢 المخزن: ${event.warehouseName}\n` : ""}` +
    `📦 إجمالي الأصناف: ${event.totalItems}\n` +
    `⚠️ الفروقات: ${event.discrepancies}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleInventoryStockUpdated(event: InventoryStockUpdatedEvent): Promise<void> {
  const message =
    `🔄 *تحديث رصيد صنف*\n\n` +
    `📦 الصنف: ${event.itemName}\n` +
    `🔢 الرصيد القديم: ${event.oldQuantity}\n` +
    `🔢 الرصيد الجديد: ${event.newQuantity}\n` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Cashbox Event Handlers ====================
async function handleReceiptCreated(event: ReceiptCreatedEvent): Promise<void> {
  const message =
    `💵 *سند قبض*\n\n` +
    `📝 رقم السند: ${event.receiptNumber}\n` +
    `💰 المبلغ: ${formatNumber(event.amount)} ريال\n` +
    `${event.customerName ? `👤 من: ${event.customerName}\n` : ""}` +
    `💳 طريقة الدفع: ${event.paymentMethod}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handlePaymentCreated(event: PaymentCreatedEvent): Promise<void> {
  const message =
    `💸 *سند صرف*\n\n` +
    `📝 رقم السند: ${event.paymentNumber}\n` +
    `💰 المبلغ: ${formatNumber(event.amount)} ريال\n` +
    `${event.supplierName ? `🏪 إلى: ${event.supplierName}\n` : ""}` +
    `💳 طريقة الدفع: ${event.paymentMethod}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleDailyBalanceUpdated(event: DailyBalanceUpdatedEvent): Promise<void> {
  const message =
    `📊 *تحديث الرصيد اليومي*\n\n` +
    `💰 رصيد الافتتاح: ${formatNumber(event.openingBalance)} ريال\n` +
    `💵 المقبوضات: ${formatNumber(event.receipts)} ريال\n` +
    `💸 المدفوعات: ${formatNumber(event.payments)} ريال\n` +
    `💰 رصيد الإقفال: ${formatNumber(event.closingBalance)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Customer Event Handlers ====================
async function handleCustomerCreated(event: CustomerCreatedEvent): Promise<void> {
  const message =
    `👤 *عميل جديد*\n\n` +
    `📝 الاسم: ${event.customerName}\n` +
    `${event.phone ? `📞 الهاتف: ${event.phone}\n` : ""}` +
    `${event.city ? `🏙️ المدينة: ${event.city}\n` : ""}` +
    `💰 الرصيد الافتتاحي: ${formatNumber(event.initialBalance)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleCustomerUpdated(event: CustomerUpdatedEvent): Promise<void> {
  const message =
    `✏️ *تحديث بيانات عميل*\n\n` +
    `📝 الاسم: ${event.customerName}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleCustomerBalanceUpdated(event: CustomerBalanceUpdatedEvent): Promise<void> {
  const message =
    `💰 *تحديث رصيد عميل*\n\n` +
    `📝 الاسم: ${event.customerName}\n` +
    `💰 الرصيد القديم: ${formatNumber(event.oldBalance)} ريال\n` +
    `💰 الرصيد الجديد: ${formatNumber(event.newBalance)} ريال\n` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Supplier Event Handlers ====================
async function handleSupplierCreated(event: SupplierCreatedEvent): Promise<void> {
  const message =
    `🏪 *مورد جديد*\n\n` +
    `📝 الاسم: ${event.supplierName}\n` +
    `${event.phone ? `📞 الهاتف: ${event.phone}\n` : ""}` +
    `${event.city ? `🏙️ المدينة: ${event.city}\n` : ""}` +
    `💰 الرصيد الافتتاحي: ${formatNumber(event.initialBalance)} ريال\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleSupplierUpdated(event: SupplierUpdatedEvent): Promise<void> {
  const message =
    `✏️ *تحديث بيانات مورد*\n\n` +
    `📝 الاسم: ${event.supplierName}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleSupplierBalanceUpdated(event: SupplierBalanceUpdatedEvent): Promise<void> {
  const message =
    `💰 *تحديث رصيد مورد*\n\n` +
    `📝 الاسم: ${event.supplierName}\n` +
    `💰 الرصيد القديم: ${formatNumber(event.oldBalance)} ريال\n` +
    `💰 الرصيد الجديد: ${formatNumber(event.newBalance)} ريال\n` +
    `${event.reason ? `📋 السبب: ${event.reason}\n` : ""}` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Collection Event Handlers ====================
async function handleInstallmentPaid(event: InstallmentPaidEvent): Promise<void> {
  const message =
    `✅ *دفع قسط*\n\n` +
    `📝 رقم القسط: ${event.installmentNumber}\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 المبلغ: ${formatNumber(event.amount)} ريال\n` +
    `📅 تاريخ الاستحقاق: ${formatDate(event.dueDate)}\n` +
    `📅 تاريخ الدفع: ${formatDate(event.paidDate)}`;

  await sendWhatsAppMessage(message);
}

async function handleBondCreated(event: BondCreatedEvent): Promise<void> {
  const message =
    `📄 *سند لأمر جديد*\n\n` +
    `📝 رقم السند: ${event.bondNumber}\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 المبلغ: ${formatNumber(event.amount)} ريال\n` +
    `📅 تاريخ الاستحقاق: ${formatDate(event.dueDate)}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

async function handleCustomerOverdueAlert(event: CustomerOverdueAlertEvent): Promise<void> {
  const message =
    `⚠️ *تنبيه عميل متأخر*\n\n` +
    `👤 العميل: ${event.customerName}\n` +
    `💰 المبلغ المتأخر: ${formatNumber(event.overdueAmount)} ريال\n` +
    `📊 عدد الأقساط المتأخرة: ${event.overdueInstallments}\n` +
    `📅 أقدم تاريخ استحقاق: ${formatDate(event.oldestDueDate)}\n` +
    `📅 التاريخ: ${formatDate(event.date)}`;

  await sendWhatsAppMessage(message);
}

// ==================== Error Event Handler ====================
async function handleSystemError(event: SystemErrorEvent): Promise<void> {
  const severityEmoji = {
    low: "ℹ️",
    medium: "⚠️",
    high: "🔴",
    critical: "🚨",
  };

  const message =
    `${severityEmoji[event.severity]} *خطأ في النظام*\n\n` +
    `📦 الوحدة: ${event.module}\n` +
    `❌ النوع: ${event.errorType}\n` +
    `📝 الرسالة: ${event.errorMessage}\n` +
    `${event.userName ? `👤 المستخدم: ${event.userName}\n` : ""}` +
    `📅 الوقت: ${formatDate(event.timestamp)}`;

  await sendWhatsAppMessage(message, true);
}

/**
 * تسجيل جميع الـ Event Listeners
 */
export function registerWhatsAppListeners(): void {
  console.log("[WhatsApp Listener] Registering all event listeners...");

  // Sales
  eventBus.subscribe(EventNames.SALES_INVOICE_CREATED, handleSalesInvoiceCreated);
  eventBus.subscribe(EventNames.SALES_INVOICE_UPDATED, handleSalesInvoiceUpdated);
  eventBus.subscribe(EventNames.SALES_INVOICE_CANCELLED, handleSalesInvoiceCancelled);

  // Purchases
  eventBus.subscribe(EventNames.PURCHASE_INVOICE_CREATED, handlePurchaseInvoiceCreated);
  eventBus.subscribe(EventNames.PURCHASE_RETURN_CREATED, handlePurchaseReturnCreated);

  // Inventory
  eventBus.subscribe(EventNames.INVENTORY_ITEM_ADDED, handleInventoryItemAdded);
  eventBus.subscribe(EventNames.INVENTORY_ITEM_REMOVED, handleInventoryItemRemoved);
  eventBus.subscribe(EventNames.INVENTORY_TRANSFER, handleInventoryTransfer);
  eventBus.subscribe(EventNames.INVENTORY_AUDIT, handleInventoryAudit);
  eventBus.subscribe(EventNames.INVENTORY_STOCK_UPDATED, handleInventoryStockUpdated);

  // Cashbox
  eventBus.subscribe(EventNames.RECEIPT_CREATED, handleReceiptCreated);
  eventBus.subscribe(EventNames.PAYMENT_CREATED, handlePaymentCreated);
  eventBus.subscribe(EventNames.DAILY_BALANCE_UPDATED, handleDailyBalanceUpdated);

  // Customers
  eventBus.subscribe(EventNames.CUSTOMER_CREATED, handleCustomerCreated);
  eventBus.subscribe(EventNames.CUSTOMER_UPDATED, handleCustomerUpdated);
  eventBus.subscribe(EventNames.CUSTOMER_BALANCE_UPDATED, handleCustomerBalanceUpdated);

  // Suppliers
  eventBus.subscribe(EventNames.SUPPLIER_CREATED, handleSupplierCreated);
  eventBus.subscribe(EventNames.SUPPLIER_UPDATED, handleSupplierUpdated);
  eventBus.subscribe(EventNames.SUPPLIER_BALANCE_UPDATED, handleSupplierBalanceUpdated);

  // Collection
  eventBus.subscribe(EventNames.INSTALLMENT_PAID, handleInstallmentPaid);
  eventBus.subscribe(EventNames.BOND_CREATED, handleBondCreated);
  eventBus.subscribe(EventNames.CUSTOMER_OVERDUE_ALERT, handleCustomerOverdueAlert);

  // Errors
  eventBus.subscribe(EventNames.SYSTEM_ERROR, handleSystemError);

  console.log("[WhatsApp Listener] All event listeners registered successfully");
}
