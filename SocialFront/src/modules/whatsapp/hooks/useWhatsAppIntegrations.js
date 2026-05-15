import { useCallback, useEffect, useState } from 'react';
import { getIntegrations } from '../services/whatsapp.api';

export const useWhatsAppIntegrations = (centerId) => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchIntegrations = useCallback(async () => {
    if (!centerId) return;
    setLoading(true);
    setError('');
    try {
      const response = await getIntegrations(centerId);
      const rows = response?.data || response?.integrations || response || [];
      setIntegrations(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load WhatsApp integrations.');
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return { integrations, loading, error, refetch: fetchIntegrations };
};

export default useWhatsAppIntegrations;
