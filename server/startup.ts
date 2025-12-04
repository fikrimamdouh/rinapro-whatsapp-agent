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
    
    // Seed sample data for new tables
    seedNewTables();
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

  // WhatsApp temporarily disabled due to connection issues
  // Will be replaced with WhatsApp Business API
  console.log("[Startup] WhatsApp service disabled (pending Business API setup)");

  console.log("[Startup] RinaPro ERP started successfully!");
}
