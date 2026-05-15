import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWhatsAppCloud } from '../context/WhatsAppCloudContext';
import { formatChatLabel } from '../utils/whatsapp';

const useWhatsAppChat = () => {
  const {
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
  } = useWhatsAppCloud();

  const [phoneInput, setPhoneInput] = useState('');

  const selectedChatId = useMemo(
    () => selectedChat?.chatId || selectedChat?.phone || selectedChat,
    [selectedChat],
  );

  const currentMessages = messages[selectedChatId] || [];

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
    }
  }, [selectedChatId, fetchMessages]);

  const createOrSelectChat = useCallback(() => {
    const nextChat = phoneInput.trim();
    if (!nextChat) return;

    const existing = chats.find((chat) => formatChatLabel(chat) === nextChat || (chat.chatId || chat.phone) === nextChat);
    const chatToSelect = existing || { chatId: nextChat, phone: nextChat };

    if (!existing) {
      setChats((prev) => [...prev, chatToSelect]);
    }

    setSelectedChat(chatToSelect);
    setPhoneInput('');
  }, [phoneInput, chats, setChats, setSelectedChat]);

  const sendMessage = useCallback(async (text) => {
    if (!selectedChatId || !text?.trim()) return;
    await sendTextMessage({ to: selectedChatId, text: text.trim() });
  }, [selectedChatId, sendTextMessage]);

  const sendImage = useCallback(async (file, caption = '') => {
    if (!selectedChatId || !file) return;
    await sendImageMessage({ to: selectedChatId, file, caption });
  }, [selectedChatId, sendImageMessage]);

  return {
    chats,
    selectedChat,
    setSelectedChat,
    selectedChatId,
    currentMessages,
    loading,
    error,
    phoneInput,
    setPhoneInput,
    createOrSelectChat,
    sendMessage,
    sendImage,
  };
};

export default useWhatsAppChat;
