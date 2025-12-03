/**
 * Data Fetcher Module
 * وحدة سحب البيانات
 */

import type { BrowserManager } from "./browser";
import type { AgentConfig } from "./agent.config";
import type { LoginManager } from "./login";

export interface FetchedData {
  customers: any[];
  invoices: any[];
  payments: any[];
  products: any[];
  timestamp: Date;
}

export class DataFetcher {
  private browser: BrowserManager;
  private config: AgentConfig;
  private loginManager: LoginManager;

  constructor(
    browser: BrowserManager,
    config: AgentConfig,
    loginManager: LoginManager
  ) {
    this.browser = browser;
    this.config = config;
    this.loginManager = loginManager;
  }

  /**
   * سحب جميع البيانات
   */
  async fetchAll(): Promise<FetchedData> {
    console.log("[Agent Fetcher] Starting data fetch...");

    // التأكد من تسجيل الدخول
    await this.loginManager.ensureLoggedIn();

    const data: FetchedData = {
      customers: [],
      invoices: [],
      payments: [],
      products: [],
      timestamp: new Date(),
    };

    try {
      // سحب العملاء
      if (this.config.sync.syncCustomers) {
        console.log("[Agent Fetcher] Fetching customers...");
        data.customers = await this.fetchCustomers();
        console.log(`[Agent Fetcher] Fetched ${data.customers.length} customers`);
      }

      // سحب الفواتير
      if (this.config.sync.syncInvoices) {
        console.log("[Agent Fetcher] Fetching invoices...");
        data.invoices = await this.fetchInvoices();
        console.log(`[Agent Fetcher] Fetched ${data.invoices.length} invoices`);
      }

      // سحب المدفوعات
      if (this.config.sync.syncPayments) {
        console.log("[Agent Fetcher] Fetching payments...");
        data.payments = await this.fetchPayments();
        console.log(`[Agent Fetcher] Fetched ${data.payments.length} payments`);
      }

      // سحب المنتجات
      if (this.config.sync.syncProducts) {
        console.log("[Agent Fetcher] Fetching products...");
        data.products = await this.fetchProducts();
        console.log(`[Agent Fetcher] Fetched ${data.products.length} products`);
      }

      console.log("[Agent Fetcher] Data fetch completed successfully");
      return data;
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching data:", error);
      throw error;
    }
  }

  /**
   * سحب العملاء
   */
  private async fetchCustomers(): Promise<any[]> {
    try {
      // الانتقال إلى صفحة العملاء
      await this.browser.goto(`${this.config.targetSite.url}/customers`);
      await this.browser.wait(2000);

      const page = this.browser.getPage();

      // محاولة استخراج البيانات من جدول
      const customers = await page.evaluate(() => {
        const rows = document.querySelectorAll("table tbody tr");
        const data: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 0) {
            data.push({
              name: cells[0]?.textContent?.trim() || "",
              phone: cells[1]?.textContent?.trim() || "",
              email: cells[2]?.textContent?.trim() || "",
              address: cells[3]?.textContent?.trim() || "",
              balance: cells[4]?.textContent?.trim() || "0",
            });
          }
        });

        return data;
      });

      return customers;
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching customers:", error);
      return [];
    }
  }

  /**
   * سحب الفواتير
   */
  private async fetchInvoices(): Promise<any[]> {
    try {
      // الانتقال إلى صفحة الفواتير
      await this.browser.goto(`${this.config.targetSite.url}/invoices`);
      await this.browser.wait(2000);

      const page = this.browser.getPage();

      // محاولة استخراج البيانات من جدول
      const invoices = await page.evaluate(() => {
        const rows = document.querySelectorAll("table tbody tr");
        const data: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 0) {
            data.push({
              invoiceNumber: cells[0]?.textContent?.trim() || "",
              customerName: cells[1]?.textContent?.trim() || "",
              date: cells[2]?.textContent?.trim() || "",
              amount: cells[3]?.textContent?.trim() || "0",
              status: cells[4]?.textContent?.trim() || "",
            });
          }
        });

        return data;
      });

      return invoices;
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching invoices:", error);
      return [];
    }
  }

  /**
   * سحب المدفوعات
   */
  private async fetchPayments(): Promise<any[]> {
    try {
      // الانتقال إلى صفحة المدفوعات
      await this.browser.goto(`${this.config.targetSite.url}/payments`);
      await this.browser.wait(2000);

      const page = this.browser.getPage();

      // محاولة استخراج البيانات من جدول
      const payments = await page.evaluate(() => {
        const rows = document.querySelectorAll("table tbody tr");
        const data: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 0) {
            data.push({
              paymentId: cells[0]?.textContent?.trim() || "",
              customerName: cells[1]?.textContent?.trim() || "",
              date: cells[2]?.textContent?.trim() || "",
              amount: cells[3]?.textContent?.trim() || "0",
              method: cells[4]?.textContent?.trim() || "",
            });
          }
        });

        return data;
      });

      return payments;
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching payments:", error);
      return [];
    }
  }

  /**
   * سحب المنتجات
   */
  private async fetchProducts(): Promise<any[]> {
    try {
      // الانتقال إلى صفحة المنتجات
      await this.browser.goto(`${this.config.targetSite.url}/products`);
      await this.browser.wait(2000);

      const page = this.browser.getPage();

      // محاولة استخراج البيانات من جدول
      const products = await page.evaluate(() => {
        const rows = document.querySelectorAll("table tbody tr");
        const data: any[] = [];

        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 0) {
            data.push({
              productCode: cells[0]?.textContent?.trim() || "",
              name: cells[1]?.textContent?.trim() || "",
              price: cells[2]?.textContent?.trim() || "0",
              quantity: cells[3]?.textContent?.trim() || "0",
              category: cells[4]?.textContent?.trim() || "",
            });
          }
        });

        return data;
      });

      return products;
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching products:", error);
      return [];
    }
  }

  /**
   * سحب تقرير مخصص
   */
  async fetchCustomReport(url: string): Promise<any> {
    try {
      await this.browser.goto(url);
      await this.browser.wait(2000);

      const html = await this.browser.getHTML();
      return { html, url, timestamp: new Date() };
    } catch (error) {
      console.error("[Agent Fetcher] Error fetching custom report:", error);
      return null;
    }
  }
}
