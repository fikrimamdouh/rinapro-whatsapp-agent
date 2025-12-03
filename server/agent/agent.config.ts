/**
 * AI Agent Configuration
 * إعدادات الوكيل الذكي
 */

export interface AgentConfig {
  // إعدادات الموقع المستهدف
  targetSite: {
    url: string;
    loginUrl: string;
    dashboardUrl: string;
    reportsUrl: string;
  };

  // بيانات تسجيل الدخول
  credentials: {
    username: string;
    password: string;
  };

  // إعدادات المتصفح
  browser: {
    headless: boolean;
    timeout: number;
    viewport: {
      width: number;
      height: number;
    };
  };

  // إعدادات الجدولة
  schedule: {
    enabled: boolean;
    cronExpression: string; // "0 6 * * *" = كل يوم الساعة 6 صباحاً
    timezone: string;
  };

  // إعدادات المزامنة
  sync: {
    autoSync: boolean;
    syncCustomers: boolean;
    syncInvoices: boolean;
    syncPayments: boolean;
    syncProducts: boolean;
  };

  // إعدادات التقارير
  reports: {
    sendToWhatsApp: boolean;
    sendToManager: boolean;
    sendToGroup: boolean;
  };

  // إعدادات WhatsApp
  whatsappReportJid?: string; // رقم المستلم للتقارير
  ownerJid?: string; // رقم المالك
}

// الإعدادات الافتراضية
export const defaultAgentConfig: AgentConfig = {
  targetSite: {
    url: process.env.AGENT_TARGET_URL || "https://example.com",
    loginUrl: process.env.AGENT_LOGIN_URL || "https://example.com/login",
    dashboardUrl: process.env.AGENT_DASHBOARD_URL || "https://example.com/dashboard",
    reportsUrl: process.env.AGENT_REPORTS_URL || "https://example.com/reports",
  },

  credentials: {
    username: process.env.AGENT_USERNAME || "",
    password: process.env.AGENT_PASSWORD || "",
  },

  browser: {
    headless: process.env.NODE_ENV === "production",
    timeout: 30000,
    viewport: {
      width: 1920,
      height: 1080,
    },
  },

  schedule: {
    enabled: true,
    cronExpression: "0 6 * * *", // كل يوم الساعة 6 صباحاً
    timezone: "Asia/Riyadh",
  },

  sync: {
    autoSync: true,
    syncCustomers: true,
    syncInvoices: true,
    syncPayments: true,
    syncProducts: true,
  },

  reports: {
    sendToWhatsApp: true,
    sendToManager: true,
    sendToGroup: true,
  },

  whatsappReportJid: process.env.WHATSAPP_REPORT_JID || undefined,
  ownerJid: process.env.WHATSAPP_OWNER_JID || undefined,
};

// تحميل الإعدادات من قاعدة البيانات أو ملف
export async function loadAgentConfig(): Promise<AgentConfig> {
  // يمكن تحميل الإعدادات من قاعدة البيانات هنا
  return defaultAgentConfig;
}
