import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    window.updateAppContext = ({ user: u, institute: inst } = {}) => {
      if (u) {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      }
      if (inst) {
        setInstitute(inst);
        localStorage.setItem('institute', JSON.stringify(inst));
        const uuid = inst.institute_uuid || inst.uuid;
        if (uuid) localStorage.setItem('institute_uuid', uuid);
      }
    };
  }, []);

  const institute_uuid = institute?.institute_uuid || institute?.uuid || null;

  return (
    <AppContext.Provider value={{ user, setUser, institute, setInstitute, institute_uuid, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
