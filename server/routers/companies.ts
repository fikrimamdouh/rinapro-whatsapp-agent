import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { db } from "../db/sqlite";

export const companiesRouter = router({
  // Get all companies
  list: publicProcedure.query(async () => {
    const database = db();
    const companies = database.prepare(`
      SELECT * FROM companies WHERE isActive = 1 ORDER BY name
    `).all();
    
    return companies;
  }),

  // Get company by ID with branches
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = db();
      
      const company = database.prepare(`
        SELECT * FROM companies WHERE id = ?
      `).get(input.id);
      
      if (!company) {
        throw new Error("Company not found");
      }
      
      const branches = database.prepare(`
        SELECT * FROM branches WHERE companyId = ? ORDER BY name
      `).all(input.id);
      
      return { ...company, branches };
    }),

  // Create company
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      logo: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      welcomeMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = db();
      
      const result = database.prepare(`
        INSERT INTO companies (name, logo, phone, email, address, taxNumber, welcomeMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.name,
        input.logo || null,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.taxNumber || null,
        input.welcomeMessage || null
      );
      
      return { id: result.lastInsertRowid };
    }),

  // Update company
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string(),
      logo: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      taxNumber: z.string().optional(),
      welcomeMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = db();
      
      database.prepare(`
        UPDATE companies 
        SET name = ?, logo = ?, phone = ?, email = ?, address = ?, 
            taxNumber = ?, welcomeMessage = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        input.name,
        input.logo || null,
        input.phone || null,
        input.email || null,
        input.address || null,
        input.taxNumber || null,
        input.welcomeMessage || null,
        input.id
      );
      
      return { success: true };
    }),

  // Delete company
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = db();
      
      // Soft delete
      database.prepare(`
        UPDATE companies SET isActive = 0 WHERE id = ?
      `).run(input.id);
      
      return { success: true };
    }),
});
