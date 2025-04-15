
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface RequestUser {
  userId: string;
  name: string;
  profilePic?: string;
}

interface SessionRequestsListProps {
  requests: RequestUser[];
  onAccept: (userId: string) => Promise<void>;
  onReject: (userId: string) => Promise<void>;
}

export const SessionRequestsList = ({ requests, onAccept, onReject }: SessionRequestsListProps) => {
  if (requests.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-sm font-semibold flex items-center">
        <Users className="h-4 w-4 mr-1" />
        Join Requests
      </h4>
      {requests.map(request => (
        <div key={request.userId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
          <div className="flex items-center">
            <img 
              src={request.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${request.name}`} 
              alt={request.name}
              className="w-6 h-6 rounded-full mr-2" 
            />
            <span className="text-sm">{request.name}</span>
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs px-2 border-green-500 text-green-500 hover:bg-green-50"
              onClick={() => onAccept(request.userId)}
            >
              Accept
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs px-2 border-red-500 text-red-500 hover:bg-red-50"
              onClick={() => onReject(request.userId)}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
