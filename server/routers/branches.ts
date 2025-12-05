import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { db } from "../db/sqlite";

export const branchesRouter = router({
  // Get all branches
  list: publicProcedure.query(async () => {
    const database = db();
    const branches = database.prepare(`
      SELECT * FROM branches WHERE isActive = 1 ORDER BY name
    `).all();
    
    return branches;
  }),

  // Get branches by company ID
  getByCompanyId: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const database = db();
      
      const branches = database.prepare(`
        SELECT * FROM branches WHERE companyId = ? AND isActive = 1 ORDER BY name
      `).all(input.companyId);
      
      return branches;
    }),

  // Create branch
  create: publicProcedure
    .input(z.object({
      companyId: z.number(),
      name: z.string(),
      code: z.string(),
      phone: z.string().optional(),
      address: z.string().optional(),
      whatsappGroupId: z.string().optional(),
      whatsappGroupName: z.string().optional(),
      managerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = db();
      
      const result = database.prepare(`
        INSERT INTO branches (companyId, name, code, phone, address, whatsappGroupId, whatsappGroupName, managerPhone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.companyId,
        input.name,
        input.code,
        input.phone || null,
        input.address || null,
        input.whatsappGroupId || null,
        input.whatsappGroupName || null,
        input.managerPhone || null
      );
      
      return { id: result.lastInsertRowid };
    }),

  // Update branch
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
      phone: z.string().optional(),
      address: z.string().optional(),
      whatsappGroupId: z.string().optional(),
      whatsappGroupName: z.string().optional(),
      managerPhone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = db();
      
      database.prepare(`
        UPDATE branches 
        SET name = ?, code = ?, phone = ?, address = ?, 
            whatsappGroupId = ?, whatsappGroupName = ?, managerPhone = ?, 
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        input.name,
        input.code,
        input.phone || null,
        input.address || null,
        input.whatsappGroupId || null,
        input.whatsappGroupName || null,
        input.managerPhone || null,
        input.id
      );
      
      return { success: true };
    }),

  // Delete branch
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = db();
      
      // Soft delete
      database.prepare(`
        UPDATE branches SET isActive = 0 WHERE id = ?
      `).run(input.id);
      
      return { success: true };
    }),
});
