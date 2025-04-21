
import { useEffect, useState } from "react";
import { SessionService, GymSession } from "@/services/SessionService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { AuthService } from "@/services/AuthService";

interface SessionRequestsProps {
  sessionId: string;
  onUpdate?: () => void;
}

export function SessionRequests({ sessionId, onUpdate }: SessionRequestsProps) {
  const [session, setSession] = useState<GymSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SessionService.getSessionById(sessionId).then(setSession);
  }, [sessionId]);

  const handleAccept = async (userId: string) => {
    setLoading(true);
    const currentUser = AuthService.getCurrentUserSync();
    if (!session || !currentUser) return;
    await SessionService.acceptRequest(sessionId, userId, currentUser);
    const updated = await SessionService.getSessionById(sessionId);
    setSession(updated || null);
    if (onUpdate) onUpdate();
    setLoading(false);
  };

  const handleReject = async (userId: string) => {
    setLoading(true);
    const currentUser = AuthService.getCurrentUserSync();
    if (!session || !currentUser) return;
    await SessionService.rejectRequest(sessionId, userId, currentUser);
    const updated = await SessionService.getSessionById(sessionId);
    setSession(updated || null);
    if (onUpdate) onUpdate();
    setLoading(false);
  };

  if (!session || session.requests.length === 0) {
    return <div className="text-gray-500 text-sm px-2 pb-2">No join requests yet.</div>;
  }

  return (
    <CardContent className="bg-gray-50 rounded border p-2 mt-2 flex flex-col gap-2">
      {session.requests.map(req => (
        <div key={req.userId} className="flex items-center justify-between dark:bg-white bg-blue-50 rounded px-2 py-1">
          <div className="flex items-center gap-2">
            <img
              src={req.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${req.name}`}
              alt={req.name}
              className="w-7 h-7 rounded-full"
            />
            <div>{req.name}</div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={loading}
              aria-label="Accept"
              onClick={() => handleAccept(req.userId)}
            >
              <Check className="w-4 h-4 text-green-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={loading}
              aria-label="Reject"
              onClick={() => handleReject(req.userId)}
            >
              <X className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </CardContent>
  );
}
