
import { Button } from "@/components/ui/button";
import { Users, UserCheck, UserX } from "lucide-react";

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
    <div className="mt-3 p-4 pt-0">
      <h4 className="text-sm font-semibold flex items-center mb-2">
        <Users className="h-4 w-4 mr-1" />
        Join Requests ({requests.length})
      </h4>
      <div className="space-y-2">
        {requests.map(request => (
          <div key={request.userId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <div className="flex items-center">
              <img 
                src={request.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${request.name}`} 
                alt={request.name}
                className="w-8 h-8 rounded-full mr-2" 
              />
              <span className="text-sm font-medium">{request.name}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs px-3 border-green-500 text-green-500 hover:bg-green-50"
                onClick={() => onAccept(request.userId)}
              >
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 text-xs px-3 border-red-500 text-red-500 hover:bg-red-50"
                onClick={() => onReject(request.userId)}
              >
                <UserX className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
