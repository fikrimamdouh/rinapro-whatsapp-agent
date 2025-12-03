/**
 * Auto-Login Module
 * وحدة تسجيل الدخول التلقائي
 */

import type { BrowserManager } from "./browser";
import type { AgentConfig } from "./agent.config";

export class LoginManager {
  private browser: BrowserManager;
  private config: AgentConfig;
  private isLoggedIn = false;

  constructor(browser: BrowserManager, config: AgentConfig) {
    this.browser = browser;
    this.config = config;
  }

  /**
   * تسجيل الدخول التلقائي
   */
  async login(): Promise<boolean> {
    try {
      console.log("[Agent Login] Starting auto-login...");

      // الانتقال إلى صفحة تسجيل الدخول
      await this.browser.goto(this.config.targetSite.loginUrl);
      await this.browser.wait(2000);

      // البحث عن حقول تسجيل الدخول
      const page = this.browser.getPage();

      // محاولة العثور على حقل اسم المستخدم
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[type="text"]',
        'input[id="username"]',
        'input[id="email"]',
        '#username',
        '#email',
      ];

      let usernameField = null;
      for (const selector of usernameSelectors) {
        try {
          usernameField = await page.$(selector);
          if (usernameField) {
            console.log(`[Agent Login] Found username field: ${selector}`);
            break;
          }
        } catch (e) {
          // تجاهل الخطأ والمحاولة التالية
        }
      }

      if (!usernameField) {
        throw new Error("Username field not found");
      }

      // محاولة العثور على حقل كلمة المرور
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[id="password"]',
        '#password',
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          passwordField = await page.$(selector);
          if (passwordField) {
            console.log(`[Agent Login] Found password field: ${selector}`);
            break;
          }
        } catch (e) {
          // تجاهل الخطأ والمحاولة التالية
        }
      }

      if (!passwordField) {
        throw new Error("Password field not found");
      }

      // ملء البيانات
      await usernameField.fill(this.config.credentials.username);
      await passwordField.fill(this.config.credentials.password);

      console.log("[Agent Login] Credentials filled");

      // البحث عن زر تسجيل الدخول
      const loginButtonSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'button:has-text("تسجيل الدخول")',
        'button:has-text("دخول")',
        '#login-button',
        '.login-button',
      ];

      let loginButton = null;
      for (const selector of loginButtonSelectors) {
        try {
          loginButton = await page.$(selector);
          if (loginButton) {
            console.log(`[Agent Login] Found login button: ${selector}`);
            break;
          }
        } catch (e) {
          // تجاهل الخطأ والمحاولة التالية
        }
      }

      if (!loginButton) {
        // محاولة الضغط على Enter
        await passwordField.press("Enter");
      } else {
        await loginButton.click();
      }

      console.log("[Agent Login] Login button clicked");

      // الانتظار للتحقق من نجاح تسجيل الدخول
      await this.browser.wait(3000);

      // التحقق من نجاح تسجيل الدخول
      const currentUrl = page.url();
      if (
        currentUrl.includes("dashboard") ||
        currentUrl.includes("home") ||
        currentUrl !== this.config.targetSite.loginUrl
      ) {
        console.log("[Agent Login] Login successful!");
        this.isLoggedIn = true;
        return true;
      }

      // محاولة البحث عن رسالة خطأ
      const errorSelectors = [
        ".error",
        ".alert-danger",
        ".error-message",
        '[role="alert"]',
      ];

      for (const selector of errorSelectors) {
        try {
          const errorElement = await page.$(selector);
          if (errorElement) {
            const errorText = await errorElement.textContent();
            console.error(`[Agent Login] Login error: ${errorText}`);
            return false;
          }
        } catch (e) {
          // تجاهل
        }
      }

      console.error("[Agent Login] Login failed - unknown reason");
      return false;
    } catch (error) {
      console.error("[Agent Login] Login error:", error);
      return false;
    }
  }

  /**
   * التحقق من حالة تسجيل الدخول
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  /**
   * تسجيل الخروج
   */
  async logout(): Promise<void> {
    console.log("[Agent Login] Logging out...");
    this.isLoggedIn = false;
  }

  /**
   * إعادة تسجيل الدخول إذا انتهت الجلسة
   */
  async ensureLoggedIn(): Promise<boolean> {
    if (!this.isLoggedIn) {
      return await this.login();
    }

    // التحقق من أن الجلسة ما زالت نشطة
    try {
      const page = this.browser.getPage();
      const currentUrl = page.url();

      // إذا كنا في صفحة تسجيل الدخول، نحتاج لإعادة تسجيل الدخول
      if (currentUrl.includes("login") || currentUrl.includes("signin")) {
        console.log("[Agent Login] Session expired, re-logging in...");
        return await this.login();
      }

      return true;
    } catch (error) {
      console.error("[Agent Login] Error checking session:", error);
      return await this.login();
    }
  }
}
