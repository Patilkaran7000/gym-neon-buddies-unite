
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
      const success = await SessionService.requestToJoin(session.id, currentUser);
      
      if (success) {
        toast("Request sent!", {
          description: "Your request to join this session has been sent",
        });
        setStatus('requested');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast("Request failed", {
        description: "There was a problem with your request",
      });
    }
  };

  const handleAccept = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await SessionService.acceptRequest(session.id, userId, currentUser);
      
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
      const success = await SessionService.rejectRequest(session.id, userId, currentUser);
      
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
      const success = await SessionService.rateSession(session.id, rating, currentUser);
      
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
      const success = await SessionService.deleteSession(session.id, currentUser);
      
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

  const isPastSession = isPast(new Date(session.datetime));
  const isCreator = status === 'creator';

  return (
    <Card className="w-full transition-all hover:shadow-lg group">
      <SessionHeader 
        session={session}
        isCreator={isCreator}
        isPastSession={isPastSession}
        onDelete={handleDeleteSession}
      />
      
      <SessionContent 
        session={session}
        averageRating={averageRating}
        canRate={canRate}
        userRating={userRating}
        onRate={handleRate}
        status={status}
      />

      {isCreator && session.requests.length > 0 && (
        <SessionRequestsList 
          requests={session.requests}
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
