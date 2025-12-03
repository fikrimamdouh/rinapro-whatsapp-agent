import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول العملاء (Customers)
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  customerId: varchar("customerId", { length: 50 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  // أرصدة أول المدة
  openingDebitBalance: int("openingDebitBalance").default(0).notNull(),
  openingCreditBalance: int("openingCreditBalance").default(0).notNull(),
  // الحركات
  debitMovement: int("debitMovement").default(0).notNull(),
  creditMovement: int("creditMovement").default(0).notNull(),
  // أرصدة آخر المدة
  closingDebitBalance: int("closingDebitBalance").default(0).notNull(),
  closingCreditBalance: int("closingCreditBalance").default(0).notNull(),
  // أعمدة قديمة (للتوافق مع الكود القديم)
  previousBalance: int("previousBalance").default(0).notNull(),
  debit: int("debit").default(0).notNull(),
  credit: int("credit").default(0).notNull(),
  balance: int("balance").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * جدول الموردين (Suppliers)
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  balance: int("balance").default(0).notNull(), // الرصيد بالهللة
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * جدول الفواتير (Invoices)
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId").notNull(),
  invoiceDate: timestamp("invoiceDate").notNull(),
  totalAmount: int("totalAmount").notNull(), // المبلغ الإجمالي بالهللة
  paidAmount: int("paidAmount").default(0).notNull(), // المبلغ المدفوع بالهللة
  remainingAmount: int("remainingAmount").notNull(), // المبلغ المتبقي بالهللة
  status: mysqlEnum("status", ["paid", "partial", "unpaid"]).default("unpaid").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * جدول الأقساط (Installments)
 */
export const installments = mysqlTable("installments", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  customerId: int("customerId").notNull(),
  amount: int("amount").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  paidDate: timestamp("paidDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Installment = typeof installments.$inferSelect;
export type InsertInstallment = typeof installments.$inferInsert;

/**
 * جدول السندات (Receipts)
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 100 }).notNull().unique(),
  customerId: int("customerId"),
  supplierId: int("supplierId"),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: int("amount").notNull(), // المبلغ بالهللة
  receiptDate: timestamp("receiptDate").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * جدول المخزون (Inventory)
 */
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  itemName: varchar("itemName", { length: 255 }).notNull(),
  itemCode: varchar("itemCode", { length: 100 }).unique(),
  quantity: int("quantity").default(0).notNull(),
  unit: varchar("unit", { length: 50 }),
  unitPrice: int("unitPrice").default(0).notNull(), // السعر بالهللة
  totalValue: int("totalValue").default(0).notNull(), // القيمة الإجمالية بالهللة
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryItem = typeof inventory.$inferSelect;
export type InsertInventoryItem = typeof inventory.$inferInsert;

/**
 * جدول حركات المخزون (Inventory Transactions)
 */
export const inventoryTransactions = mysqlTable("inventoryTransactions", {
  id: int("id").autoincrement().primaryKey(),
  inventoryId: int("inventoryId").notNull(),
  type: mysqlEnum("type", ["in", "out"]).notNull(),
  quantity: int("quantity").notNull(),
  transactionDate: timestamp("transactionDate").notNull(),
  reference: varchar("reference", { length: 255 }), // مرجع العملية (رقم فاتورة، رقم طلب، إلخ)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

/**
 * جدول الحركة اليومية (Daily Transactions)
 */
export const dailyTransactions = mysqlTable("dailyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionDate: timestamp("transactionDate").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }), // فئة الحركة (مبيعات، مشتريات، رواتب، إلخ)
  amount: int("amount").notNull(), // المبلغ بالهللة
  description: text("description"),
  reference: varchar("reference", { length: 255 }), // مرجع العملية
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyTransaction = typeof dailyTransactions.$inferSelect;
export type InsertDailyTransaction = typeof dailyTransactions.$inferInsert;

/**
 * جدول الإعدادات (Settings)
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * جدول سجل الرسائل (Message Log)
 */
export const messageLogs = mysqlTable("messageLogs", {
  id: int("id").autoincrement().primaryKey(),
  messageFrom: varchar("messageFrom", { length: 100 }).notNull(),
  messageTo: varchar("messageTo", { length: 100 }),
  messageType: mysqlEnum("messageType", ["incoming", "outgoing"]).notNull(),
  messageContent: text("messageContent"),
  command: varchar("command", { length: 100 }), // الأمر المستخرج من الرسالة
  response: text("response"), // الرد المرسل
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type MessageLog = typeof messageLogs.$inferSelect;
export type InsertMessageLog = typeof messageLogs.$inferInsert;

/**
 * جدول حالة الاتصال (Connection Status)
 */
export const connectionStatus = mysqlTable("connectionStatus", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["connected", "disconnected", "connecting"]).default("disconnected").notNull(),
  lastConnected: timestamp("lastConnected"),
  sessionData: text("sessionData"), // بيانات الجلسة
  qrCode: text("qrCode"), // QR Code للاتصال
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConnectionStatus = typeof connectionStatus.$inferSelect;
export type InsertConnectionStatus = typeof connectionStatus.$inferInsert;

/**
 * جدول السندات (Bonds)
 */
export const bonds = mysqlTable("bonds", {
  id: int("id").autoincrement().primaryKey(),
  bondNumber: varchar("bondNumber", { length: 100 }).notNull().unique(), // رقم السند
  amount: int("amount").notNull(), // المبلغ بالهللة
  issueDate: timestamp("issueDate").notNull(), // تاريخ الإنشاء
  dueDate: timestamp("dueDate").notNull(), // تاريخ الاستحقاق
  creditorName: varchar("creditorName", { length: 255 }).notNull(), // اسم الدائن
  creditorId: varchar("creditorId", { length: 50 }), // رقم الموحد للدائن
  debtorName: varchar("debtorName", { length: 255 }).notNull(), // اسم المدين
  debtorId: varchar("debtorId", { length: 50 }), // رقم هوية المدين
  customerId: int("customerId"), // ربط بالعميل (اختياري)
  reason: text("reason"), // سبب إنشاء السند
  status: mysqlEnum("status", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  pdfUrl: text("pdfUrl"), // رابط ملف PDF الأصلي
  extractedData: text("extractedData"), // البيانات المستخرجة (JSON)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bond = typeof bonds.$inferSelect;
export type InsertBond = typeof bonds.$inferInsert;

/**
 * جدول سجل الأحداث (Event Logs)
 */
export const eventLogs = mysqlTable("eventLogs", {
  id: int("id").autoincrement().primaryKey(),
  eventName: varchar("eventName", { length: 255 }).notNull(),
  eventPayload: text("eventPayload").notNull(), // JSON
  status: mysqlEnum("status", ["pending", "success", "failed", "retrying"]).default("pending").notNull(),
  error: text("error"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastAttemptAt: timestamp("lastAttemptAt"),
});

export type EventLog = typeof eventLogs.$inferSelect;
export type InsertEventLog = typeof eventLogs.$inferInsert;

/**
 * جدول أرصدة العملاء اليومية (Customer Balances)
 * يتم تحديثه يومياً من ملف Excel
 */
export const customerBalances = mysqlTable("customerBalances", {
  id: int("id").autoincrement().primaryKey(),
  customerCode: varchar("customerCode", { length: 50 }).notNull(), // رقم العميل
  customerName: varchar("customerName", { length: 255 }).notNull(), // اسم العميل
  previousBalance: int("previousBalance").default(0).notNull(), // الرصيد السابق (بالهللة)
  debit: int("debit").default(0).notNull(), // المدين (بالهللة)
  credit: int("credit").default(0).notNull(), // الدائن (بالهللة)
  currentBalance: int("currentBalance").default(0).notNull(), // الرصيد الحالي (بالهللة)
  phone: varchar("phone", { length: 50 }), // رقم الهاتف (مستخرج من الاسم)
  importDate: timestamp("importDate").defaultNow().notNull(), // تاريخ الاستيراد
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerBalance = typeof customerBalances.$inferSelect;
export type InsertCustomerBalance = typeof customerBalances.$inferInsert;

/**
 * جدول أرصدة الحسابات (Account Balances)
 * يتم تحديثه يومياً من ملف Excel
 */
export const accountBalances = mysqlTable("accountBalances", {
  id: int("id").autoincrement().primaryKey(),
  accountCode: varchar("accountCode", { length: 50 }), // رقم الحساب
  accountName: varchar("accountName", { length: 255 }), // اسم الحساب
  openingDebitBalance: int("openingDebitBalance").default(0).notNull(), // أول المدة - مدين (بالهللة)
  openingCreditBalance: int("openingCreditBalance").default(0).notNull(), // أول المدة - دائن (بالهللة)
  debitMovement: int("debitMovement").default(0).notNull(), // الحركة المدينة (بالهللة)
  creditMovement: int("creditMovement").default(0).notNull(), // الحركة الدائنة (بالهللة)
  debitBalance: int("debitBalance").default(0).notNull(), // الرصيد المدين (بالهللة)
  creditBalance: int("creditBalance").default(0).notNull(), // الرصيد الدائن (بالهللة)
  importDate: timestamp("importDate").defaultNow().notNull(), // تاريخ الاستيراد
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountBalance = typeof accountBalances.$inferSelect;
export type InsertAccountBalance = typeof accountBalances.$inferInsert;

/**
 * جدول إحصائيات WhatsApp (WhatsApp Stats)
 * لحفظ إحصائيات الرسائل والنشاط
 */
export const whatsappStats = mysqlTable("whatsappStats", {
  id: int("id").autoincrement().primaryKey(),
  messagesSent: int("messagesSent").default(0).notNull(), // عدد الرسائل المرسلة
  messagesReceived: int("messagesReceived").default(0).notNull(), // عدد الرسائل المستلمة
  messagesFailed: int("messagesFailed").default(0).notNull(), // عدد الرسائل الفاشلة
  successRate: int("successRate").default(0).notNull(), // معدل النجاح (بالنسبة المئوية × 10)
  avgResponseTime: int("avgResponseTime").default(0).notNull(), // متوسط وقت الاستجابة (بالميلي ثانية)
  activeGroups: int("activeGroups").default(0).notNull(), // عدد المجموعات النشطة
  lastActivity: varchar("lastActivity", { length: 500 }), // آخر نشاط
  lastActivityTime: timestamp("lastActivityTime"), // وقت آخر نشاط
  lastActivityType: mysqlEnum("lastActivityType", ["sent", "received", "failed"]), // نوع آخر نشاط
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsAppStats = typeof whatsappStats.$inferSelect;
export type InsertWhatsAppStats = typeof whatsappStats.$inferInsert;
