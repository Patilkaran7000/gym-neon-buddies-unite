
import { useSessionChat } from "@/hooks/useSessionChat";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SessionChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  userProfilePic?: string;
}

export function SessionChat({ sessionId, userId, userName, userProfilePic }: SessionChatProps) {
  const {
    messages,
    sendMessage,
    message,
    setMessage,
    loading,
    scrollerRef
  } = useSessionChat(sessionId, userId, userName, userProfilePic);

  return (
    <CardContent className="border-t pt-3">
      <div className="max-h-56 overflow-y-auto mb-2 space-y-2" ref={scrollerRef}>
        {messages.length === 0 && (
          <div className="text-xs text-gray-400 text-center">No messages yet.</div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${msg.userId === userId ? 'justify-end' : ''}`}
          >
            {msg.userId !== userId && (
              <img
                src={msg.userProfilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${msg.userName}`}
                alt={msg.userName}
                className="w-6 h-6 rounded-full"
              />
            )}
            <div className={`p-2 rounded bg-gray-200 ${msg.userId === userId ? 'bg-neon-blue text-white' : 'bg-gray-100'}`}>
              <span className="block text-xs font-medium">{msg.userName}</span>
              <span className="block">{msg.content}</span>
              <span className="block text-[10px] text-gray-500 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            {msg.userId === userId && (
              <img
                src={msg.userProfilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${msg.userName}`}
                alt={msg.userName}
                className="w-6 h-6 rounded-full"
              />
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2 mt-2"
      >
        <Input
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="flex-1"
          placeholder="Type a message"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !message.trim()}>Send</Button>
      </form>
    </CardContent>
  );
}
