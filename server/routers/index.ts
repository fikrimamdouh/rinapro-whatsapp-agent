/**
 * Main Router
 * Combines all TRPC routers into a single appRouter
 */

import { router } from "../_core/trpc";
import { systemRouter } from "./system";
import { agentRouter } from "./agent";
import { whatsappRouter } from "./whatsapp";
import { customersRouter } from "./customers";
import { invoicesRouter } from "./invoices";
import { suppliersRouter } from "./suppliers";
import { installmentsRouter } from "./installments";
import { settingsRouter } from "./settings";
import { authRouter } from "./auth";
import { balancesRouter } from "./balances";
import { accountsRouter } from "./accounts";
import { customerBalancesRouter } from "./customerBalances";
import { accountBalancesRouter } from "./accountBalances";
import { uploadsRouter } from "./uploads";
import { purchasesRouter } from "./purchases";
import { maintenanceRouter } from "./maintenance";
import { logisticsRouter } from "./logistics";
import { aiRouter } from "./ai";
import { reportsRouter } from "./reports";
import { financeRouter } from "./finance";
import { installmentsBondsRouter } from "./installmentsBonds";

export const appRouter = router({
  system: systemRouter,
  agent: agentRouter,
  whatsapp: whatsappRouter,
  customers: customersRouter,
  invoices: invoicesRouter,
  suppliers: suppliersRouter,
  installments: installmentsRouter,
  settings: settingsRouter,
  auth: authRouter,
  balances: balancesRouter,
  accounts: accountsRouter,
  customerBalances: customerBalancesRouter,
  accountBalances: accountBalancesRouter,
  uploads: uploadsRouter,
  purchases: purchasesRouter,
  maintenance: maintenanceRouter,
  logistics: logisticsRouter,
  ai: aiRouter,
  reports: reportsRouter,
  finance: financeRouter,
  installmentsBonds: installmentsBondsRouter,
});

export type AppRouter = typeof appRouter;
