/**
 * Browser Automation Module
 * وحدة التحكم في المتصفح
 */

import { chromium, Browser, BrowserContext, Page } from "playwright";
import type { AgentConfig } from "./agent.config";

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * تشغيل المتصفح
   */
  async launch(): Promise<void> {
    console.log("[Agent Browser] Launching browser...");

    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    this.context = await this.browser.newContext({
      viewport: this.config.browser.viewport,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    this.page = await this.context.newPage();

    // تعيين timeout افتراضي
    this.page.setDefaultTimeout(this.config.browser.timeout);

    console.log("[Agent Browser] Browser launched successfully");
  }

  /**
   * الانتقال إلى صفحة
   */
  async goto(url: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    console.log(`[Agent Browser] Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  /**
   * الحصول على الصفحة الحالية
   */
  getPage(): Page {
    if (!this.page) {
      throw new Error("Browser not launched");
    }
    return this.page;
  }

  /**
   * أخذ لقطة شاشة
   */
  async screenshot(path: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    await this.page.screenshot({ path, fullPage: true });
    console.log(`[Agent Browser] Screenshot saved: ${path}`);
  }

  /**
   * تنفيذ JavaScript
   */
  async evaluate<T>(fn: () => T): Promise<T> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    return await this.page.evaluate(fn);
  }

  /**
   * الانتظار لمدة معينة
   */
  async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * الانتظار حتى ظهور عنصر
   */
  async waitForSelector(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * النقر على عنصر
   */
  async click(selector: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    await this.page.click(selector);
  }

  /**
   * كتابة نص في حقل
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    await this.page.fill(selector, text);
  }

  /**
   * الحصول على نص من عنصر
   */
  async getText(selector: string): Promise<string> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    return (await element.textContent()) || "";
  }

  /**
   * الحصول على HTML من الصفحة
   */
  async getHTML(): Promise<string> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    return await this.page.content();
  }

  /**
   * إغلاق المتصفح
   */
  async close(): Promise<void> {
    console.log("[Agent Browser] Closing browser...");

    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    console.log("[Agent Browser] Browser closed");
  }

  /**
   * التحقق من حالة المتصفح
   */
  isRunning(): boolean {
    return this.browser !== null && this.page !== null;
  }
}
