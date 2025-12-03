/**
 * Invoices Router
 * TRPC procedures for invoice management
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const invoicesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getInvoices();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getInvoiceById(input.id);
    }),

  create: publicProcedure
    .input(
      z.object({
        invoiceNumber: z.string().min(1, "رقم الفاتورة مطلوب"),
        customerId: z.number(),
        invoiceDate: z.string().or(z.date()),
        totalAmount: z.number(),
        paidAmount: z.number().default(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const remainingAmount = input.totalAmount - input.paidAmount;
      const status = remainingAmount === 0 ? "paid" : input.paidAmount > 0 ? "partial" : "unpaid";
      
      const id = await db.createInvoice({
        ...input,
        invoiceDate: new Date(input.invoiceDate),
        remainingAmount,
        status,
      });
      return { id, success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        invoiceNumber: z.string().optional(),
        customerId: z.number().optional(),
        invoiceDate: z.string().or(z.date()).optional(),
        totalAmount: z.number().optional(),
        paidAmount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      const current = await db.getInvoiceById(id);
      if (!current) throw new Error("الفاتورة غير موجودة");

      const totalAmount = data.totalAmount ?? current.totalAmount;
      const paidAmount = data.paidAmount ?? current.paidAmount;
      const remainingAmount = totalAmount - paidAmount;
      const status = remainingAmount === 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid";

      await db.updateInvoice(id, {
        ...data,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        remainingAmount,
        status,
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteInvoice(input.id);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllInvoices();
    return { success: true, message: "تم حذف جميع الفواتير" };
  }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            invoiceNumber: z.string(),
            customerId: z.number(),
            invoiceDate: z.string(),
            totalAmount: z.number(),
            paidAmount: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      for (const invoice of input.data) {
        try {
          const paidAmount = invoice.paidAmount || 0;
          const remainingAmount = invoice.totalAmount - paidAmount;
          const status = remainingAmount === 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid";
          
          await db.createInvoice({
            ...invoice,
            invoiceDate: new Date(invoice.invoiceDate),
            paidAmount,
            remainingAmount,
            status,
          });
          successCount++;
        } catch (error) {
          console.error("Error importing invoice:", error);
        }
      }
      return { successCount, totalCount: input.data.length };
    }),

  downloadTemplate: publicProcedure.query(() => {
    return {
      headers: ["رقم الفاتورة", "رقم العميل", "التاريخ", "المبلغ الإجمالي", "المبلغ المدفوع"],
      fields: ["invoiceNumber", "customerId", "invoiceDate", "totalAmount", "paidAmount"],
    };
  }),
});
