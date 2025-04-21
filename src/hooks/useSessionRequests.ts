
import { useState } from "react";
import { SessionService } from "@/services/SessionService";
import { AuthService } from "@/services/AuthService";
import { toast } from "@/lib/toast";

export function useSessionRequests(sessionId: string, onUpdate?: () => void) {
  const [loading, setLoading] = useState(false);

  const handleRequestJoin = async (e?: React.MouseEvent) => {
    // Prevent default browser action if event is provided
    if (e) {
      e.preventDefault();
    }
    
    setLoading(true);
    const currentUser = AuthService.getCurrentUserSync();
    if (!currentUser) {
      toast("You must be logged in to request");
      setLoading(false);
      return;
    }
    try {
      const ok = await SessionService.requestToJoin(sessionId, currentUser);
      if (ok) {
        toast("Request sent!", {
          description: "Your request to join has been sent.",
        });
        if (onUpdate) onUpdate();
      } else {
        toast("Request failed", {
          description: "You cannot request to join this session",
        });
      }
    } catch (e) {
      toast("Request failed", { description: "Something went wrong" });
    }
    setLoading(false);
  };

  return { handleRequestJoin, loading };
}
