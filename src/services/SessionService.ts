
import { User } from './AuthService';
import { supabase } from '@/integrations/supabase/client';

export interface GymSession {
  id: string;
  title: string;
  workoutType: string;
  location: string;
  datetime: string;
  details: string;
  createdAt: number;
  creator: {
    id: string;
    name: string;
    profilePic?: string;
  };
  requests: {
    userId: string;
    name: string;
    profilePic?: string;
  }[];
  accepted: {
    userId: string;
    name: string;
    profilePic?: string;
  }[];
  ratings: {
    userId: string;
    rating: number;
  }[];
}

export class SessionService {
  private static readonly SESSIONS_KEY = 'gym_buddy_sessions';
  
  static async getSessions(): Promise<GymSession[]> {
    try {
      // Fetch sessions from Supabase
      const { data: gymSessions, error } = await supabase
        .from('gym_sessions')
        .select('*');
      
      if (error) {
        console.error('Error fetching sessions from Supabase:', error);
        // Fall back to localStorage if Supabase query fails
        const sessionsStr = localStorage.getItem(this.SESSIONS_KEY);
        return sessionsStr ? JSON.parse(sessionsStr) : [];
      }
      
      if (!gymSessions || gymSessions.length === 0) {
        // If no sessions in Supabase, check localStorage
        const sessionsStr = localStorage.getItem(this.SESSIONS_KEY);
        const localSessions = sessionsStr ? JSON.parse(sessionsStr) : [];
        
        // If we have local sessions, let's migrate them to Supabase
        if (localSessions.length > 0) {
          console.log('Migrating local sessions to Supabase...');
          await this.migrateLocalSessionsToSupabase(localSessions);
          return localSessions;
        }
        
        return [];
      }
      
      // Map Supabase data to our GymSession interface
      const mappedSessions: GymSession[] = gymSessions.map(session => {
        // Get complex data from metadata fields
        const requestsData = this.tryParseJson(session.creator_requests || '[]');
        const acceptedData = this.tryParseJson(session.creator_accepted || '[]');
        const ratingsData = this.tryParseJson(session.creator_ratings || '[]');
        
        return {
          id: session.id,
          title: session.title,
          workoutType: session.workout_type,
          location: session.location,
          datetime: session.date,
          details: session.description || '',
          createdAt: new Date(session.created_at).getTime(),
          creator: {
            id: session.creator_id,
            name: session.creator_name || 'Unknown',
            profilePic: session.creator_profile_pic
          },
          requests: requestsData,
          accepted: acceptedData,
          ratings: ratingsData
        };
      });
      
      return mappedSessions;
      
    } catch (error) {
      console.error('Error in getSessions:', error);
      // Fall back to localStorage in case of any error
      const sessionsStr = localStorage.getItem(this.SESSIONS_KEY);
      return sessionsStr ? JSON.parse(sessionsStr) : [];
    }
  }
  
  // Helper method to safely parse JSON
  private static tryParseJson(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
  }
  
  private static async migrateLocalSessionsToSupabase(sessions: GymSession[]): Promise<void> {
    for (const session of sessions) {
      try {
        // Convert our GymSession to Supabase format
        const supabaseSession = {
          id: session.id,
          title: session.title,
          workout_type: session.workoutType,
          location: session.location,
          date: session.datetime,
          description: session.details,
          created_at: new Date(session.createdAt).toISOString(),
          creator_id: session.creator.id,
          creator_name: session.creator.name,
          creator_profile_pic: session.creator.profilePic,
          creator_requests: JSON.stringify(session.requests),
          creator_accepted: JSON.stringify(session.accepted),
          creator_ratings: JSON.stringify(session.ratings),
          // Default values for required fields
          experience_level: 'intermediate',
          max_participants: 10
        };
        
        const { error } = await supabase
          .from('gym_sessions')
          .insert(supabaseSession);
          
        if (error) {
          console.error('Error migrating session to Supabase:', error);
        }
      } catch (e) {
        console.error('Error in session migration:', e);
      }
    }
  }
  
  static async saveSessions(sessions: GymSession[]): Promise<void> {
    // Save to localStorage as backup
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    
    // We don't do a bulk save to Supabase here as individual operations
    // (create, update, delete) will handle their Supabase operations
  }
  
  static async createSession(session: Omit<GymSession, 'id' | 'createdAt' | 'requests' | 'accepted' | 'ratings'>, user: User): Promise<GymSession> {
    // First create the session object
    const newSession: GymSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      requests: [],
      accepted: [],
      ratings: []
    };
    
    try {
      // Convert to Supabase format
      const supabaseSession = {
        id: newSession.id,
        title: newSession.title,
        workout_type: newSession.workoutType,
        location: newSession.location,
        date: newSession.datetime,
        description: newSession.details,
        created_at: new Date(newSession.createdAt).toISOString(),
        creator_id: user.id,
        creator_name: user.name,
        creator_profile_pic: user.profilePic,
        // Store complex objects in custom fields
        creator_requests: JSON.stringify(newSession.requests),
        creator_accepted: JSON.stringify(newSession.accepted),
        creator_ratings: JSON.stringify(newSession.ratings),
        // Default values for required fields
        experience_level: 'intermediate',
        max_participants: 10
      };
      
      // Save to Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .insert(supabaseSession);
        
      if (error) {
        console.error('Error saving session to Supabase:', error);
      }
      
      // Also update local storage
      const sessions = await this.getSessions();
      sessions.push(newSession);
      await this.saveSessions(sessions);
      
      return newSession;
    } catch (error) {
      console.error('Error in createSession:', error);
      
      // Fall back to localStorage only
      const sessions = await this.getSessions();
      sessions.push(newSession);
      await this.saveSessions(sessions);
      
      return newSession;
    }
  }
  
  static async getSessionById(id: string): Promise<GymSession | undefined> {
    const sessions = await this.getSessions();
    return sessions.find(s => s.id === id);
  }
  
  static async requestToJoin(sessionId: string, user: User): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      
      // Check if user is creator
      if (session.creator.id === user.id) return false;
      
      // Check if user already requested or accepted
      if (
        session.requests.some(r => r.userId === user.id) ||
        session.accepted.some(a => a.userId === user.id)
      ) return false;
      
      session.requests.push({
        userId: user.id,
        name: user.name,
        profilePic: user.profilePic
      });
      
      sessions[sessionIndex] = session;
      await this.saveSessions(sessions);
      
      // Update in Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .update({
          creator_requests: JSON.stringify(session.requests)
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error updating requests in Supabase:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error in requestToJoin:', error);
      return false;
    }
  }
  
  static async acceptRequest(sessionId: string, userId: string, currentUser: User): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      
      // Verify current user is the creator
      if (session.creator.id !== currentUser.id) return false;
      
      // Find request
      const requestIndex = session.requests.findIndex(r => r.userId === userId);
      if (requestIndex === -1) return false;
      
      // Move from requests to accepted
      const request = session.requests[requestIndex];
      session.accepted.push(request);
      session.requests.splice(requestIndex, 1);
      
      sessions[sessionIndex] = session;
      await this.saveSessions(sessions);
      
      // Update in Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .update({
          creator_requests: JSON.stringify(session.requests),
          creator_accepted: JSON.stringify(session.accepted)
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error updating acceptance in Supabase:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error in acceptRequest:', error);
      return false;
    }
  }
  
  static async rejectRequest(sessionId: string, userId: string, currentUser: User): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      
      // Verify current user is the creator
      if (session.creator.id !== currentUser.id) return false;
      
      // Find and remove request
      const requestIndex = session.requests.findIndex(r => r.userId === userId);
      if (requestIndex === -1) return false;
      
      session.requests.splice(requestIndex, 1);
      
      sessions[sessionIndex] = session;
      await this.saveSessions(sessions);
      
      // Update in Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .update({
          creator_requests: JSON.stringify(session.requests)
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error updating requests in Supabase:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error in rejectRequest:', error);
      return false;
    }
  }
  
  static async rateSession(sessionId: string, rating: number, user: User): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      
      // Only accepted users can rate
      if (!session.accepted.some(a => a.userId === user.id)) return false;
      
      // Check if session datetime has passed
      const sessionDate = new Date(session.datetime);
      if (sessionDate > new Date()) return false;
      
      // Remove previous rating if exists
      const existingRatingIndex = session.ratings.findIndex(r => r.userId === user.id);
      if (existingRatingIndex !== -1) {
        session.ratings.splice(existingRatingIndex, 1);
      }
      
      // Add new rating
      session.ratings.push({
        userId: user.id,
        rating
      });
      
      sessions[sessionIndex] = session;
      await this.saveSessions(sessions);
      
      // Update in Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .update({
          creator_ratings: JSON.stringify(session.ratings)
        })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error updating ratings in Supabase:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error in rateSession:', error);
      return false;
    }
  }
  
  static getAverageRating(session: GymSession): number {
    if (session.ratings.length === 0) return 0;
    
    const sum = session.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / session.ratings.length;
  }
  
  static getUserSessionStatus(session: GymSession, userId: string): 'creator' | 'accepted' | 'requested' | 'none' {
    if (session.creator.id === userId) return 'creator';
    if (session.accepted.some(a => a.userId === userId)) return 'accepted';
    if (session.requests.some(r => r.userId === userId)) return 'requested';
    return 'none';
  }
  
  static canRateSession(session: GymSession, userId: string): boolean {
    if (!session.accepted.some(a => a.userId === userId)) return false;
    
    const sessionDate = new Date(session.datetime);
    if (sessionDate > new Date()) return false;
    
    return true;
  }
  
  static async deleteSession(sessionId: string, currentUser: User): Promise<boolean> {
    try {
      const sessions = await this.getSessions();
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      
      // Verify current user is the creator
      if (session.creator.id !== currentUser.id) return false;
      
      // Remove the session from local storage
      sessions.splice(sessionIndex, 1);
      await this.saveSessions(sessions);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('gym_sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) {
        console.error('Error deleting session from Supabase:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }
}
