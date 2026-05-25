import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerContextSetters } from './appContextBridge';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on first render
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const instiStr = localStorage.getItem('institute');

      if (userStr && instiStr) {
        const userObj = JSON.parse(userStr);
        const instiObj = JSON.parse(instiStr);
        if (!instiObj.institute_uuid) {
          const legacyUuid = localStorage.getItem('institute_uuid');
          if (legacyUuid) instiObj.institute_uuid = legacyUuid;
        }
        setUser(userObj);
        setInstitute(instiObj);
        if (instiObj.institute_uuid) {
          localStorage.setItem('institute_uuid', instiObj.institute_uuid);
        }
      }
    } catch (err) {
      console.error('[AppContext] Failed to restore session:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Register setters with the module-level bridge so non-React code can update context
  useEffect(() => {
    registerContextSetters(setUser, setInstitute);
  }, []);

  const institute_uuid = institute?.institute_uuid || institute?.uuid || null;

  return (
    <AppContext.Provider value={{ user, setUser, institute, setInstitute, institute_uuid, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
