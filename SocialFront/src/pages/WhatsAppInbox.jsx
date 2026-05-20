import { Avatar, Box, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
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
    <Box
      sx={{
        height: { xs: 'calc(100vh - 10rem)', md: 'calc(100vh - 8rem)' },
        minHeight: 500,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar — chat list */}
      <Box
        component="aside"
        sx={{
          width: { xs: '100%', md: 300 },
          flexShrink: 0,
          borderRight: { md: '1px solid #e2e8f0' },
          borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
          bgcolor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: { xs: 220, md: '100%' },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <WhatsAppIcon sx={{ color: '#25d366', fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={700}>WhatsApp Inbox</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter phone number"
              size="small"
              fullWidth
              onKeyDown={(e) => e.key === 'Enter' && createOrSelectChat()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
            />
            <Button
              onClick={createOrSelectChat}
              size="small"
              sx={{
                minWidth: 'auto',
                px: 2,
                bgcolor: '#25d366',
                '&:hover': { bgcolor: '#1ebe57' },
                flexShrink: 0,
              }}
            >
              Open
            </Button>
          </Stack>
        </Box>

        {/* Chat list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
              <WhatsAppIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                No chats yet. Open a phone number to start.
              </Typography>
            </Box>
          ) : (
            chats.map((chat, index) => {
              const chatId = chat.chatId || chat.phone || chat;
              const active = (selectedChat?.chatId || selectedChat?.phone || selectedChat) === chatId;
              return (
                <Box key={`${chatId}-${index}`}>
                  <Box
                    component="button"
                    onClick={() => setSelectedChat(chat)}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      px: 2,
                      py: 1.5,
                      border: 'none',
                      borderRadius: 0,
                      cursor: 'pointer',
                      bgcolor: active ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.12s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&:hover': { bgcolor: active ? '#f0fdf4' : '#f1f5f9' },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36, height: 36, flexShrink: 0,
                        bgcolor: active ? '#25d366' : '#e2e8f0',
                        fontSize: '0.8rem', fontWeight: 700,
                        color: active ? '#fff' : '#64748b',
                      }}
                    >
                      {(formatChatLabel(chat) || '?')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={active ? 700 : 500} noWrap sx={{ fontSize: '0.825rem' }}>
                        {formatChatLabel(chat)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                        {chatId}
                      </Typography>
                    </Box>
                    {active && (
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#25d366', ml: 'auto', flexShrink: 0 }} />
                    )}
                  </Box>
                  <Divider sx={{ mx: 2 }} />
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* Main chat area */}
      <Box component="section" sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <ChatBox
          messages={currentMessages}
          onSendMessage={sendMessage}
          onSendImage={sendImage}
          loading={loading}
          error={error}
          selectedChatId={selectedChatId}
        />
      </Box>
    </Box>
  );
};

export default WhatsAppInbox;
