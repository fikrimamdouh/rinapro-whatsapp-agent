/**
 * Company utilities
 * Helper functions for multi-company support
 */

export function getActiveCompanyId(headers?: any): number {
  // Get from header or default to 1
  const companyId = headers?.['x-company-id'];
  return companyId ? parseInt(companyId) : 1;
}
