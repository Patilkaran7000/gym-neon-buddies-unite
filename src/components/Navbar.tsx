
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AuthService, User } from "@/services/AuthService";
import { Dumbbell, LogOut, User as UserIcon, Home, Plus } from 'lucide-react';
import { toast } from "@/lib/toast";

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const user = await AuthService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      // Clear cached user before logout to prevent UI issues
      AuthService.updateCachedUser(null);
      
      // Then perform the actual logout operation
      await AuthService.logout();
      
      toast("Logged out successfully", {
        description: "You have been logged out of your account"
      });
      
      // Navigate after all logout operations are complete
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast("Logout failed", {
        description: "There was a problem logging out. Please try again."
      });
    }
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Dumbbell className="h-8 w-8 text-neon-purple" />
            <span className="text-2xl font-bold gradient-text">GymBuddy</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {!isLoading && currentUser ? (
              <>
                <Link to="/">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
                <Link to="/create">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Create Session</span>
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" className="bg-neon-purple hover:bg-neon-purple/90">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
