import React, { createContext } from 'react';

export const BrandingContext = createContext();

const staticBranding = {
  color: '#1a7a4a',
  logo: '/pwa-512x512.png',
  favicon: '/icon.svg',
  institute: 'Instify',
  tagline: 'Institutions Simplified',
};

// Set CSS variables once at module load
document.documentElement.style.setProperty('--tw-color-primary', '26 122 74');
document.documentElement.style.setProperty('--theme-color', '#1a7a4a');
document.documentElement.style.setProperty('--primary', '#1a7a4a');
document.documentElement.style.setProperty('--primary-hover', '#25a066');
document.documentElement.style.setProperty('--primary-light', '#34c97e');
document.documentElement.style.setProperty('--secondary', '#d4a017');
document.documentElement.style.setProperty('--secondary-hover', '#f0c040');
document.documentElement.style.setProperty('--dark', '#0a1a0f');
document.documentElement.style.setProperty('--background', '#f4f9f6');
document.documentElement.style.setProperty('--white', '#ffffff');
document.documentElement.style.setProperty('--border', '#d0e8d0');
document.documentElement.style.setProperty('--text', '#1a1a1a');
document.documentElement.style.setProperty('--text-muted', '#555555');
document.documentElement.style.setProperty('--text-light', '#888888');
document.documentElement.style.setProperty('--error', '#c62828');
document.documentElement.style.setProperty('--success', '#1b5e20');

const BrandingProvider = ({ children }) => {
  return (
    <BrandingContext.Provider value={{ branding: staticBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export default BrandingProvider;

export const useBranding = () => React.useContext(BrandingContext);
