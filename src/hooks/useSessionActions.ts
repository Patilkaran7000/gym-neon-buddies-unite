
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
      // First update the UI optimistically
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
      setStatus('requested');
      
      // Then make the actual request to the backend
      const success = await SessionService.requestToJoin(currentSession.id, currentUser);
      
      if (success) {
        toast("Request sent!", {
          description: "Your request to join this session has been sent",
        });
      } else {
        // If the request fails, revert the UI changes
        setCurrentSession(currentSession);
        setStatus(SessionService.getUserSessionStatus(currentSession, currentUser.id));
        throw new Error("Failed to request join");
      }
    } catch (error) {
      console.error('Error requesting to join:', error);
      toast("Request failed", {
        description: "There was a problem with your request. Please try again.",
      });
      // Revert UI changes on error
      setCurrentSession(currentSession);
      setStatus(SessionService.getUserSessionStatus(currentSession, currentUser.id));
    }
  };

  const handleAccept = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      // First update UI optimistically
      const requestIndex = currentSession.requests.findIndex(r => r.userId === userId);
      if (requestIndex === -1) return;
      
      const request = currentSession.requests[requestIndex];
      
      const updatedSession = {
        ...currentSession,
        requests: currentSession.requests.filter((_, index) => index !== requestIndex),
        accepted: [...currentSession.accepted, request]
      };
      
      setCurrentSession(updatedSession);
      
      // Then make the API call
      const success = await SessionService.acceptRequest(currentSession.id, userId, currentUser);
      
      if (success) {
        toast("Request accepted!", {
          description: "You've accepted the request to join",
        });
      } else {
        // Revert UI changes if the API call fails
        setCurrentSession(currentSession);
        throw new Error("Failed to accept request");
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast("Accept failed", {
        description: "There was a problem accepting the request",
      });
      // Revert UI changes on error
      setCurrentSession(currentSession);
    }
  };

  const handleReject = async (userId: string) => {
    if (!currentUser) return;
    
    try {
      // First update UI optimistically
      const updatedSession = {
        ...currentSession,
        requests: currentSession.requests.filter(r => r.userId !== userId)
      };
      
      setCurrentSession(updatedSession);
      
      // Then make the API call
      const success = await SessionService.rejectRequest(currentSession.id, userId, currentUser);
      
      if (success) {
        toast("Request rejected", {
          description: "You've rejected the request to join",
        });
      } else {
        // Revert UI changes if the API call fails
        setCurrentSession(currentSession);
        throw new Error("Failed to reject request");
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast("Reject failed", {
        description: "There was a problem rejecting the request",
      });
      // Revert UI changes on error
      setCurrentSession(currentSession);
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
