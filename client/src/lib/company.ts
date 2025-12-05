/**
 * Company utilities for frontend
 */

export function getActiveCompanyId(): number {
  const stored = localStorage.getItem("activeCompanyId");
  return stored ? parseInt(stored) : 1;
}

export function setActiveCompanyId(id: number): void {
  localStorage.setItem("activeCompanyId", id.toString());
}
