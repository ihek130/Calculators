import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calculator, DollarSign, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Import calculators data
import calculatorsData from '../data/calculators.json';

const FinancialCalculatorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const financialCalculators = calculatorsData.calculators.filter(calc => calc.category === 'financial');
  
  const filteredCalculators = financialCalculators.filter(calc =>
    calc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title>Financial Calculators - CalcVerse</title>
        <meta name="description" content="Free financial calculators including mortgage, loan, investment, retirement, and more. Calculate instantly with our online tools." />
        <meta name="keywords" content="financial calculator, mortgage calculator, loan calculator, investment calculator, retirement calculator" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="h-8 w-8 text-blue-600" />
                <Link href="/">
                  <h1 className="text-2xl font-bold text-gray-900 cursor-pointer">CalcVerse</h1>
                </Link>
              </div>
              <p className="text-gray-600">Financial Calculators</p>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back button and title */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            
            <div className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-fit">
                <DollarSign className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Financial Calculators
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {financialCalculators.length} calculators for mortgage, loan, investment, and financial planning
              </p>
              
              {/* Search */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search financial calculators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Calculators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCalculators.map((calculator) => (
              <Card key={calculator.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{calculator.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      financial
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {calculator.short_description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={`/calculators/${calculator.slug}`}>
                    <Button className="w-full">
                      Use Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCalculators.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No calculators found matching "{searchTerm}"</p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-600">{financialCalculators.length}</div>
                <div className="text-gray-600">Financial Calculators</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">Free</div>
                <div className="text-gray-600">Always Free to Use</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">Instant</div>
                <div className="text-gray-600">Real-time Results</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialCalculatorsPage;