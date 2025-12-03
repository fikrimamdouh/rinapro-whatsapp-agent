/**
 * AI Engine Service
 * Advanced Natural Language Understanding for accounting queries
 */

import { calculateDashboardKPIs, getSalesTrend, getTopSellingItems } from "./kpiCalculator";
import { getSQLiteDb } from "../db/sqlite";

export interface AIIntent {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  action: string;
}

export interface ConversationContext {
  lastIntent?: string;
  lastEntities?: Record<string, any>;
  conversationHistory: Array<{ role: string; content: string }>;
}

// Conversation memory per user
const conversationMemory = new Map<string, ConversationContext>();

/**
 * Process natural language query with AI
 * TODO: Integrate OpenAI GPT-4 or Claude for production
 */
export async function processNaturalLanguage(
  sender: string,
  message: string
): Promise<{ response: string; data?: any }> {
  
  // Get or create conversation context
  const context = conversationMemory.get(sender) || {
    conversationHistory: [],
  };

  // Simple intent detection (will be replaced with GPT-4)
  const intent = detectIntent(message, context);
  
  // Process based on intent
  let response: string;
  let data: any;

  switch (intent.intent) {
    case "sales_query":
      ({ response, data } = await handleSalesQuery(intent));
      break;
    
    case "comparison_query":
      ({ response, data } = await handleComparisonQuery(intent, context));
      break;
    
    case "inventory_query":
      ({ response, data } = await handleInventoryQuery(intent));
      break;
    
    case "cashbox_query":
      ({ response, data } = await handleCashboxQuery(intent));
      break;
    
    case "customer_query":
      ({ response, data } = await handleCustomerQuery(intent));
      break;
    
    case "recommendation_request":
      ({ response, data } = await handleRecommendation(intent));
      break;
    
    default:
      response = "عذراً، لم أفهم طلبك. هل يمكنك إعادة صياغته؟";
  }

  // Update conversation context
  context.lastIntent = intent.intent;
  context.lastEntities = intent.entities;
  context.conversationHistory.push(
    { role: "user", content: message },
    { role: "assistant", content: response }
  );
  
  // Keep only last 10 messages
  if (context.conversationHistory.length > 20) {
    context.conversationHistory = context.conversationHistory.slice(-20);
  }
  
  conversationMemory.set(sender, context);

  return { response, data };
}

/**
 * Detect intent from message (simple pattern matching)
 * TODO: Replace with GPT-4 function calling
 */
function detectIntent(message: string, context: ConversationContext): AIIntent {
  const msg = message.toLowerCase();

  // Sales queries
  if (msg.match(/مبيعات|بعنا|بيع|مبيع/)) {
    return {
      intent: "sales_query",
      entities: extractTimeEntities(msg),
      confidence: 0.9,
      action: "get_sales_data",
    };
  }

  // Comparison queries
  if (msg.match(/مقارنة|قارن|الفرق|أكثر|أقل|زيادة|نقص/)) {
    return {
      intent: "comparison_query",
      entities: extractTimeEntities(msg),
      confidence: 0.85,
      action: "compare_data",
    };
  }

  // Inventory queries
  if (msg.match(/مخزون|أصناف|منتج|بضاعة/)) {
    return {
      intent: "inventory_query",
      entities: extractItemEntities(msg),
      confidence: 0.9,
      action: "get_inventory_data",
    };
  }

  // Cashbox queries
  if (msg.match(/صندوق|رصيد|نقدية|سيولة/)) {
    return {
      intent: "cashbox_query",
      entities: {},
      confidence: 0.9,
      action: "get_cashbox_data",
    };
  }

  // Customer queries
  if (msg.match(/عميل|زبون|مدين|دائن/)) {
    return {
      intent: "customer_query",
      entities: extractCustomerEntities(msg),
      confidence: 0.85,
      action: "get_customer_data",
    };
  }

  // Contextual queries (using previous context)
  if (msg.match(/^(و|ف|ثم|كم|شو|ايش|وين|متى)/) && context.lastIntent) {
    return {
      intent: context.lastIntent,
      entities: context.lastEntities || {},
      confidence: 0.7,
      action: "continue_context",
    };
  }

  return {
    intent: "unknown",
    entities: {},
    confidence: 0,
    action: "fallback",
  };
}

/**
 * Extract time-related entities
 */
function extractTimeEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};

  if (message.match(/اليوم|today/)) {
    entities.period = "today";
    entities.date = new Date().toISOString().split("T")[0];
  } else if (message.match(/أمس|البارحة|yesterday/)) {
    entities.period = "yesterday";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    entities.date = yesterday.toISOString().split("T")[0];
  } else if (message.match(/الأسبوع|هذا الأسبوع|week/)) {
    entities.period = "this_week";
  } else if (message.match(/الشهر|هذا الشهر|month/)) {
    entities.period = "this_month";
  } else if (message.match(/السنة|هذه السنة|year/)) {
    entities.period = "this_year";
  }

  return entities;
}

/**
 * Extract item-related entities
 */
function extractItemEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // Extract item name (simple approach)
  const words = message.split(" ");
  for (const word of words) {
    if (word.length > 3 && !word.match(/مخزون|أصناف|منتج|بضاعة|كم|شو/)) {
      entities.itemName = word;
      break;
    }
  }

  return entities;
}

/**
 * Extract customer-related entities
 */
function extractCustomerEntities(message: string): Record<string, any> {
  const entities: Record<string, any> = {};
  
  // Extract customer name (simple approach)
  const words = message.split(" ");
  for (const word of words) {
    if (word.length > 2 && !word.match(/عميل|زبون|مدين|دائن|كم|شو/)) {
      entities.customerName = word;
      break;
    }
  }

  return entities;
}

/**
 * Handle sales queries
 */
async function handleSalesQuery(intent: AIIntent): Promise<{ response: string; data?: any }> {
  const db = getSQLiteDb();
  if (!db) {
    return { response: "⚠️ قاعدة البيانات غير متاحة حالياً" };
  }

  const { period, date } = intent.entities;
  
  let query = `SELECT COUNT(*) as count, SUM(totalPrice) as total FROM salesUploads`;
  let params: any[] = [];

  if (date) {
    query += ` WHERE DATE(saleDate) = ?`;
    params.push(date);
  }

  const result = db.prepare(query).get(...params) as { count: number; total: number | null };
  const total = (result.total || 0) / 100;

  let periodText = "اليوم";
  if (period === "yesterday") periodText = "أمس";
  else if (period === "this_week") periodText = "هذا الأسبوع";
  else if (period === "this_month") periodText = "هذا الشهر";

  return {
    response: `📊 المبيعات ${periodText}:\n\n` +
      `🛒 عدد العمليات: ${result.count}\n` +
      `💰 الإجمالي: ${total.toLocaleString("ar-SA")} ريال`,
    data: result,
  };
}

/**
 * Handle comparison queries
 */
async function handleComparisonQuery(
  intent: AIIntent,
  context: ConversationContext
): Promise<{ response: string; data?: any }> {
  const db = getSQLiteDb();
  if (!db) {
    return { response: "⚠️ قاعدة البيانات غير متاحة حالياً" };
  }

  // Get today's sales
  const today = new Date().toISOString().split("T")[0];
  const todaySales = db.prepare(`
    SELECT SUM(totalPrice) as total FROM salesUploads WHERE DATE(saleDate) = ?
  `).get(today) as { total: number | null };

  // Get yesterday's sales
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];
  const yesterdaySales = db.prepare(`
    SELECT SUM(totalPrice) as total FROM salesUploads WHERE DATE(saleDate) = ?
  `).get(yesterdayDate) as { total: number | null };

  const todayTotal = (todaySales.total || 0) / 100;
  const yesterdayTotal = (yesterdaySales.total || 0) / 100;
  const difference = todayTotal - yesterdayTotal;
  const percentChange = yesterdayTotal > 0 ? (difference / yesterdayTotal) * 100 : 0;

  const emoji = difference > 0 ? "📈" : difference < 0 ? "📉" : "➡️";
  const changeText = difference > 0 ? "زيادة" : difference < 0 ? "انخفاض" : "ثابت";

  return {
    response: `${emoji} مقارنة المبيعات:\n\n` +
      `📅 اليوم: ${todayTotal.toLocaleString("ar-SA")} ريال\n` +
      `📅 أمس: ${yesterdayTotal.toLocaleString("ar-SA")} ريال\n\n` +
      `📊 الفرق: ${Math.abs(difference).toLocaleString("ar-SA")} ريال\n` +
      `📈 النسبة: ${changeText} ${Math.abs(percentChange).toFixed(1)}%`,
    data: { today: todayTotal, yesterday: yesterdayTotal, difference, percentChange },
  };
}

/**
 * Handle inventory queries
 */
async function handleInventoryQuery(intent: AIIntent): Promise<{ response: string; data?: any }> {
  const db = getSQLiteDb();
  if (!db) {
    return { response: "⚠️ قاعدة البيانات غير متاحة حالياً" };
  }

  const { itemName } = intent.entities;

  if (itemName) {
    // Specific item query
    const item = db.prepare(`
      SELECT * FROM inventoryUploads 
      WHERE itemName LIKE ? 
      ORDER BY createdAt DESC 
      LIMIT 1
    `).get(`%${itemName}%`) as any;

    if (!item) {
      return { response: `❌ لم أجد صنف باسم "${itemName}"` };
    }

    return {
      response: `📦 معلومات الصنف:\n\n` +
        `📝 الاسم: ${item.itemName}\n` +
        `📊 الكمية: ${item.stockQuantity}\n` +
        `💰 السعر: ${(item.unitPrice / 100).toLocaleString("ar-SA")} ريال\n` +
        `💵 القيمة: ${(item.totalValue / 100).toLocaleString("ar-SA")} ريال`,
      data: item,
    };
  } else {
    // General inventory query
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(stockQuantity) as totalQuantity,
        SUM(totalValue) as totalValue,
        COUNT(CASE WHEN stockQuantity < 10 THEN 1 END) as lowStock
      FROM inventoryUploads
    `).get() as any;

    return {
      response: `📦 حالة المخزون:\n\n` +
        `📊 عدد الأصناف: ${stats.totalItems}\n` +
        `📈 إجمالي الكمية: ${stats.totalQuantity}\n` +
        `💰 القيمة الإجمالية: ${((stats.totalValue || 0) / 100).toLocaleString("ar-SA")} ريال\n` +
        `⚠️ أصناف منخفضة: ${stats.lowStock}`,
      data: stats,
    };
  }
}

/**
 * Handle cashbox queries
 */
async function handleCashboxQuery(intent: AIIntent): Promise<{ response: string; data?: any }> {
  const kpis = calculateDashboardKPIs();

  return {
    response: `💰 رصيد الصندوق:\n\n` +
      `💵 الإيرادات: ${kpis.totalRevenue.toLocaleString("ar-SA")} ريال\n` +
      `💸 المصروفات: ${kpis.totalExpenses.toLocaleString("ar-SA")} ريال\n` +
      `📊 الرصيد الحالي: ${kpis.cashBalance.toLocaleString("ar-SA")} ريال`,
    data: kpis,
  };
}

/**
 * Handle customer queries
 */
async function handleCustomerQuery(intent: AIIntent): Promise<{ response: string; data?: any }> {
  const { customerName } = intent.entities;

  if (!customerName) {
    return { response: "من هو العميل الذي تريد الاستعلام عنه؟" };
  }

  // TODO: Query customer from database
  return {
    response: `👤 معلومات العميل "${customerName}":\n\n` +
      `هذه الميزة قيد التطوير. سيتم إضافتها قريباً.`,
  };
}

/**
 * Handle recommendation requests
 */
async function handleRecommendation(intent: AIIntent): Promise<{ response: string; data?: any }> {
  const topItems = getTopSellingItems(3);
  const kpis = calculateDashboardKPIs();

  let recommendations = "💡 التوصيات الذكية:\n\n";

  // Low stock warning
  if (kpis.lowStockItems > 0) {
    recommendations += `⚠️ لديك ${kpis.lowStockItems} أصناف منخفضة المخزون. يُنصح بإعادة الطلب.\n\n`;
  }

  // Top selling items
  if (topItems.length > 0) {
    recommendations += `🏆 الأصناف الأكثر مبيعاً:\n`;
    topItems.forEach((item, i) => {
      recommendations += `${i + 1}. ${item.itemName} - ${item.revenue.toLocaleString("ar-SA")} ريال\n`;
    });
  }

  return { response: recommendations, data: { topItems, kpis } };
}

/**
 * Clear conversation context for a user
 */
export function clearConversationContext(sender: string): void {
  conversationMemory.delete(sender);
}

/**
 * Get conversation context for a user
 */
export function getConversationContext(sender: string): ConversationContext | undefined {
  return conversationMemory.get(sender);
}
