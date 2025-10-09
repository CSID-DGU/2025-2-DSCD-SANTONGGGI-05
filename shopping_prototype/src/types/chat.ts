import { BaseEntity } from './index';
import { PanelData } from './panel';
import { CartUpdate } from './cart';

export interface ChatMessage extends BaseEntity {
  content: string;
  role: 'user' | 'assistant';
  type: 'text' | 'image' | 'file' | 'product' | 'action';
  metadata?: ChatMessageMetadata;
  panelData?: PanelData;
  cartUpdates?: CartUpdate[];
  attachments?: ChatAttachment[];
}

export interface ChatMessageMetadata {
  typing?: boolean;
  edited?: boolean;
  editedAt?: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'failed';
  retryCount?: number;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'product_link';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface ChatSession extends BaseEntity {
  title: string;
  messages: ChatMessage[];
  isActive: boolean;
  summary?: string;
  tags?: string[];
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

export interface ChatContextValue extends ChatState {
  sendMessage: (content: string, attachments?: ChatAttachment[]) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  createSession: (title?: string) => Promise<ChatSession>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearCurrentSession: () => void;
  markAsRead: (messageId: string) => void;
}

export interface ChatApiRequest {
  message: string;
  sessionId?: string;
  attachments?: ChatAttachment[];
  context?: {
    cartItems?: string[];
    userPreferences?: any;
    previousMessages?: number;
  };
}

export interface ChatApiResponse {
  message: ChatMessage;
  panelData?: PanelData;
  cartUpdates?: CartUpdate[];
  sessionId: string;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'add_to_cart' | 'remove_from_cart' | 'show_product' | 'navigate' | 'search';
  payload: any;
  label: string;
  icon?: string;
}