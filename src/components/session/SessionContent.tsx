
import { useState } from 'react';
import { CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Star, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { GymSession } from "@/services/SessionService";
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [isRatingHovered, setIsRatingHovered] = useState(0);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const handleRate = async (rating: number) => {
    try {
      // Update UI immediately for better feedback
      setUserRating(rating);
      await onRate(rating);
      setIsRatingDialogOpen(false);
    } catch (error) {
      console.error('Error rating session:', error);
    }
  };

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
      
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {averageRating > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= averageRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({session.ratings.length})
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <h4 className="font-semibold mb-2">Ratings & Reviews</h4>
                  {session.ratings.length > 0 ? (
                    session.ratings.map((rating, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2 p-2 rounded hover:bg-gray-50">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{rating.userId}</span>
                        <div className="flex ml-auto">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-3 w-3 ${star <= rating.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No ratings yet</p>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              <span className="text-xs text-gray-500">No ratings yet</span>
            )}
          </div>
          
          {canRate && (status === 'accepted' || status === 'creator') && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Rate:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 cursor-pointer transition-colors ${
                      star <= (isRatingHovered || userRating) 
                        ? 'text-yellow-500 fill-yellow-500' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    onMouseEnter={() => setIsRatingHovered(star)}
                    onMouseLeave={() => setIsRatingHovered(0)}
                    onClick={() => {
                      setSelectedRating(star);
                      setIsRatingDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Rating confirmation dialog */}
          <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Rate this session</DialogTitle>
                <DialogDescription>
                  Your rating helps others find great workout sessions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-8 w-8 cursor-pointer transition-colors ${
                        star <= (isRatingHovered || selectedRating) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-300'
                      }`}
                      onMouseEnter={() => setIsRatingHovered(star)}
                      onMouseLeave={() => setIsRatingHovered(0)}
                      onClick={() => setSelectedRating(star)}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsRatingDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleRate(selectedRating)}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    Submit Rating
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
