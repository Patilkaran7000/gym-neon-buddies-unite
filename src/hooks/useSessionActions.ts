
import { User } from '@/services/AuthService';
import { GymSession, SessionService } from '@/services/SessionService';
import { toast } from "@/lib/toast";
import { useNavigate } from 'react-router-dom';

export const useSessionActions = (
  currentSession: GymSession,
  setCurrentSession: (session: GymSession) => void,
  currentUser: User | null,
  setStatus: (status: 'creator' | 'accepted' | 'requested' | 'none') => void,
  onUpdate?: () => void
) => {
  const navigate = useNavigate();

  const handleRequestJoin = async () => {
    if (!currentUser) {
      toast("Please login to join sessions", {
        description: "You need to be logged in to join a gym session",
      });
      navigate('/login');
      return;
    }
    
    try {
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
      
      setCurrentSession(updatedSession);
      
      const success = await SessionService.requestToJoin(currentSession.id, currentUser);
      
      if (success) {
        setStatus('requested');
        
        if (onUpdate) {
          setTimeout(() => onUpdate(), 500);
        }
      } else {
        setCurrentSession(currentSession);
        throw new Error("Failed to request join");
      }
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast("Request failed", {
        description: "There was a problem with your request. Please try again.",
      });
      setStatus(SessionService.getUserSessionStatus(currentSession, currentUser.id));
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

  return {
    handleRequestJoin,
    handleAccept,
    handleReject,
    handleRate,
    handleDeleteSession
  };
};
