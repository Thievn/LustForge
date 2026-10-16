import { Link } from "react-router-dom";
import { LegalPage } from "@/components/legal/LegalPage";

const EighteenPlusDisclaimer = () => {
  return (
    <LegalPage title="Adult content notice">
      <p>
        LustForge includes adult sexual content, mature themes, and AI companions. It is intended only for adults.
      </p>
      <p>Adults only, 18 and over. You must be at least 18 years old to use this site and app.</p>
      <p>
        By entering, you confirm that you are 18 or older and that viewing this material is legal where you are. If you
        are under 18, leave now.
      </p>
      <p>
        This notice is part of our <Link to="/terms-of-service">Terms of Service</Link>. Questions:{" "}
        <a href="mailto:support@lustforge.app">support@lustforge.app</a>
      </p>
    </LegalPage>
  );
};

export default EighteenPlusDisclaimer;
