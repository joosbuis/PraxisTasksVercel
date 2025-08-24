/**
 * Centrale plek voor het versienummer.
 * - Zet in .env: VITE_APP_VERSION=1.2.3
 * - Of laat leeg; dan valt hij terug op '0.1.0'
 */
export const APP_VERSION: string = (import.meta as any)?.env?.VITE_APP_VERSION ?? '0.1.0 beta';
