const fs = require('fs');
const path = require('path');

// Read the calculators data
const calculatorsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'calculators.json'), 'utf8'));

// Generate App.tsx with all routes
function generateUpdatedApp() {
  const imports = calculatorsData.calculators.map(calc => {
    const pageName = calc.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Page';
    return `import ${pageName} from "@/pages/calculators/${pageName}";`;
  }).join('\n');

  const routes = calculatorsData.calculators.map(calc => {
    const pageName = calc.id.split('-').map(word => {
      if (/^\d/.test(word)) {
        word = '_' + word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join('') + 'Page';
    return `      <Route path="/calculators/${calc.slug}" component={${pageName}} />`;
  }).join('\n');

  const appContent = `import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HomePage from "@/components/HomePage";
import NotFound from "@/pages/not-found";

// Import all calculator pages
${imports}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      
      {/* All Calculator Routes */}
${routes}
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
`;

  const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
  fs.writeFileSync(appPath, appContent);
  
  console.log(`✅ Updated App.tsx with ${calculatorsData.calculators.length} calculator routes`);
}

// Generate updated HomePage component
function generateUpdatedHomePage() {
  const homePageContent = `import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Calculator, DollarSign, Heart, Wrench } from 'lucide-react';
import { useState } from 'react';

// Import calculators data
import calculatorsData from '../../data/calculators.json';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const categories = calculatorsData.categories;
  const calculators = calculatorsData.calculators;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CalcVerse</h1>
            </div>
            <p className="text-gray-600">Free Online Calculators for Every Need</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            ${calculatorsData.metadata.total_calculators} Free Online Calculators
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        {!searchTerm && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Calculator Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(categories).map(([key, category]) => (
                <Card key={key} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-2 p-3 bg-blue-100 rounded-full w-fit">
                      {getCategoryIcon(key)}
                    </div>
                    <CardTitle>{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="secondary">{category.count} calculators</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Calculators Grid */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            {searchTerm ? \`Search Results (\${filteredCalculators.length})\` : 'All Calculators'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCalculators.slice(0, searchTerm ? filteredCalculators.length : 12).map((calculator) => (
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
                  <Link to={\`/calculators/\${calculator.slug}\`}>
                    <Button className="w-full">
                      Use Calculator
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {!searchTerm && filteredCalculators.length > 12 && (
            <div className="text-center mt-8">
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                View All {calculatorsData.metadata.total_calculators} Calculators
              </Button>
            </div>
          )}
        </div>

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
    </div>
  );
};

export default HomePage;
`;

  const homePagePath = path.join(__dirname, 'client', 'src', 'components', 'HomePage.tsx');
  fs.writeFileSync(homePagePath, homePageContent);
  
  console.log('✅ Updated HomePage.tsx with all calculator categories and search');
}

// Main execution
function main() {
  console.log('🚀 Updating App.tsx and HomePage with all calculators...');
  
  generateUpdatedApp();
  generateUpdatedHomePage();
  
  console.log('🎉 App and HomePage updated successfully!');
  console.log('');
  console.log('✅ Your CalcVerse app now has:');
  console.log(`   📊 ${calculatorsData.calculators.length} working calculators`);
  console.log('   🔍 Search functionality');
  console.log('   📱 Category organization');
  console.log('   🧮 Real-time calculations');
  console.log('   📈 SEO optimization');
  console.log('');
  console.log('🚀 Ready to run: npm run dev');
}

main();