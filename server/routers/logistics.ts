import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getSQLiteDb } from "../db/sqlite";

export const logisticsRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getSQLiteDb();
    const logistics = await db.all(`
      SELECT * FROM logistics 
      ORDER BY date DESC 
      LIMIT 100
    `);
    return logistics || [];
  }),

  create: publicProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        driverId: z.string().optional(),
        route: z.string(),
        distance: z.number().optional(),
        fuelCost: z.number().optional(),
        date: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getSQLiteDb();
      const result = await db.run(
        `INSERT INTO logistics (vehicle_id, driver_id, route, distance, fuel_cost, date, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          input.vehicleId,
          input.driverId || null,
          input.route,
          input.distance || 0,
          input.fuelCost || 0,
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
      await db.run(`DELETE FROM logistics WHERE id = ?`, [input.id]);
      return { success: true };
    }),

  deleteAll: publicProcedure.mutation(async () => {
    const db = await getSQLiteDb();
    await db.run(`DELETE FROM logistics`);
    return { success: true };
  }),
});
