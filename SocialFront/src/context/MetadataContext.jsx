import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../apiClient';
import { useApp } from './AppContext';

const MetadataContext = createContext({
  courses: [],
  educations: [],
  exams: [],
  batches: [],
  paymentModes: [],
  refresh: () => {},
  loading: false,
});

export const MetadataProvider = ({ children }) => {
  const { institute_uuid } = useApp();
  const [courses, setCourses] = useState([]);
  const [educations, setEducations] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!institute_uuid) return; // Not authenticated yet — skip fetch

    setLoading(true);
    try {
      const params = { institute_uuid };
      const [coursesRes, educationsRes, examsRes, batchesRes, paymentModesRes] = await Promise.all([
        apiClient.get('/api/courses',     { params }),
        apiClient.get('/api/education',   { params }),
        apiClient.get('/api/exams',       { params }),
        apiClient.get('/api/batches',     { params }),
        apiClient.get('/api/paymentmode', { params }),
      ]);

      setCourses(Array.isArray(coursesRes.data.data)      ? coursesRes.data.data      : []);
      setEducations(Array.isArray(educationsRes.data.data) ? educationsRes.data.data  : []);
      setExams(Array.isArray(examsRes.data.data)           ? examsRes.data.data       : []);
      setBatches(Array.isArray(batchesRes.data.data)       ? batchesRes.data.data     : []);
      setPaymentModes(Array.isArray(paymentModesRes.data.data) ? paymentModesRes.data.data : []);
    } catch (err) {
      console.error('[MetadataContext] Failed to load metadata:', err.message);
    } finally {
      setLoading(false);
    }
  }, [institute_uuid]); // Re-run whenever the active institute changes

  useEffect(() => {
    load();
  }, [load]);

  return (
    <MetadataContext.Provider value={{ courses, educations, exams, batches, paymentModes, refresh: load, loading }}>
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = () => useContext(MetadataContext);

export default MetadataProvider;
