
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthService, User } from '@/services/AuthService';
import { SessionService, GymSession } from '@/services/SessionService';
import SessionCard from '@/components/SessionCard';
import Navbar from '@/components/Navbar';
import { User as UserIcon, LogOut, Dumbbell } from 'lucide-react';

const Profile = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(AuthService.getCurrentUserSync());
  const [mySessions, setMySessions] = useState<GymSession[]>([]);
  const [joinedSessions, setJoinedSessions] = useState<GymSession[]>([]);
  const [requestedSessions, setRequestedSessions] = useState<GymSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!currentUser) {
      // Try to load user asynchronously
      const loadUser = async () => {
        const user = await AuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        } else {
          navigate('/login');
        }
      };
      
      loadUser();
      return;
    }
    
    loadUserSessions();
    
    // Set up localStorage change listener
    window.addEventListener('storage', loadUserSessions);
    
    return () => {
      window.removeEventListener('storage', loadUserSessions);
    };
  }, [navigate, currentUser]);
  
  const loadUserSessions = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const allSessions = await SessionService.getSessions();
      
      // Filter sessions created by user
      const created = allSessions.filter(session => 
        session.creator.id === currentUser.id
      );
      
      // Filter sessions where user is accepted
      const joined = allSessions.filter(session => 
        session.accepted.some(user => user.userId === currentUser.id)
      );
      
      // Filter sessions where user has requested to join
      const requested = allSessions.filter(session => 
        session.requests.some(user => user.userId === currentUser.id)
      );
      
      setMySessions(created);
      setJoinedSessions(joined);
      setRequestedSessions(requested);
    } catch (error) {
      console.error('Error loading user sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };
  
  if (!currentUser) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-neon-purple to-neon-blue"></div>
            <CardContent className="pt-0 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 mb-4">
                <div className="relative">
                  <img 
                    src={currentUser.profilePic || `https://api.dicebear.com/7.x/thumbs/svg?seed=${currentUser.name}`} 
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-full border-4 border-white bg-white"
                  />
                  <div className="absolute bottom-0 right-0 h-6 w-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                  <p className="text-gray-500">{currentUser.email}</p>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sessions Tabs */}
          <Tabs defaultValue="my-sessions" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="my-sessions" className="text-sm sm:text-base">
                My Sessions ({mySessions.length})
              </TabsTrigger>
              <TabsTrigger value="joined-sessions" className="text-sm sm:text-base">
                Joined ({joinedSessions.length})
              </TabsTrigger>
              <TabsTrigger value="requested-sessions" className="text-sm sm:text-base">
                Pending ({requestedSessions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-sessions">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
                </div>
              ) : mySessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mySessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onUpdate={loadUserSessions} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <Dumbbell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No sessions created</h3>
                  <p className="text-gray-500 mb-6">You haven't created any workout sessions yet</p>
                  <Button 
                    onClick={() => navigate('/create')}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    Create Session
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="joined-sessions">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
                </div>
              ) : joinedSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {joinedSessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onUpdate={loadUserSessions} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No joined sessions</h3>
                  <p className="text-gray-500 mb-6">You haven't joined any workout sessions yet</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    Browse Sessions
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="requested-sessions">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple"></div>
                </div>
              ) : requestedSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {requestedSessions.map(session => (
                    <SessionCard 
                      key={session.id} 
                      session={session} 
                      onUpdate={loadUserSessions} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No pending requests</h3>
                  <p className="text-gray-500 mb-6">You don't have any pending session requests</p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    Browse Sessions
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
