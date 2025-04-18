
import { CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";

interface SessionActionsProps {
  status: 'creator' | 'accepted' | 'requested' | 'none';
  isPastSession: boolean;
  onRequestJoin: () => Promise<void>;
}

export const SessionActions = ({ status: initialStatus, isPastSession, onRequestJoin }: SessionActionsProps) => {
  const [status, setStatus] = useState(initialStatus);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // This useEffect ensures the component status stays in sync with props
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleRequestJoin = async () => {
    try {
      setIsRequesting(true);
      // Update the UI immediately for a better user experience
      setStatus('requested');
      
      // Then make the actual request
      await onRequestJoin();
      
      toast("Request sent!", {
        description: "Your request to join this session has been sent",
      });
    } catch (error) {
      console.error('Error requesting to join:', error);
      // Revert the status if the request fails
      setStatus('none');
      toast("Request failed", {
        description: "There was a problem with your request",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <CardFooter className="pt-1">
      {status === 'none' && !isPastSession && (
        <Button 
          onClick={handleRequestJoin}
          className="w-full bg-neon-purple hover:bg-neon-purple/90"
          disabled={isRequesting}
        >
          {isRequesting ? 'Requesting...' : 'Request to Join'}
        </Button>
      )}
      {status === 'requested' && (
        <Badge 
          className="w-full flex justify-center py-2 bg-amber-500"
        >
          Request Pending
        </Badge>
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
