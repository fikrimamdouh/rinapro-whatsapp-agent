/**
 * WhatsApp Router
 * TRPC procedures for WhatsApp integration
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getWhatsAppService } from "../whatsapp/whatsappService";
import { getWhatsAppStats, getSetting } from "../db";

export const whatsappRouter = router({
  status: publicProcedure.query(async () => {
    const service = getWhatsAppService();
    return service.getStatus();
  }),

  connect: publicProcedure.mutation(async () => {
    const service = getWhatsAppService();
    const qr = await service.connect();
    return {
      success: true,
      qrCode: qr,
      message: qr ? "جاري الاتصال، يرجى مسح QR Code" : "جاري الاتصال...",
    };
  }),

  disconnect: publicProcedure.mutation(async () => {
    const service = getWhatsAppService();
    await service.disconnect();
    return {
      success: true,
      message: "تم قطع الاتصال بنجاح",
    };
  }),

  getGroups: publicProcedure.query(async () => {
    const service = getWhatsAppService();
    return service.getGroups();
  }),

  sendMessage: publicProcedure
    .input(
      z.object({
        to: z.string().min(1, "المستلم مطلوب"),
        message: z.string().min(1, "الرسالة مطلوبة"),
      })
    )
    .mutation(async ({ input }) => {
      const service = getWhatsAppService();

      if (input.to === "group") {
        const groupName = await getSetting("GROUP_NAME");
        if (!groupName) {
          throw new Error("اسم المجموعة غير محدد في الإعدادات");
        }
        await service.sendMessageToGroup(groupName, input.message);
      } else if (input.to === "manager") {
        await service.sendToManager(input.message);
      } else {
        await service.sendMessage(input.to, input.message);
      }

      return {
        success: true,
        message: "تم إرسال الرسالة بنجاح",
      };
    }),

  sendToManager: publicProcedure
    .input(
      z.object({
        message: z.string().min(1, "الرسالة مطلوبة"),
      })
    )
    .mutation(async ({ input }) => {
      const service = getWhatsAppService();
      await service.sendToManager(input.message);
      return {
        success: true,
        message: "تم إرسال الرسالة للمدير بنجاح",
      };
    }),

  sendToGroup: publicProcedure
    .input(
      z.object({
        groupId: z.string().optional(),
        groupName: z.string().optional(),
        message: z.string().min(1, "الرسالة مطلوبة"),
      })
    )
    .mutation(async ({ input }) => {
      const service = getWhatsAppService();

      if (input.groupId) {
        await service.sendMessage(input.groupId, input.message);
      } else if (input.groupName) {
        await service.sendMessageToGroup(input.groupName, input.message);
      } else {
        const defaultGroup = await getSetting("GROUP_NAME");
        if (!defaultGroup) {
          throw new Error("لم يتم تحديد مجموعة");
        }
        await service.sendMessageToGroup(defaultGroup, input.message);
      }

      return {
        success: true,
        message: "تم إرسال الرسالة للمجموعة بنجاح",
      };
    }),

  getStats: publicProcedure.query(async () => {
    const stats = await getWhatsAppStats();
    const service = getWhatsAppService();
    const groups = await service.getGroups();

    return {
      messagesSent: stats?.messagesSent || 0,
      messagesReceived: stats?.messagesReceived || 0,
      messagesFailed: stats?.messagesFailed || 0,
      successRate: stats?.successRate || 100,
      avgResponseTime: stats?.avgResponseTime || 0,
      activeGroups: groups.length,
      lastActivity: stats?.lastActivity || "لا يوجد نشاط",
      lastActivityTime: stats?.lastActivityTime || null,
      lastActivityType: stats?.lastActivityType || null,
    };
  }),
});
