import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const accountBalancesRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAccountBalances();
  }),

  getAll: publicProcedure.query(async () => {
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
        data: z.array(z.any()).default([]),
        isFirstBatch: z.boolean().default(true),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        successCount: z.number(),
        totalCount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('📥 AccountBalances Import - Records:', input.data.length, 'First batch:', input.isFirstBatch);
      
      const data = input.data;
      let successCount = 0;
      const totalCount = data.length;
      
      if (totalCount === 0) {
        return {
          success: false,
          successCount: 0,
          totalCount: 0,
        };
      }

      // Only delete all on first batch if explicitly requested
      // Now using INSERT OR REPLACE, so no need to delete
      // Records will be updated automatically based on accountCode
      if (input.isFirstBatch) {
        console.log('🔄 Updating existing records...');
        // No deletion - will update or insert based on accountCode
      }

      for (const [index, item] of data.entries()) {
          try {
            const accountCode = String(item.accountCode || '').trim();
            const accountName = String(item.accountName || accountCode || '').trim();
            
            if (!accountCode && !accountName) {
              console.log(`⏭️ Skip empty row ${index + 1}`);
              continue;
            }
            
            const toHalala = (val: any) => {
              const num = Number(val) || 0;
              return Math.round(num * 100);
            };
            
            await db.createAccountBalance({
              accountCode,
              accountName,
              openingDebitBalance: toHalala(item.openingDebitBalance),
              openingCreditBalance: toHalala(item.openingCreditBalance),
              debitMovement: toHalala(item.debitMovement),
              creditMovement: toHalala(item.creditMovement),
              debitBalance: toHalala(item.debitBalance),
              creditBalance: toHalala(item.creditBalance),
            });
            
            successCount++;
          } catch (error: any) {
            console.error(`❌ Row ${index + 1}:`, error.message);
          }
        }

      console.log(`✅ Imported ${successCount}/${totalCount}`);
      
      return { 
        success: true,
        successCount, 
        totalCount 
      };
    }),

  uploadBatch: publicProcedure
    .input(
      z.object({
        data: z.array(z.any()),
        isFirstBatch: z.boolean(),
        isLastBatch: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`📤 Batch upload: ${input.data.length} rows`);
      
      const toHalala = (value: any) => {
        if (value === null || value === undefined || value === '') return 0;
        const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);
        return isNaN(num) ? 0 : Math.round(num * 100);
      };

      let successCount = 0;
      
      for (const item of input.data) {
        try {
          const accountCode = String(item.accountCode || '').trim();
          const accountName = String(item.accountName || '').trim();
          
          if (!accountCode) continue;
          
          await db.createAccountBalance({
            accountCode,
            accountName,
            openingDebitBalance: toHalala(item.openingDebitBalance),
            openingCreditBalance: toHalala(item.openingCreditBalance),
            debitMovement: toHalala(item.debitMovement),
            creditMovement: toHalala(item.creditMovement),
            debitBalance: toHalala(item.debitBalance),
            creditBalance: toHalala(item.creditBalance),
          });
          
          successCount++;
        } catch (error: any) {
          console.error(`❌ Error:`, error.message);
        }
      }
      
      return { success: true, count: successCount };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    await db.deleteAllAccountBalances();
    return { success: true };
  }),
});
