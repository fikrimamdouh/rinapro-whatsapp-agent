/**
 * Branding Service
 * Add company branding to messages and reports
 */

import { getSQLiteDb } from "../db/sqlite";

export interface CompanyInfo {
  name: string;
  logo: string;
}

/**
 * Get company information from settings
 */
export function getCompanyInfo(): CompanyInfo {
  const db = getSQLiteDb();
  
  const defaultInfo: CompanyInfo = {
    name: "RinaPro",
    logo: "",
  };

  if (!db) return defaultInfo;

  try {
    const nameRow = db.prepare(`
      SELECT settingValue FROM settings WHERE settingKey = 'COMPANY_NAME'
    `).get() as { settingValue: string } | undefined;

    const logoRow = db.prepare(`
      SELECT settingValue FROM settings WHERE settingKey = 'COMPANY_LOGO'
    `).get() as { settingValue: string } | undefined;

    return {
      name: nameRow?.settingValue || defaultInfo.name,
      logo: logoRow?.settingValue || defaultInfo.logo,
    };
  } catch (error) {
    console.error("[Branding] Error getting company info:", error);
    return defaultInfo;
  }
}

/**
 * Add company branding to WhatsApp message
 */
export function brandWhatsAppMessage(message: string): string {
  const company = getCompanyInfo();
  
  return `${message}\n\n━━━━━━━━━━━━━━━━\n📱 *${company.name}*\n🤖 نظام إدارة ذكي`;
}

/**
 * Create branded report header
 */
export function createReportHeader(reportTitle: string): string {
  const company = getCompanyInfo();
  const date = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `╔═══════════════════════════╗
║  *${company.name}*  ║
╚═══════════════════════════╝

📊 *${reportTitle}*
📅 ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Create branded footer
 */
export function createReportFooter(): string {
  const company = getCompanyInfo();
  
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━
تم إنشاء هذا التقرير تلقائياً
🏢 ${company.name}
🤖 نظام RinaPro الذكي`;
}
