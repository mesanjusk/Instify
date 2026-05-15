import ChatBox from '../components/ChatBox';
import useWhatsAppChat from '../hooks/useWhatsAppChat';
import { formatChatLabel } from '../utils/whatsapp';

const WhatsAppInbox = () => {
  const {
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
  } = useWhatsAppChat();

  return (
    <div className="h-[calc(100vh-11rem)] min-h-[500px] bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row overflow-hidden">
      <aside className="w-full md:w-80 border-r border-gray-200 bg-[#f8f9fa] flex flex-col">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <h1 className="text-lg font-semibold">WhatsApp Inbox</h1>
          <div className="flex gap-2">
            <input
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              placeholder="Enter phone number"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={createOrSelectChat}
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            >
              Open
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500 px-3 py-4">No chats yet. Open a phone number to start.</p>
          ) : (
            chats.map((chat, index) => {
              const chatId = chat.chatId || chat.phone || chat;
              const active = (selectedChat?.chatId || selectedChat?.phone || selectedChat) === chatId;
              return (
                <button
                  type="button"
                  key={`${chatId}-${index}`}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-gray-100 ${active ? 'bg-green-50' : ''}`}
                >
                  <p className="font-medium text-sm">{formatChatLabel(chat)}</p>
                  <p className="text-xs text-gray-500">{chatId}</p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <ChatBox
          messages={currentMessages}
          onSendMessage={sendMessage}
          onSendImage={sendImage}
          loading={loading}
          error={error}
          selectedChatId={selectedChatId}
        />
      </section>
    </div>
  );
};

export default WhatsAppInbox;
