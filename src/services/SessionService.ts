import { User } from './AuthService';

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
  
  static getSessions(): GymSession[] {
    const sessionsStr = localStorage.getItem(this.SESSIONS_KEY);
    return sessionsStr ? JSON.parse(sessionsStr) : [];
  }
  
  static saveSessions(sessions: GymSession[]): void {
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }
  
  static createSession(session: Omit<GymSession, 'id' | 'createdAt' | 'requests' | 'accepted' | 'ratings'>, user: User): GymSession {
    const sessions = this.getSessions();
    
    const newSession: GymSession = {
      ...session,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      requests: [],
      accepted: [],
      ratings: []
    };
    
    sessions.push(newSession);
    this.saveSessions(sessions);
    return newSession;
  }
  
  static getSessionById(id: string): GymSession | undefined {
    const sessions = this.getSessions();
    return sessions.find(s => s.id === id);
  }
  
  static requestToJoin(sessionId: string, user: User): boolean {
    const sessions = this.getSessions();
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
    this.saveSessions(sessions);
    return true;
  }
  
  static acceptRequest(sessionId: string, userId: string, currentUser: User): boolean {
    const sessions = this.getSessions();
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
    this.saveSessions(sessions);
    return true;
  }
  
  static rejectRequest(sessionId: string, userId: string, currentUser: User): boolean {
    const sessions = this.getSessions();
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
    this.saveSessions(sessions);
    return true;
  }
  
  static rateSession(sessionId: string, rating: number, user: User): boolean {
    const sessions = this.getSessions();
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
    this.saveSessions(sessions);
    return true;
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
  
  static deleteSession(sessionId: string, currentUser: User): boolean {
    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return false;
    
    const session = sessions[sessionIndex];
    
    // Verify current user is the creator
    if (session.creator.id !== currentUser.id) return false;
    
    // Remove the session
    sessions.splice(sessionIndex, 1);
    this.saveSessions(sessions);
    return true;
  }
}
