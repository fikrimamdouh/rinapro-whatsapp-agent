/**
 * Installments Router
 * TRPC procedures for installment management
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const installmentsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getInstallments();
  }),

  getOverdue: publicProcedure.query(async () => {
    return await db.getOverdueInstallments();
  }),

  create: publicProcedure
    .input(
      z.object({
        invoiceId: z.number(),
        customerId: z.number(),
        amount: z.number(),
        dueDate: z.string().or(z.date()),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createInstallment({
        ...input,
        dueDate: new Date(input.dueDate),
        status: "pending",
      });
      return { id, success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.number().optional(),
        dueDate: z.string().or(z.date()).optional(),
        paidDate: z.string().or(z.date()).optional(),
        status: z.enum(["pending", "paid", "overdue"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInstallment(id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidDate: data.paidDate ? new Date(data.paidDate) : undefined,
      });
      return { success: true };
    }),

  markAsPaid: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateInstallment(input.id, {
        status: "paid",
        paidDate: new Date(),
      });
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteInstallment(input.id);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllInstallments();
    return { success: true, message: "تم حذف جميع الأقساط" };
  }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            invoiceId: z.number(),
            customerId: z.number(),
            amount: z.number(),
            dueDate: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      for (const installment of input.data) {
        try {
          await db.createInstallment({
            ...installment,
            dueDate: new Date(installment.dueDate),
            status: "pending",
          });
          successCount++;
        } catch (error) {
          console.error("Error importing installment:", error);
        }
      }
      return { successCount, totalCount: input.data.length };
    }),

  downloadTemplate: publicProcedure.query(() => {
    return {
      headers: ["رقم الفاتورة", "رقم العميل", "المبلغ", "تاريخ الاستحقاق"],
      fields: ["invoiceId", "customerId", "amount", "dueDate"],
    };
  }),
});
