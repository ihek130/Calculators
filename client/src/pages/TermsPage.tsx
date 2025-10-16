import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FileText, AlertTriangle, CheckCircle, Scale } from 'lucide-react';

const TermsPage = () => {
  return (
    <>
      <Header />
      <Helmet>
        <title>Terms of Service - CalcVerse</title>
        <meta name="description" content="CalcVerse Terms of Service - Terms and conditions for using our free online calculator platform." />
        <meta name="keywords" content="terms of service, terms and conditions, calculator usage terms" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using CalcVerse.
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            
            {/* Last Updated */}
            <p className="text-sm text-gray-500 mb-8">
              <strong>Last Updated:</strong> December 2024
            </p>

            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Introduction</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Welcome to CalcVerse! These Terms of Service ("Terms") govern your use of the CalcVerse website and services 
                (collectively, the "Service") operated by us.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, 
                then you may not access the Service.
              </p>
            </div>

            {/* Acceptance */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Acceptance of Terms</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                By using CalcVerse, you confirm that you accept these Terms and that you agree to comply with them. 
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </div>

            {/* Service Description */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Description of Service</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                CalcVerse provides free online calculators for various purposes including:
              </p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Financial calculations (mortgages, loans, investments, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Health and fitness calculations (BMI, calories, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Mathematical and scientific calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>General utility calculators for everyday use</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                All calculators are provided free of charge and do not require registration or personal information.
              </p>
            </div>

            {/* Acceptable Use */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Acceptable Use</h2>
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-6">
                <h3 className="text-xl font-semibold text-green-900 mb-3">You may use CalcVerse to:</h3>
                <ul className="space-y-2 text-green-800">
                  <li>• Perform calculations for personal, educational, or professional purposes</li>
                  <li>• Access and use all available calculators</li>
                  <li>• Share links to specific calculators with others</li>
                  <li>• Use the service for legitimate business purposes</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-xl font-semibold text-red-900 mb-3">You must not use CalcVerse to:</h3>
                <ul className="space-y-2 text-red-800">
                  <li>• Attempt to hack, disrupt, or damage the website</li>
                  <li>• Use automated systems to scrape or harvest data</li>
                  <li>• Violate any applicable laws or regulations</li>
                  <li>• Interfere with other users' ability to use the service</li>
                  <li>• Attempt to reverse engineer or copy our calculators</li>
                  <li>• Use the service for any illegal or unauthorized purpose</li>
                </ul>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Important Disclaimers</h2>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mb-6">
                <h3 className="text-xl font-semibold text-orange-900 mb-3">Accuracy of Calculations</h3>
                <p className="text-orange-800 leading-relaxed">
                  While we strive to ensure all calculators are accurate and reliable, we cannot guarantee that all calculations will be 
                  error-free or suitable for your specific needs. Always verify important calculations independently and consult with 
                  qualified professionals for critical decisions.
                </p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 mb-6">
                <h3 className="text-xl font-semibold text-orange-900 mb-3">Financial and Health Advice</h3>
                <p className="text-orange-800 leading-relaxed">
                  CalcVerse provides calculation tools only and does not provide financial, medical, legal, or professional advice. 
                  Our calculators are for informational purposes only. Always consult with qualified professionals before making 
                  important financial, health, or legal decisions.
                </p>
              </div>

              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-xl font-semibold text-orange-900 mb-3">Service Availability</h3>
                <p className="text-orange-800 leading-relaxed">
                  We strive to maintain continuous service availability but cannot guarantee that the website will always be accessible 
                  or error-free. We may temporarily suspend the service for maintenance or updates without prior notice.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Scale className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Limitation of Liability</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                To the fullest extent permitted by law, CalcVerse and its operators shall not be liable for any:
              </p>
              <ul className="space-y-3 text-gray-700 mb-6">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  <span>Direct, indirect, incidental, or consequential damages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  <span>Financial losses resulting from calculator use</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  <span>Errors or omissions in calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  <span>Service interruptions or unavailability</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 mr-3">•</span>
                  <span>Data loss or corruption</span>
                </li>
              </ul>
              <p className="text-lg text-gray-700 leading-relaxed">
                Your use of CalcVerse is at your own risk and discretion.
              </p>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Intellectual Property</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                The CalcVerse website, including its design, code, calculators, and content, is owned by us and protected by 
                intellectual property laws. You may not:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Copy, reproduce, or distribute our calculators or website code</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Create derivative works based on our calculators</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Remove or modify copyright notices or proprietary markings</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">•</span>
                  <span>Use our trademarks or branding without permission</span>
                </li>
              </ul>
            </div>

            {/* Privacy */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Privacy</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we protect your information. 
                By using CalcVerse, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
            </div>

            {/* Modifications */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Modifications to Terms</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will post the updated Terms on this page and update 
                the "Last Updated" date. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Termination</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason, 
                including if you breach these Terms. You may discontinue use of the Service at any time.
              </p>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Governing Law</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
              </p>
            </div>

            {/* Severability */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Severability</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please review our About page for more information about CalcVerse.
              </p>
            </div>
          </div>

          {/* Bottom Notice */}
          <div className="text-center bg-blue-50 p-8 rounded-lg border border-blue-200">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Thank You for Using CalcVerse</h3>
            <p className="text-gray-700">
              By using our calculators, you help us continue providing free, useful tools for everyone.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;