/**
 * Suppliers Router
 * TRPC procedures for supplier management
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const suppliersRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getSuppliers();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await db.searchSuppliers(input.query);
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "الاسم مطلوب"),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createSupplier(input);
      return { id, success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteSupplier(input.id);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllSuppliers();
    return { success: true, message: "تم حذف جميع الموردين" };
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getSupplierById(input.id);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateSupplier(id, data);
      return { success: true };
    }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            name: z.string(),
            phone: z.string().optional(),
            email: z.string().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      for (const supplier of input.data) {
        try {
          await db.createSupplier(supplier);
          successCount++;
        } catch (error) {
          console.error("Error importing supplier:", error);
        }
      }
      return { successCount, totalCount: input.data.length };
    }),

  downloadTemplate: publicProcedure.query(() => {
    return {
      headers: ["الاسم", "الهاتف", "البريد الإلكتروني", "العنوان", "المدينة"],
      fields: ["name", "phone", "email", "address", "city"],
    };
  }),
});
