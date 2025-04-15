
import { useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { GymSession } from "@/services/SessionService";
import { useNavigate } from 'react-router-dom';

interface SessionContentProps {
  session: GymSession;
  averageRating: number;
  canRate: boolean;
  userRating: number;
  onRate: (rating: number) => Promise<void>;
  status: 'creator' | 'accepted' | 'requested' | 'none';
}

export const SessionContent = ({ 
  session, 
  averageRating, 
  canRate, 
  userRating, 
  onRate, 
  status 
}: SessionContentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  return (
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

      {canRate && (status === 'accepted' || status === 'creator') && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-1">Rate this session:</h4>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`h-5 w-5 cursor-pointer transition-colors ${star <= userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-300'}`} 
                onClick={() => onRate(star)}
              />
            ))}
          </div>
        </div>
      )}

      {(status === 'accepted' || status === 'creator') && (
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full border-neon-purple text-neon-purple hover:bg-neon-purple/10 flex items-center justify-center gap-2"
            onClick={() => navigate(`/chat/${session.id}`)}
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Gym Buddies
          </Button>
        </div>
      )}
    </CardContent>
  );
};
