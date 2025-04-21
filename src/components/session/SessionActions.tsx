
import { CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionActionsProps {
  status: 'creator' | 'accepted' | 'requested' | 'none';
  isPastSession: boolean;
}

export const SessionActions = ({ 
  status, 
  isPastSession
}: SessionActionsProps) => {

  return (
    <CardFooter className="pt-1 flex flex-col gap-2">
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
