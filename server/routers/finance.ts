import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db/sqlite";

export const financeRouter = router({
  getPayments: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM payments 
      ORDER BY paymentDate DESC
    `);
    return stmt.all();
  }),

  getReceipts: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM receipts 
      ORDER BY receiptDate DESC
    `);
    return stmt.all();
  }),

  getBankTransactions: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM bankTransactions 
      ORDER BY transactionDate DESC
    `);
    return stmt.all();
  }),

  getChecks: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM checks 
      ORDER BY dueDate ASC
    `);
    return stmt.all();
  }),

  getStats: publicProcedure.query(() => {
    const totalReceipts = db().prepare(`SELECT SUM(amount) as sum FROM receipts WHERE status = 'completed'`).get() as any;
    const totalPayments = db().prepare(`SELECT SUM(amount) as sum FROM payments WHERE status = 'completed'`).get() as any;
    const pendingChecks = db().prepare(`SELECT COUNT(*) as count FROM checks WHERE status = 'pending'`).get() as any;

    const receiptsSum = totalReceipts.sum || 0;
    const paymentsSum = totalPayments.sum || 0;

    return {
      totalReceipts: receiptsSum,
      totalPayments: paymentsSum,
      currentBalance: receiptsSum - paymentsSum,
      pendingChecks: pendingChecks.count || 0,
    };
  }),

  getCashFlow: publicProcedure.query(() => {
    const inflow = db().prepare(`SELECT SUM(amount) as sum FROM receipts WHERE status = 'completed'`).get() as any;
    const outflow = db().prepare(`SELECT SUM(amount) as sum FROM payments WHERE status = 'completed'`).get() as any;

    const inflowSum = inflow.sum || 0;
    const outflowSum = outflow.sum || 0;

    return {
      inflow: inflowSum,
      outflow: outflowSum,
      netFlow: inflowSum - outflowSum,
      byCategory: [
        { name: "المبيعات", amount: inflowSum * 0.8 },
        { name: "الخدمات", amount: inflowSum * 0.2 },
        { name: "المشتريات", amount: -outflowSum * 0.5 },
        { name: "الرواتب", amount: -outflowSum * 0.3 },
        { name: "أخرى", amount: -outflowSum * 0.2 },
      ],
    };
  }),

  reconcileTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      const stmt = db().prepare(`
        UPDATE bankTransactions 
        SET reconciled = 1, reconciledDate = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(input.id);
      return { success: true };
    }),
});
