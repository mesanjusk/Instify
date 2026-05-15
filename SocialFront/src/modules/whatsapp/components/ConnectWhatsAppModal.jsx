import { useState } from 'react';
import toast from 'react-hot-toast';
import { connectEmbedded, connectManual } from '../services/whatsapp.api';

const FB_SDK_ID = 'facebook-jssdk';
const FB_VERSION = 'v21.0';
const META_SCOPES = [
  'business_management',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
].join(',');

const loadFacebookSdk = () => {
  if (window.FB) return Promise.resolve(window.FB);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(FB_SDK_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.FB));
      existing.addEventListener('error', () => reject(new Error('Failed to load Facebook SDK')));
      return;
    }

    const script = document.createElement('script');
    script.id = FB_SDK_ID;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.FB);
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);
  });
};

const normalizeApiErrors = (err) => {
  const responseData = err?.response?.data;
  if (Array.isArray(responseData?.errors)) return responseData.errors.join('\n');
  if (responseData?.errors && typeof responseData.errors === 'object') {
    return Object.values(responseData.errors).flat().join('\n');
  }
  return responseData?.message || err?.message || 'Request failed.';
};

const requestEmbeddedSignupCode = async () => {
  const FB = await loadFacebookSdk();
  if (!FB) {
    throw new Error('Facebook SDK not available.');
  }

  const appId = import.meta.env.VITE_META_APP_ID;
  const configId = import.meta.env.VITE_META_WHATSAPP_CONFIG_ID;
  if (!appId) {
    throw new Error('VITE_META_APP_ID is missing.');
  }

  FB.init({ appId, cookie: true, xfbml: false, version: FB_VERSION });

  return new Promise((resolve, reject) => {
    FB.login(
      (response) => {
        if (response?.authResponse?.code) {
          resolve(response.authResponse.code);
          return;
        }
        reject(new Error('Meta authorization was cancelled or no auth code was returned.'));
      },
      {
        scope: META_SCOPES,
        response_type: 'code',
        override_default_response_type: true,
        ...(configId ? { config_id: configId } : {}),
      },
    );
  });
};

const ConnectWhatsAppModal = ({ isOpen, centerId, onClose, onConnected }) => {
  const [activeTab, setActiveTab] = useState('embedded');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState('');
  const [manual, setManual] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: '',
    displayName: '',
  });

  if (!isOpen) return null;

  const onManualChange = (field, value) => {
    setManual((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmbeddedConnect = async () => {
    setSubmitting(true);
    setErrors('');
    try {
      const code = await requestEmbeddedSignupCode();
      await connectEmbedded({ code, centerId });
      toast.success('WhatsApp connected with Meta Embedded Signup.');
      onConnected();
      onClose();
    } catch (err) {
      setErrors(normalizeApiErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors('');
    try {
      await connectManual({ centerId, ...manual });
      toast.success('Manual WhatsApp connection successful.');
      setManual({ accessToken: '', phoneNumberId: '', wabaId: '', displayName: '' });
      onConnected();
      onClose();
    } catch (err) {
      setErrors(normalizeApiErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-xl w-full">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Connect WhatsApp</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="flex border-b text-sm">
          <button className={`px-4 py-2 ${activeTab === 'embedded' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('embedded')}>
            Connect via Meta
          </button>
          <button className={`px-4 py-2 ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('manual')}>
            Manual Connect
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'embedded' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Use Meta Embedded Signup to securely authorize this center.</p>
              <button
                type="button"
                onClick={handleEmbeddedConnect}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {submitting ? 'Connecting...' : 'Connect with Facebook'}
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <form className="space-y-3" onSubmit={handleManualSubmit}>
              <input className="w-full border rounded p-2" placeholder="Access Token *" value={manual.accessToken} onChange={(e) => onManualChange('accessToken', e.target.value)} required />
              <input className="w-full border rounded p-2" placeholder="Phone Number ID *" value={manual.phoneNumberId} onChange={(e) => onManualChange('phoneNumberId', e.target.value)} required />
              <input className="w-full border rounded p-2" placeholder="WABA ID *" value={manual.wabaId} onChange={(e) => onManualChange('wabaId', e.target.value)} required />
              <input className="w-full border rounded p-2" placeholder="Display Name (Optional)" value={manual.displayName} onChange={(e) => onManualChange('displayName', e.target.value)} />
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                {submitting ? 'Saving...' : 'Connect'}
              </button>
            </form>
          )}

          {errors && <div className="mt-4 whitespace-pre-line text-sm text-red-600 bg-red-50 p-3 rounded">{errors}</div>}
        </div>
      </div>
    </div>
  );
};

export default ConnectWhatsAppModal;
