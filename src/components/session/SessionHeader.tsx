
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { GymSession } from "@/services/SessionService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SessionHeaderProps {
  session: GymSession;
  isCreator: boolean;
  isPastSession: boolean;
  onDelete: () => Promise<void>;
}

export const SessionHeader = ({ session, isCreator, isPastSession, onDelete }: SessionHeaderProps) => {
  return (
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-xl font-bold">{session.title}</CardTitle>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <img 
              src={session.creator.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${session.creator.name}`} 
              alt={session.creator.name} 
              className="w-6 h-6 rounded-full mr-2" 
            />
            <span>by {session.creator.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            className={`
              ${session.workoutType === 'cardio' ? 'bg-orange-500' : ''}
              ${session.workoutType === 'strength' ? 'bg-blue-600' : ''}
              ${session.workoutType === 'yoga' ? 'bg-green-500' : ''}
              ${session.workoutType === 'hiit' ? 'bg-purple-600' : ''}
              ${session.workoutType === 'crossfit' ? 'bg-red-600' : ''}
              ${!['cardio', 'strength', 'yoga', 'hiit', 'crossfit'].includes(session.workoutType) ? 'bg-gray-600' : ''}
            `}
          >
            {session.workoutType}
          </Badge>
          
          {isCreator && !isPastSession && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this gym session? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </CardHeader>
  );
};
