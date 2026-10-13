const SOON = [
  { title: "Creator showcase", body: "A room for the faces you are proud of." },
  { title: "Challenges", body: "Little dares between you and her." },
  { title: "Voice notes", body: "She will leave one when you are out." },
  { title: "Gift shop", body: "Something to send when words are not enough." },
] as const;

export function ComingSoon() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {SOON.map((item) => (
        <article key={item.title} className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Coming soon</p>
          <h3 className="mt-1 font-gothic text-xl">{item.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
        </article>
      ))}
    </section>
  );
}
