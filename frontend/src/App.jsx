import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import InputBar from './components/InputBar';
import ChatMessage from './components/ChatMessage';
import AuthModal from './components/AuthModal';
import ExploreView from './components/ExploreView';
import LibraryView from './components/LibraryView';
import SettingsView from './components/SettingsView';
import { CenterHeroMark, OrganicWaves } from './components/BrandLogo';
import {
  authService,
  fetchConversations,
  createConversation,
  fetchConversationDetail,
  renameConversation,
  deleteConversation,
  sendMessage,
  uploadMediaFile,
  fetchNotifications,
  markNotificationsRead,
  logoutUser
} from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('chat');
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let currentUser = authService.getUser();
    if (!currentUser) {
      currentUser = { name: 'Shalika', email: 'shalika@nexora.ai' };
      authService.setUser(currentUser);
    }
    setUser(currentUser);
    loadConversations(currentUser.email);
    loadNotifications(currentUser.email);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async (email) => {
    try {
      const convs = await fetchConversations(email);
      setConversations(convs);
    } catch {}
  };

  const loadNotifications = async (email) => {
    try {
      const notifs = await fetchNotifications(email);
      setNotifications(notifs);
    } catch {}
  };

  const handleSelectConv = async (convId) => {
    setActiveConvId(convId);
    try {
      const detail = await fetchConversationDetail(convId);
      setMessages(detail.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setActiveNav('chat');
  };

  const handleRenameConv = async (convId, newTitle) => {
    try {
      await renameConversation(convId, newTitle);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: newTitle } : c));
    } catch {}
  };

  const handleDeleteConv = async (convId) => {
    try {
      await deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch {}
  };

  const handleSendMessage = async (text, attachments = []) => {
    let currentConvId = activeConvId;

    if (!currentConvId) {
      try {
        const titleSnippet = (text || (attachments[0]?.file_name || "Conversation")).split(' ').slice(0, 4).join(' ');
        const newConv = await createConversation(user?.email || 'guest@nexora.ai', titleSnippet);
        currentConvId = newConv.id;
        setActiveConvId(newConv.id);
        setConversations(prev => [newConv, ...prev]);
      } catch (err) {
        alert("Failed to start chat: " + err.message);
        return;
      }
    }

    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text || (attachments[0]?.file_name || "Attached media"),
      modality: attachments.length > 0 ? attachments[0].file_type : 'text',
      media_url: attachments.length > 0 ? attachments[0].file_url : null,
      attachments_data: attachments,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const response = await sendMessage(currentConvId, text, attachments);
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        response.user_message,
        response.assistant_message
      ]);
      loadConversations(user?.email || 'guest@nexora.ai');
      loadNotifications(user?.email || 'guest@nexora.ai');
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: "I encountered a network issue while processing your request. Please try again.",
          modality: 'text',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file, type) => {
    return await uploadMediaFile(file, type, user?.email || 'guest@nexora.ai');
  };

  const handleSelectPrompt = (prompt) => {
    handleNewChat();
    handleSendMessage(prompt);
  };

  const handleSignOut = async () => {
    await logoutUser();
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (newUser) => {
    setUser(newUser);
    loadConversations(newUser.email);
    loadNotifications(newUser.email);
    handleNewChat();
  };

  const handleMarkNotificationsRead = async () => {
    if (user?.email) {
      await markNotificationsRead(user.email);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        conversations={conversations}
        activeConvId={activeConvId}
        onSelectConv={handleSelectConv}
        onNewChat={handleNewChat}
        onRenameConv={handleRenameConv}
        onDeleteConv={handleDeleteConv}
      />

      <main style={{
        flex: 1,
        height: '100vh',
        position: 'relative',
        backgroundColor: '#FAF0EA',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <OrganicWaves />

        <Header
          user={user}
          onSignOut={handleSignOut}
          notifications={notifications}
          onMarkNotificationsRead={handleMarkNotificationsRead}
        />

        {activeNav === 'explore' && (
          <div style={{ flex: 1, position: 'relative', zIndex: 10, overflow: 'hidden' }}>
            <ExploreView onSelectPrompt={handleSelectPrompt} />
          </div>
        )}

        {activeNav === 'library' && (
          <div style={{ flex: 1, position: 'relative', zIndex: 10, overflow: 'hidden' }}>
            <LibraryView user={user} />
          </div>
        )}

        {activeNav === 'settings' && (
          <div style={{ flex: 1, position: 'relative', zIndex: 10, overflow: 'hidden' }}>
            <SettingsView user={user} onSignOut={handleSignOut} conversations={conversations} />
          </div>
        )}

        {activeNav === 'chat' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10,
            overflow: 'hidden',
            padding: '24px 24px 28px 24px'
          }}>
            {(!activeConvId || messages.length === 0) ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '-30px'
              }}>
                <CenterHeroMark />
              </div>
            ) : (
              <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: '12px',
                paddingBottom: '24px',
                marginTop: '40px'
              }}>
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onRegenerate={() => {
                      const lastUser = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUser) handleSendMessage(lastUser.content);
                    }}
                  />
                ))}

                {loading && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    width: 'fit-content',
                    border: '1px solid #EFE3DA',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    margin: '0 auto 16px 0',
                    maxWidth: '780px'
                  }}>
                    <span style={{ fontSize: '13px', color: '#6E6259', fontWeight: '500' }}>NexoraAI is thinking</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C2693F', display: 'inline-block' }} />
                      <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C2693F', display: 'inline-block' }} />
                      <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C2693F', display: 'inline-block' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <div style={{ width: '100%', marginTop: 'auto', paddingTop: '10px' }}>
              <InputBar
                onSendMessage={handleSendMessage}
                onUploadFile={handleUploadFile}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
