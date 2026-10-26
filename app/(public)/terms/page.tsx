import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - FindAm",
  description: "FindAm's terms of service outlining the rules and regulations for using our platform.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-400 mb-12">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing and using FindAm, you accept and agree to be bound by the terms and 
              provisions of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Use of Service</h2>
            <p className="text-gray-300 mb-4">
              You agree to use FindAm only for lawful purposes and in accordance with these Terms. 
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
              <li>Post false, misleading, or fraudulent listings</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with the proper functioning of the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Content</h2>
            <p className="text-gray-300 mb-4">
              You retain ownership of content you post on FindAm. By posting content, you grant us a 
              license to use, modify, and display that content in connection with our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Termination</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to terminate or suspend your account at any time, without prior 
              notice, for conduct that we believe violates these Terms or is harmful to other users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Disclaimers</h2>
            <p className="text-gray-300 mb-4">
              FindAm is provided "as is" without warranties of any kind. We do not guarantee the 
              accuracy, completeness, or reliability of any listings or user content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-300 mb-4">
              FindAm shall not be liable for any indirect, incidental, special, or consequential 
              damages arising out of or in connection with your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Changes to Terms</h2>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Contact</h2>
            <p className="text-gray-300 mb-4">
              Questions about these Terms should be sent to{" "}
              <a href="mailto:legal@findam.ng" className="text-primary-400 hover:text-primary-300">
                legal@findam.ng
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
