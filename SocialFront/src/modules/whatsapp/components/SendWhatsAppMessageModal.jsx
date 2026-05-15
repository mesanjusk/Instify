import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getConnectedNumbers, getTemplates, sendWhatsAppMessage } from '../services/whatsapp.api';

const emptyForm = (contact = '') => ({
  integrationId: '',
  mode: 'text',
  message: '',
  templateName: '',
  paramsText: '',
  mediaType: 'image',
  mediaUrl: '',
  caption: '',
  to: contact || '',
});

const SendWhatsAppMessageModal = ({ isOpen, centerId, contact, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyForm(contact));

  useEffect(() => {
    setForm((prev) => ({ ...prev, to: contact || '' }));
  }, [contact]);

  useEffect(() => {
    if (!isOpen || !centerId) return;
    (async () => {
      try {
        const response = await getConnectedNumbers(centerId);
        const rows = Array.isArray(response?.data) ? response.data : [];
        setNumbers(rows);
        if (rows[0]) {
          setForm((prev) => ({ ...prev, integrationId: prev.integrationId || rows[0].id || rows[0].integrationId || '' }));
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unable to load connected numbers.');
      }
    })();
  }, [isOpen, centerId]);

  useEffect(() => {
    if (!isOpen || !form.integrationId || form.mode !== 'template') return;
    (async () => {
      try {
        const response = await getTemplates(centerId, form.integrationId);
        setTemplates(Array.isArray(response?.data) ? response.data : []);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Unable to load templates.');
      }
    })();
  }, [isOpen, centerId, form.integrationId, form.mode]);

  const selectedIntegration = useMemo(
    () => numbers.find((n) => (n.id || n.integrationId) === form.integrationId),
    [numbers, form.integrationId],
  );

  if (!isOpen) return null;

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    if (!form.integrationId || !form.to) return toast.error('Connected number and recipient are required.');
    if (form.mode === 'text' && !form.message.trim()) return toast.error('Message is required.');
    if (form.mode === 'template' && !form.templateName) return toast.error('Template is required.');
    if (form.mode === 'media' && !form.mediaUrl.trim()) return toast.error('Media URL is required.');

    setLoading(true);
    try {
      const payload = {
        centerId,
        institute_uuid: centerId,
        integrationId: form.integrationId,
        to: form.to,
        type: form.mode,
        message: form.mode === 'text' ? form.message : undefined,
        templateName: form.mode === 'template' ? form.templateName : undefined,
        params: form.mode === 'template'
          ? form.paramsText.split('\n').map((item) => item.trim()).filter(Boolean)
          : undefined,
        mediaType: form.mode === 'media' ? form.mediaType : undefined,
        mediaUrl: form.mode === 'media' ? form.mediaUrl : undefined,
        caption: form.mode === 'media' ? form.caption : undefined,
      };

      await sendWhatsAppMessage(payload);
      toast.success('WhatsApp message sent.');
      setForm(emptyForm(contact));
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send WhatsApp message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold">Send WhatsApp Message</h3>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-4">
          <select className="w-full border rounded p-2" value={form.integrationId} onChange={(e) => updateField('integrationId', e.target.value)}>
            <option value="">Select Connected Number</option>
            {numbers.map((n) => (
              <option key={n.id || n.integrationId} value={n.id || n.integrationId}>
                {n.displayName || n.phoneNumber || n.phone_number || n.phoneNumberId}
              </option>
            ))}
          </select>

          <input className="w-full border rounded p-2" value={form.to} onChange={(e) => updateField('to', e.target.value)} placeholder="Recipient phone with country code" />

          <div className="flex gap-4 text-sm flex-wrap">
            {['text', 'template', 'media'].map((mode) => (
              <label key={mode} className="flex items-center gap-2">
                <input type="radio" checked={form.mode === mode} onChange={() => updateField('mode', mode)} />
                <span className="capitalize">{mode}</span>
              </label>
            ))}
          </div>

          {form.mode === 'text' && (
            <textarea className="w-full border rounded p-2" rows={5} placeholder="Type message" value={form.message} onChange={(e) => updateField('message', e.target.value)} />
          )}

          {form.mode === 'template' && (
            <>
              <select className="w-full border rounded p-2" value={form.templateName} onChange={(e) => updateField('templateName', e.target.value)}>
                <option value="">Select Template</option>
                {templates.map((t) => (
                  <option key={t.id || t.name} value={t.name}>{`${t.name} (${t.language || 'en_US'})`}</option>
                ))}
              </select>
              <textarea
                className="w-full border rounded p-2"
                rows={4}
                placeholder="Optional template body params, one per line"
                value={form.paramsText}
                onChange={(e) => updateField('paramsText', e.target.value)}
              />
            </>
          )}

          {form.mode === 'media' && (
            <>
              <select className="w-full border rounded p-2" value={form.mediaType} onChange={(e) => updateField('mediaType', e.target.value)}>
                <option value="image">Image</option>
                <option value="document">Document</option>
                <option value="video">Video</option>
              </select>
              <input className="w-full border rounded p-2" value={form.mediaUrl} onChange={(e) => updateField('mediaUrl', e.target.value)} placeholder="Public media URL" />
              <textarea className="w-full border rounded p-2" rows={3} placeholder="Caption (optional)" value={form.caption} onChange={(e) => updateField('caption', e.target.value)} />
            </>
          )}

          <button onClick={handleSend} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {loading ? 'Sending...' : 'Send WhatsApp Message'}
          </button>

          {selectedIntegration && (
            <div className="text-xs text-gray-500">
              Using: {selectedIntegration.displayName || selectedIntegration.phoneNumberId || selectedIntegration.phone_number}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendWhatsAppMessageModal;
