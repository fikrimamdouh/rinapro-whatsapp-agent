import { drizzle } from "drizzle-orm/mysql2";
import { customers } from "../drizzle/schema";

async function clearOldCustomers() {
  console.log("[Clear] Starting to clear old customers...");
  
  const db = drizzle(process.env.DATABASE_URL!);
  
  // حذف جميع العملاء
  await db.delete(customers);
  
  console.log("[Clear] ✅ All old customers deleted successfully!");
}

clearOldCustomers().catch(console.error);
