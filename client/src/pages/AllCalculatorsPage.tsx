import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calculator, DollarSign, Heart, Wrench, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Import calculators data
import calculatorsData from '../data/calculators.json';

const AllCalculatorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const allCalculators = calculatorsData.calculators;
  
  const filteredCalculators = allCalculators.filter(calc => {
    const matchesSearch = calc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         calc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || calc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'health': return <Heart className="h-4 w-4" />;
      case 'math': return <Calculator className="h-4 w-4" />;
      case 'other': return <Wrench className="h-4 w-4" />;
      default: return <Calculator className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'text-blue-600 bg-blue-100';
      case 'health': return 'text-green-600 bg-green-100';
      case 'math': return 'text-purple-600 bg-purple-100';
      case 'other': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const groupedCalculators = allCalculators.reduce((acc, calc) => {
    if (!acc[calc.category]) {
      acc[calc.category] = [];
    }
    acc[calc.category].push(calc);
    return acc;
  }, {} as Record<string, typeof allCalculators>);

  return (
    <>
      <Helmet>
        <title>All Calculators - CalcVerse</title>
        <meta name="description" content="Browse all 199 free online calculators organized by category. Financial, health, math, and utility calculators for every need." />
        <meta name="keywords" content="all calculators, online calculator, free calculator, financial calculator, health calculator, math calculator" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <Header />
        
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
              <div className="mx-auto mb-4 p-4 bg-gray-100 rounded-full w-fit">
                <Calculator className="h-12 w-12 text-gray-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                All Calculators
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Browse all {allCalculators.length} free online calculators organized by category
              </p>
              
              {/* Search and Filter */}
              <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search all calculators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="financial">Financial ({calculatorsData.categories.financial.count})</SelectItem>
                    <SelectItem value="health">Health & Fitness ({calculatorsData.categories.health.count})</SelectItem>
                    <SelectItem value="math">Math ({calculatorsData.categories.math.count})</SelectItem>
                    <SelectItem value="other">Other ({calculatorsData.categories.other.count})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6 text-center">
            <p className="text-gray-600">
              Showing {filteredCalculators.length} of {allCalculators.length} calculators
              {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {/* Calculators by Category */}
          {selectedCategory === 'all' && !searchTerm ? (
            // Show grouped by category
            Object.entries(groupedCalculators).map(([category, calculators]) => (
              <div key={category} className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${getCategoryColor(category)}`}>
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 capitalize">
                      {(calculatorsData.categories as any)[category]?.title || category}
                    </h3>
                    <Badge variant="secondary">{calculators.length} calculators</Badge>
                  </div>
                  <Link href={`/${category}-calculators`}>
                    <Button variant="outline" size="sm">
                      View All {(calculatorsData.categories as any)[category]?.title || category}
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {calculators.slice(0, 6).map((calculator) => (
                    <Card key={calculator.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{calculator.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {calculator.category}
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
                
                {calculators.length > 6 && (
                  <div className="text-center mt-6">
                    <Link href={`/${category}-calculators`}>
                      <Button variant="outline">
                        View All {calculators.length} {(calculatorsData.categories as any)[category]?.title || category}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Show filtered results
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCalculators.map((calculator) => (
                <Card key={calculator.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{calculator.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {calculator.category}
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
          )}

          {filteredCalculators.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No calculators found 
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Category Stats */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Calculator Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(calculatorsData.categories).map(([key, category]) => (
                <Link key={key} href={`/${key}-calculators`}>
                  <div className="text-center hover:bg-gray-50 p-4 rounded-lg transition-colors cursor-pointer">
                    <div className={`mx-auto mb-2 p-3 rounded-full w-fit ${getCategoryColor(key)}`}>
                      {getCategoryIcon(key)}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{category.count}</div>
                    <div className="text-gray-600 text-sm">{category.title}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllCalculatorsPage;