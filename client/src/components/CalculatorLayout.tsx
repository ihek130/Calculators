import React from 'react';
import { Link } from 'wouter';

interface CalculatorLayoutProps {
  title: string;
  description?: string;
  relatedCalculators?: Array<{
    title: string;
    slug: string;
  }>;
  children: React.ReactNode;
}

const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({
  title,
  description,
  relatedCalculators = [],
  children
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/">
          <span className="text-blue-600 hover:text-blue-800">Home</span>
        </Link>
        <span className="text-gray-500 mx-2">›</span>
        <span className="text-gray-700">{title}</span>
      </div>

      {/* Calculator Content */}
      {children}

      {/* Related Calculators */}
      {relatedCalculators.length > 0 && (
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Related Calculators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedCalculators.map((calc) => (
              <Link key={calc.slug} href={`/calculators/${calc.slug}`}>
                <div className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium py-1">
                  {calc.title}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorLayout;