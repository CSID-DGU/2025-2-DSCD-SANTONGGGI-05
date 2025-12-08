import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import {
  ChatState,
  ChatContextValue,
  ChatMessage,
  ChatSession,
  RecommendationProduct,
} from '../types/chat';
import { chatApi } from '../services/api/chat';
import { useAuth } from './AuthContext';

// Initial empty session (messages will be loaded from API)
const emptySession: ChatSession = {
  id: 'session-1',
  title: '쇼핑 상담',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Initial state - messages will be loaded from API after login
const initialState: ChatState = {
  currentSession: emptySession,
  sessions: [emptySession],
  isLoading: false,
  isTyping: false,
  error: null,
  connectionStatus: 'connected',
  isRecommendationModalOpen: false,
  recommendationProducts: [],
};

// Action types (ERD 기반 단순화)
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTION_STATUS'; payload: 'connected' | 'connecting' | 'disconnected' | 'error' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { messageId: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_CURRENT_SESSION' }
  | { type: 'OPEN_RECOMMENDATION_MODAL'; payload: RecommendationProduct[] }
  | { type: 'CLOSE_RECOMMENDATION_MODAL' };

// Reducer (ERD 기반 단순화)
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

    case 'ADD_MESSAGE':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, messages: [...state.currentSession.messages, action.payload] }
          : state.currentSession,
      };

    case 'UPDATE_MESSAGE':
      const { messageId, updates } = action.payload;
      return {
        ...state,
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              messages: state.currentSession.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              )
            }
          : state.currentSession,
      };

    case 'SET_MESSAGES':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, messages: action.payload }
          : state.currentSession,
      };

    case 'CLEAR_CURRENT_SESSION':
      return {
        ...state,
        currentSession: null,
      };

    case 'OPEN_RECOMMENDATION_MODAL':
      return {
        ...state,
        isRecommendationModalOpen: true,
        recommendationProducts: action.payload,
      };

    case 'CLOSE_RECOMMENDATION_MODAL':
      return {
        ...state,
        isRecommendationModalOpen: false,
        recommendationProducts: [],
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

  // Load chat history when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Load chat history (GET /api/chat/history)
  const loadHistory = useCallback(async () => {
    if (!user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatApi.getHistory(user.id);

      if (!response.success || !response.data) {
        const message = response.error || '채팅 기록을 불러오지 못했습니다.';
        dispatch({ type: 'SET_ERROR', payload: message });
        return;
      }

      // ERD API 응답을 프론트엔드 메시지 형식으로 변환
      const messages: ChatMessage[] = [];

      response.data.messages.forEach(msg => {
        // User message 추가 (message가 비어있지 않을 때만)
        if (msg.message && msg.message.trim()) {
          messages.push({
            id: `msg-${msg.id}`,
            content: msg.message,
            role: 'user' as const,
            type: 'text' as const,
            createdAt: new Date(msg.timestamp),
            updatedAt: new Date(msg.timestamp),
            status: 'sent' as const
          });
        }

        // AI message 추가 (ai_message가 비어있지 않을 때만)
        if (msg.ai_message && msg.ai_message.trim()) {
          messages.push({
            id: `ai-msg-${msg.id}`,
            content: msg.ai_message,
            role: 'assistant' as const,
            type: 'text' as const,
            createdAt: new Date(msg.timestamp),
            updatedAt: new Date(msg.timestamp),
            status: 'delivered' as const
          });
        }
      });

      dispatch({ type: 'SET_MESSAGES', payload: messages });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  // Send message (POST /api/chat/messages)
  const sendMessage = useCallback(async (content: string, onRecommendation?: (products: any[]) => void) => {
    if (!user) {
      dispatch({ type: 'SET_ERROR', payload: '로그인이 필요합니다' });
      return;
    }

    // Create optimistic user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      role: 'user',
      type: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'sending'
    };

    // Add user message immediately
    dispatch({
      type: 'ADD_MESSAGE',
      payload: userMessage
    });

    try {
      dispatch({ type: 'SET_TYPING', payload: true });

      // ERD API 호출
      const response = await chatApi.sendMessage(user.id, content);

      if (!response.success || !response.data) {
        throw new Error(response.error || '메시지 전송에 실패했습니다.');
      }

      // Update user message status
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          messageId: userMessage.id,
          updates: { status: 'sent' }
        }
      });

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: response.data.ai_message,
        role: 'assistant',
        type: response.data.type === 1 ? 'product' : response.data.type === 2 ? 'statistics' : 'text',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'delivered'
      };

      dispatch({
        type: 'ADD_MESSAGE',
        payload: aiMessage
      });

      // Handle product recommendations
      if (response.data.type === 1 && response.data.recommendationItems.length > 0) {
        const products = response.data.recommendationItems as RecommendationProduct[];
        const isCustomRecommendation = products.some(
          (item) =>
            (typeof item.savings_ratio_pct === 'number' && item.savings_ratio_pct > 0) ||
            typeof item.similarity === 'number',
        );

        if (isCustomRecommendation) {
          onRecommendation?.(products);
        } else {
          dispatch({ type: 'OPEN_RECOMMENDATION_MODAL', payload: products });
        }
      }
    } catch (error: any) {
      // Update message status to failed
      dispatch({
        type: 'UPDATE_MESSAGE',
        payload: {
          messageId: userMessage.id,
          updates: { status: 'failed' }
        }
      });

      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  }, [user]);

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT_SESSION' });
  }, []);

  const closeRecommendationModal = useCallback(() => {
    dispatch({ type: 'CLOSE_RECOMMENDATION_MODAL' });
  }, []);

  const contextValue: ChatContextValue = {
    ...state,
    sendMessage,
    clearCurrentSession,
    loadHistory,
    closeRecommendationModal,
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
