/**
 * Balances Router
 * TRPC procedures for account balances
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import * as XLSX from "xlsx";

export const balancesRouter = router({
  listAccountBalances: publicProcedure.query(async () => {
    return await db.getAccountBalances();
  }),

  importAccountBalances: publicProcedure
    .input(
      z.object({
        fileBase64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const balances: db.schema.InsertAccountBalance[] = [];
        const errors: string[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i] as Record<string, unknown>;
          try {
            balances.push({
              accountCode: String(row["رقم الحساب"] || row["accountCode"] || ""),
              accountName: String(row["اسم الحساب"] || row["accountName"] || ""),
              openingDebitBalance: Number(row["أول المدة مدين"] || row["openingDebitBalance"] || 0) * 100,
              openingCreditBalance: Number(row["أول المدة دائن"] || row["openingCreditBalance"] || 0) * 100,
              debitMovement: Number(row["الحركة المدينة"] || row["debitMovement"] || 0) * 100,
              creditMovement: Number(row["الحركة الدائنة"] || row["creditMovement"] || 0) * 100,
              debitBalance: Number(row["الرصيد المدين"] || row["debitBalance"] || 0) * 100,
              creditBalance: Number(row["الرصيد الدائن"] || row["creditBalance"] || 0) * 100,
            });
          } catch (error) {
            errors.push(`خطأ في الصف ${i + 2}: ${String(error)}`);
          }
        }

        const result = await db.importAccountBalances(balances);

        return {
          success: true,
          message: `تم استيراد ${result.success} حساب بنجاح`,
          imported: result.success,
          failed: result.failed,
          errors,
        };
      } catch (error) {
        return {
          success: false,
          message: `فشل الاستيراد: ${String(error)}`,
          imported: 0,
          failed: 0,
          errors: [String(error)],
        };
      }
    }),
});
