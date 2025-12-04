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

  // Initialize WhatsApp in background (don't block server startup)
  console.log("[Startup] WhatsApp will initialize in background...");
  
  // Run WhatsApp initialization asynchronously
  setTimeout(async () => {
    try {
      console.log("[Startup] Initializing WhatsApp...");
      
      whatsappService.on("connected", () => {
        console.log("[Startup] WhatsApp connected successfully");
      });

      whatsappService.on("disconnected", () => {
        console.log("[Startup] WhatsApp disconnected");
      });

      whatsappService.on("qr", (qr: string) => {
        console.log("[Startup] WhatsApp QR code generated");
        console.log("[QR] Scan this QR code with WhatsApp:");
        console.log(qr);
      });

      await whatsappService.initialize();
      console.log("[Startup] WhatsApp service initialized");
    } catch (error) {
      console.error("[Startup] WhatsApp initialization failed:", error);
      console.log("[Startup] WhatsApp will retry connection...");
    }
  }, 1000); // Start after 1 second

  console.log("[Startup] RinaPro ERP started successfully!");
}
