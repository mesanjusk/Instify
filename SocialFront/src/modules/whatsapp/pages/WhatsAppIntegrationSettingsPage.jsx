import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useWhatsAppIntegrations from '../hooks/useWhatsAppIntegrations';
import ConnectWhatsAppModal from '../components/ConnectWhatsAppModal';
import { disconnectIntegration, syncTemplates } from '../services/whatsapp.api';

const StatusBadge = ({ status }) => {
  const connected = status === 'connected';
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
      {connected ? 'Connected' : status || 'Not Connected'}
    </span>
  );
};

const WhatsAppIntegrationSettingsPage = () => {
  const { centerId } = useParams();
  const fallbackCenterId = localStorage.getItem('institute_uuid');
  const activeCenterId = centerId || fallbackCenterId;
  const [openConnectModal, setOpenConnectModal] = useState(false);
  const [submittingId, setSubmittingId] = useState('');
  const { integrations, loading, error, refetch } = useWhatsAppIntegrations(activeCenterId);

  const activeIntegration = useMemo(() => integrations[0] || null, [integrations]);

  const handleDisconnect = async (integrationId) => {
    setSubmittingId(integrationId);
    try {
      await disconnectIntegration(activeCenterId, integrationId);
      toast.success('WhatsApp disconnected.');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Disconnect failed.');
    } finally {
      setSubmittingId('');
    }
  };

  const handleSyncTemplates = async (integrationId) => {
    setSubmittingId(integrationId);
    try {
      const response = await syncTemplates(activeCenterId, integrationId);
      toast.success(`Templates synced: ${response?.data?.length || 0}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Template sync failed.');
    } finally {
      setSubmittingId('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">WhatsApp Integration</h1>
          <p className="text-sm text-gray-500">Center: {activeCenterId || 'Not detected'}</p>
        </div>
        <button onClick={() => setOpenConnectModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Connect WhatsApp
        </button>
      </div>

      {loading && <div className="p-4 bg-white border rounded">Loading integration status...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded">{error}</div>}

      {!loading && !integrations.length && (
        <div className="p-4 bg-white border rounded flex justify-between items-center">
          <div>
            <h2 className="font-medium">No active WhatsApp integration</h2>
            <p className="text-sm text-gray-500">Connect a WhatsApp Cloud account for this center.</p>
          </div>
          <StatusBadge status="disconnected" />
        </div>
      )}

      {activeIntegration && (
        <div className="p-5 bg-white border rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Current Connection</h2>
              <p className="text-sm text-gray-500">{activeIntegration.displayName || 'WhatsApp Business Number'}</p>
            </div>
            <StatusBadge status={activeIntegration.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="border rounded p-3">
              <div className="text-gray-500">Phone Number ID</div>
              <div className="font-medium break-all">{activeIntegration.phoneNumberId || '—'}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">WABA ID</div>
              <div className="font-medium break-all">{activeIntegration.wabaId || '—'}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Business ID</div>
              <div className="font-medium break-all">{activeIntegration.businessId || '—'}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Connection Type</div>
              <div className="font-medium">{activeIntegration.connectionType || '—'}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleSyncTemplates(activeIntegration.id || activeIntegration.integrationId)} disabled={Boolean(submittingId)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Sync Templates
            </button>
            <button onClick={() => handleDisconnect(activeIntegration.id || activeIntegration.integrationId)} disabled={Boolean(submittingId)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Disconnect
            </button>
          </div>
        </div>
      )}

      <ConnectWhatsAppModal isOpen={openConnectModal} centerId={activeCenterId} onClose={() => setOpenConnectModal(false)} onConnected={refetch} />
    </div>
  );
};

export default WhatsAppIntegrationSettingsPage;
