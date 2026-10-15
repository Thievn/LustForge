import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BoudoirChat } from "@/components/chat/BoudoirChat";
import { useChatSessionController } from "./chat/useChatSessionController";

const Chat = () => {
  const session = useChatSessionController();

  if (session.companionsLoading || session.forgeLookupBusy) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session.companion) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-muted-foreground">Companion not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <BoudoirChat {...session} />;
};

export default Chat;
