
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
    <nav className="glass-effect sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Dumbbell className="h-10 w-10 text-neon-purple group-hover:text-neon-pink transition-colors duration-300" />
              <div className="absolute inset-0 h-10 w-10 text-neon-purple opacity-50 group-hover:animate-ping"></div>
            </div>
            <span className="text-3xl font-bold gradient-text">GymBuddy</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            {!isLoading && currentUser ? (
              <>
                <Link to="/">
                  <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift">
                    <Home className="h-5 w-5" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
                <Link to="/create">
                  <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift">
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Create Session</span>
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift">
                    <UserIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2 text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift">
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 text-white border-0 glow-effect hover-lift">Sign Up</Button>
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
