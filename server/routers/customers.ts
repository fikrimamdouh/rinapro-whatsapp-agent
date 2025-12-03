/**
 * Customers Router
 * TRPC procedures for customer management
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const customersRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getCustomers();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await db.searchCustomers(input.query);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getCustomerById(input.id);
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
      const id = await db.createCustomer(input);
      return { id, success: true };
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
      await db.updateCustomer(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCustomer(input.id);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllCustomers();
    return { success: true, message: "تم حذف جميع العملاء" };
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
      for (const customer of input.data) {
        try {
          await db.createCustomer(customer);
          successCount++;
        } catch (error) {
          console.error("Error importing customer:", error);
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
