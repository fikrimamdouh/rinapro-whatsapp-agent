/**
 * Agent Scheduler Module
 * وحدة جدولة Agent التلقائية
 */

import cron from "node-cron";
import { BrowserManager } from "./browser";
import { LoginManager } from "./login";
import { DataFetcher } from "./fetcher";
import { DataParser } from "./parser";
import { DataSync } from "./sync";
import type { AgentConfig } from "./agent.config";
import { getWhatsAppService } from "../whatsapp/whatsappService";

export class AgentScheduler {
  private config: AgentConfig;
  private cronJob: ReturnType<typeof cron.schedule> | null = null;
  private isRunning = false;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * بدء الجدولة اليومية
   */
  start(): void {
    if (this.cronJob) {
      console.log("[Agent Scheduler] Already running");
      return;
    }

    // الجدولة اليومية في الساعة 6 صباحاً
    this.cronJob = cron.schedule(
      "0 6 * * *",
      async () => {
        await this.runSync();
      },
      {
        timezone: "Asia/Riyadh",
      }
    );

    console.log("[Agent Scheduler] Started - will run daily at 6:00 AM");
  }

  /**
   * إيقاف الجدولة
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("[Agent Scheduler] Stopped");
    }
  }

  /**
   * تشغيل المزامنة يدوياً
   */
  async runSync(): Promise<void> {
    if (this.isRunning) {
      console.log("[Agent Scheduler] Sync already in progress");
      return;
    }

    this.isRunning = true;
    console.log("\n[Agent Scheduler] ========== Starting Sync ==========");
    console.log(`[Agent Scheduler] Time: ${new Date().toLocaleString("ar-SA")}`);

    try {
      // 1. إنشاء المتصفح
      const browser = new BrowserManager(this.config);
      await browser.launch();

      // 2. تسجيل الدخول
      const login = new LoginManager(browser, this.config);
      const loginSuccess = await login.login();

      if (!loginSuccess) {
        throw new Error("Login failed");
      }

      // 3. سحب البيانات
      const fetcher = new DataFetcher(browser, this.config, login);
      const fetchedData = await fetcher.fetchAll();

      // 4. تحليل البيانات
      const parser = new DataParser();
      const parsedData = parser.parse(fetchedData);

      // 5. مزامنة البيانات
      const sync = new DataSync();
      const syncResult = await sync.syncAll(parsedData);

      // 6. إرسال تقرير عبر WhatsApp
      await this.sendWhatsAppReport(syncResult, sync);

      // 7. إغلاق المتصفح
      await browser.close();

      console.log("[Agent Scheduler] ========== Sync Completed ==========\n");
    } catch (error) {
      console.error("[Agent Scheduler] Sync failed:", error);

      // إرسال تنبيه بالخطأ عبر WhatsApp
      await this.sendWhatsAppError(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * إرسال تقرير المزامنة عبر WhatsApp
   */
  private async sendWhatsAppReport(syncResult: any, sync: DataSync): Promise<void> {
    try {
      const whatsappService = getWhatsAppService();

      if (!whatsappService.isConnected()) {
        console.warn("[Agent Scheduler] WhatsApp not connected, skipping report");
        return;
      }

      const report = sync.generateReport(syncResult);

      // إرسال إلى المالك أو مجموعة معينة
      const recipientJid = this.config.whatsappReportJid || this.config.ownerJid;

      if (recipientJid) {
        await whatsappService.sendMessage(recipientJid, report);
        console.log("[Agent Scheduler] WhatsApp report sent successfully");
      }
    } catch (error) {
      console.error("[Agent Scheduler] Failed to send WhatsApp report:", error);
    }
  }

  /**
   * إرسال تنبيه خطأ عبر WhatsApp
   */
  private async sendWhatsAppError(error: any): Promise<void> {
    try {
      const whatsappService = getWhatsAppService();

      if (!whatsappService.isConnected()) {
        return;
      }

      const errorMessage = `
⚠️ *تنبيه: فشل المزامنة التلقائية*

❌ *الخطأ*: ${String(error)}

⏰ *الوقت*: ${new Date().toLocaleString("ar-SA")}

يرجى التحقق من النظام وإعادة المحاولة.
      `.trim();

      const recipientJid = this.config.whatsappReportJid || this.config.ownerJid;

      if (recipientJid) {
        await whatsappService.sendMessage(recipientJid, errorMessage);
      }
    } catch (err) {
      console.error("[Agent Scheduler] Failed to send WhatsApp error:", err);
    }
  }

  /**
   * الحصول على حالة الجدولة
   */
  getStatus(): {
    running: boolean;
    syncInProgress: boolean;
    nextRun: string | null;
  } {
    return {
      running: this.cronJob !== null,
      syncInProgress: this.isRunning,
      nextRun: this.cronJob ? "6:00 AM daily" : null,
    };
  }
}
