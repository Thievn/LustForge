import { Link } from "react-router-dom";
import { LegalPage } from "@/components/legal/LegalPage";

const TermsOfService = () => {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the LustForge website, app, and related services (the
        &quot;Service&quot;), operated by LustForge (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using the Service, you agree to these
        Terms and to our <Link to="/privacy-policy">Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <section className="space-y-3">
        <h2>Eligibility</h2>
        <p>
          The Service is for adults only, 18 and over. You may use it only if you are at least 18 years old and adult
          content is legal for you where you live. You confirm that when you enter. We may refuse access if we cannot
          confirm that you are eligible.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Account</h2>
        <p>
          Some parts of the Service require an account. You agree to give us a working email address and to keep your
          login details private. You are responsible for what happens on your account. Email{" "}
          <a href="mailto:support@lustforge.app">support@lustforge.app</a> if you think someone else is using it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service if you are under 18</li>
          <li>request, upload, or share sexual content involving anyone under 18</li>
          <li>upload an image of a real person unless you have the right to use it</li>
          <li>harass, threaten, or harm anyone</li>
          <li>break the law, or try to break, copy, scrape, or disrupt the Service</li>
          <li>share your account or resell access</li>
        </ul>
        <p>We may remove content or suspend access that breaks these rules.</p>
      </section>

      <section className="space-y-3">
        <h2>User content</h2>
        <p>
          You keep ownership of the text, images, and other material you submit (&quot;User Content&quot;). You give us permission
          to host, store, display, and process User Content only as needed to run the Service for you. You confirm that
          you have the rights to anything you upload. Where the product lets you delete content, you may do so. You may
          also ask us to close your account.
        </p>
      </section>

      <section className="space-y-3">
        <h2>AI-generated content</h2>
        <p>
          Companions, messages, and images may be produced by automated systems. That output can be wrong, incomplete, or
          unexpected. It is not a real person, and it is not medical, legal, financial, or other professional advice. You
          are responsible for how you use it. We may refuse or filter a request that breaks these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Payments and subscriptions</h2>
        <p>
          If we offer a paid feature, the price, what you receive, and any billing period are shown before you pay. You
          authorize us and our payment processor to charge the payment method you provide. Taxes may be added where the
          law requires them. Unless the law says otherwise, a fee is not refunded after the feature or the paid period
          has been provided. You may cancel a renewing subscription before the next billing date. Cancellation stops
          later charges and does not undo the current period. We may change a price for a later period, and we will tell
          you before that change applies to you.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Intellectual property</h2>
        <p>
          The Service, including its software, design, and the LustForge name and logo, belongs to us or our licensors.
          These Terms do not give you that ownership. You may not copy our branding or present the Service as your own.
          If you send us a suggestion, we may use it without owing you anything for it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Disclaimers</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available.&quot; We do not promise that it will be uninterrupted,
          error-free, or suited to a particular purpose. Companions are generated characters. Time with them is not a
          substitute for a relationship with a real person, or for professional care.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent the law allows, we are not liable for indirect, incidental, special, consequential, or
          punitive damages, or for lost profits, data, or goodwill, arising out of your use of the Service. Our total
          liability for claims related to the Service is limited to the amount you paid us for the Service in the twelve
          months before the claim. If you paid nothing, our liability is limited to what the law requires. Some places do
          not allow these limits. Where they do not, our liability is limited to the extent the law allows.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time and may ask us to close your account. We may suspend or close an
          account, or stop offering the Service, if you break these Terms, if the law requires it, or if we discontinue
          the Service. Sections that by their nature should continue, including intellectual property, disclaimers, and
          limitation of liability, stay in effect.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Governing law</h2>
        <p>
          These Terms are governed by the laws that apply to us, without regard to conflict-of-law rules. The courts in
          that place have jurisdiction, except where the law lets you bring a claim where you live. If a court finds one
          part of these Terms unenforceable, the rest remains in effect.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. We will post the new version on this page and change the date at
          the top. If a change is important, we will also give notice on the Service or by email. If you keep using the
          Service after the update, the new Terms apply.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Contact</h2>
        <p>
          Questions about these Terms: <a href="mailto:support@lustforge.app">support@lustforge.app</a>
        </p>
      </section>
    </LegalPage>
  );
};

export default TermsOfService;
