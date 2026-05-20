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
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import AddIcon from '@mui/icons-material/Add';

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

  const analyticsKeys = ['totalMessages', 'sent', 'delivered', 'read'];

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>WhatsApp Cloud Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Meta integration, templates, messages, and auto replies.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<WhatsAppIcon />}
          onClick={() => setConnectOpen(true)}
          sx={{ bgcolor: '#25d366', '&:hover': { bgcolor: '#1ebe5d' }, whiteSpace: 'nowrap' }}
        >
          Connect WhatsApp
        </Button>
      </Stack>

      {/* Analytics cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {analyticsKeys.map((key) => (
          <Card key={key} variant="outlined">
            <CardContent sx={{ pb: '12px !important' }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {analytics?.[key] || 0}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Send Message + Connected Account */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Send Message */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} mb={2}>
              <Box>
                <Typography variant="h6" fontWeight={600}>Send Message</Typography>
                <Typography variant="body2" color="text.secondary">Use any connected WhatsApp number.</Typography>
              </Box>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Select number</InputLabel>
                <Select
                  value={form.integrationId}
                  label="Select number"
                  onChange={(e) => updateForm('integrationId', e.target.value)}
                >
                  <MenuItem value="">Select number</MenuItem>
                  {integrations.map((integration) => (
                    <MenuItem key={integration.id || integration.integrationId} value={integration.id || integration.integrationId}>
                      {integration.displayName || integration.phoneNumberId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack spacing={2}>
              <TextField
                size="small"
                label="Recipient phone with country code"
                value={form.to}
                onChange={(e) => updateForm('to', e.target.value)}
                fullWidth
              />

              <RadioGroup row value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
                {['text', 'template', 'media'].map((type) => (
                  <FormControlLabel key={type} value={type} control={<Radio size="small" />} label={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{type}</Typography>} />
                ))}
              </RadioGroup>

              {form.type === 'text' && (
                <TextField
                  multiline
                  rows={5}
                  size="small"
                  label="Type message"
                  value={form.message}
                  onChange={(e) => updateForm('message', e.target.value)}
                  fullWidth
                />
              )}

              {form.type === 'template' && (
                <>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select template</InputLabel>
                    <Select value={form.templateName} label="Select template" onChange={(e) => updateForm('templateName', e.target.value)}>
                      <MenuItem value="">Select template</MenuItem>
                      {templates.map((template) => (
                        <MenuItem key={template.id || template.name} value={template.name}>
                          {`${template.name} (${template.language || 'en_US'})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    multiline
                    rows={4}
                    size="small"
                    label="Template params, one per line"
                    value={form.paramsText}
                    onChange={(e) => updateForm('paramsText', e.target.value)}
                    fullWidth
                  />
                </>
              )}

              {form.type === 'media' && (
                <>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Media type</InputLabel>
                    <Select value={form.mediaType} label="Media type" onChange={(e) => updateForm('mediaType', e.target.value)}>
                      <MenuItem value="image">Image</MenuItem>
                      <MenuItem value="document">Document</MenuItem>
                      <MenuItem value="video">Video</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="Public media URL"
                    value={form.mediaUrl}
                    onChange={(e) => updateForm('mediaUrl', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    multiline
                    rows={3}
                    size="small"
                    label="Caption (optional)"
                    value={form.caption}
                    onChange={(e) => updateForm('caption', e.target.value)}
                    fullWidth
                  />
                </>
              )}

              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                onClick={handleSend}
                disabled={sending}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, alignSelf: 'flex-start' }}
              >
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Connected Account */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={0.5}>Connected Account</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>Current active Meta number.</Typography>
            {activeIntegration ? (
              <Stack spacing={1.5}>
                {[
                  { label: 'Display Name', value: activeIntegration.displayName || '—' },
                  { label: 'Phone Number ID', value: activeIntegration.phoneNumberId || '—' },
                  { label: 'WABA ID', value: activeIntegration.wabaId || '—' },
                  { label: 'Status', value: activeIntegration.status || 'connected' },
                ].map(({ label, value }) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{label}: </Typography>
                    <Typography variant="body2" component="span" sx={{ wordBreak: 'break-all' }}>{value}</Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">No WhatsApp number connected yet.</Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Auto Reply Rules + Recent Messages */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Auto Reply Rules */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={0.5}>Auto Reply Rules</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>Create keyword based replies like your MIS setup.</Typography>

            <Stack spacing={2} mb={2}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <TextField
                  size="small"
                  label="Keyword"
                  value={ruleForm.keyword}
                  onChange={(e) => updateRuleForm('keyword', e.target.value)}
                  fullWidth
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Match Type</InputLabel>
                  <Select value={ruleForm.matchType} label="Match Type" onChange={(e) => updateRuleForm('matchType', e.target.value)}>
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="exact">Exact</MenuItem>
                    <MenuItem value="startsWith">Starts With</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth>
                  <InputLabel>Reply Mode</InputLabel>
                  <Select value={ruleForm.replyMode} label="Reply Mode" onChange={(e) => updateRuleForm('replyMode', e.target.value)}>
                    <MenuItem value="text">Text Reply</MenuItem>
                    <MenuItem value="template">Template Reply</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  type="number"
                  label="Delay (seconds)"
                  value={ruleForm.delaySeconds}
                  onChange={(e) => updateRuleForm('delaySeconds', Number(e.target.value) || 0)}
                  inputProps={{ min: 0 }}
                  fullWidth
                />
              </Box>

              {ruleForm.replyMode === 'text' ? (
                <TextField
                  multiline
                  rows={4}
                  size="small"
                  label="Reply text"
                  value={ruleForm.replyText}
                  onChange={(e) => updateRuleForm('replyText', e.target.value)}
                  fullWidth
                />
              ) : (
                <FormControl size="small" fullWidth>
                  <InputLabel>Select template</InputLabel>
                  <Select value={ruleForm.templateName} label="Select template" onChange={(e) => updateRuleForm('templateName', e.target.value)}>
                    <MenuItem value="">Select template</MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template.id || template.name} value={template.name}>{template.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant="contained"
                startIcon={ruleSaving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                onClick={handleCreateRule}
                disabled={ruleSaving}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, alignSelf: 'flex-start' }}
              >
                {ruleSaving ? 'Saving...' : 'Save Auto Reply'}
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              {rules.map((rule) => (
                <Paper key={rule._id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>{rule.keyword}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rule.matchType} • {rule.replyMode === 'template' ? rule.templateName : rule.replyText}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} flexShrink={0}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRule(rule._id)}
                        title={rule.active ? 'Disable' : 'Enable'}
                        sx={{ color: rule.active ? '#10b981' : 'text.disabled' }}
                      >
                        {rule.active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRule(rule._id)}
                        sx={{ color: '#ef4444' }}
                        title="Delete rule"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {!rules.length && (
                <Typography variant="body2" color="text.secondary">No auto reply rules yet.</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={600} mb={0.5}>Recent Messages</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>Latest WhatsApp activity for the selected number.</Typography>
            <Stack spacing={1.5} sx={{ maxHeight: 540, overflow: 'auto' }}>
              {loading && (
                <Stack alignItems="center" py={3}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" mt={1}>Loading dashboard...</Typography>
                </Stack>
              )}
              {messages.map((item) => (
                <Paper key={item._id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={0.5}>
                    <Typography variant="caption" fontWeight={600}>
                      {item.direction || 'outgoing'} • {item.messageType}
                    </Typography>
                    <Chip label={item.status} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    To: {item.to || '—'} {item.from ? `• From: ${item.from}` : ''}
                  </Typography>
                  {item.message && (
                    <Typography variant="body2" mt={0.5}>{item.message}</Typography>
                  )}
                  {item.mediaUrl && (
                    <Typography variant="caption" color="primary.main" sx={{ wordBreak: 'break-all', display: 'block', mt: 0.5 }}>
                      {item.mediaUrl}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                    {new Date(item.timestamp || item.createdAt).toLocaleString()}
                  </Typography>
                </Paper>
              ))}
              {!messages.length && !loading && (
                <Typography variant="body2" color="text.secondary">No WhatsApp messages found yet.</Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <ConnectWhatsAppModal isOpen={connectOpen} centerId={centerId} onClose={() => setConnectOpen(false)} onConnected={loadDashboard} />
    </Box>
  );
};

export default WhatsAppAdminPage;
