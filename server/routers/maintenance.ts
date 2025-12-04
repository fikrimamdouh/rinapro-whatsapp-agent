import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { db } from "../db/sqlite";

export const maintenanceRouter = router({
  getRequests: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM maintenanceRequests 
      ORDER BY createdAt DESC
    `);
    return stmt.all();
  }),

  getTechnicians: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM technicians 
      WHERE status = 'active'
      ORDER BY name ASC
    `);
    return stmt.all();
  }),

  getSpareParts: publicProcedure.query(() => {
    const stmt = db().prepare(`
      SELECT * FROM spareParts 
      ORDER BY partName ASC
    `);
    return stmt.all();
  }),

  getStats: publicProcedure.query(() => {
    const totalRequests = db().prepare(`SELECT COUNT(*) as count FROM maintenanceRequests`).get() as any;
    const inProgress = db().prepare(`SELECT COUNT(*) as count FROM maintenanceRequests WHERE status = 'in_progress'`).get() as any;
    const completed = db().prepare(`SELECT COUNT(*) as count FROM maintenanceRequests WHERE status = 'completed'`).get() as any;
    const totalCost = db().prepare(`SELECT SUM(actualCost) as sum FROM maintenanceRequests WHERE actualCost > 0`).get() as any;

    return {
      totalRequests: totalRequests.count || 0,
      inProgress: inProgress.count || 0,
      completed: completed.count || 0,
      totalCost: totalCost.sum || 0,
    };
  }),

  updateRequestStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(({ input }) => {
      const stmt = db().prepare(`
        UPDATE maintenanceRequests 
        SET status = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(input.status, input.id);
      return { success: true };
    }),
});
