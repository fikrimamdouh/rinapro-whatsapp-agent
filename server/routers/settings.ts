/**
 * Settings Router
 * TRPC procedures for system settings
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const settingsRouter = router({
  list: publicProcedure.query(async () => {
    return await db.getAllSettings();
  }),

  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const value = await db.getSetting(input.key);
      return value ? { key: input.key, value } : null;
    }),

  set: publicProcedure
    .input(
      z.object({
        key: z.string().min(1, "المفتاح مطلوب"),
        value: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.setSetting(input.key, input.value, input.description);
      return { success: true };
    }),
});
