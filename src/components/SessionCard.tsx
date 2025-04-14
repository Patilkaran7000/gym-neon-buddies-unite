
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { AuthService, User } from '@/services/AuthService';
import { SessionService, GymSession } from '@/services/SessionService';
import { Calendar, MapPin, Star, MessageCircle, Users, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionCardProps {
  session: GymSession;
  onUpdate?: () => void;
}

const SessionCard = ({ session, onUpdate }: SessionCardProps) => {
  const [status, setStatus] = useState<'creator' | 'accepted' | 'requested' | 'none'>('none');
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());
  const [averageRating, setAverageRating] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      }
    };
    
    loadUser();
  }, [currentUser]);
  
  useEffect(() => {
    if (currentUser) {
      setStatus(SessionService.getUserSessionStatus(session, currentUser.id));
      setCanRate(SessionService.canRateSession(session, currentUser.id));
      
      const userRating = session.ratings.find(r => r.userId === currentUser.id)?.rating || 0;
      setUserRating(userRating);
    }
    
    setAverageRating(SessionService.getAverageRating(session));
  }, [session, currentUser]);
  
  const handleRequestJoin = async () => {
    if (!currentUser) {
      toast("Please login to join sessions", {
        description: "You need to be logged in to join a gym session",
      });
      navigate('/login');
      return;
    }
    
    const success = SessionService.requestToJoin(session.id, currentUser);
    
    if (success) {
      toast("Request sent!", {
        description: "Your request to join this session has been sent",
      });
      setStatus('requested');
      if (onUpdate) onUpdate();
    } else {
      toast("Request failed", {
        description: "Unable to request to join this session",
      });
    }
  };
  
  const handleAccept = (userId: string) => {
    if (!currentUser) return;
    
    const success = SessionService.acceptRequest(session.id, userId, currentUser);
    
    if (success) {
      toast("Request accepted!", {
        description: "You've accepted the request to join",
      });
      if (onUpdate) onUpdate();
    }
  };
  
  const handleReject = (userId: string) => {
    if (!currentUser) return;
    
    const success = SessionService.rejectRequest(session.id, userId, currentUser);
    
    if (success) {
      toast("Request rejected", {
        description: "You've rejected the request to join",
      });
      if (onUpdate) onUpdate();
    }
  };
  
  const handleRate = (rating: number) => {
    if (!currentUser) return;
    
    const success = SessionService.rateSession(session.id, rating, currentUser);
    
    if (success) {
      toast("Session rated!", {
        description: `You've rated this session ${rating} stars`,
      });
      setUserRating(rating);
      if (onUpdate) onUpdate();
    }
  };
  
  const navigateToChat = () => {
    navigate(`/chat/${session.id}`);
  };
  
  const handleDeleteSession = () => {
    if (!currentUser) return;
    
    const success = SessionService.deleteSession(session.id, currentUser);
    
    if (success) {
      toast("Session deleted", {
        description: "Your session has been permanently deleted",
      });
      if (onUpdate) onUpdate();
    } else {
      toast("Delete failed", {
        description: "You don't have permission to delete this session",
      });
    }
  };
  
  const sessionDate = new Date(session.datetime);
  const isPastSession = isPast(sessionDate);
  
  return (
    <Card className="w-full transition-all hover:shadow-lg group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{session.title}</CardTitle>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <img 
                src={session.creator.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${session.creator.name}`} 
                alt={session.creator.name} 
                className="w-6 h-6 rounded-full mr-2" 
              />
              <span>by {session.creator.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              className={`
                ${session.workoutType === 'cardio' ? 'bg-orange-500' : ''}
                ${session.workoutType === 'strength' ? 'bg-blue-600' : ''}
                ${session.workoutType === 'yoga' ? 'bg-green-500' : ''}
                ${session.workoutType === 'hiit' ? 'bg-purple-600' : ''}
                ${session.workoutType === 'crossfit' ? 'bg-red-600' : ''}
                ${!['cardio', 'strength', 'yoga', 'hiit', 'crossfit'].includes(session.workoutType) ? 'bg-gray-600' : ''}
              `}
            >
              {session.workoutType}
            </Badge>
            
            {status === 'creator' && !isPastSession && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-7 w-7 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this gym session? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteSession}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center text-sm mb-2">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span>{format(new Date(session.datetime), 'MMM d, yyyy - h:mm a')}</span>
        </div>
        <div className="flex items-center text-sm mb-3">
          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
          <span>{session.location}</span>
        </div>
        
        <p className={`text-sm text-gray-700 ${!isExpanded && 'line-clamp-2'}`}>
          {session.details}
        </p>
        {session.details.length > 100 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-xs text-neon-purple mt-1 hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
        
        {averageRating > 0 && (
          <div className="flex items-center mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-4 w-4 ${star <= averageRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="ml-2 text-xs text-gray-500">
              ({session.ratings.length} {session.ratings.length === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}
        
        {status === 'creator' && session.requests.length > 0 && (
          <div className="mt-3 space-y-2">
            <h4 className="text-sm font-semibold flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Join Requests
            </h4>
            {session.requests.map(request => (
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
                    onClick={() => handleAccept(request.userId)}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs px-2 border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => handleReject(request.userId)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {(status === 'accepted' || status === 'creator') && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full border-neon-purple text-neon-purple hover:bg-neon-purple/10 flex items-center justify-center gap-2"
              onClick={navigateToChat}
            >
              <MessageCircle className="h-4 w-4" />
              Chat with Gym Buddies
            </Button>
          </div>
        )}
        
        {canRate && (status === 'accepted' || status === 'creator') && isPastSession && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-1">Rate this session:</h4>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 cursor-pointer transition-colors ${star <= userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-300'}`} 
                  onClick={() => handleRate(star)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
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
    </Card>
  );
};

export default SessionCard;
