/**
 * FBR Portal Utilities
 * Handles cookies, downloads, and browser-like functionality for FBR IRIS Portal
 */

export const FBRConfig = {
  IRIS_URL: 'https://iris.fbr.gov.pk/',

  // iframe sandbox settings to allow browser-like functionality
  sandboxAttributes: [
    'allow-same-origin', // Allow cookies from same origin
    'allow-scripts', // Allow JavaScript execution
    'allow-forms', // Allow form submission
    'allow-popups', // Allow popups from the site
    'allow-downloads', // Allow file downloads
    'allow-modals', // Allow modal dialogs
    'allow-top-navigation', // Allow navigation to top-level
  ],

  // Permissions to grant the iframe
  permissions: ['clipboard-read', 'clipboard-write'],
};

/**
 * Check if the FBR site is accessible
 */
export const checkFBRAccessibility = async (): Promise<boolean> => {
  try {
    const response = await fetch(FBRConfig.IRIS_URL, {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.error('FBR Portal accessibility check failed:', error);
    return false;
  }
};

/**
 * Get the iframe sandbox attribute string
 */
export const getSandboxAttributes = (): string => {
  return FBRConfig.sandboxAttributes.join(' ');
};

/**
 * Get the iframe allow attribute string
 */
export const getPermissions = (): string => {
  return FBRConfig.permissions.join('; ');
};
