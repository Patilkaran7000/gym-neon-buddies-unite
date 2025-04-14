
import { useState, useEffect } from 'react';
import { SessionService, GymSession } from '@/services/SessionService';
import { AuthService } from '@/services/AuthService';
import SessionCard from '@/components/SessionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { Dumbbell, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

const HomePage = () => {
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<GymSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const allSessions = await SessionService.getSessions();
        setSessions(allSessions);
        setFilteredSessions(allSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast("Error loading sessions", {
          description: "There was a problem retrieving the sessions",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadSessions();
    
    // Check if user is logged in
    const user = AuthService.getCurrentUserSync();
    setIsLoggedIn(!!user);
    
    // Set up real-time subscription to session changes
    const sessionChanges = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'gym_sessions' 
      }, (payload) => {
        loadSessions();
      })
      .subscribe();
    
    return () => {
      sessionChanges.unsubscribe();
    };
  }, []);
  
  // Apply filters and search
  useEffect(() => {
    let result = sessions;
    
    // Apply workout type filter
    if (activeFilter) {
      result = result.filter(session => session.workoutType.toLowerCase() === activeFilter.toLowerCase());
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(session => 
        session.title.toLowerCase().includes(term) || 
        session.location.toLowerCase().includes(term) || 
        session.details.toLowerCase().includes(term) ||
        session.creator.name.toLowerCase().includes(term)
      );
    }
    
    setFilteredSessions(result);
  }, [sessions, searchTerm, activeFilter]);
  
  const handleFilterClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const allSessions = await SessionService.getSessions();
      setSessions(allSessions);
      toast("Sessions refreshed", {
        description: "The latest sessions have been loaded",
      });
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      toast("Refresh failed", {
        description: "There was a problem refreshing the sessions",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const workoutTypes = ['cardio', 'strength', 'yoga', 'hiit', 'crossfit'];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-neon-purple/90 to-neon-blue/80 rounded-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3')] bg-cover opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Gym Buddy</h1>
            <p className="text-xl mb-6 opacity-90">
              Connect with fitness enthusiasts, join workout sessions, and achieve your goals together.
            </p>
            
            {!isLoggedIn ? (
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button size="lg" className="bg-white text-neon-purple hover:bg-gray-100">
                    Join Now
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Login
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/create">
                <Button size="lg" className="bg-white text-neon-purple hover:bg-gray-100 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Create Workout Session
                </Button>
              </Link>
            )}
          </div>
          
          <div className="hidden md:block absolute bottom-0 right-0">
            <div className="animate-float">
              <Users className="h-32 w-32 text-white/30" />
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              className="pl-10"
              placeholder="Search sessions by title, location, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {workoutTypes.map(type => (
              <Badge
                key={type}
                variant={activeFilter === type ? "default" : "outline"}
                className={`cursor-pointer capitalize ${
                  activeFilter === type ? 'bg-neon-purple hover:bg-neon-purple/90' : ''
                }`}
                onClick={() => handleFilterClick(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Session Cards */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Available Sessions</h2>
          <Button 
            variant="ghost" 
            onClick={handleRefresh}
            className="text-sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map(session => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No sessions found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || activeFilter 
                ? "Try adjusting your search or filters"
                : "Be the first to create a workout session!"}
            </p>
            
            {isLoggedIn && (
              <Link to="/create">
                <Button className="bg-neon-purple hover:bg-neon-purple/90">
                  Create Session
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
