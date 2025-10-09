import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat } from '../../../contexts/AppProvider';
import { ChatMessages } from '../ChatMessages/ChatMessages';
import { TypingIndicator } from '../TypingIndicator/TypingIndicator';
import { ChatAttachment } from '../../../types/chat';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Find me wireless headphones under $100",
  "What are the best laptops for students?",
  "Show me trending fashion items",
  "Help me plan a gift for my mom",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const {
    currentSession,
    isLoading,
    isTyping,
    error,
    connectionStatus,
    sendMessage,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    if (isLoading || isTyping) return;

    try {
      await sendMessage(inputValue.trim(), attachments);
      setInputValue('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle key press in textarea
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file attachment
  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: ChatAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  // Remove attachment
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-send the suggestion
    try {
      await sendMessage(suggestion);
      setInputValue('');
    } catch (error) {
      console.error('Failed to send suggestion:', error);
    }
  };




  const interfaceClasses = [
    styles.chatInterface,
    className,
  ].filter(Boolean).join(' ');

  const messages = currentSession?.messages || [];
  const hasMessages = messages.length > 0;
  const canSend = inputValue.trim().length > 0 || attachments.length > 0;

  return (
    <div className={interfaceClasses} role="region" aria-label="Chat Interface">
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className={`${styles.connectionStatus} ${styles[connectionStatus]}`}>
          {connectionStatus === 'connecting' && 'Connecting...'}
          {connectionStatus === 'disconnected' && 'Disconnected - Attempting to reconnect'}
          {connectionStatus === 'error' && 'Connection error - Please check your internet'}
        </div>
      )}

      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div>
          <h1 className={styles.headerTitle}>쇼비자 맞춤형 쇼핑 비서 서비스</h1>
          <p className={styles.headerSubtitle}>실시간 상품 추천 채팅</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer} role="log" aria-live="polite">
        {hasMessages ? (
          <>
            <ChatMessages messages={messages} />
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              💬
            </div>
            <h2 className={styles.emptyStateTitle}>Welcome to Shopping Assistant</h2>
            <p className={styles.emptyStateDescription}>
              I'm here to help you find products, compare prices, and make informed shopping decisions.
              Ask me anything about products you're looking for!
            </p>
            <div className={styles.emptyStateSuggestions}>
              {SUGGESTED_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  className={styles.suggestionButton}
                  onClick={() => handleSuggestionClick(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator isVisible={isTyping} />}
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className={styles.attachmentsPreview}>
            {attachments.map(attachment => (
              <div key={attachment.id} className={styles.attachment}>
                <span className={styles.attachmentName}>{attachment.name}</span>
                <button
                  className={styles.removeAttachment}
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label={`Remove ${attachment.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textInput}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading || isTyping}
            rows={1}
            aria-label="Message input"
          />

          <div className={styles.inputActions}>
            <button
              className={styles.attachButton}
              onClick={handleFileAttach}
              disabled={isLoading || isTyping}
              aria-label="Attach file"
              title="Attach file"
            >
              📎
            </button>

            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!canSend || isLoading || isTyping}
              aria-label="Send message"
              title="Send message"
            >
              {isLoading || isTyping ? '⏳' : '➤'}
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>


      {/* Error Display */}
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

    </div>
  );
};

export default ChatInterface;