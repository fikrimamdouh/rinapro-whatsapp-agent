import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const accountsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAccounts();
  }),

  create: publicProcedure
    .input(
      z.object({
        code: z.string().min(1, "رمز الحساب مطلوب"),
        name: z.string().min(1, "اسم الحساب مطلوب"),
        type: z.enum(["asset", "liability", "equity", "revenue", "expense"]).default("asset"),
        parentId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createAccount(input);
      return { id, success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        type: z.enum(["asset", "liability", "equity", "revenue", "expense"]).optional(),
        parentId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAccount(id, data);
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAccount(input.id);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllAccounts();
    return { success: true, message: "تم حذف جميع الحسابات" };
  }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            code: z.string(),
            name: z.string(),
            type: z.string().optional(),
            parentId: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      for (const account of input.data) {
        try {
          await db.createAccount(account);
          successCount++;
        } catch (error) {
          console.error("Error importing account:", error);
        }
      }
      return { successCount, totalCount: input.data.length };
    }),

  downloadTemplate: publicProcedure.query(() => {
    return {
      headers: ["رمز الحساب", "اسم الحساب", "النوع", "الحساب الأب"],
      fields: ["code", "name", "type", "parentId"],
    };
  }),
});
