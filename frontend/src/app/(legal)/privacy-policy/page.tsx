
export default function PrivacyPolicyPage() {
  return (
    <div id="animated-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold font-headline mb-4 text-foreground">Privacy Policy for Flexoraa</h1>
        <p className="text-muted-foreground mb-8">Last Updated: July 26, 2025</p>

        <div className="space-y-8 text-muted-foreground prose-p:text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
          
          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">1. General Information and Scope</h3>
            <p>This Privacy Policy describes how Flexoraa ("Flexoraa," "we," "us," or "our") collects, uses, processes, and discloses information, including personal data, in connection with your access to and use of the Flexoraa Intelligence OS platform and our associated websites (collectively, the "Services"). This policy is intended to help you understand your rights and our obligations regarding your personal data.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">2. Data Controller and Data Protection Officer</h3>
            <h4 className="text-xl font-semibold font-headline">2.1. Controller for Client and Visitor Data</h4>
            <p>For the personal data of our Clients and Website Visitors, Flexoraa is the Data Controller.</p>
            <address className="not-italic text-muted-foreground">
              Flexoraa<br />
              41, Simla Road, Maniktala<br />
              Kolkata, West Bengal, India<br />
              Email: <code className="bg-muted px-1 py-0.5 rounded">legal@flexoraa.com</code>
            </address>

            <h4 className="text-xl font-semibold font-headline">2.2. Processor for Lead Data</h4>
            <p>For the personal data of Leads processed through our Services, our Client is the Data Controller and Flexoraa is the Data Processor. Our processing of Lead data is governed by a Data Processing Addendum (DPA) executed with our Clients.</p>

            <h4 className="text-xl font-semibold font-headline">2.3. Data Protection Officer (DPO)</h4>
            <p>We have appointed a Data Protection Officer to oversee our data protection strategy and implementation. You can contact our DPO at <code className="bg-muted px-1 py-0.5 rounded">dpo@flexoraa.com</code>.</p>

            <h4 className="text-xl font-semibold font-headline">2.4. Data Processing Agreement (DPA)</h4>
            <p>We offer a standard Data Processing Agreement (DPA) to clients upon request, outlining our processor obligations under GDPR and India's DPDP Act.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">3. Detailed Information on Data Processing</h3>
            <h4 className="text-xl font-semibold font-headline">3.1. When You Visit Our Website</h4>
            <ul className="list-none space-y-1">
              <li><strong>Data Processed:</strong> Server log files, including your IP address, browser type and version, operating system, referrer URL, time of the server request, and pages visited.</li>
              <li><strong>Purpose:</strong> To ensure the security and stability of our website, to analyze usage for optimization, and to defend against cyberattacks.</li>
              <li><strong>Legal Basis:</strong> Our legitimate interest (Art. 6(1)(f) GDPR) in maintaining a secure and functional web presence.</li>
            </ul>

            <h4 className="text-xl font-semibold font-headline">3.2. Use of Cookies and Tracking Technologies</h4>
            <p>We use essential, analytics, and marketing cookies. When required by law, we request your consent via a cookie banner. You may revoke or change cookie preferences at any time. To learn more, see our Cookie Policy for a breakdown of cookie types, retention periods, and vendors used.</p>

            <h4 className="text-xl font-semibold font-headline">3.3. When You Register as a Client</h4>
            <ul className="list-none space-y-1">
                <li><strong>Data Processed:</strong> Name, business email address, company name, phone number, password, and payment information.</li>
                <li><strong>Purpose:</strong> To create and manage your account, provide our Services, process payments, and communicate with you about your account.</li>
                <li><strong>Legal Basis:</strong> The performance of a contract to which you are a party (Art. 6(1)(b) GDPR).</li>
                <li><strong>Payment Processing Note:</strong> We do not store your payment card details. All payment transactions are handled securely by third-party payment processors such as Stripe and Razorpay.</li>
            </ul>

            <h4 className="text-xl font-semibold font-headline">3.4. When We Process Lead Data for Our Clients</h4>
             <ul className="list-none space-y-1">
                <li><strong>Data Processed:</strong> All data provided by our Client, including but not limited to names, phone numbers, and email addresses of Leads. Additionally, we generate conversation transcripts from WhatsApp interactions and AI-derived lead scores.</li>
                <li><strong>Purpose:</strong> To execute the core functions of the Flexoraa Intelligence OS as directed by our Client, namely to verify, qualify, score, and facilitate engagement with Leads.</li>
                <li><strong>Legal Basis:</strong> We process this data as a Data Processor under the instruction of our Client (the Data Controller) and pursuant to our DPA.</li>
                <li><strong>Client Responsibility for Lawful Basis:</strong> Flexoraa does not verify whether Clients have obtained appropriate consent or legal basis for uploading Lead Data. By using our Services, Clients represent and warrant that they have lawful grounds (e.g., consent or legitimate interest) to collect, upload, and process personal data through our platform.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">4. Automated Decision-Making and Profiling</h3>
            <p>Our Service utilizes AI to perform lead scoring (e.g., "Hot," "Warm," "Cold"), which constitutes a form of automated processing and profiling.</p>
            <ul className="list-none space-y-1">
              <li><strong>Purpose and Logic:</strong> The purpose is to assist our Clients in efficiently prioritizing engagement efforts. The score is based on factors such as engagement level, responses during conversations, and other metadata. Flexoraa utilizes multiple internal AI models ("Agents") which may securely process lead data based on predefined automation logic. This processing is carried out under our legitimate interest to offer an optimized service, or under our Client's instructions where they are the Data Controller.</li>
              <li><strong>Significance & Consequences:</strong> These automated decisions are assistive; they do not have legal or similarly significant effects and are always subject to human oversight. The ultimate decision to contact, nurture, or disregard a Lead rests with our Client's human sales team.</li>
              <li><strong>Opt-Out Rights:</strong> If you wish to opt out of automated profiling or request a human review of a decision, please contact <code className="bg-muted px-1 py-0.5 rounded">privacy@flexoraa.com</code>. We will accommodate your request in accordance with applicable law.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">5. Recipients of Personal Data and Third-Party Services</h3>
            <p>We engage third-party companies and individuals (Sub-processors) to facilitate our Services. We have entered into DPAs with all Sub-processors who handle personal data. A list of our primary sub-processors can be found in Appendix A.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">6. Hosting and Data Residency</h3>
            <p>All lead and client data is stored securely in Supabase's regional servers, currently set to EU (Frankfurt) or AP (Mumbai), depending on project setup and client requirements. Our self-hosted automation processes are hosted on Hetzner servers in Germany, and our web interface runs on Railway’s cloud infrastructure. All data is encrypted in transit via HTTPS/TLS and at rest. Clients may request data residency preference (EU or India) during onboarding, which Flexoraa will accommodate based on availability.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">7. International Data Transfers</h3>
            <p>Our service providers may be located outside of the European Economic Area (EEA) or your country of residence. When we transfer personal data to these countries, we ensure that appropriate safeguards are in place to protect the data, such as by relying on Standard Contractual Clauses (SCCs) as approved by the European Commission, or other legally-recognized transfer mechanisms.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">8. Data Retention</h3>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Client Data:</strong> We retain your account information for as long as your account is active and for a reasonable period thereafter as necessary to comply with our legal obligations.</li>
                <li><strong>Lead Data:</strong> We retain Lead data processed on behalf of our Clients for the duration specified in our DPA with the Client. Upon termination of the contract or upon instruction from the Client, we will securely delete or return the Lead data.</li>
                <li><strong>Website Data:</strong> Server log data is typically retained for a short period (e.g., 14 days) for security purposes.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">9. Your Data Protection Rights (Rights of the Data Subject)</h3>
            <p>Under GDPR and other data protection laws, you have certain rights, including:</p>
            <ul className="list-disc pl-5 space-y-2">
                <li>Right of Access (Art. 15 GDPR)</li>
                <li>Right to Rectification (Art. 16 GDPR)</li>
                <li>Right to Erasure ("Right to be Forgotten") (Art. 17 GDPR)</li>
                <li>Right to Restriction of Processing (Art. 18 GDPR)</li>
                <li>Right to Data Portability (Art. 20 GDPR): Clients may export their Lead Data in a machine-readable format.</li>
                <li>Right to Object (Art. 21 GDPR)</li>
                <li>Right to Withdraw Consent</li>
            </ul>
            <p>To exercise any of these rights, please contact us at <code className="bg-muted px-1 py-0.5 rounded">privacy@flexoraa.com</code>. We may request identity verification before fulfilling requests.</p>
            <p><strong>Important Note for Leads:</strong> As we are the Data Processor for your data, please direct any rights requests to the company (our Client) that collected your data. We will assist our Clients in fulfilling these requests.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">10. Data Security</h3>
            <p>We are committed to protecting the security of your data. We use a variety of security technologies and procedures—including encryption, access controls, and network security measures—to help protect your personal information from unauthorized access, use, or disclosure.</p>
            <h4 className="text-xl font-semibold font-headline">10.1. Data Breach Notification</h4>
            <p>In the event of a data breach involving personal data, we will notify affected Clients without undue delay and within the timeframes required by applicable law. We will cooperate with Clients to fulfill any legal reporting obligations.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">11. Changes to this Privacy Policy</h3>
            <p>We may update this policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page, updating the "Last Updated" date, and/or by notifying active Clients via email or through the platform dashboard.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">12. Contact Information</h3>
            <p>If you have any questions, concerns, or complaints about this Privacy Policy or our data practices, please contact us or our Data Protection Officer at: <code className="bg-muted px-1 py-0.5 rounded">legal@flexoraa.com</code> or <code className="bg-muted px-1 py-0.5 rounded">dpo@flexoraa.com</code>.</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">13. Local Legal Compliance (India)</h3>
            <p>If you are a resident of India, Flexoraa also complies with the Digital Personal Data Protection (DPDP) Act, 2023. Under DPDP, you have rights including access, correction, grievance redressal, and data deletion. We appoint a Grievance Officer for such requests at: <code className="bg-muted px-1 py-0.5 rounded">grievance@flexoraa.com</code>. All grievances will be acknowledged within 24 hours and resolved within 7 working days. Flexoraa is committed to supporting India’s Consent Manager ecosystem and processes personal data only for the "specified purpose" for which it was collected, as required by law.</p>
          </section>
          
          <section className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">14. Notice for California Residents</h3>
            <p>If you are a resident of California, USA, you have rights under the California Consumer Privacy Act (CCPA), including the right to know, delete, and opt-out of the sale of personal data. Flexoraa does not sell, rent, or disclose personal information for monetary gain and does not engage in "data sales" as defined under the CCPA. To exercise your rights, please contact us at the address provided in Section 12.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
