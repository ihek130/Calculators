import React from 'react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Calculator, Users, Target, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <>
      <Header />
      <Helmet>
        <title>About Us - CalcVerse</title>
        <meta name="description" content="Learn about CalcVerse, your trusted source for 199+ free online calculators. We are committed to improving user utility and making calculations simple." />
        <meta name="keywords" content="about calcverse, online calculators, free tools, calculator website" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <Calculator className="h-12 w-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About CalcVerse</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your trusted destination for comprehensive, free online calculators designed to simplify your daily calculations and improve your productivity.
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            
            {/* Mission Section */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At CalcVerse, we are dedicated to improving user utility by providing a comprehensive suite of 199+ free online calculators. 
                Our mission is to make complex calculations simple, accessible, and reliable for everyone.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                We believe that powerful calculation tools should be available to everyone, without barriers, subscriptions, or unnecessary complexity. 
                That's why we've built CalcVerse as a completely free platform that serves millions of users worldwide.
              </p>
            </div>

            {/* What We Offer */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h4 className="text-xl font-semibold text-blue-900 mb-3">Financial Calculators</h4>
                  <p className="text-blue-800">Mortgage, loan, investment, and retirement planning tools to help you make informed financial decisions.</p>
                </div>
                <div className="p-6 bg-green-50 rounded-lg">
                  <h4 className="text-xl font-semibold text-green-900 mb-3">Health & Fitness</h4>
                  <p className="text-green-800">BMI, calorie, nutrition, and fitness calculators to support your health and wellness journey.</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg">
                  <h4 className="text-xl font-semibold text-purple-900 mb-3">Math & Science</h4>
                  <p className="text-purple-800">Advanced mathematical and scientific calculators for students, professionals, and researchers.</p>
                </div>
                <div className="p-6 bg-orange-50 rounded-lg">
                  <h4 className="text-xl font-semibold text-orange-900 mb-3">Everyday Tools</h4>
                  <p className="text-orange-800">Practical calculators for daily use including conversions, percentages, and utility calculations.</p>
                </div>
              </div>
            </div>

            {/* Our Other Project */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Heart className="h-8 w-8 text-red-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Our Other Project</h2>
              </div>
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border border-red-200">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  We are also the proud owners of <a href="https://petwellbot.com/" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800 font-semibold underline">PetWellBot.com</a>, 
                  a comprehensive platform dedicated to pet health and wellness.
                </p>
                <p className="text-gray-600">
                  Just like CalcVerse, PetWellBot reflects our commitment to creating useful, accessible tools that improve lives - whether for humans or their beloved pets.
                </p>
              </div>
            </div>

            {/* Our Values */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Accuracy</h4>
                  <p className="text-gray-600">Every calculator is built with precision and validated to ensure reliable results you can trust.</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Accessibility</h4>
                  <p className="text-gray-600">Free, fast, and easy-to-use tools that work on any device, anywhere, anytime.</p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                    <Target className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">User Focus</h4>
                  <p className="text-gray-600">Every feature is designed with user utility in mind, making complex calculations simple.</p>
                </div>
              </div>
            </div>

            {/* Why Choose CalcVerse */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose CalcVerse?</h3>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span><strong>Completely Free:</strong> No hidden costs, subscriptions, or premium features. Everything is free forever.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span><strong>No Registration Required:</strong> Start calculating immediately without creating accounts or providing personal information.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span><strong>Mobile Optimized:</strong> All calculators work perfectly on desktop, tablet, and mobile devices.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span><strong>Constantly Updated:</strong> We regularly add new calculators and improve existing ones based on user needs.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3">✓</span>
                  <span><strong>Privacy Focused:</strong> Your calculations stay private - we don't store or track your data.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-blue-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Calculating?</h3>
            <p className="text-gray-600 mb-6">
              Explore our comprehensive collection of calculators and discover tools that make your life easier.
            </p>
            <Link href="/all-calculators">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Browse All Calculators
              </button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;