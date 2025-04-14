
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { AuthService, User } from '@/services/AuthService';
import { SessionService, GymSession } from '@/services/SessionService';
import { ChatService, ChatMessage } from '@/services/ChatService';
import { toast } from '@/lib/toast';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const ChatPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<GymSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Get current user
    const fetchCurrentUser = async () => {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
    };
    
    fetchCurrentUser();
  }, []);
  
  useEffect(() => {
    if (!sessionId || !currentUser) return;
    
    // Get session data
    const sessionData = SessionService.getSessionById(sessionId);
    if (!sessionData) {
      toast("Session not found", {
        description: "The session you're looking for doesn't exist."
      });
      navigate('/');
      return;
    }
    
    setSession(sessionData);
    
    // Check if user can access this chat
    if (!ChatService.canAccessChat(sessionId, currentUser.id)) {
      toast("Access denied", {
        description: "You don't have access to this chat."
      });
      navigate('/');
      return;
    }
    
    // Check if session has ended
    const ended = ChatService.hasSessionEnded(sessionId);
    setIsEnded(ended);
    
    // Get initial messages
    const chatMessages = ChatService.getMessages(sessionId);
    setMessages(chatMessages);
    setIsLoading(false);
    
    // Subscribe to message updates
    const unsubscribe = ChatService.subscribeToMessages(sessionId, (updatedMessages) => {
      setMessages(updatedMessages);
    });
    
    return () => {
      unsubscribe(); // Clean up subscription
    };
  }, [sessionId, currentUser, navigate]);
  
  useEffect(() => {
    // Scroll to the bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionId || !currentUser || !newMessage.trim()) return;
    
    // Send message
    ChatService.sendMessage(sessionId, newMessage.trim(), currentUser);
    
    // Clear input field
    setNewMessage('');
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <p>Session not found</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{session.title} Chat</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span>{format(new Date(session.datetime), 'MMM d, yyyy - h:mm a')} • {session.location}</span>
            </div>
          </div>
        </div>
        
        {isEnded && (
          <Badge className="self-center bg-amber-500 mb-4">
            This session has ended, but you can still view the chat history
          </Badge>
        )}
        
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
          <div className="p-4 overflow-y-auto flex-1">
            {messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                <p>No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.userId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[75%] rounded-lg p-3 ${
                        msg.userId === currentUser?.id 
                          ? 'bg-neon-purple text-white rounded-tr-none' 
                          : 'bg-gray-100 rounded-tl-none'
                      }`}
                    >
                      {msg.userId !== currentUser?.id && (
                        <div className="flex items-center mb-1">
                          <img 
                            src={msg.userProfilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${msg.userName}`} 
                            alt={msg.userName} 
                            className="w-5 h-5 rounded-full mr-2" 
                          />
                          <span className="text-xs font-semibold">{msg.userName}</span>
                        </div>
                      )}
                      <p>{msg.content}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          msg.userId === currentUser?.id ? 'text-purple-200' : 'text-gray-500'
                        }`}
                      >
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <form 
            onSubmit={handleSendMessage}
            className="border-t p-4 flex items-center"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isEnded ? "Session has ended" : "Type your message..."}
              className="flex-1 mr-2"
              disabled={isEnded}
            />
            <Button type="submit" disabled={isEnded || !newMessage.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
