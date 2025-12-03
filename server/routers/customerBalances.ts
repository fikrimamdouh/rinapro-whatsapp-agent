import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const customerBalancesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getCustomerBalances();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await db.searchCustomerBalances(input.query);
    }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            customerCode: z.union([z.string(), z.number()]).transform(v => String(v)),
            customerName: z.string().optional(),
            previousBalance: z.number().optional().default(0),
            debit: z.number().optional().default(0),
            credit: z.number().optional().default(0),
            currentBalance: z.number().optional().default(0),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      const totalCount = input.data.length;

      await db.deleteAllCustomerBalances();

      for (const item of input.data) {
        try {
          if (!item.customerCode && !item.customerName) continue;
          
          const toHalala = (val: number) => Math.round((val || 0) * 100);
          
          await db.createCustomerBalance({
            customerCode: String(item.customerCode || ""),
            customerName: item.customerName || String(item.customerCode || ""),
            previousBalance: toHalala(item.previousBalance || 0),
            debit: toHalala(item.debit || 0),
            credit: toHalala(item.credit || 0),
            currentBalance: toHalala(item.currentBalance || 0),
          });
          successCount++;
        } catch (error) {
          console.error("Error importing customer balance:", error);
        }
      }

      return { successCount, totalCount };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllCustomerBalances();
    return { success: true };
  }),
});
