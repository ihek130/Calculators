import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield, Lock, Eye, UserX } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <>
      <Header />
      <Helmet>
        <title>Privacy Policy - CalcVerse</title>
        <meta name="description" content="CalcVerse Privacy Policy - We care about your privacy. No signup required, no data collection, your privacy is 100% safe." />
        <meta name="keywords" content="privacy policy, data protection, no signup, private calculations" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 rounded-full">
                <Shield className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We care deeply about your privacy. That's why we've built CalcVerse with a no-signup policy - we cannot collect your data because we don't even know who is using our website.
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            
            {/* Privacy Promise */}
            <div className="mb-12 bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-4">
                <Lock className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-green-900">Our Privacy Promise</h2>
              </div>
              <p className="text-lg text-green-800 leading-relaxed">
                <strong>Your privacy is 100% safe with CalcVerse.</strong> We have deliberately designed our platform with a no-signup, 
                no-registration policy specifically to protect your privacy. We cannot collect your personal data because we have no way to identify you.
              </p>
            </div>

            {/* Last Updated */}
            <p className="text-sm text-gray-500 mb-8">
              <strong>Last Updated:</strong> December 2024
            </p>

            {/* What We Don't Collect */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <UserX className="h-8 w-8 text-red-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">What We DON'T Collect</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-xl font-semibold text-red-900 mb-3">Personal Information</h3>
                  <ul className="text-red-800 space-y-2">
                    <li>• No names or email addresses</li>
                    <li>• No phone numbers or addresses</li>
                    <li>• No account creation or profiles</li>
                    <li>• No login credentials</li>
                  </ul>
                </div>
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="text-xl font-semibold text-red-900 mb-3">Calculation Data</h3>
                  <ul className="text-red-800 space-y-2">
                    <li>• No calculation inputs or results</li>
                    <li>• No financial information</li>
                    <li>• No health data</li>
                    <li>• No personal calculations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Protect Your Privacy */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Eye className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">How We Protect Your Privacy</h2>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">No Signup Required</h3>
                  <p className="text-blue-800">
                    You can use all 199+ calculators immediately without creating an account, providing an email, or sharing any personal information.
                  </p>
                </div>
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Client-Side Processing</h3>
                  <p className="text-blue-800">
                    All calculations are performed directly in your browser. Your inputs and results never leave your device or get sent to our servers.
                  </p>
                </div>
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">No Data Storage</h3>
                  <p className="text-blue-800">
                    We don't store any of your calculation data, search queries, or usage patterns. Each calculation session is completely private and temporary.
                  </p>
                </div>
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-900 mb-3">Anonymous Usage</h3>
                  <p className="text-blue-800">
                    We have no way to identify individual users. You are completely anonymous when using our calculators.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Information We May Collect</h2>
              <p className="text-lg text-gray-700 mb-4">
                Like most websites, our web servers may automatically collect basic technical information that cannot be used to identify you personally:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Server Logs:</strong> Basic information like IP addresses (anonymized), browser types, and access times for security and performance purposes.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Analytics:</strong> Aggregated, anonymous usage statistics to help us improve the website (e.g., most popular calculators, general traffic patterns).</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Error Reports:</strong> Technical error information to help us fix bugs and improve performance.</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 mt-4">
                <strong>Important:</strong> This technical data is aggregated, anonymized, and cannot be used to identify individual users or their specific calculations.
              </p>
            </div>

            {/* Cookies */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Cookies and Local Storage</h2>
              <p className="text-lg text-gray-700 mb-4">
                CalcVerse may use minimal, essential cookies and local storage only for:
              </p>
              <ul className="space-y-3 text-gray-700 mb-4">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Functionality:</strong> Remembering your calculator preferences during your session (like selected units or themes).</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Performance:</strong> Basic technical cookies to ensure the website works properly.</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700">
                We do not use tracking cookies, advertising cookies, or any cookies that compromise your privacy.
              </p>
            </div>

            {/* Third-Party Services */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Third-Party Services</h2>
              <p className="text-lg text-gray-700 mb-4">
                CalcVerse may use minimal third-party services for essential website functionality:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Content Delivery:</strong> We may use content delivery networks (CDNs) to make the website faster and more reliable.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span><strong>Analytics:</strong> We may use privacy-focused analytics tools that provide aggregated, anonymous usage statistics.</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 mt-4">
                Any third-party services we use are carefully selected to maintain our privacy standards and do not compromise your anonymity.
              </p>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <p className="text-lg text-green-800 leading-relaxed">
                  Since we don't collect personal data, there's nothing to delete, modify, or export. Your privacy is protected by design. 
                  You have complete control over your data because all calculations happen in your browser and nothing is stored on our servers.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions About Privacy</h2>
              <p className="text-lg text-gray-700">
                If you have any questions about this Privacy Policy or our privacy practices, you can review our open-source code 
                or examine how our calculators work directly in your browser's developer tools.
              </p>
            </div>

            {/* Policy Updates */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Policy Updates</h2>
              <p className="text-lg text-gray-700">
                We may update this Privacy Policy occasionally to reflect changes in our practices or legal requirements. 
                Any updates will be posted on this page with a new "Last Updated" date. Since we don't collect contact information, 
                we cannot notify users directly of changes.
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center bg-green-50 p-8 rounded-lg border border-green-200">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy is Our Priority</h3>
            <p className="text-gray-700 mb-6">
              Enjoy using our calculators with complete peace of mind. Your calculations are private, secure, and never leave your device.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPage;