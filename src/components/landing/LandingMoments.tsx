import { motion, useReducedMotion } from "framer-motion";
import { Heart, Image as ImageIcon, MessageCircle, Phone } from "lucide-react";

const MOMENTS = [
  {
    icon: MessageCircle,
    title: "They text first",
    body: "The thread opens with them. You only have to answer.",
  },
  {
    icon: ImageIcon,
    title: "A picture, mid-thread",
    body: "While you are still talking, a picture can land between the lines.",
  },
  {
    icon: Phone,
    title: "Hear them",
    body: "Pick up when you want their voice, not only the words.",
  },
  {
    icon: Heart,
    title: "Make it physical",
    body: "When you want them closer than the screen, the moment can follow.",
  },
] as const;

export function LandingMoments() {
  const reduced = useReducedMotion();

  return (
    <section className="px-4 pb-4 pt-16 sm:px-6 sm:pt-20" aria-labelledby="landing-moments-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="landing-moments-heading" className="text-center font-gothic text-2xl text-foreground sm:text-3xl">
          Once the thread starts
        </h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {MOMENTS.map((moment, index) => {
            const Icon = moment.icon;
            return (
              <motion.li
                key={moment.title}
                initial={reduced ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.08, ease: "easeOut" }}
                className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_40px_rgba(80,30,50,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)]"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-gothic text-lg text-foreground">{moment.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{moment.body}</p>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
