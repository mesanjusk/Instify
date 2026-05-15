import { useEffect, useRef, useState } from 'react';
import { downloadImage, openImageInNewTab } from '../utils/whatsappWindow';

const ChatBox = ({ messages, onSendMessage, onSendImage, loading, error, selectedChatId }) => {
  const [text, setText] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const messageListRef = useRef(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl('');
    return undefined;
  }, [file]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    await onSendMessage(text);
    setText('');
  };

  const handleSendImage = async () => {
    if (!file) return;
    await onSendImage(file, caption);
    setFile(null);
    setCaption('');
  };

  if (!selectedChatId) {
    return <div className="h-full flex items-center justify-center text-gray-500">Select or create a chat to start messaging.</div>;
  }

  return (
    <div className="h-full flex flex-col bg-[#efeae2] rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-[#f0f2f5] border-b border-gray-200 font-semibold">
        {selectedChatId}
      </div>

      <div ref={messageListRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => {
          const isOutgoing = message.direction === 'outgoing' || message.to === selectedChatId;
          return (
            <div
              key={`${message.id || index}-${message.createdAt || ''}`}
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${isOutgoing ? 'ml-auto bg-[#d9fdd3]' : 'bg-white'}`}
            >
              {message.type === 'image' && message.mediaUrl ? (
                <div className="space-y-2">
                  <img
                    src={message.mediaUrl}
                    alt="img"
                    style={{ width: '200px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => openImageInNewTab(message.mediaUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => downloadImage(message.mediaUrl, `image-${index + 1}.jpg`)}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    Download
                  </button>
                </div>
              ) : (
                <p className="text-sm break-words">{message.text}</p>
              )}

              {message.type === 'image' && message.text ? (
                <p className="text-sm mt-2 break-words">{message.text}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 bg-white p-3 space-y-2">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {previewUrl ? (
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border">
            <img src={previewUrl} alt="preview" className="w-16 h-16 rounded object-cover" />
            <input
              type="text"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Add caption (optional)"
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={handleSendImage}
              disabled={loading}
              className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-70"
            >
              {loading ? 'Sending...' : 'Send Image'}
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSend} className="flex flex-wrap md:flex-nowrap gap-2">
          <label className="px-3 py-2 rounded bg-gray-200 cursor-pointer text-sm hover:bg-gray-300">
            Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Type a message"
            className="flex-1 border rounded px-3 py-2 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-70"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
