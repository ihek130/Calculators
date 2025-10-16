import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calculator, DollarSign, Heart, Wrench } from 'lucide-react';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import calculators data
import calculatorsData from '../data/calculators.json';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = calculatorsData.categories;
  const calculators = calculatorsData.calculators;

  // Shared search handler for both header and hero search
  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  // Filter calculators based on search
  const filteredCalculators = calculators.filter(calc =>
    calc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="h-6 w-6" />;
      case 'health': return <Heart className="h-6 w-6" />;
      case 'math': return <Calculator className="h-6 w-6" />;
      case 'other': return <Wrench className="h-6 w-6" />;
      default: return <Calculator className="h-6 w-6" />;
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            199 Free Online Calculators
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            From financial planning to health monitoring, math problems to everyday calculations
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search calculators..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Calculator Categories with Lists */}
        {!searchTerm && (
          <div className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Financial Calculators */}
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 p-4 bg-blue-100 rounded-full w-fit">
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Financial Calculators</h3>
                </div>
                <div className="space-y-2">
                  {calculators.filter(calc => calc.category === 'financial').slice(0, 12).map((calculator) => (
                    <Link key={calculator.id} to={`/calculators/${calculator.slug}`}>
                      <div className="text-blue-600 hover:text-blue-800 hover:underline text-base sm:text-sm font-medium py-1">
                        {calculator.title}
                      </div>
                    </Link>
                  ))}
                  <Link href="/financial-calculators">
                    <div className="text-blue-500 hover:text-blue-700 text-sm font-semibold pt-2 border-t border-gray-200 mt-3">
                      View All Financial Calculators →
                    </div>
                  </Link>
                </div>
              </div>

              {/* Health & Fitness Calculators */}
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 p-4 bg-green-100 rounded-full w-fit">
                    <Heart className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Fitness & Health Calculators</h3>
                </div>
                <div className="space-y-2">
                  {calculators.filter(calc => calc.category === 'health').slice(0, 12).map((calculator) => (
                    <Link key={calculator.id} to={`/calculators/${calculator.slug}`}>
                      <div className="text-blue-600 hover:text-blue-800 hover:underline text-base sm:text-sm font-medium py-1">
                        {calculator.title}
                      </div>
                    </Link>
                  ))}
                  <Link href="/health-calculators">
                    <div className="text-blue-500 hover:text-blue-700 text-sm font-semibold pt-2 border-t border-gray-200 mt-3">
                      View All Health Calculators →
                    </div>
                  </Link>
                </div>
              </div>

              {/* Math Calculators */}
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 p-4 bg-purple-100 rounded-full w-fit">
                    <Calculator className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Math Calculators</h3>
                </div>
                <div className="space-y-2">
                  {calculators.filter(calc => calc.category === 'math').slice(0, 12).map((calculator) => (
                    <Link key={calculator.id} to={`/calculators/${calculator.slug}`}>
                      <div className="text-blue-600 hover:text-blue-800 hover:underline text-base sm:text-sm font-medium py-1">
                        {calculator.title}
                      </div>
                    </Link>
                  ))}
                  <Link href="/math-calculators">
                    <div className="text-blue-500 hover:text-blue-700 text-sm font-semibold pt-2 border-t border-gray-200 mt-3">
                      View All Math Calculators →
                    </div>
                  </Link>
                </div>
              </div>

              {/* Other Calculators */}
              <div>
                <div className="text-center mb-6">
                  <div className="mx-auto mb-3 p-4 bg-orange-100 rounded-full w-fit">
                    <Wrench className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Other Calculators</h3>
                </div>
                <div className="space-y-2">
                  {calculators.filter(calc => calc.category === 'other').slice(0, 12).map((calculator) => (
                    <Link key={calculator.id} to={`/calculators/${calculator.slug}`}>
                      <div className="text-blue-600 hover:text-blue-800 hover:underline text-base sm:text-sm font-medium py-1">
                        {calculator.title}
                      </div>
                    </Link>
                  ))}
                  <Link href="/other-calculators">
                    <div className="text-blue-500 hover:text-blue-700 text-sm font-semibold pt-2 border-t border-gray-200 mt-3">
                      View All Other Calculators →
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* View All Button */}
            <div className="text-center mt-12">
              <Link href="/all-calculators">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  View All {calculatorsData.metadata.total_calculators} Calculators
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results ({filteredCalculators.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCalculators.map((calculator) => (
                <div key={calculator.id} className="space-y-2">
                  <Link to={`/calculators/${calculator.slug}`}>
                    <div className="text-blue-600 hover:text-blue-800 hover:underline text-base sm:text-sm font-medium py-1 border-b border-gray-100">
                      {calculator.title}
                    </div>
                  </Link>
                  <div className="text-xs text-gray-500">{calculator.category}</div>
                </div>
              ))}
            </div>

            {filteredCalculators.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No calculators found matching "{searchTerm}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">{calculatorsData.metadata.total_calculators}</div>
              <div className="text-gray-600">Total Calculators</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{categories.financial.count}</div>
              <div className="text-gray-600">Financial Tools</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{categories.health.count}</div>
              <div className="text-gray-600">Health & Fitness</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{categories.math.count}</div>
              <div className="text-gray-600">Math & Science</div>
            </div>
          </div>
        </div>
    </div>
    <Footer />
    </>
  );
};

export default HomePage;
