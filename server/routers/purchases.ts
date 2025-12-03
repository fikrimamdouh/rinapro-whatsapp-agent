import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getSQLiteDb } from "../db/sqlite";

export const purchasesRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getSQLiteDb();
    const purchases = await db.all(`
      SELECT * FROM purchases 
      ORDER BY date DESC 
      LIMIT 100
    `);
    return purchases || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        supplierId: z.number().optional(),
        supplierName: z.string(),
        items: z.array(z.any()),
        total: z.number(),
        date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getSQLiteDb();
      const result = await db.run(
        `INSERT INTO purchases (supplier_id, supplier_name, items, total, date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          input.supplierId || null,
          input.supplierName,
          JSON.stringify(input.items),
          input.total,
          input.date,
          input.notes || '',
        ]
      );
      return { id: result.lastID, success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getSQLiteDb();
      await db.run(`DELETE FROM purchases WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    const db = await getSQLiteDb();
    await db.run(`DELETE FROM purchases`);
    return { success: true };
  }),
});
