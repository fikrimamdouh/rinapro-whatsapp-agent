import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getSQLiteDb } from "../db/sqlite";

export const maintenanceRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getSQLiteDb();
    const maintenance = await db.all(`
      SELECT * FROM maintenance 
      ORDER BY date DESC 
      LIMIT 100
    `);
    return maintenance || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        type: z.string(),
        description: z.string(),
        cost: z.number(),
        date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getSQLiteDb();
      const result = await db.run(
        `INSERT INTO maintenance (vehicle_id, type, description, cost, date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          input.vehicleId,
          input.type,
          input.description,
          input.cost,
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
      await db.run(`DELETE FROM maintenance WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    const db = await getSQLiteDb();
    await db.run(`DELETE FROM maintenance`);
    return { success: true };
  }),
});
