/**
 * Event Types & Schemas
 * تعريف جميع أنواع الأحداث في النظام
 */

// ==================== Sales Events ====================
export interface SalesInvoiceCreatedEvent {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: Date;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export interface SalesInvoiceUpdatedEvent {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  oldTotal: number;
  newTotal: number;
  changes: Record<string, any>;
  date: Date;
}

export interface SalesInvoiceCancelledEvent {
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  totalAmount: number;
  reason?: string;
  date: Date;
}

// ==================== Purchase Events ====================
export interface PurchaseInvoiceCreatedEvent {
  invoiceId: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: Date;
}

export interface PurchaseReturnCreatedEvent {
  returnId: number;
  returnNumber: string;
  supplierId: number;
  supplierName: string;
  totalAmount: number;
  reason?: string;
  date: Date;
}

// ==================== Inventory Events ====================
export interface InventoryItemAddedEvent {
  itemId: number;
  itemName: string;
  quantity: number;
  warehouseId?: number;
  warehouseName?: string;
  date: Date;
}

export interface InventoryItemRemovedEvent {
  itemId: number;
  itemName: string;
  quantity: number;
  warehouseId?: number;
  warehouseName?: string;
  reason?: string;
  date: Date;
}

export interface InventoryTransferEvent {
  itemId: number;
  itemName: string;
  quantity: number;
  fromWarehouse: string;
  toWarehouse: string;
  date: Date;
}

export interface InventoryAuditEvent {
  warehouseId?: number;
  warehouseName?: string;
  totalItems: number;
  discrepancies: number;
  date: Date;
}

export interface InventoryStockUpdatedEvent {
  itemId: number;
  itemName: string;
  oldQuantity: number;
  newQuantity: number;
  reason?: string;
  date: Date;
}

// ==================== Cashbox/Treasury Events ====================
export interface ReceiptCreatedEvent {
  receiptId: number;
  receiptNumber: string;
  amount: number;
  customerId?: number;
  customerName?: string;
  paymentMethod: string;
  date: Date;
}

export interface PaymentCreatedEvent {
  paymentId: number;
  paymentNumber: string;
  amount: number;
  supplierId?: number;
  supplierName?: string;
  paymentMethod: string;
  date: Date;
}

export interface DailyBalanceUpdatedEvent {
  date: Date;
  openingBalance: number;
  receipts: number;
  payments: number;
  closingBalance: number;
}

// ==================== Customer Events ====================
export interface CustomerCreatedEvent {
  customerId: number;
  customerName: string;
  phone?: string;
  email?: string;
  city?: string;
  initialBalance: number;
  date: Date;
}

export interface CustomerUpdatedEvent {
  customerId: number;
  customerName: string;
  changes: Record<string, any>;
  date: Date;
}

export interface CustomerBalanceUpdatedEvent {
  customerId: number;
  customerName: string;
  oldBalance: number;
  newBalance: number;
  reason?: string;
  date: Date;
}

// ==================== Supplier Events ====================
export interface SupplierCreatedEvent {
  supplierId: number;
  supplierName: string;
  phone?: string;
  email?: string;
  city?: string;
  initialBalance: number;
  date: Date;
}

export interface SupplierUpdatedEvent {
  supplierId: number;
  supplierName: string;
  changes: Record<string, any>;
  date: Date;
}

export interface SupplierBalanceUpdatedEvent {
  supplierId: number;
  supplierName: string;
  oldBalance: number;
  newBalance: number;
  reason?: string;
  date: Date;
}

// ==================== Collection Events ====================
export interface InstallmentPaidEvent {
  installmentId: number;
  installmentNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  dueDate: Date;
  paidDate: Date;
}

export interface BondCreatedEvent {
  bondId: number;
  bondNumber: string;
  customerId: number;
  customerName: string;
  amount: number;
  dueDate: Date;
  date: Date;
}

export interface CustomerOverdueAlertEvent {
  customerId: number;
  customerName: string;
  overdueAmount: number;
  overdueInstallments: number;
  oldestDueDate: Date;
  date: Date;
}

// ==================== Error Events ====================
export interface SystemErrorEvent {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  module: string;
  userId?: number;
  userName?: string;
  timestamp: Date;
  severity: "low" | "medium" | "high" | "critical";
}

// ==================== Event Names ====================
export const EventNames = {
  // Sales
  SALES_INVOICE_CREATED: "sales.invoice.created",
  SALES_INVOICE_UPDATED: "sales.invoice.updated",
  SALES_INVOICE_CANCELLED: "sales.invoice.cancelled",

  // Purchases
  PURCHASE_INVOICE_CREATED: "purchase.invoice.created",
  PURCHASE_RETURN_CREATED: "purchase.return.created",

  // Inventory
  INVENTORY_ITEM_ADDED: "inventory.item.added",
  INVENTORY_ITEM_REMOVED: "inventory.item.removed",
  INVENTORY_TRANSFER: "inventory.transfer",
  INVENTORY_AUDIT: "inventory.audit",
  INVENTORY_STOCK_UPDATED: "inventory.stock.updated",

  // Cashbox
  RECEIPT_CREATED: "cashbox.receipt.created",
  PAYMENT_CREATED: "cashbox.payment.created",
  DAILY_BALANCE_UPDATED: "cashbox.daily_balance.updated",

  // Customers
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CUSTOMER_BALANCE_UPDATED: "customer.balance.updated",

  // Suppliers
  SUPPLIER_CREATED: "supplier.created",
  SUPPLIER_UPDATED: "supplier.updated",
  SUPPLIER_BALANCE_UPDATED: "supplier.balance.updated",

  // Collection
  INSTALLMENT_PAID: "collection.installment.paid",
  BOND_CREATED: "collection.bond.created",
  CUSTOMER_OVERDUE_ALERT: "collection.customer.overdue",

  // Errors
  SYSTEM_ERROR: "system.error",
} as const;

export type EventName = (typeof EventNames)[keyof typeof EventNames];
