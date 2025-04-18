
import { useState, useEffect } from 'react';
import { User } from '@/services/AuthService';
import { GymSession, SessionService } from '@/services/SessionService';
import { toast } from "@/lib/toast";

export const useSessionManagement = (
  session: GymSession,
  currentUser: User | null,
  onUpdate?: () => void
) => {
  const [currentSession, setCurrentSession] = useState<GymSession>(session);
  const [status, setStatus] = useState<'creator' | 'accepted' | 'requested' | 'none'>('none');
  const [averageRating, setAverageRating] = useState(0);
  const [canRate, setCanRate] = useState(false);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    setCurrentSession(session);
    
    if (currentUser) {
      const userStatus = SessionService.getUserSessionStatus(session, currentUser.id);
      setStatus(userStatus);
      setCanRate(SessionService.canRateSession(session, currentUser.id));
      
      const userRating = session.ratings.find(r => r.userId === currentUser.id)?.rating || 0;
      setUserRating(userRating);
    }
    
    setAverageRating(SessionService.getAverageRating(session));
  }, [session, currentUser]);

  return {
    currentSession,
    setCurrentSession,
    status,
    setStatus,
    averageRating,
    canRate,
    userRating,
    setUserRating
  };
};
