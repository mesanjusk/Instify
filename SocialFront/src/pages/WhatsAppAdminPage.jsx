import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import ConnectWhatsAppModal from '../modules/whatsapp/components/ConnectWhatsAppModal';
import {
  createAutoReply,
  deleteAutoReply,
  getAnalytics,
  getAutoReplies,
  getConnectedNumbers,
  getMessages,
  getTemplates,
  sendWhatsAppMessage,
  toggleAutoReply,
} from '../modules/whatsapp/services/whatsapp.api';

const initialRule = {
  keyword: '',
  matchType: 'contains',
  replyMode: 'text',
  replyText: '',
  templateName: '',
  templateLanguage: 'en_US',
  delaySeconds: 0,
};

const WhatsAppAdminPage = () => {
  const centerId = localStorage.getItem('institute_uuid');
  const [connectOpen, setConnectOpen] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [form, setForm] = useState({
    integrationId: '',
    to: '',
    type: 'text',
    message: '',
    templateName: '',
    paramsText: '',
    mediaType: 'image',
    mediaUrl: '',
    caption: '',
  });
  const [ruleForm, setRuleForm] = useState(initialRule);

  const activeIntegration = useMemo(() => integrations[0] || null, [integrations]);

  const loadDashboard = async () => {
    if (!centerId) return;
    setLoading(true);
    try {
      const [numbersRes, rulesRes] = await Promise.all([
        getConnectedNumbers(centerId),
        getAutoReplies(centerId),
      ]);

      const integrationsData = Array.isArray(numbersRes?.data) ? numbersRes.data : [];
      setIntegrations(integrationsData);
      setRules(Array.isArray(rulesRes?.data) ? rulesRes.data : []);

      const defaultIntegrationId = integrationsData[0]?.id || integrationsData[0]?.integrationId || '';
      setForm((prev) => ({ ...prev, integrationId: prev.integrationId || defaultIntegrationId }));

      if (defaultIntegrationId) {
        const [templatesRes, messagesRes, analyticsRes] = await Promise.all([
          getTemplates(centerId, defaultIntegrationId),
          getMessages(centerId, defaultIntegrationId, 30),
          getAnalytics(centerId, defaultIntegrationId),
        ]);
        setTemplates(Array.isArray(templatesRes?.data) ? templatesRes.data : []);
        setMessages(Array.isArray(messagesRes?.data) ? messagesRes.data : []);
        setAnalytics(analyticsRes?.data || {});
      } else {
        setTemplates([]);
        setMessages([]);
        setAnalytics({});
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load WhatsApp dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [centerId]);

  useEffect(() => {
    if (!form.integrationId || !centerId) return;
    (async () => {
      try {
        const [templatesRes, messagesRes, analyticsRes] = await Promise.all([
          getTemplates(centerId, form.integrationId),
          getMessages(centerId, form.integrationId, 30),
          getAnalytics(centerId, form.integrationId),
        ]);
        setTemplates(Array.isArray(templatesRes?.data) ? templatesRes.data : []);
        setMessages(Array.isArray(messagesRes?.data) ? messagesRes.data : []);
        setAnalytics(analyticsRes?.data || {});
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to refresh integration data.');
      }
    })();
  }, [form.integrationId, centerId]);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateRuleForm = (field, value) => setRuleForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    if (!centerId) return toast.error('Center not found. Please log in again.');
    if (!form.integrationId || !form.to) return toast.error('Connected number and recipient are required.');
    if (form.type === 'text' && !form.message.trim()) return toast.error('Message is required.');
    if (form.type === 'template' && !form.templateName) return toast.error('Template is required.');
    if (form.type === 'media' && !form.mediaUrl.trim()) return toast.error('Media URL is required.');

    setSending(true);
    try {
      await sendWhatsAppMessage({
        centerId,
        institute_uuid: centerId,
        integrationId: form.integrationId,
        to: form.to,
        type: form.type,
        message: form.type === 'text' ? form.message : undefined,
        templateName: form.type === 'template' ? form.templateName : undefined,
        params: form.type === 'template' ? form.paramsText.split('\n').map((item) => item.trim()).filter(Boolean) : undefined,
        mediaType: form.type === 'media' ? form.mediaType : undefined,
        mediaUrl: form.type === 'media' ? form.mediaUrl : undefined,
        caption: form.type === 'media' ? form.caption : undefined,
      });
      toast.success('WhatsApp message sent.');
      setForm((prev) => ({ ...prev, to: '', message: '', paramsText: '', mediaUrl: '', caption: '' }));
      loadDashboard();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleCreateRule = async () => {
    if (!centerId) return toast.error('Center not found.');
    if (!ruleForm.keyword.trim()) return toast.error('Keyword is required.');
    if (ruleForm.replyMode === 'text' && !ruleForm.replyText.trim()) return toast.error('Reply text is required.');
    if (ruleForm.replyMode === 'template' && !ruleForm.templateName) return toast.error('Template is required.');

    setRuleSaving(true);
    try {
      await createAutoReply({ centerId, institute_uuid: centerId, ...ruleForm });
      toast.success('Auto reply saved.');
      setRuleForm(initialRule);
      const rulesRes = await getAutoReplies(centerId);
      setRules(Array.isArray(rulesRes?.data) ? rulesRes.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save auto reply.');
    } finally {
      setRuleSaving(false);
    }
  };

  const handleToggleRule = async (id) => {
    try {
      await toggleAutoReply(id);
      const rulesRes = await getAutoReplies(centerId);
      setRules(Array.isArray(rulesRes?.data) ? rulesRes.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to toggle auto reply.');
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await deleteAutoReply(id);
      const rulesRes = await getAutoReplies(centerId);
      setRules(Array.isArray(rulesRes?.data) ? rulesRes.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete auto reply.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Cloud Dashboard</h1>
          <p className="text-sm text-gray-500">Manage Meta integration, templates, messages, and auto replies.</p>
        </div>
        <button onClick={() => setConnectOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Connect WhatsApp
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['totalMessages', 'sent', 'delivered', 'read'].map((key) => (
          <div key={key} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-sm text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
            <div className="text-2xl font-semibold">{analytics?.[key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Send Message</h2>
              <p className="text-sm text-gray-500">Use any connected WhatsApp number.</p>
            </div>
            <select className="border rounded p-2" value={form.integrationId} onChange={(e) => updateForm('integrationId', e.target.value)}>
              <option value="">Select number</option>
              {integrations.map((integration) => (
                <option key={integration.id || integration.integrationId} value={integration.id || integration.integrationId}>
                  {integration.displayName || integration.phoneNumberId}
                </option>
              ))}
            </select>
          </div>

          <input className="w-full border rounded p-2" placeholder="Recipient phone with country code" value={form.to} onChange={(e) => updateForm('to', e.target.value)} />

          <div className="flex gap-3 text-sm flex-wrap">
            {['text', 'template', 'media'].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input type="radio" checked={form.type === type} onChange={() => updateForm('type', type)} />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>

          {form.type === 'text' && (
            <textarea className="w-full border rounded p-2" rows={5} placeholder="Type message" value={form.message} onChange={(e) => updateForm('message', e.target.value)} />
          )}

          {form.type === 'template' && (
            <>
              <select className="w-full border rounded p-2" value={form.templateName} onChange={(e) => updateForm('templateName', e.target.value)}>
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id || template.name} value={template.name}>{`${template.name} (${template.language || 'en_US'})`}</option>
                ))}
              </select>
              <textarea className="w-full border rounded p-2" rows={4} placeholder="Template params, one per line" value={form.paramsText} onChange={(e) => updateForm('paramsText', e.target.value)} />
            </>
          )}

          {form.type === 'media' && (
            <>
              <select className="w-full border rounded p-2" value={form.mediaType} onChange={(e) => updateForm('mediaType', e.target.value)}>
                <option value="image">Image</option>
                <option value="document">Document</option>
                <option value="video">Video</option>
              </select>
              <input className="w-full border rounded p-2" placeholder="Public media URL" value={form.mediaUrl} onChange={(e) => updateForm('mediaUrl', e.target.value)} />
              <textarea className="w-full border rounded p-2" rows={3} placeholder="Caption (optional)" value={form.caption} onChange={(e) => updateForm('caption', e.target.value)} />
            </>
          )}

          <button onClick={handleSend} disabled={sending} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Connected Account</h2>
            <p className="text-sm text-gray-500">Current active Meta number.</p>
          </div>
          {activeIntegration ? (
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="border rounded p-3"><span className="text-gray-500">Display Name: </span>{activeIntegration.displayName || '—'}</div>
              <div className="border rounded p-3 break-all"><span className="text-gray-500">Phone Number ID: </span>{activeIntegration.phoneNumberId || '—'}</div>
              <div className="border rounded p-3 break-all"><span className="text-gray-500">WABA ID: </span>{activeIntegration.wabaId || '—'}</div>
              <div className="border rounded p-3"><span className="text-gray-500">Status: </span>{activeIntegration.status || 'connected'}</div>
            </div>
          ) : (
            <div className="border rounded p-4 text-sm text-gray-500">No WhatsApp number connected yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Auto Reply Rules</h2>
            <p className="text-sm text-gray-500">Create keyword based replies like your MIS setup.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded p-2" placeholder="Keyword" value={ruleForm.keyword} onChange={(e) => updateRuleForm('keyword', e.target.value)} />
            <select className="border rounded p-2" value={ruleForm.matchType} onChange={(e) => updateRuleForm('matchType', e.target.value)}>
              <option value="contains">Contains</option>
              <option value="exact">Exact</option>
              <option value="startsWith">Starts With</option>
            </select>
            <select className="border rounded p-2" value={ruleForm.replyMode} onChange={(e) => updateRuleForm('replyMode', e.target.value)}>
              <option value="text">Text Reply</option>
              <option value="template">Template Reply</option>
            </select>
            <input className="border rounded p-2" type="number" min="0" placeholder="Delay seconds" value={ruleForm.delaySeconds} onChange={(e) => updateRuleForm('delaySeconds', Number(e.target.value) || 0)} />
          </div>

          {ruleForm.replyMode === 'text' ? (
            <textarea className="w-full border rounded p-2" rows={4} placeholder="Reply text" value={ruleForm.replyText} onChange={(e) => updateRuleForm('replyText', e.target.value)} />
          ) : (
            <select className="w-full border rounded p-2" value={ruleForm.templateName} onChange={(e) => updateRuleForm('templateName', e.target.value)}>
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id || template.name} value={template.name}>{template.name}</option>
              ))}
            </select>
          )}

          <button onClick={handleCreateRule} disabled={ruleSaving} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            {ruleSaving ? 'Saving...' : 'Save Auto Reply'}
          </button>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div key={rule._id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{rule.keyword}</div>
                  <div className="text-sm text-gray-500">{rule.matchType} • {rule.replyMode === 'template' ? rule.templateName : rule.replyText}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleRule(rule._id)} className="px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">
                    {rule.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDeleteRule(rule._id)} className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200">
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!rules.length && <div className="text-sm text-gray-500">No auto reply rules yet.</div>}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent Messages</h2>
            <p className="text-sm text-gray-500">Latest WhatsApp activity for the selected number.</p>
          </div>
          <div className="space-y-3 max-h-[540px] overflow-y-auto">
            {loading && <div className="text-sm text-gray-500">Loading dashboard...</div>}
            {messages.map((item) => (
              <div key={item._id} className="border rounded-lg p-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="font-medium">{item.direction || 'outgoing'} • {item.messageType}</span>
                  <span className="text-gray-500">{item.status}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">To: {item.to || '—'} {item.from ? `• From: ${item.from}` : ''}</div>
                {item.message && <div className="mt-2 text-sm">{item.message}</div>}
                {item.mediaUrl && <div className="mt-2 text-xs text-blue-600 break-all">{item.mediaUrl}</div>}
                <div className="mt-2 text-xs text-gray-400">{new Date(item.timestamp || item.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!messages.length && !loading && <div className="text-sm text-gray-500">No WhatsApp messages found yet.</div>}
          </div>
        </div>
      </div>

      <ConnectWhatsAppModal isOpen={connectOpen} centerId={centerId} onClose={() => setConnectOpen(false)} onConnected={loadDashboard} />
    </div>
  );
};

export default WhatsAppAdminPage;
