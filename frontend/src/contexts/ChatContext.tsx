import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { ChatState, ChatContextValue, ChatMessage, ChatSession, ChatAttachment } from '../types/chat';
import { chatApi } from '../services/api/chat';
import { useAuth } from './AuthContext';
import { usePanel } from './PanelContext';
import { useCart } from './CartContext';

// Sample messages for testing mockup design
const sampleSession: ChatSession = {
  id: 'sample-session-1',
  title: '쇼핑 상담',
  messages: [
    {
      id: 'msg-1',
      content: '안녕하세요! 무엇을 도와드릴까요?',
      role: 'assistant',
      type: 'text',
      createdAt: new Date(Date.now() - 300000), // 5 minutes ago
      updatedAt: new Date(Date.now() - 300000),
      metadata: { status: 'delivered' }
    },
    {
      id: 'msg-2',
      content: '총인님에게 적합한 상품을 추천해 드릴게요!',
      role: 'assistant',
      type: 'text',
      createdAt: new Date(Date.now() - 240000), // 4 minutes ago
      updatedAt: new Date(Date.now() - 240000),
      metadata: { status: 'delivered' }
    },
    {
      id: 'msg-3',
      content: '나 물 6개 사야 될 것 같아',
      role: 'user',
      type: 'text',
      createdAt: new Date(Date.now() - 180000), // 3 minutes ago
      updatedAt: new Date(Date.now() - 180000),
      metadata: { status: 'sent' }
    },
    {
      id: 'msg-4',
      content: '내 장바구니 불러워줘',
      role: 'user',
      type: 'text',
      createdAt: new Date(Date.now() - 120000), // 2 minutes ago
      updatedAt: new Date(Date.now() - 120000),
      metadata: { status: 'sent' }
    },
    {
      id: 'msg-5',
      content: '장바구니를 확인했습니다',
      role: 'assistant',
      type: 'text',
      createdAt: new Date(Date.now() - 60000), // 1 minute ago
      updatedAt: new Date(Date.now() - 60000),
      metadata: { status: 'delivered' }
    }
  ],
  createdAt: new Date(Date.now() - 360000), // 6 minutes ago
  updatedAt: new Date(Date.now() - 60000),
  metadata: {
    totalMessages: 5,
    lastActivity: new Date(Date.now() - 60000)
  }
};

// Initial state with sample data
const initialState: ChatState = {
  currentSession: sampleSession,
  sessions: [sampleSession],
  isLoading: false,
  isTyping: false,
  error: null,
  connectionStatus: 'connected',
};

// Action types
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' | 'error' }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession | null }
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'ADD_MESSAGE'; payload: { sessionId: string; message: ChatMessage } }
  | { type: 'UPDATE_MESSAGE'; payload: { sessionId: string; messageId: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: { sessionId: string; messageId: string } }
  | { type: 'ADD_SESSION'; payload: ChatSession }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'CLEAR_CURRENT_SESSION' };

// Reducer
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };

    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };

    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };

    case 'ADD_MESSAGE':
      const { sessionId, message } = action.payload;
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? { ...session, messages: [...session.messages, message] }
            : session
        ),
        currentSession: state.currentSession?.id === sessionId
          ? { ...state.currentSession, messages: [...state.currentSession.messages, message] }
          : state.currentSession,
      };

    case 'UPDATE_MESSAGE':
      const { messageId, updates } = action.payload;
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                )
              }
            : session
        ),
        currentSession: state.currentSession?.id === action.payload.sessionId
          ? {
              ...state.currentSession,
              messages: state.currentSession.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              )
            }
          : state.currentSession,
      };

    case 'DELETE_MESSAGE':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.sessionId
            ? {
                ...session,
                messages: session.messages.filter(msg => msg.id !== action.payload.messageId)
              }
            : session
        ),
        currentSession: state.currentSession?.id === action.payload.sessionId
          ? {
              ...state.currentSession,
              messages: state.currentSession.messages.filter(msg => msg.id !== action.payload.messageId)
            }
          : state.currentSession,
      };

    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [action.payload, ...state.sessions],
      };

    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload ? null : state.currentSession,
      };

    case 'CLEAR_CURRENT_SESSION':
      return {
        ...state,
        currentSession: null,
      };

    default:
      return state;
  }
};

// Context
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const { showPanel } = usePanel();
  const { addItem, updateQuantity } = useCart();

  // Initialize chat sessions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadChatSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]); // loadChatSessions is intentionally not in deps

  // Load chat sessions
  const loadChatSessions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatApi.getSessions();
      dispatch({ type: 'SET_SESSIONS', payload: response.data });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Send message
  const sendMessage = async (content: string, attachments?: ChatAttachment[]) => {
    if (!state.currentSession) {
      // Create new session if none exists
      await createSession();
    }

    const sessionId = state.currentSession!.id;

    // Create optimistic user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      role: 'user',
      type: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
      attachments,
      metadata: { status: 'sending' }
    };

    // Add user message immediately
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { sessionId, message: userMessage }
    });

    try {
      dispatch({ type: 'SET_TYPING', payload: true });

      const response = await chatApi.sendMessage({
        message: content,
        sessionId,
        attachments,
        context: {
          cartItems: [],
          userPreferences: user?.preferences,
        }
      });

      // Update user message status
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          sessionId,
          messageId: userMessage.id,
          updates: {
            id: response.data.message.id || userMessage.id,
            metadata: { status: 'sent' }
          }
        }
      });

      // Add assistant response
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          sessionId,
          message: response.data.message
        }
      });

      // Handle panel data if present
      if (response.data.panelData) {
        showPanel(response.data.panelData);
      }

      // Handle cart updates if present
      if (response.data.cartUpdates) {
        for (const update of response.data.cartUpdates) {
          switch (update.type) {
            case 'add':
              if (update.productId) {
                await addItem(update.productId, update.quantity || 1, update.variantId);
              }
              break;
            case 'update_quantity':
              if (update.itemId && update.quantity) {
                await updateQuantity(update.itemId, update.quantity);
              }
              break;
          }
        }
      }

    } catch (error: any) {
      // Update message status to failed
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          sessionId,
          messageId: userMessage.id,
          updates: {
            metadata: { status: 'failed' }
          }
        }
      });

      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  };

  // Retry failed message
  const retryMessage = async (messageId: string) => {
    const session = state.currentSession;
    if (!session) return;

    const message = session.messages.find(msg => msg.id === messageId);
    if (!message || message.role !== 'user') return;

    await sendMessage(message.content, message.attachments);
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    const session = state.currentSession;
    if (!session) return;

    try {
      await chatApi.editMessage(messageId, newContent);

      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          sessionId: session.id,
          messageId,
          updates: {
            content: newContent,
            metadata: { edited: true, editedAt: new Date() }
          }
        }
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    const session = state.currentSession;
    if (!session) return;

    try {
      await chatApi.deleteMessage(messageId);

      dispatch({
        type: 'DELETE_MESSAGE',
        payload: { sessionId: session.id, messageId }
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Create new session
  const createSession = async (title?: string): Promise<ChatSession> => {
    try {
      const response = await chatApi.createSession(title);
      const newSession = response.data;

      dispatch({ type: 'ADD_SESSION', payload: newSession });
      dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession });

      return newSession;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Switch to different session
  const switchSession = async (sessionId: string) => {
    try {
      const session = state.sessions.find(s => s.id === sessionId);
      if (session) {
        dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      } else {
        // Load session from API if not in local state
        const response = await chatApi.getSession(sessionId);
        dispatch({ type: 'SET_CURRENT_SESSION', payload: response.data });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId);
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Clear current session
  const clearCurrentSession = () => {
    dispatch({ type: 'CLEAR_CURRENT_SESSION' });
  };

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    // Implementation for read receipts if needed
    console.log('Marking message as read:', messageId);
  }, []);

  const contextValue: ChatContextValue = {
    ...state,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    createSession,
    switchSession,
    deleteSession,
    clearCurrentSession,
    markAsRead,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook to use chat context
export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};