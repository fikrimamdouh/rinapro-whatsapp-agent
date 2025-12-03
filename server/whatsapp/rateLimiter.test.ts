/**
 * Rate Limiter Tests
 * Manual test file to verify memory leak fix
 */

import { RateLimiter } from "./rateLimiter";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMemoryLeak() {
  console.log("\n=== Testing Rate Limiter Memory Leak Fix ===\n");
  
  const limiter = RateLimiter.getInstance();
  limiter.clear();
  
  console.log("Initial entry count:", limiter.getEntryCount());
  
  // Simulate 100 different users sending messages
  console.log("\nSimulating 100 users sending messages...");
  for (let i = 0; i < 100; i++) {
    const jid = `user${i}@s.whatsapp.net`;
    limiter.recordSent(jid);
  }
  
  console.log("Entry count after 100 users:", limiter.getEntryCount());
  console.log("Expected: ~300 entries (3 time windows per user)");
  
  // Wait for entries to expire (1 minute + buffer)
  console.log("\nWaiting 65 seconds for minute-window entries to expire...");
  await sleep(65000);
  
  // Trigger cleanup by checking a new user
  limiter.canSend("trigger@s.whatsapp.net");
  
  console.log("Entry count after 65 seconds:", limiter.getEntryCount());
  console.log("Expected: ~200 entries (minute entries should be cleaned up)");
  
  // Wait for hour entries to expire (would take 1 hour in real scenario)
  console.log("\nNote: Full cleanup would occur after entries expire.");
  console.log("Cleanup runs automatically every 5 minutes.");
  
  limiter.stopCleanup();
  console.log("\n=== Test Complete ===\n");
}

async function testRateLimitFunctionality() {
  console.log("\n=== Testing Rate Limit Functionality ===\n");
  
  const limiter = RateLimiter.getInstance();
  limiter.clear();
  limiter.configure({
    maxMessagesPerMinute: 3,
    maxMessagesPerHour: 10,
    maxMessagesPerDay: 20,
  });
  
  const testJid = "test@s.whatsapp.net";
  
  // Test minute limit
  console.log("Testing minute limit (max 3)...");
  for (let i = 1; i <= 5; i++) {
    const result = limiter.canSend(testJid);
    console.log(`  Attempt ${i}: ${result.allowed ? "✅ Allowed" : "❌ Blocked - " + result.reason}`);
    if (result.allowed) {
      limiter.recordSent(testJid);
    }
  }
  
  // Check stats
  const stats = limiter.getStats(testJid);
  console.log("\nCurrent stats:", stats);
  console.log("Expected: minute=3, hour=3, day=3");
  
  limiter.stopCleanup();
  console.log("\n=== Test Complete ===\n");
}

async function testCleanupPreventsMemoryLeak() {
  console.log("\n=== Testing Cleanup Prevents Memory Leak ===\n");
  
  const limiter = RateLimiter.getInstance();
  limiter.clear();
  
  console.log("Creating 1000 entries with short expiry...");
  const startCount = limiter.getEntryCount();
  
  // Create many entries
  for (let i = 0; i < 1000; i++) {
    limiter.recordSent(`user${i}@s.whatsapp.net`);
  }
  
  const afterCreation = limiter.getEntryCount();
  console.log(`Entries after creation: ${afterCreation}`);
  
  // Wait for minute entries to expire
  console.log("Waiting 65 seconds for cleanup...");
  await sleep(65000);
  
  // Trigger cleanup
  limiter.canSend("trigger@s.whatsapp.net");
  
  const afterCleanup = limiter.getEntryCount();
  console.log(`Entries after cleanup: ${afterCleanup}`);
  console.log(`Cleaned up: ${afterCreation - afterCleanup} entries`);
  console.log(`Memory saved: ~${((afterCreation - afterCleanup) * 32 / 1024).toFixed(2)} KB`);
  
  limiter.stopCleanup();
  console.log("\n=== Test Complete ===\n");
}

// Run tests if executed directly
if (require.main === module) {
  (async () => {
    try {
      await testRateLimitFunctionality();
      // Uncomment to run memory leak tests (they take time)
      // await testMemoryLeak();
      // await testCleanupPreventsMemoryLeak();
    } catch (error) {
      console.error("Test failed:", error);
      process.exit(1);
    }
  })();
}

export { testMemoryLeak, testRateLimitFunctionality, testCleanupPreventsMemoryLeak };
