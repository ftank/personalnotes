import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Menu, LogOut, Target, AlertTriangle, Loader, Plus, Search, MoreHorizontal, Sparkles, Clock, Moon, Sun, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

function Chat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messageInput, setMessageInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // Start closed on mobile
  const [isComposing, setIsComposing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const {
    conversations,
    currentConversation,
    messages,
    isTyping,
    emergencyAlert,
    loading,
    sendMessage,
    loadConversations,
    loadMessages,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    clearEmergencyAlert,
  } = useChatStore();

  const { user, logout } = useAuthStore();
  const { theme, setTheme, actualTheme } = useThemeStore();

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile, auto-open on desktop
      if (!mobile) {
        setShowSidebar(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || loading || isComposing) return;

    // Create conversation if none exists
    if (!currentConversation) {
      await createConversation('Nova Conversa');
    }

    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNewConversation = async () => {
    await createConversation('Nova Conversa');
    if (isMobile) setShowSidebar(false);
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation(); // Prevent conversation selection

    if (!window.confirm('Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteConversation(conversationId);
    } catch (error) {
      alert('Erro ao deletar conversa: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const title = (conv.title || 'Sem título').toLowerCase();
    return title.includes(query);
  });

  return (
    <div className="flex h-screen bg-white dark:bg-notion-dark-bg overflow-hidden">
      {/* Sidebar - Notion style */}
      <div
        className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-30 w-64 h-full bg-[#f7f6f3] dark:bg-notion-dark-sidebar border-r border-black/[0.06] dark:border-white/10 transition-all duration-200 ease-out flex flex-col`}
      >
        {/* Workspace Header */}
        <div className="h-[60px] flex items-center px-4 border-b border-black/[0.06] dark:border-white/10">
          <button className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md transition-colors flex-1 min-w-0">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-[#37352f] dark:text-white/90 truncate">Personal Notes</span>
          </button>
          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden p-1.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md ml-1"
          >
            <Menu className="w-4 h-4 text-[#37352f]/60 dark:text-white/60" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-[#37352f]/40 dark:text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm text-[#37352f] dark:text-white/90 placeholder-[#37352f]/40 dark:placeholder-white/40 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus:bg-white dark:focus:bg-white/[0.1] border border-transparent focus:border-[#37352f]/20 dark:focus:border-white/20 rounded-md transition-colors outline-none"
            />
          </div>
        </div>

        {/* New Note Button */}
        <div className="px-3 pb-2">
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-[#37352f] dark:text-white/90 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Nova Nota
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-3">
          <div className="px-2 py-2 text-xs font-medium text-[#37352f]/50 dark:text-white/40 uppercase tracking-wider">
            {searchQuery ? `Resultados (${filteredConversations.length})` : 'Notas Recentes'}
          </div>
          {conversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageCircle className="w-6 h-6 text-[#37352f]/20 dark:text-white/10 mx-auto mb-2" />
              <p className="text-xs text-[#37352f]/40 dark:text-white/30">Nenhuma nota</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Search className="w-6 h-6 text-[#37352f]/20 dark:text-white/10 mx-auto mb-2" />
              <p className="text-xs text-[#37352f]/40 dark:text-white/30">Nenhum resultado encontrado</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setCurrentConversation(conv);
                  if (isMobile) {
                    setShowSidebar(false);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group cursor-pointer ${
                  currentConversation?.id === conv.id
                    ? 'bg-white dark:bg-white/10 shadow-sm'
                    : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCurrentConversation(conv);
                    if (window.innerWidth < 1024) setShowSidebar(false);
                  }
                }}
              >
                <MessageCircle className={`w-4 h-4 flex-shrink-0 ${
                  currentConversation?.id === conv.id ? 'text-[#37352f] dark:text-white/90' : 'text-[#37352f]/30 dark:text-white/30'
                }`} />
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm truncate ${
                    currentConversation?.id === conv.id ? 'text-[#37352f] dark:text-white/90 font-medium' : 'text-[#37352f]/70 dark:text-white/60'
                  }`}>
                    {conv.title || 'Sem título'}
                  </div>
                  <div className="text-xs text-[#37352f]/40 dark:text-white/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(conv.updated_at)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Deletar conversa"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* User Section */}
        <div className="border-t border-black/[0.06] dark:border-white/10 p-4 space-y-0.5">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352f] dark:text-white/90 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md transition-colors"
          >
            <Target className="w-4 h-4" />
            <span>Objetivos</span>
          </button>
          <button
            onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352f] dark:text-white/90 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md transition-colors"
          >
            {actualTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{actualTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="px-3 py-2 text-xs text-[#37352f]/50 dark:text-white/40 truncate">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#37352f]/60 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 bg-black/30 z-20 backdrop-blur-sm"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-notion-dark-bg">
        {/* Top Bar */}
        <div className="h-[60px] flex items-center px-6 sm:px-8 md:px-10 lg:px-12 border-b border-black/[0.06] dark:border-white/10 relative z-10">
          {isMobile && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-md mr-3 transition-colors"
              aria-label={showSidebar ? "Fechar menu" : "Abrir menu"}
            >
              <Menu className="w-5 h-5 text-[#37352f] dark:text-white/90" />
            </button>
          )}

          {currentConversation && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageCircle className="w-4 h-4 text-[#37352f]/40 dark:text-white/40 flex-shrink-0" />
              <h1 className="text-sm font-medium text-[#37352f] dark:text-white/90 truncate">
                {currentConversation.title || 'Sem título'}
              </h1>
            </div>
          )}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-[#37352f]/50 dark:text-white/50 ml-auto">
              <Loader className="w-3 h-3 animate-spin" />
              <span>Digitando...</span>
            </div>
          )}
        </div>

        {/* Emergency Alert */}
        {emergencyAlert && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/30">
            <div className="max-w-4xl mx-auto px-6 py-5 sm:px-8 sm:py-6 md:px-12 md:py-7 lg:px-16 lg:py-8 flex items-start gap-5">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  {emergencyAlert.risk_level === 'high' && 'Situação de Risco Detectada'}
                  {emergencyAlert.risk_level === 'medium' && 'Atenção Necessária'}
                  {emergencyAlert.risk_level === 'low' && 'Apoio Disponível'}
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300 mb-3">{emergencyAlert.message}</p>
                {emergencyAlert.resources && emergencyAlert.resources.length > 0 && (
                  <div className="text-xs text-red-800 dark:text-red-200 bg-white/50 dark:bg-white/10 rounded-lg p-3">
                    <p className="font-medium mb-2">Recursos disponíveis:</p>
                    <ul className="space-y-1">
                      {emergencyAlert.resources.map((resource, idx) => (
                        <li key={idx}>
                          <strong>{resource.name}:</strong> {resource.phone}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={clearEmergencyAlert}
                className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentConversation ? (
            <div className="h-full flex items-center justify-center px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 rounded-xl bg-[#f7f6f3] dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-[#37352f]/30 dark:text-white/30" />
                </div>
                <h2 className="text-xl font-semibold text-[#37352f] dark:text-white/90 mb-2">
                  Bem-vindo ao Personal Notes
                </h2>
                <p className="text-sm text-[#37352f]/50 dark:text-white/50 mb-6">
                  Crie uma nova nota para começar a conversar com sua assistente pessoal
                </p>
                <button
                  onClick={handleNewConversation}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#37352f] dark:bg-white/90 text-white dark:text-[#191919] text-sm font-medium rounded-md hover:bg-[#37352f]/90 dark:hover:bg-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Nota
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center px-6 sm:px-8 md:px-12 lg:px-16">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#f7f6f3] dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="w-6 h-6 text-[#37352f]/30 dark:text-white/30" />
                </div>
                <p className="text-sm text-[#37352f]/50 dark:text-white/50">
                  Digite sua primeira mensagem abaixo
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 space-y-8 sm:space-y-10 md:space-y-12">
              {messages.map((message, idx) => (
                <div
                  key={message.id || idx}
                  className={`flex gap-5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : 'bg-[#f7f6f3] dark:bg-white/10 text-[#37352f]/60 dark:text-white/60'
                  }`}>
                    {message.role === 'user' ? user?.email?.[0]?.toUpperCase() : 'AI'}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block max-w-[85%] ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`px-5 py-4 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-[#f7f6f3] dark:bg-white/10 text-[#37352f] dark:text-white/90'
                          : 'text-[#37352f] dark:text-white/90'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Customize link behavior
                                a: ({ node, ...props }) => (
                                  <a {...props} target="_blank" rel="noopener noreferrer" />
                                ),
                                // Ensure code blocks have proper styling
                                code: ({ node, inline, className, children, ...props }) => {
                                  return inline ? (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}
                      </div>
                      {message.timestamp && (
                        <div className="text-[10px] text-[#37352f]/30 dark:text-white/30 mt-2 px-1">
                          {formatTime(message.timestamp)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-5 flex-row animate-fade-in">
                  {/* AI Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium bg-[#f7f6f3] dark:bg-white/10 text-[#37352f]/60 dark:text-white/60">
                    AI
                  </div>

                  {/* Typing Dots */}
                  <div className="flex-1 text-left">
                    <div className="inline-block">
                      <div className="bg-[#f7f6f3] dark:bg-white/10 px-5 py-4 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-[#37352f]/40 dark:bg-white/40 rounded-full typing-dot"></div>
                          <div className="w-2 h-2 bg-[#37352f]/40 dark:bg-white/40 rounded-full typing-dot"></div>
                          <div className="w-2 h-2 bg-[#37352f]/40 dark:bg-white/40 rounded-full typing-dot"></div>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#37352f]/30 dark:text-white/30 mt-2 px-1">
                        Pensando...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Notion style */}
        <div className="border-t border-black/[0.06] dark:border-white/10">
          <div className="max-w-4xl mx-auto px-6 py-5 sm:px-8 sm:py-6 md:px-10 md:py-7 lg:px-16 lg:py-8">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder={currentConversation ? "Escreva uma mensagem..." : "Escreva sua primeira mensagem..."}
                  disabled={isTyping}
                  rows={1}
                  className="w-full px-6 py-5 pr-16 border border-black/[0.1] dark:border-white/10 rounded-lg focus:outline-none focus:border-black/[0.2] dark:focus:border-white/20 disabled:bg-[#f7f6f3] dark:disabled:bg-white/5 disabled:cursor-not-allowed resize-none text-sm text-[#37352f] dark:text-white/90 placeholder-[#37352f]/30 dark:placeholder-white/30 bg-white dark:bg-notion-dark-bg transition-colors"
                  style={{ minHeight: '56px', maxHeight: '140px' }}
                />
                <button
                  type="submit"
                  disabled={isTyping || !messageInput.trim() || isComposing}
                  className="absolute right-4 bottom-4 p-3 bg-[#37352f] dark:bg-white/90 text-white dark:text-[#191919] rounded-lg hover:bg-[#37352f]/90 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isTyping ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
