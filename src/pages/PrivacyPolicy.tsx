import { Link } from "react-router-dom";
import { LegalPage } from "@/components/legal/LegalPage";

const PrivacyPolicy = () => {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy describes how LustForge (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) handles personal information when you use the
        LustForge website, app, and related services (the &quot;Service&quot;). It should be read with our{" "}
        <Link to="/terms-of-service">Terms of Service</Link>.
      </p>

      <section className="space-y-3">
        <h2>Data we collect</h2>
        <ul>
          <li>Account and waitlist details, such as your email address and a display name.</li>
          <li>Content you create, including messages, pictures, companion settings, and files you upload.</li>
          <li>Messages you send to support.</li>
          <li>Device and log information, such as browser type, IP address, and the pages or screens you use.</li>
          <li>
            Payment status, if you buy a paid feature. Card numbers are handled by our payment processor. We do not store
            them.
          </li>
          <li>Information kept on your device, including whether you confirmed that you are 18 or older.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>How we use information</h2>
        <p>We use this information to:</p>
        <ul>
          <li>provide the Service, including saving chats and pictures to your account</li>
          <li>send waitlist updates and service messages you ask for</li>
          <li>reply to support requests</li>
          <li>keep the Service secure and enforce our Terms</li>
          <li>limit the Service to adults only, 18 and over</li>
          <li>understand, in aggregate, how the Service is used</li>
          <li>meet legal duties</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section className="space-y-3">
        <h2>Cookies</h2>
        <p>
          We use cookies and similar storage that the Service needs in order to work, such as keeping you signed in,
          remembering that you passed the age check, and storing preferences. You can block cookies in your browser. If
          you do, parts of the Service may not work.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Third-party processors</h2>
        <p>
          We use other companies to host the Service, deliver email, process sign-in, process payments, and measure basic
          usage. They may handle personal information only to do that work for us, and not for their own marketing. The
          companies we use can change, so we do not list them here. They may store information in a country other than
          yours. We do not sell your information to them.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Retention</h2>
        <p>
          We keep personal information while your account or waitlist entry is active, and for a limited time after that
          for support, security, and legal duties. You may ask us to delete your account. We delete or de-identify
          information when we no longer need it, unless the law requires us to keep it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect personal information. No method of storage or
          transmission is completely secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have the right to access, correct, delete, or receive a copy of your
          personal information, or to object to certain uses of it. Email{" "}
          <a href="mailto:support@lustforge.app">support@lustforge.app</a> to make a request. We may need to confirm that
          the request is yours. You may also have the right to complain to a privacy regulator.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Children</h2>
        <p>
          The Service is not for children. Adults only, 18 and over. We do not knowingly collect personal information
          from anyone under 18. If you believe someone under 18 has used the Service, email{" "}
          <a href="mailto:support@lustforge.app">support@lustforge.app</a> and we will delete that information.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Changes</h2>
        <p>
          We may update this policy from time to time. We will post the new version on this page and change the date at
          the top. If a change is important, we will also give notice on the Service or by email.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Contact</h2>
        <p>
          Privacy questions: <a href="mailto:support@lustforge.app">support@lustforge.app</a>
        </p>
      </section>
    </LegalPage>
  );
};

export default PrivacyPolicy;
