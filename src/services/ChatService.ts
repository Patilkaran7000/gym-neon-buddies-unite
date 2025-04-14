
import { User } from './AuthService';
import { EventEmitter } from '../utils/EventEmitter';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
  content: string;
  timestamp: number;
}

// Create an event emitter for message updates
const messageEvents = new EventEmitter<{sessionId: string, messages: ChatMessage[]}>();

export class ChatService {
  private static readonly MESSAGES_KEY = 'gym_buddy_messages';
  
  // Subscribe to message updates for a specific session
  static subscribeToMessages(sessionId: string, callback: (messages: ChatMessage[]) => void): () => void {
    return messageEvents.subscribe(event => {
      if (event.sessionId === sessionId) {
        callback(event.messages);
      }
    });
  }
  
  static getMessages(sessionId: string): ChatMessage[] {
    const messagesStr = localStorage.getItem(this.MESSAGES_KEY);
    const allMessages = messagesStr ? JSON.parse(messagesStr) : [];
    return allMessages.filter((msg: ChatMessage) => msg.sessionId === sessionId);
  }
  
  static saveMessages(messages: ChatMessage[]): void {
    if (messages.length === 0) return;
    
    const sessionId = messages[0].sessionId; // Get the session ID from the first message
    const messagesStr = localStorage.getItem(this.MESSAGES_KEY);
    const allMessages = messagesStr ? JSON.parse(messagesStr) : [];
    
    // Filter out messages with the same session ID
    const otherMessages = allMessages.filter(
      (msg: ChatMessage) => !messages.some(m => m.sessionId === msg.sessionId)
    );
    
    // Combine with new messages
    const updatedMessages = [...otherMessages, ...messages];
    
    localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(updatedMessages));
    
    // Emit event to notify subscribers
    messageEvents.emit({ sessionId, messages });
  }
  
  static sendMessage(sessionId: string, content: string, user: User): ChatMessage {
    const messages = this.getMessages(sessionId);
    
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      userId: user.id,
      userName: user.name,
      userProfilePic: user.profilePic,
      content,
      timestamp: Date.now()
    };
    
    const updatedMessages = [...messages, newMessage];
    this.saveMessages(updatedMessages);
    
    // Return the new message
    return newMessage;
  }
  
  // Check if user can access chat (must be creator or accepted participant)
  static canAccessChat(sessionId: string, userId: string): boolean {
    // Get the session from SessionService
    const { SessionService } = require('./SessionService');
    const session = SessionService.getSessionById(sessionId);
    
    if (!session) return false;
    
    // Check if user is creator or accepted participant
    return (
      session.creator.id === userId || 
      session.accepted.some(a => a.userId === userId)
    );
  }
  
  // Check if session has ended (for showing historical messages or active chat)
  static hasSessionEnded(sessionId: string): boolean {
    const { SessionService } = require('./SessionService');
    const session = SessionService.getSessionById(sessionId);
    
    if (!session) return true;
    
    const sessionDate = new Date(session.datetime);
    return sessionDate < new Date();
  }
}
