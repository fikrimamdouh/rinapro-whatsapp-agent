/**
 * AI Agent Router
 * مسارات API للوكيل الذكي
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { AgentScheduler } from "../agent/scheduler";
import { loadAgentConfig } from "../agent/agent.config";
import { BrowserManager } from "../agent/browser";
import { LoginManager } from "../agent/login";
import { DataFetcher } from "../agent/fetcher";
import { DataParser } from "../agent/parser";
import { DataSync } from "../agent/sync";

// Singleton instance للـ scheduler
let agentScheduler: AgentScheduler | null = null;

async function getAgentScheduler(): Promise<AgentScheduler> {
  if (!agentScheduler) {
    const config = await loadAgentConfig();
    agentScheduler = new AgentScheduler(config);

    // بدء الجدولة التلقائية إذا كانت مفعلة
    if (config.schedule.enabled) {
      agentScheduler.start();
      console.log("[Agent Router] Scheduler started automatically");
    }
  }
  return agentScheduler;
}

export const agentRouter = router({
  /**
   * الحصول على حالة Agent
   */
  getStatus: publicProcedure.query(async () => {
    const scheduler = await getAgentScheduler();
    const status = scheduler.getStatus();
    const config = await loadAgentConfig();

    return {
      ...status,
      config: {
        targetUrl: config.targetSite.url,
        scheduleEnabled: config.schedule.enabled,
        autoSync: config.sync.autoSync,
        syncCustomers: config.sync.syncCustomers,
        syncInvoices: config.sync.syncInvoices,
        syncPayments: config.sync.syncPayments,
        syncProducts: config.sync.syncProducts,
      },
    };
  }),

  /**
   * تشغيل المزامنة يدوياً
   */
  runSync: publicProcedure.mutation(async () => {
    try {
      const scheduler = await getAgentScheduler();
      await scheduler.runSync();

      return {
        success: true,
        message: "تم بدء المزامنة بنجاح",
      };
    } catch (error) {
      console.error("[Agent Router] Sync error:", error);
      return {
        success: false,
        message: `فشل بدء المزامنة: ${String(error)}`,
      };
    }
  }),

  /**
   * بدء الجدولة التلقائية
   */
  startScheduler: publicProcedure.mutation(async () => {
    try {
      const scheduler = await getAgentScheduler();
      scheduler.start();

      return {
        success: true,
        message: "تم بدء الجدولة التلقائية",
      };
    } catch (error) {
      console.error("[Agent Router] Start scheduler error:", error);
      return {
        success: false,
        message: `فشل بدء الجدولة: ${String(error)}`,
      };
    }
  }),

  /**
   * إيقاف الجدولة التلقائية
   */
  stopScheduler: publicProcedure.mutation(async () => {
    try {
      const scheduler = await getAgentScheduler();
      scheduler.stop();

      return {
        success: true,
        message: "تم إيقاف الجدولة التلقائية",
      };
    } catch (error) {
      console.error("[Agent Router] Stop scheduler error:", error);
      return {
        success: false,
        message: `فشل إيقاف الجدولة: ${String(error)}`,
      };
    }
  }),

  /**
   * اختبار الاتصال بالموقع المستهدف
   */
  testConnection: publicProcedure.mutation(async () => {
    try {
      const config = await loadAgentConfig();
      const browser = new BrowserManager(config);

      await browser.launch();
      await browser.goto(config.targetSite.url);

      const title = await browser.evaluate(() => document.title);

      await browser.close();

      return {
        success: true,
        message: "تم الاتصال بنجاح",
        data: {
          url: config.targetSite.url,
          title,
        },
      };
    } catch (error) {
      console.error("[Agent Router] Test connection error:", error);
      return {
        success: false,
        message: `فشل الاتصال: ${String(error)}`,
      };
    }
  }),

  /**
   * اختبار تسجيل الدخول
   */
  testLogin: publicProcedure.mutation(async () => {
    try {
      const config = await loadAgentConfig();
      const browser = new BrowserManager(config);
      await browser.launch();

      const login = new LoginManager(browser, config);
      const success = await login.login();

      await browser.close();

      return {
        success,
        message: success ? "تم تسجيل الدخول بنجاح" : "فشل تسجيل الدخول",
      };
    } catch (error) {
      console.error("[Agent Router] Test login error:", error);
      return {
        success: false,
        message: `فشل تسجيل الدخول: ${String(error)}`,
      };
    }
  }),

  /**
   * سحب البيانات فقط (بدون مزامنة)
   */
  fetchData: publicProcedure.mutation(async () => {
    try {
      const config = await loadAgentConfig();
      const browser = new BrowserManager(config);
      await browser.launch();

      const login = new LoginManager(browser, config);
      const loginSuccess = await login.login();

      if (!loginSuccess) {
        throw new Error("فشل تسجيل الدخول");
      }

      const fetcher = new DataFetcher(browser, config, login);
      const fetchedData = await fetcher.fetchAll();

      const parser = new DataParser();
      const parsedData = parser.parse(fetchedData);

      await browser.close();

      return {
        success: true,
        message: "تم سحب البيانات بنجاح",
        data: {
          customersCount: parsedData.customers.length,
          invoicesCount: parsedData.invoices.length,
          paymentsCount: parsedData.payments.length,
          productsCount: parsedData.products.length,
        },
      };
    } catch (error) {
      console.error("[Agent Router] Fetch data error:", error);
      return {
        success: false,
        message: `فشل سحب البيانات: ${String(error)}`,
      };
    }
  }),
});
