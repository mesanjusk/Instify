import { createContext, useContext, useEffect, useState } from 'react';

export const BrandingContext = createContext();

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        setBranding(data);

        // Apply favicon
        if (data.favicon) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = data.favicon;
          document.head.appendChild(link);
        }

        // Apply title if institute name exists
        if (data.institute) {
          document.title = `${data.institute} - Instify`;
        }

        // Set CSS variables
        document.documentElement.style.setProperty('--primary-color', data.theme?.color || '6fa8dc');
        document.documentElement.style.setProperty('--accent-color', data.theme?.accentColor || '#22C55E');
        document.documentElement.style.setProperty('--dark-color', data.theme?.darkColor || '#1F2937');
      });
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      {branding ? children : <div className="text-center mt-20 text-lg text-gray-600">Loading brand...</div>}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
