export const getMessageType = (message = {}) => {
  const explicitType = message.type || message.messageType;
  if (explicitType) return explicitType;
  if (message.mediaUrl || message.imageUrl || message.image?.url) return 'image';
  return 'text';
};

export const getMediaUrl = (message = {}) => (
  message.mediaUrl || message.imageUrl || message.image?.url || ''
);

export const getMessageText = (message = {}) => (
  message.text || message.message || message.body || ''
);

export const getChatId = (message = {}) => (
  message.chatId || message.from || message.to || message.phone || message.wa_id || ''
);

export const formatChatLabel = (chat) => {
  if (!chat) return '';
  if (typeof chat === 'string') return chat;
  return chat.name || chat.phone || chat.chatId || chat.id || 'Unknown';
};

export const normalizeMessages = (messages = []) => messages.map((message) => ({
  ...message,
  type: getMessageType(message),
  mediaUrl: getMediaUrl(message),
  text: getMessageText(message),
  chatId: getChatId(message),
}));
