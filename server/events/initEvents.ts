/**
 * Event System Initializer
 * تهيئة وتشغيل نظام الأحداث
 */

import { registerWhatsAppListeners } from "./listeners/whatsappListener";
import { eventLogger } from "./eventLogger";
import { eventBus } from "./eventBus";
import { getWhatsAppService } from "../whatsapp/whatsappService";
import * as db from "../db";

/**
 * معالج إعادة محاولة إرسال الأحداث الفاشلة
 */
async function retryFailedEvent(event: any): Promise<boolean> {
  try {
    // إعادة نشر الحدث
    const payload = JSON.parse(event.eventPayload);
    await eventBus.publish(event.eventName, payload);
    return true;
  } catch (error) {
    console.error(`[Event Retry] Failed to retry event ${event.id}:`, error);
    return false;
  }
}

/**
 * Initialize events - main entry point
 */
export async function initEvents(): Promise<void> {
  initializeEventSystem();
}

/**
 * تهيئة نظام الأحداث
 */
export function initializeEventSystem(): void {
  console.log("[Event System] Initializing...");

  // 1. تسجيل WhatsApp Listeners
  registerWhatsAppListeners();

  // 2. بدء نظام إعادة المحاولة (معطل مؤقتاً - DB غير متوفر)
  // eventLogger.startRetrySystem(retryFailedEvent);

  // 3. جدولة تنظيف الأحداث القديمة (معطل مؤقتاً - DB غير متوفر)
  // setInterval(
  //   async () => {
  //     console.log("[Event System] Cleaning old events...");
  //     const cleaned = await eventLogger.cleanOldEvents(30);
  //     console.log(`[Event System] Cleaned ${cleaned} old events`);
  //   },
  //   24 * 60 * 60 * 1000
  // ); // 24 hours

  console.log("[Event System] Initialized successfully");
}

/**
 * إيقاف نظام الأحداث
 */
export function shutdownEventSystem(): void {
  console.log("[Event System] Shutting down...");
  eventLogger.stopRetrySystem();
  eventBus.clearAllSubscriptions();
  console.log("[Event System] Shut down successfully");
}

/**
 * الحصول على إحصائيات النظام
 */
export async function getEventSystemStats() {
  const stats = await eventLogger.getEventStats();
  const eventNames = eventBus.getAllEventNames();

  return {
    ...stats,
    registeredEvents: eventNames.length,
    eventNames,
  };
}
