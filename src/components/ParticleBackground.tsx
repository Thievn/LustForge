type ParticleBackgroundProps = {
  /**
   * Kept so existing pages can still pass it. The floating specks are gone:
   * on phones they rendered as a field of black dots.
   */
  contain?: boolean;
};

/** App pages used to paint drifting dots behind the UI. That layer is off. */
const ParticleBackground = (_props: ParticleBackgroundProps) => null;

export default ParticleBackground;
