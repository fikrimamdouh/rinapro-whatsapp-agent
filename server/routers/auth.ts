/**
 * Auth Router
 * TRPC procedures for authentication
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { COOKIE_NAME } from "@shared/const";

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user || null;
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.res) {
      ctx.res.clearCookie(COOKIE_NAME);
    }
    return { success: true };
  }),

  getSession: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      isAuthenticated: true,
    };
  }),
});
