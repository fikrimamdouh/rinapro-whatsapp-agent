import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db/sqlite";

export const installmentsBondsRouter = router({
  getInstallments: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM customerInstallments 
      ORDER BY dueDate ASC
    `);
    return stmt.all();
  }),

  getBonds: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM bonds 
      ORDER BY bondDate DESC
    `);
    return stmt.all();
  }),

  getStats: publicProcedure.query(() => {
    const totalInstallments = db().prepare(`SELECT COUNT(*) as count FROM customerInstallments`).get() as any;
    const totalDue = db().prepare(`SELECT SUM(remainingAmount) as sum FROM customerInstallments WHERE status = 'pending'`).get() as any;
    const totalPaid = db().prepare(`SELECT SUM(paidAmount) as sum FROM customerInstallments`).get() as any;
    const totalBonds = db().prepare(`SELECT COUNT(*) as count FROM bonds`).get() as any;

    return {
      totalInstallments: totalInstallments.count || 0,
      totalDue: totalDue.sum || 0,
      totalPaid: totalPaid.sum || 0,
      totalBonds: totalBonds.count || 0,
    };
  }),

  createInstallment: publicProcedure
    .input(
      z.object({
        customerCode: z.string(),
        customerName: z.string(),
        customerPhone: z.string().optional(),
        totalAmount: z.number(),
        installmentAmount: z.number(),
        dueDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const installmentNumber = `INS-${Date.now()}`;
      const stmt = db().prepare(`
        INSERT INTO customerInstallments (
          installmentNumber, customerCode, customerName, customerPhone,
          totalAmount, paidAmount, remainingAmount, installmentAmount,
          dueDate, status, notes, source
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 'pending', ?, 'manual')
      `);
      
      stmt.run(
        installmentNumber,
        input.customerCode,
        input.customerName,
        input.customerPhone || null,
        input.totalAmount,
        input.totalAmount,
        input.installmentAmount,
        input.dueDate,
        input.notes || null
      );
      
      return { success: true, installmentNumber };
    }),

  createBond: publicProcedure
    .input(
      z.object({
        bondType: z.string(),
        customerCode: z.string().optional(),
        customerName: z.string().optional(),
        amount: z.number(),
        bondDate: z.string(),
        description: z.string().optional(),
        paymentMethod: z.string(),
        referenceNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(({ input }) => {
      const bondNumber = `BND-${Date.now()}`;
      const stmt = db().prepare(`
        INSERT INTO bonds (
          bondNumber, bondType, customerCode, customerName, amount,
          bondDate, description, paymentMethod, referenceNumber,
          status, notes, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 'manual')
      `);
      
      stmt.run(
        bondNumber,
        input.bondType,
        input.customerCode || null,
        input.customerName || null,
        input.amount,
        input.bondDate,
        input.description || null,
        input.paymentMethod,
        input.referenceNumber || null,
        input.notes || null
      );
      
      return { success: true, bondNumber };
    }),

  markInstallmentPaid: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => {
      const stmt = db().prepare(`
        UPDATE customerInstallments 
        SET status = 'paid', 
            paidDate = CURRENT_TIMESTAMP,
            paidAmount = totalAmount,
            remainingAmount = 0
        WHERE id = ?
      `);
      stmt.run(input.id);
      return { success: true };
    }),

  uploadExcel: publicProcedure
    .input(
      z.object({
        fileData: z.string(),
        filename: z.string(),
      })
    )
    .mutation(({ input }) => {
      // Mock implementation - في الواقع سنستخدم مكتبة xlsx
      return { success: true, count: 0, message: "قريباً: رفع Excel" };
    }),

  uploadPDF: publicProcedure
    .input(
      z.object({
        fileData: z.string(),
        filename: z.string(),
      })
    )
    .mutation(({ input }) => {
      // Mock implementation - في الواقع سنحفظ الملف
      return { success: true, message: "قريباً: رفع PDF" };
    }),
});
