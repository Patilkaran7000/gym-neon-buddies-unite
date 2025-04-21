
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
    handleRate,
    handleDeleteSession
  };
};
