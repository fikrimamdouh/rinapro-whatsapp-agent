/**
 * Shared constants used across client and server
 */

export const COOKIE_NAME = "rinapro_session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
export const AXIOS_TIMEOUT_MS = 30000;

export const UNAUTHED_ERR_MSG = "يجب تسجيل الدخول للوصول لهذه الصفحة";
export const NOT_ADMIN_ERR_MSG = "غير مصرح لك بالوصول لهذه الصفحة";

export const DEFAULT_GROUP_NAME = "RinaPro Reports";
export const DEFAULT_MANAGER_NUMBER = "";

export const WHATSAPP_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
} as const;

export type WhatsAppStatus = typeof WHATSAPP_STATUS[keyof typeof WHATSAPP_STATUS];
