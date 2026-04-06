import api from '../services/api/axios';

export interface TenantBranding {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
}

/**
 * Extracts the tenant slug from the subdomain.
 * e.g., 'acme.localhost' -> 'acme'
 * e.g., 'localhost' -> null
 */
export const getTenantSlug = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // Localhost case (e.g. acme.localhost:3000)
  if (parts.includes('localhost')) {
    if (parts.length > 1 && parts[0] !== 'localhost') {
      return parts[0].toLowerCase();
    }
    return null;
  }

  // Production case (e.g. acme.pm-app.com)
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    if (subdomain !== 'www' && subdomain !== 'app') {
      return subdomain;
    }
  }

  return null;
};

/**
 * Fetches branding details for the current environment.
 * It sends both the full hostname and the extracted slug to the backend for resolution.
 */
export const fetchBranding = async (): Promise<TenantBranding | null> => {
  try {
    const hostname = window.location.hostname;
    const slug = getTenantSlug();
    
    const { data } = await api.get('/tenant/resolve', {
      params: { hostname, slug }
    });
    return data;
  } catch (error: any) {
    // If no branding is found (404), we just return null silently.
    // The UI will naturally fall back to the default branding.
    return null;
  }
};

/**
 * Applies the tenant branding to the document styling.
 */
export const applyBranding = (branding: TenantBranding | null) => {
  if (branding && branding.primaryColor) {
    document.documentElement.style.setProperty('--primary', branding.primaryColor);
    // You can add more CSS variable overrides here as needed
  } else {
    // Reset to default indigo
    document.documentElement.style.removeProperty('--primary');
  }
};
