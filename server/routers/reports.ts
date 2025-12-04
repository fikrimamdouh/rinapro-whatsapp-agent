import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db/sqlite";

export const reportsRouter = router({
  getFinancialSummary: publicProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(({ input }) => {
      // Mock data for now
      return {
        totalRevenue: 500000,
        totalExpenses: 300000,
        netProfit: 200000,
        profitMargin: 40,
        revenueBreakdown: [
          { category: "المبيعات", amount: 400000 },
          { category: "الخدمات", amount: 100000 },
        ],
        expensesBreakdown: [
          { category: "الرواتب", amount: 150000 },
          { category: "الإيجار", amount: 50000 },
          { category: "المرافق", amount: 30000 },
          { category: "أخرى", amount: 70000 },
        ],
      };
    }),

  getSalesReport: publicProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return {
        totalSales: 400000,
        invoiceCount: 150,
        averageInvoice: 2666,
        topProducts: [
          { name: "منتج أ", quantity: 100, revenue: 150000 },
          { name: "منتج ب", quantity: 80, revenue: 120000 },
          { name: "منتج ج", quantity: 60, revenue: 90000 },
        ],
      };
    }),

  getInventoryReport: publicProcedure.query(() => {
    return {
      totalItems: 250,
      totalValue: 1500000,
      lowStockItems: 15,
      lowStockList: [
        { name: "صنف أ", currentStock: 5, minStock: 20 },
        { name: "صنف ب", currentStock: 3, minStock: 15 },
        { name: "صنف ج", currentStock: 8, minStock: 25 },
      ],
    };
  }),

  getProfitLoss: publicProcedure
    .input(
      z.object({
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return {
        revenue: [
          { label: "إيرادات المبيعات", amount: 400000 },
          { label: "إيرادات الخدمات", amount: 100000 },
        ],
        totalRevenue: 500000,
        expenses: [
          { label: "تكلفة البضاعة المباعة", amount: 200000 },
          { label: "الرواتب والأجور", amount: 150000 },
          { label: "الإيجار", amount: 50000 },
          { label: "المرافق", amount: 30000 },
          { label: "مصاريف أخرى", amount: 70000 },
        ],
        totalExpenses: 500000,
        netProfit: 0,
      };
    }),

  exportReport: publicProcedure
    .input(
      z.object({
        reportType: z.string(),
        format: z.enum(["excel", "pdf"]),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      // Mock export
      return {
        url: `/exports/${input.reportType}.${input.format}`,
        filename: `${input.reportType}_${new Date().toISOString()}.${input.format}`,
      };
    }),
});
