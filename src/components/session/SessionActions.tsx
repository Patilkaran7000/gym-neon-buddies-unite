
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "@/lib/toast";
import { useSessionRequests } from "@/hooks/useSessionRequests";
import { SessionRequests } from "./SessionRequests";

interface SessionActionsProps {
  status: 'creator' | 'accepted' | 'requested' | 'none';
  isPastSession: boolean;
  sessionId: string;
  currentUserId?: string;
  onUpdate?: () => void;
}

export const SessionActions = ({
  status,
  isPastSession,
  sessionId,
  currentUserId,
  onUpdate
}: SessionActionsProps) => {
  const [showRequests, setShowRequests] = useState(false);
  const { handleRequestJoin, loading } = useSessionRequests(sessionId, onUpdate);

  return (
    <CardFooter className="pt-1 flex flex-col gap-2">
      {/* Accepted status */}
      {status === 'accepted' && !isPastSession && (
        <Badge className="w-full flex justify-center py-2 bg-green-500">
          You're In! See you there!
        </Badge>
      )}

      {/* Creator: see requests */}
      {status === 'creator' && (
        <>
          <Badge className="w-full flex justify-center py-2 bg-neon-blue">
            You created this session
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowRequests(v => !v)}
          >
            Manage Join Requests
          </Button>
          {showRequests && (
            <SessionRequests sessionId={sessionId} onUpdate={onUpdate} />
          )}
        </>
      )}

      {/* None/requested: show request button */}
      {status === 'none' && !isPastSession && (
        <Button
          onClick={handleRequestJoin}
          disabled={loading}
          className="w-full flex gap-2 items-center"
        >
          <UserPlus className="h-4 w-4" />
          Request to Join
        </Button>
      )}

      {status === 'requested' && !isPastSession && (
        <Badge className="w-full flex justify-center py-2 bg-yellow-400 text-white">
          Request Pending Approval
        </Badge>
      )}

      {isPastSession && status !== 'creator' && status !== 'accepted' && (
        <Badge
          variant="outline"
          className="w-full flex justify-center py-2 border-gray-300 text-gray-500"
        >
          This session has ended
        </Badge>
      )}
    </CardFooter>
  );
};
