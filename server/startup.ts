/**
 * Server Startup
 * Initializes all services on server start
 */

import { initDatabase } from "./db";
import { whatsappService } from "./whatsapp/whatsappService";
import { initEvents } from "./events/initEvents";
import { seedNewTables } from "./db/seedData";

export async function startup(): Promise<void> {
  console.log("[Startup] Initializing RinaPro ERP...");

  try {
    console.log("[Startup] Connecting to database...");
    await initDatabase();
    console.log("[Startup] Database initialized");
    
    // Seed data disabled - using real data only
    // seedNewTables();
  } catch (error) {
    console.error("[Startup] Database initialization failed:", error);
  }

  try {
    console.log("[Startup] Initializing event system...");
    await initEvents();
    console.log("[Startup] Event system initialized");
  } catch (error) {
    console.error("[Startup] Event system initialization failed:", error);
  }

  // WhatsApp disabled temporarily due to Railway compatibility issues
  // Baileys library has known Error 405 issues on Railway platform
  // To enable WhatsApp, use WhatsApp Business API or deploy on different platform
  console.log("[Startup] ⚠️  WhatsApp integration disabled (Railway compatibility issue)");
  console.log("[Startup] ℹ️  Use WhatsApp Business API for production deployment");

  console.log("[Startup] RinaPro ERP started successfully!");
}
