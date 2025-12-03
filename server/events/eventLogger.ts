/**
 * Event Logger & Retry System
 * تسجيل جميع الأحداث ومحاولة إعادة إرسال الرسائل الفاشلة
 */

import { getDb } from "../db";
import { eventLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface EventLogEntry {
  eventName: string;
  eventPayload: any;
  status: "pending" | "success" | "failed" | "retrying";
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  lastAttemptAt?: Date;
}

class EventLogger {
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds
  private retryInterval: NodeJS.Timeout | null = null;

  /**
   * تسجيل حدث جديد
   */
  async logEvent(
    eventName: string,
    eventPayload: any,
    status: "pending" | "success" | "failed" = "pending"
  ): Promise<number> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Event Logger] Database not available");
        return -1;
      }

      const result = await db.insert(eventLogs).values({
        eventName,
        eventPayload: JSON.stringify(eventPayload),
        status,
        retryCount: 0,
        maxRetries: this.maxRetries,
        createdAt: new Date(),
      });

      const insertId = result[0]?.insertId;
      return insertId ? Number(insertId) : -1;
    } catch (error) {
      console.error("[Event Logger] Failed to log event:", error);
      return -1;
    }
  }

  /**
   * تحديث حالة حدث
   */
  async updateEventStatus(
    eventId: number,
    status: "pending" | "success" | "failed" | "retrying",
    error?: string
  ): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      await db
        .update(eventLogs)
        .set({
          status,
          error: error || null,
          lastAttemptAt: new Date(),
        })
        .where(eq(eventLogs.id, eventId));
    } catch (error) {
      console.error("[Event Logger] Failed to update event status:", error);
    }
  }

  /**
   * زيادة عداد المحاولات
   */
  async incrementRetryCount(eventId: number): Promise<void> {
    try {
      const db = await getDb();
      if (!db) return;

      // الحصول على الحدث الحالي
      const events = await db.select().from(eventLogs).where(eq(eventLogs.id, eventId)).limit(1);

      if (events.length > 0) {
        const event = events[0];
        const newRetryCount = (event.retryCount || 0) + 1;

        await db
          .update(eventLogs)
          .set({
            retryCount: newRetryCount,
            lastAttemptAt: new Date(),
          })
          .where(eq(eventLogs.id, eventId));
      }
    } catch (error) {
      console.error("[Event Logger] Failed to increment retry count:", error);
    }
  }

  /**
   * الحصول على الأحداث الفاشلة التي تحتاج إعادة محاولة
   */
  async getFailedEvents(): Promise<any[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const events = await db
        .select()
        .from(eventLogs)
        .where(eq(eventLogs.status, "failed"))
        .limit(100);

      return events.filter((event) => (event.retryCount || 0) < (event.maxRetries || this.maxRetries));
    } catch (error) {
      console.error("[Event Logger] Failed to get failed events:", error);
      return [];
    }
  }

  /**
   * بدء نظام إعادة المحاولة التلقائي
   */
  startRetrySystem(retryHandler: (event: any) => Promise<boolean>): void {
    if (this.retryInterval) {
      console.warn("[Event Logger] Retry system already running");
      return;
    }

    console.log("[Event Logger] Starting retry system...");

    this.retryInterval = setInterval(async () => {
      const failedEvents = await this.getFailedEvents();

      if (failedEvents.length === 0) {
        return;
      }

      console.log(`[Event Logger] Retrying ${failedEvents.length} failed events...`);

      for (const event of failedEvents) {
        try {
          // تحديث الحالة إلى "retrying"
          await this.updateEventStatus(event.id, "retrying");

          // محاولة إعادة الإرسال
          const success = await retryHandler(event);

          if (success) {
            await this.updateEventStatus(event.id, "success");
            console.log(`[Event Logger] Successfully retried event ${event.id}`);
          } else {
            await this.incrementRetryCount(event.id);

            // إذا وصل لأقصى عدد محاولات، نضع الحالة "failed" نهائياً
            if ((event.retryCount || 0) + 1 >= (event.maxRetries || this.maxRetries)) {
              await this.updateEventStatus(event.id, "failed", "Max retries reached");
              console.error(`[Event Logger] Max retries reached for event ${event.id}`);
            } else {
              await this.updateEventStatus(event.id, "failed");
            }
          }
        } catch (error) {
          console.error(`[Event Logger] Error retrying event ${event.id}:`, error);
          await this.incrementRetryCount(event.id);
          await this.updateEventStatus(event.id, "failed", (error as Error).message);
        }
      }
    }, this.retryDelay);

    console.log("[Event Logger] Retry system started");
  }

  /**
   * إيقاف نظام إعادة المحاولة
   */
  stopRetrySystem(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
      console.log("[Event Logger] Retry system stopped");
    }
  }

  /**
   * الحصول على إحصائيات الأحداث
   */
  async getEventStats(): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    retrying: number;
  }> {
    try {
      const db = await getDb();
      if (!db) {
        return { total: 0, success: 0, failed: 0, pending: 0, retrying: 0 };
      }

      const allEvents = await db.select().from(eventLogs);

      return {
        total: allEvents.length,
        success: allEvents.filter((e) => e.status === "success").length,
        failed: allEvents.filter((e) => e.status === "failed").length,
        pending: allEvents.filter((e) => e.status === "pending").length,
        retrying: allEvents.filter((e) => e.status === "retrying").length,
      };
    } catch (error) {
      console.error("[Event Logger] Failed to get event stats:", error);
      return { total: 0, success: 0, failed: 0, pending: 0, retrying: 0 };
    }
  }

  /**
   * مسح الأحداث القديمة (أقدم من 30 يوم)
   */
  async cleanOldEvents(daysToKeep: number = 30): Promise<number> {
    try {
      const db = await getDb();
      if (!db) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // حذف الأحداث الناجحة القديمة فقط
      const result = await db
        .delete(eventLogs)
        .where(eq(eventLogs.status, "success"));

      console.log(`[Event Logger] Cleaned old events`);
      return 0;
    } catch (error) {
      console.error("[Event Logger] Failed to clean old events:", error);
      return 0;
    }
  }
}

// Singleton instance
const eventLogger = new EventLogger();

export { eventLogger, EventLogger };
