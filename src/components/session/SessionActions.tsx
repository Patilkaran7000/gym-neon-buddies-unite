
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GymSession } from "@/services/SessionService";
import { toast } from "@/lib/toast";

interface SessionActionsProps {
  status: 'creator' | 'accepted' | 'requested' | 'none';
  isPastSession: boolean;
  onRequestJoin: () => Promise<void>;
}

export const SessionActions = ({ status, isPastSession, onRequestJoin }: SessionActionsProps) => {
  const handleRequestJoin = async () => {
    try {
      await onRequestJoin();
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast("Request failed", {
        description: "There was a problem with your request",
      });
    }
  };

  return (
    <CardFooter className="pt-1">
      {status === 'none' && !isPastSession && (
        <Button 
          onClick={handleRequestJoin}
          className="w-full bg-neon-purple hover:bg-neon-purple/90"
        >
          Request to Join
        </Button>
      )}
      {status === 'requested' && (
        <Button 
          variant="outline" 
          className="w-full" 
          disabled
        >
          Request Pending
        </Button>
      )}
      {status === 'accepted' && !isPastSession && (
        <Badge 
          className="w-full flex justify-center py-2 bg-green-500"
        >
          You're In! See you there!
        </Badge>
      )}
      {status === 'creator' && (
        <Badge 
          className="w-full flex justify-center py-2 bg-neon-blue"
        >
          You created this session
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
