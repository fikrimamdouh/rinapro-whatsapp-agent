import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const accountBalancesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAccountBalances();
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input }) => {
      return await db.searchAccountBalances(input.query);
    }),

  importFromExcel: publicProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            accountCode: z.union([z.string(), z.number()]).transform(v => String(v)),
            accountName: z.string().optional(),
            openingDebitBalance: z.number().optional().default(0),
            openingCreditBalance: z.number().optional().default(0),
            debitMovement: z.number().optional().default(0),
            creditMovement: z.number().optional().default(0),
            debitBalance: z.number().optional().default(0),
            creditBalance: z.number().optional().default(0),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      let successCount = 0;
      const totalCount = input.data.length;

      await db.deleteAllAccountBalances();

      for (const item of input.data) {
        try {
          if (!item.accountCode && !item.accountName) continue;
          
          const toHalala = (val: number) => Math.round((val || 0) * 100);
          
          await db.createAccountBalance({
            accountCode: String(item.accountCode || ""),
            accountName: item.accountName || String(item.accountCode || ""),
            openingDebitBalance: toHalala(item.openingDebitBalance || 0),
            openingCreditBalance: toHalala(item.openingCreditBalance || 0),
            debitMovement: toHalala(item.debitMovement || 0),
            creditMovement: toHalala(item.creditMovement || 0),
            debitBalance: toHalala(item.debitBalance || 0),
            creditBalance: toHalala(item.creditBalance || 0),
          });
          successCount++;
        } catch (error) {
          console.error("Error importing account balance:", error);
        }
      }

      return { successCount, totalCount };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllAccountBalances();
    return { success: true };
  }),
});
