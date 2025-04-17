
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { AuthService, User } from '@/services/AuthService';
import { SessionService, GymSession } from '@/services/SessionService';
import { useNavigate } from 'react-router-dom';
import { SessionHeader } from './session/SessionHeader';
import { SessionContent } from './session/SessionContent';
import { SessionActions } from './session/SessionActions';
import { SessionRequestsList } from './session/SessionRequestsList';
import { isPast } from 'date-fns';

interface SessionCardProps {
  session: GymSession;
  onUpdate?: () => void;
}

const SessionCard = ({ session, onUpdate }: SessionCardProps) => {
  const [currentSession, setCurrentSession] = useState<GymSession>(session);
  const [status, setStatus] = useState<'creator' | 'accepted' | 'requested' | 'none'>('none');
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());
  const [averageRating, setAverageRating] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [userRating, setUserRating] = useState(0);
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
    setCurrentSession(session);
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
    
    try {
      // Create an optimistic update for the UI
      const updatedSession = { 
        ...currentSession,
        requests: [
          ...currentSession.requests,
          {
            userId: currentUser.id,
            name: currentUser.name,
            profilePic: currentUser.profilePic
          }
        ]
      };
      
      // Update local state to give immediate feedback
      setCurrentSession(updatedSession);
      
      // The status update is now handled by the SessionActions component
      // and we don't need to set it here anymore
      
      const success = await SessionService.requestToJoin(currentSession.id, currentUser);
      
      if (success) {
        if (onUpdate) onUpdate();
      } else {
        // Revert changes if the request failed
        setCurrentSession(session);
        throw new Error("Failed to request join");
      }
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast("Request failed", {
        description: "There was a problem with your request. Please try again.",
      });
    }
  };

  const handleAccept = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await SessionService.acceptRequest(currentSession.id, userId, currentUser);
      
      if (success) {
        toast("Request accepted!", {
          description: "You've accepted the request to join",
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast("Accept failed", {
        description: "There was a problem accepting the request",
      });
    }
  };

  const handleReject = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await SessionService.rejectRequest(currentSession.id, userId, currentUser);
      
      if (success) {
        toast("Request rejected", {
          description: "You've rejected the request to join",
        });
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast("Reject failed", {
        description: "There was a problem rejecting the request",
      });
    }
  };

  const handleRate = async (rating: number) => {
    if (!currentUser) return;
    
    try {
      const success = await SessionService.rateSession(currentSession.id, rating, currentUser);
      
      if (success) {
        toast("Session rated!", {
          description: `You've rated this session ${rating} stars`,
        });
        setUserRating(rating);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error rating session:', error);
      toast("Rating failed", {
        description: "There was a problem rating the session",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!currentUser) return;
    
    try {
      const success = await SessionService.deleteSession(currentSession.id, currentUser);
      
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
    } catch (error) {
      console.error('Error deleting session:', error);
      toast("Delete failed", {
        description: "There was a problem deleting the session",
      });
    }
  };

  const isPastSession = isPast(new Date(currentSession.datetime));
  const isCreator = status === 'creator';

  return (
    <Card className="w-full transition-all hover:shadow-lg group">
      <SessionHeader 
        session={currentSession}
        isCreator={isCreator}
        isPastSession={isPastSession}
        onDelete={handleDeleteSession}
      />
      
      <SessionContent 
        session={currentSession}
        averageRating={averageRating}
        canRate={canRate}
        userRating={userRating}
        onRate={handleRate}
        status={status}
      />

      {isCreator && currentSession.requests.length > 0 && (
        <SessionRequestsList 
          requests={currentSession.requests}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      <SessionActions 
        status={status}
        isPastSession={isPastSession}
        onRequestJoin={handleRequestJoin}
      />
    </Card>
  );
};

export default SessionCard;
