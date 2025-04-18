import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/toast";

export interface User {
  id: string;
  email: string;
  name: string;
  profilePic?: string;
}

export class AuthService {
  // Get current user from Supabase session
  static async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) return null;
    
    // Get profile data
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error || !data) {
        console.error("Profile fetch error:", error);
        return null;
      }
      
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: data.name,
        profilePic: data.profile_pic
      };
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  }
  
  // Get current user synchronously - returns cached value
  static getCurrentUserSync(): User | null {
    // Check if we have a user in localStorage
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  
  // Update cached user
  static updateCachedUser(user: User | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }
  
  // Sign up with email and password
  static async registerUser(user: { name: string, email: string, password: string }): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            name: user.name
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        toast(error.message, {
          description: "Please try again with different credentials."
        });
        console.error("Registration error:", error);
        return false;
      }
      
      // Success - the profile is created automatically via database trigger
      return true;
    } catch (err) {
      console.error("Registration exception:", err);
      return false;
    }
  }
  
  // Sign in with email and password
  static async login(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast(error.message, {
          description: "Please check your credentials and try again."
        });
        console.error("Login error:", error);
        return null;
      }
      
      if (!data.user) return null;
      
      // Get profile data
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (profileError || !profile) {
          console.error("Profile fetch error:", profileError);
          return null;
        }
        
        const user = {
          id: data.user.id,
          email: data.user.email || '',
          name: profile.name,
          profilePic: profile.profile_pic
        };
        
        // Update cached user
        this.updateCachedUser(user);
        
        return user;
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    } catch (err) {
      console.error("Login exception:", err);
      return null;
    }
  }
  
  // Sign out
  static async logout(): Promise<void> {
    // First clear the cached user
    this.updateCachedUser(null);
    
    // Then sign out from Supabase
    try {
      await supabase.auth.signOut();
      // Dispatch a storage event to notify other tabs
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error during logout:", error);
      // Throw the error so it can be caught by the UI
      throw error;
    }
  }
  
  // Set up auth state change listener
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      // Only handle sign_in and sign_out events
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
      
      if (!session?.user) {
        this.updateCachedUser(null);
        callback(null);
        return;
      }
      
      // For sign in, fetch the profile
      if (event === 'SIGNED_IN') {
        // Use setTimeout to prevent blocking the auth state change callback
        setTimeout(async () => {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileError || !profile) {
              console.error("Profile fetch error:", profileError);
              return;
            }
            
            const user = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile.name,
              profilePic: profile.profile_pic
            };
            
            // Update cached user
            this.updateCachedUser(user);
            callback(user);
          } catch (err) {
            console.error("Profile fetch error:", err);
          }
        }, 0);
      }
    });
  }
}
