const PRODUCTION_APP_URL = "https://MedQsl.vercel.app";

function normalizeAppUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Public Next.js app URL (no trailing slash). Set APP_URL in Convex for each deployment. */
export function getAppUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return normalizeAppUrl(configured);
  return PRODUCTION_APP_URL;
}

export function queueTrackingUrl(tokenCode: string): string {
  return `${getAppUrl()}/q/${tokenCode}`;
}

