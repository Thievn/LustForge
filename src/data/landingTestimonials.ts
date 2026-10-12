/**
 * Real beta-tester quotes only. Leave this empty until someone consents to
 * a name and a quote. The landing page hides the section when this is empty.
 */
export type LandingTestimonial = {
  id: string;
  name: string;
  quote: string;
};

export const LANDING_TESTIMONIALS: readonly LandingTestimonial[] = [];
