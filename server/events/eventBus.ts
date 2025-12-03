/**
 * Real-Time Event Bus
 * نظام داخلي لإدارة الأحداث في الوقت الفعلي
 */

type EventHandler = (payload: any) => void | Promise<void>;

interface EventSubscription {
  eventName: string;
  handler: EventHandler;
  id: string;
}

class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: Array<{ eventName: string; payload: any; timestamp: Date }> = [];
  private maxHistorySize = 1000;

  /**
   * نشر حدث جديد
   */
  async publish(eventName: string, payload: any): Promise<void> {
    console.log(`[EventBus] Publishing event: ${eventName}`, payload);

    // حفظ الحدث في السجل
    this.eventHistory.push({
      eventName,
      payload,
      timestamp: new Date(),
    });

    // تنظيف السجل إذا تجاوز الحد الأقصى
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // الحصول على جميع المشتركين في هذا الحدث
    const subscribers = this.subscriptions.get(eventName) || [];

    // تنفيذ جميع الـ handlers
    const promises = subscribers.map(async (sub) => {
      try {
        await sub.handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${eventName}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * الاشتراك في حدث
   */
  subscribe(eventName: string, handler: EventHandler): string {
    const id = `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscription: EventSubscription = {
      eventName,
      handler,
      id,
    };

    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }

    this.subscriptions.get(eventName)!.push(subscription);

    console.log(`[EventBus] Subscribed to ${eventName} (ID: ${id})`);

    return id;
  }

  /**
   * إلغاء الاشتراك
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventName, subs] of Array.from(this.subscriptions.entries())) {
      const index = subs.findIndex((s: EventSubscription) => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        console.log(`[EventBus] Unsubscribed from ${eventName} (ID: ${subscriptionId})`);
        return true;
      }
    }
    return false;
  }

  /**
   * الحصول على سجل الأحداث
   */
  getEventHistory(limit?: number): Array<{ eventName: string; payload: any; timestamp: Date }> {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * الحصول على عدد المشتركين لحدث معين
   */
  getSubscriberCount(eventName: string): number {
    return this.subscriptions.get(eventName)?.length || 0;
  }

  /**
   * الحصول على جميع أسماء الأحداث المشترك بها
   */
  getAllEventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * مسح جميع الاشتراكات
   */
  clearAllSubscriptions(): void {
    this.subscriptions.clear();
    console.log("[EventBus] All subscriptions cleared");
  }

  /**
   * مسح سجل الأحداث
   */
  clearEventHistory(): void {
    this.eventHistory = [];
    console.log("[EventBus] Event history cleared");
  }
}

// Singleton instance
const eventBus = new EventBus();

export { eventBus, EventBus };
export type { EventHandler, EventSubscription };
