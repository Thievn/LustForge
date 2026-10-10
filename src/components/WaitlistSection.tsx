import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEdgeFunctionInvokeMessage } from "@/lib/edgeFunction";
import { trackEvent } from "@/lib/analytics";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("waitlist-signup", {
        body: { email: trimmedEmail },
      });
      if (error) {
        throw new Error(await getEdgeFunctionInvokeMessage(error, data));
      }

      const res = (data ?? {}) as {
        status?: "created" | "duplicate";
        email_status?: "email_sent" | "email_failed";
      };

      // Success feedback
      setIsSuccess(true);
      setEmail("");

      if (res.status === "duplicate") {
        toast.success("You're already on the list.", {
          description: "We'll write when it's time.",
          duration: 5000,
        });
      } else {
        toast.success("You're on the list.", {
          description: "We'll write when it's time.",
          duration: 5000,
        });
      }

      if (res.email_status === "email_failed") {
        toast.warning("Waitlist saved, but email delivery failed.", {
          description: "Your signup is safe. We will retry notifications from the admin side.",
          duration: 6500,
        });
      }

      trackEvent("waitlist_submit", {
        result: res.status === "duplicate" ? "duplicate" : "created",
        email_delivered: res.email_status === "email_sent",
      });

    } catch (err: unknown) {
      console.error("Waitlist error:", err);
      toast.error("That didn't go through. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="waitlist" className="relative scroll-mt-28 px-4 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary/[0.06] to-transparent" aria-hidden />
      <div className="relative z-10 mx-auto max-w-xl">
        <div className="rounded-[1.75rem] border border-border bg-card px-6 py-10 text-center shadow-[0_24px_60px_rgba(80,30,50,0.08)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:px-12">
          <Mail className="mx-auto mb-4 h-8 w-8 text-primary" />

          <h2 className="mb-2 font-gothic text-2xl font-bold text-foreground md:text-3xl">
            Leave your name <span className="gradient-vice-text">on the list</span>
          </h2>

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            An email is enough. We'll write when there's a place for you.
          </p>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="h-12 w-12 text-primary" />
              <p className="font-gothic text-2xl text-foreground">You're on the list.</p>
              <p className="text-sm text-muted-foreground">We'll write when it's time.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/80 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/25"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-12 min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining
                  </>
                ) : (
                  "Join the list"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}