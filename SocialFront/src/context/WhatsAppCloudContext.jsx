import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { whatsappApi } from '../apiClient';
import { normalizeMessages } from '../utils/whatsapp';

const WhatsAppCloudContext = createContext(null);

export const WhatsAppCloudProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) return [];

    setError('');
    setLoading(true);
    try {
      const { data } = await whatsappApi.getMessages({ chatId });
      const rawMessages = data?.messages || data || [];
      const normalized = normalizeMessages(rawMessages);

      setMessages((prev) => ({ ...prev, [chatId]: normalized }));
      setChats((prev) => {
        if (prev.some((chat) => (chat.chatId || chat) === chatId)) return prev;
        return [...prev, { chatId, phone: chatId }];
      });

      return normalized;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch messages');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTextMessage = useCallback(async ({ to, text }) => {
    if (!to || !text) return null;

    setError('');
    setLoading(true);
    try {
      const { data } = await whatsappApi.sendText({ to, text });
      const outgoing = {
        chatId: to,
        to,
        text,
        type: 'text',
        direction: 'outgoing',
        createdAt: new Date().toISOString(),
        ...(data?.message || {}),
      };

      setMessages((prev) => ({
        ...prev,
        [to]: [...(prev[to] || []), outgoing],
      }));

      setChats((prev) => {
        if (prev.some((chat) => (chat.chatId || chat) === to)) return prev;
        return [...prev, { chatId: to, phone: to }];
      });

      return data;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send text message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendImageMessage = useCallback(async ({ to, file, caption }) => {
    if (!to || !file) return null;

    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('to', to);
      formData.append('image', file);
      if (caption) {
        formData.append('caption', caption);
      }

      const { data } = await whatsappApi.sendImage(formData);
      const outgoing = {
        chatId: to,
        to,
        text: caption || '',
        type: 'image',
        mediaUrl: data?.mediaUrl || URL.createObjectURL(file),
        direction: 'outgoing',
        createdAt: new Date().toISOString(),
        ...(data?.message || {}),
      };

      setMessages((prev) => ({
        ...prev,
        [to]: [...(prev[to] || []), outgoing],
      }));

      setChats((prev) => {
        if (prev.some((chat) => (chat.chatId || chat) === to)) return prev;
        return [...prev, { chatId: to, phone: to }];
      });

      return data;
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send image message');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    chats,
    messages,
    selectedChat,
    setSelectedChat,
    fetchMessages,
    sendTextMessage,
    sendImageMessage,
    loading,
    error,
    setChats,
  }), [chats, messages, selectedChat, fetchMessages, sendTextMessage, sendImageMessage, loading, error]);

  return (
    <WhatsAppCloudContext.Provider value={value}>
      {children}
    </WhatsAppCloudContext.Provider>
  );
};

export const useWhatsAppCloud = () => {
  const context = useContext(WhatsAppCloudContext);
  if (!context) {
    throw new Error('useWhatsAppCloud must be used within WhatsAppCloudProvider');
  }
  return context;
};
