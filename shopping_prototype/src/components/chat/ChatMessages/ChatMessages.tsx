import React from 'react';
import styles from './ChatMessages.module.css';

// Import from types
import { ChatMessage } from '../../../types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading = false }) => {
  const formatTime = (timestamp: Date | string): string => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageAvatar = (role: 'user' | 'assistant'): string => {
    return role === 'user' ? '👤' : '🤖';
  };

  const groupConsecutiveMessages = (messages: ChatMessage[]): ChatMessage[][] => {
    const groups: ChatMessage[][] = [];
    let currentGroup: ChatMessage[] = [];
    let lastRole: 'user' | 'assistant' | null = null;

    messages.forEach((message) => {
      if (message.role !== lastRole) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [message];
        lastRole = message.role;
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const messageGroups = groupConsecutiveMessages(messages);

  const handleCopyMessage = async (content: string): Promise<void> => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      }
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRegenerateResponse = (): void => {
    // TODO: Implement regenerate response functionality
    console.log('Regenerate response clicked');
  };

  return (
    <div className={styles.chatMessages} role="log" aria-live="polite">
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex} className={styles.messageGroup}>
          {group.map((message, messageIndex) => {
            const isUser = message.role === 'user';
            const isLastInGroup = messageIndex === group.length - 1;
            const showAvatar = messageIndex === 0;

            return (
              <div
                key={message.id}
                className={`${styles.message} ${
                  isUser ? styles.userMessage : styles.botMessage
                } ${showAvatar ? styles.messageWithAvatar : ''}`}
                style={{ animationDelay: `${(groupIndex * group.length + messageIndex) * 0.1}s` }}
              >
                {showAvatar && (
                  <div className={styles.messageAvatar} aria-hidden="true">
                    {getMessageAvatar(message.role)}
                  </div>
                )}

                <div className={styles.messageBubble}>
                  <div className={styles.messageContent}>
                    {message.content}
                  </div>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className={styles.messageAttachments}>
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className={styles.attachment}>
                          <div className={styles.attachmentIcon}>📎</div>
                          <span>{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isLastInGroup && (
                  <div className={styles.messageMetadata}>
                    <span className={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </span>
                    {isUser && (
                      <div className={styles.messageStatus}>
                        <div
                          className={`${styles.statusIcon} ${styles.delivered}`}
                          title="Delivered"
                          aria-label="Message delivered"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.messageActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleCopyMessage(message.content)}
                    aria-label="Copy message"
                    title="Copy message"
                    type="button"
                  >
                    Copy
                  </button>
                  {!isUser && (
                    <button
                      className={styles.actionButton}
                      onClick={handleRegenerateResponse}
                      aria-label="Regenerate response"
                      title="Regenerate response"
                      type="button"
                    >
                      ↻
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {isLoading && (
        <div className={`${styles.message} ${styles.botMessage} ${styles.messageWithAvatar}`}>
          <div className={styles.messageAvatar} aria-hidden="true">
            🤖
          </div>
          <div className={styles.typingIndicator} role="status" aria-label="Assistant is typing">
            <div className={styles.typingDots}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
            <span className={styles.typingText}>Assistant is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};