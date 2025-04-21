
import { useEffect, useRef, useState } from "react";
import { ChatService, ChatMessage } from "@/services/ChatService";

export function useSessionChat(sessionId: string, userId: string, userName: string, userProfilePic?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Initial fetch
    setMessages(ChatService.getMessages(sessionId));
    // Subscribe
    const unsubscribe = ChatService.subscribeToMessages(sessionId, setMessages);
    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setLoading(true);
    ChatService.sendMessage(sessionId, message, {id: userId, name: userName, profilePic: userProfilePic});
    setMessage("");
    setLoading(false);
  };

  return {
    messages,
    sendMessage,
    message,
    setMessage,
    loading,
    scrollerRef
  };
}
