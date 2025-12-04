import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db/sqlite";

export const logisticsRouter = router({
  getShipments: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM shipments 
      ORDER BY createdAt DESC
    `);
    return stmt.all();
  }),

  getDrivers: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM drivers 
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    return stmt.all();
  }),

  getVehicles: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM vehicles 
      ORDER BY plateNumber ASC
    `);
    return stmt.all();
  }),

  getStats: publicProcedure.query(() => {
    const totalShipments = db().prepare(`SELECT COUNT(*) as count FROM shipments`).get() as any;
    const inTransit = db().prepare(`SELECT COUNT(*) as count FROM shipments WHERE status = 'in_transit'`).get() as any;
    const delivered = db().prepare(`SELECT COUNT(*) as count FROM shipments WHERE status = 'delivered'`).get() as any;
    const totalCost = db().prepare(`SELECT SUM(totalCost) as sum FROM shipments`).get() as any;

    return {
      totalShipments: totalShipments.count || 0,
      inTransit: inTransit.count || 0,
      delivered: delivered.count || 0,
      totalCost: totalCost.sum || 0,
    };
  }),

  updateShipmentStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
      })
    )
    .mutation(({ input }) => {
      const stmt = db().prepare(`
        UPDATE shipments 
        SET status = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(input.status, input.id);
      return { success: true };
    }),
});
