
import { useState, useEffect } from 'react';
import { SessionService, GymSession } from '@/services/SessionService';
import { AuthService } from '@/services/AuthService';
import SessionCard from '@/components/SessionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { Dumbbell, Search, Users, Zap, Target, Award } from 'lucide-react';
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
  
  // Scroll animation effect
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const scrollElements = document.querySelectorAll('.scroll-fade-in');
    scrollElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
  
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
    <div className="min-h-screen gradient-bg particle-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="glass-card rounded-3xl p-12 mb-12 text-white relative overflow-hidden animate-slide-in-up">
          <div className="cyber-grid absolute inset-0 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 via-neon-pink/20 to-neon-blue/20"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-6 text-glow animate-scale-in">
              Find Your Perfect 
              <span className="gradient-text block mt-2">Gym Buddy</span>
            </h1>
            <p className="text-2xl mb-8 opacity-90 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
              Connect with fitness enthusiasts, join workout sessions, and achieve your goals together in the future of fitness.
            </p>
            
            {!isLoggedIn ? (
              <div className="flex flex-wrap gap-6 justify-center animate-slide-in-up" style={{animationDelay: '0.4s'}}>
                <Link to="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 text-white border-0 px-8 py-4 text-lg glow-effect hover-lift">
                    <Zap className="mr-2 h-6 w-6" />
                    Join the Revolution
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-4 text-lg hover-lift">
                    Login
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/create">
                <Button size="lg" className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-blue/80 hover:to-neon-purple/80 text-white border-0 px-8 py-4 text-lg glow-effect hover-lift animate-slide-in-up" style={{animationDelay: '0.4s'}}>
                  <Dumbbell className="mr-2 h-6 w-6" />
                  Create Workout Session
                </Button>
              </Link>
            )}
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-10 right-10 floating-animation">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 border border-white/20"></div>
          </div>
          <div className="absolute bottom-10 left-10 floating-animation" style={{animationDelay: '2s'}}>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-blue/30 to-neon-purple/30 border border-white/20"></div>
          </div>
          <div className="absolute top-1/2 right-1/4 floating-animation" style={{animationDelay: '4s'}}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-pink/30 to-neon-blue/30 border border-white/20"></div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16 scroll-fade-in">
          <h2 className="text-4xl font-bold text-center mb-12 text-white text-glow">Why Choose GymBuddy?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl text-center hover-lift glow-effect">
              <Target className="h-16 w-16 mx-auto mb-4 text-neon-purple animate-glow-pulse" />
              <h3 className="text-2xl font-bold mb-4 text-white">Goal-Oriented</h3>
              <p className="text-gray-200">Find partners who share your fitness goals and workout intensity preferences.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl text-center hover-lift glow-effect" style={{animationDelay: '0.2s'}}>
              <Users className="h-16 w-16 mx-auto mb-4 text-neon-pink animate-glow-pulse" />
              <h3 className="text-2xl font-bold mb-4 text-white">Community Driven</h3>
              <p className="text-gray-200">Join a supportive community of fitness enthusiasts from around your area.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl text-center hover-lift glow-effect" style={{animationDelay: '0.4s'}}>
              <Award className="h-16 w-16 mx-auto mb-4 text-neon-blue animate-glow-pulse" />
              <h3 className="text-2xl font-bold mb-4 text-white">Track Progress</h3>
              <p className="text-gray-200">Monitor your progress and celebrate achievements with your workout partners.</p>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="mb-12 scroll-fade-in">
          <div className="glass-card p-6 rounded-2xl">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-6 w-6" />
              <Input
                className="pl-12 h-14 text-lg bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus:border-neon-purple focus:ring-neon-purple"
                placeholder="Search sessions by title, location, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {workoutTypes.map((type, index) => (
                <Badge
                  key={type}
                  variant={activeFilter === type ? "default" : "outline"}
                  className={`cursor-pointer capitalize px-6 py-3 text-sm font-medium transition-all duration-300 hover-lift ${
                    activeFilter === type 
                      ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white border-0 glow-effect' 
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
                  onClick={() => handleFilterClick(type)}
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Session Cards */}
        <div className="mb-6 flex justify-between items-center scroll-fade-in">
          <h2 className="text-3xl font-bold text-white text-glow">Available Sessions</h2>
          <Button 
            variant="ghost" 
            onClick={handleRefresh}
            className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover-lift"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-neon-purple"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border border-neon-purple/20"></div>
            </div>
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 scroll-fade-in">
            {filteredSessions.map((session, index) => (
              <div key={session.id} className="animate-slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                <SessionCard 
                  session={session} 
                  onUpdate={handleRefresh}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass-card rounded-2xl scroll-fade-in">
            <div className="floating-animation">
              <Dumbbell className="mx-auto h-20 w-20 text-neon-purple mb-6" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No sessions found</h3>
            <p className="text-gray-200 text-lg mb-8">
              {searchTerm || activeFilter 
                ? "Try adjusting your search or filters"
                : "Be the first to create a workout session!"}
            </p>
            
            {isLoggedIn && (
              <Link to="/create">
                <Button className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/80 hover:to-neon-pink/80 text-white border-0 px-8 py-4 text-lg glow-effect hover-lift">
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
