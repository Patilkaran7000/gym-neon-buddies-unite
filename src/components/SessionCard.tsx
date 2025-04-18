
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { AuthService, User } from '@/services/AuthService';
import { GymSession } from '@/services/SessionService';
import { isPast } from 'date-fns';
import { SessionHeader } from './session/SessionHeader';
import { SessionContent } from './session/SessionContent';
import { SessionActions } from './session/SessionActions';
import { SessionRequestsList } from './session/SessionRequestsList';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useSessionActions } from '@/hooks/useSessionActions';

interface SessionCardProps {
  session: GymSession;
  onUpdate?: () => void;
}

const SessionCard = ({ session, onUpdate }: SessionCardProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());
  const [showRequests, setShowRequests] = useState(false);
  
  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser) {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      }
    };
    
    loadUser();
  }, [currentUser]);
  
  const {
    currentSession,
    setCurrentSession,
    status,
    setStatus,
    averageRating,
    canRate,
    userRating,
    setUserRating
  } = useSessionManagement(session, currentUser, onUpdate);

  const {
    handleRequestJoin,
    handleAccept,
    handleReject,
    handleRate,
    handleDeleteSession
  } = useSessionActions(currentSession, setCurrentSession, currentUser, setStatus, onUpdate);

  const isPastSession = isPast(new Date(currentSession.datetime));
  const isCreator = status === 'creator';
  const toggleRequests = () => setShowRequests(prev => !prev);

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

      {isCreator && currentSession.requests.length > 0 && showRequests && (
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
        showRequests={showRequests}
        requestCount={isCreator ? currentSession.requests.length : 0}
        onToggleRequests={toggleRequests}
      />
    </Card>
  );
};

export default SessionCard;
