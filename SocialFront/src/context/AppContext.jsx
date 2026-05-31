import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storage = localStorage;
    try {
      const userStr = storage.getItem('user');
      const instiStr = storage.getItem('institute');

      if (userStr && instiStr) {
        const userObj = JSON.parse(userStr);
        const instiObj = JSON.parse(instiStr);
        if (!instiObj.institute_uuid) {
          const legacyUuid = storage.getItem('institute_uuid');
          if (legacyUuid) {
            instiObj.institute_uuid = legacyUuid;
          }
        }
        setUser(userObj);
        setInstitute(instiObj);
        if (instiObj.institute_uuid)
          storage.setItem('institute_uuid', instiObj.institute_uuid);
      } else {
        console.warn('⚠️ [AppContext] No stored user or institute found in storage.');
      }
    } catch (err) {
      console.error('❌ [AppContext] Failed parsing user/institute:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.updateAppContext = ({ user: u, institute: i } = {}) => {
      if (u !== undefined) {
        setUser(u || null);
        if (u) localStorage.setItem('user', JSON.stringify(u));
      }
      if (i !== undefined) {
        setInstitute(i || null);
        if (i) {
          localStorage.setItem('institute', JSON.stringify(i));
          if (i.institute_uuid || i.uuid)
            localStorage.setItem('institute_uuid', i.institute_uuid || i.uuid);
        }
      }
    };

    // Used by logout flows that don't have direct access to React hooks
    window.logoutHandler = () => {
      setUser(null);
      setInstitute(null);
    };
  }, []);

  const institute_uuid = institute?.institute_uuid || institute?.uuid || null;
  const storage_mode = institute?.storage_mode || 'cloud_only';

  return (
    <AppContext.Provider value={{ user, setUser, institute, setInstitute, institute_uuid, storage_mode, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
