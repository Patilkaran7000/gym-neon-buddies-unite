
import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { AuthService, User } from '@/services/AuthService';
import { GymSession } from '@/services/SessionService';
import { isPast } from 'date-fns';
import { SessionHeader } from './session/SessionHeader';
import { SessionContent } from './session/SessionContent';
import { SessionActions } from './session/SessionActions';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useSessionActions } from '@/hooks/useSessionActions';
import { SessionChat } from './session/SessionChat';

interface SessionCardProps {
  session: GymSession;
  onUpdate?: () => void;
}

const SessionCard = ({ session, onUpdate }: SessionCardProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());

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
    handleRate,
    handleDeleteSession
  } = useSessionActions(currentSession, setCurrentSession, currentUser, setStatus, onUpdate);

  const isPastSession = isPast(new Date(currentSession.datetime));
  const isCreator = status === 'creator';

  // Allow chat for accepted users or creator (not for requested or none)
  const canChat = (status === 'accepted' || status === 'creator') && !isPastSession && currentUser;

  return (
    <Card className="w-full glass-card transition-all duration-500 hover-lift glow-effect group overflow-hidden border-glow">
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
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
        <SessionActions
          status={status}
          isPastSession={isPastSession}
          sessionId={currentSession.id}
          currentUserId={currentUser?.id}
          onUpdate={onUpdate}
        />
        {canChat && currentUser && (
          <SessionChat
            sessionId={currentSession.id}
            userId={currentUser.id}
            userName={currentUser.name}
            userProfilePic={currentUser.profilePic}
          />
        )}
      </div>
    </Card>
  );
};

export default SessionCard;
