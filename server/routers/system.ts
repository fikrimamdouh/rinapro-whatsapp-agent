/**
 * System Router
 * Dashboard stats and system information
 */

import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getWhatsAppService } from "../whatsapp/whatsappService";
import { calculateDashboardKPIs, getSalesTrend, getTopSellingItems } from "../services/kpiCalculator";

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })),

  dashboardStats: publicProcedure.query(async () => {
    const stats = await db.getDashboardStats();
    const kpis = calculateDashboardKPIs();
    const whatsapp = getWhatsAppService();
    const status = whatsapp.getStatus();

    return {
      ...stats,
      ...kpis,
      whatsappConnected: status.connected,
      dbMode: db.isUsingSQLite() ? "sqlite" : "mysql",
    };
  }),

  getKPIs: publicProcedure.query(() => {
    return calculateDashboardKPIs();
  }),

  getSalesTrend: publicProcedure.query(() => {
    return getSalesTrend();
  }),

  getTopSellingItems: publicProcedure.query(() => {
    return getTopSellingItems(5);
  }),

  getMessageLogs: publicProcedure.query(async () => {
    return await db.getMessageLogs(50);
  }),

  getRecentEvents: publicProcedure.query(async () => {
    return await db.getRecentEvents(20);
  }),

  resetSystem: publicProcedure.mutation(async () => {
    await db.resetAllData();
    return { success: true, message: "تم إعادة ضبط النظام بالكامل" };
  }),

  getAutoReplyStatus: publicProcedure.query(async () => {
    const setting = await db.getSetting("AUTO_REPLY_ENABLED");
    return { enabled: setting === "true" };
  }),

  toggleAutoReply: publicProcedure.mutation(async () => {
    const current = await db.getSetting("AUTO_REPLY_ENABLED");
    const newValue = current === "true" ? "false" : "true";
    await db.setSetting("AUTO_REPLY_ENABLED", newValue, "تفعيل/إيقاف الرد الآلي");
    return { enabled: newValue === "true" };
  }),
});
