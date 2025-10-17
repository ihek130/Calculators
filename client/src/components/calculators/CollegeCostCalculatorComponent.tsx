import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Percent,
  GraduationCap,
  BookOpen,
  Building,
  Target,
  Info,
  AlertCircle
} from 'lucide-react';

interface CollegeInputs {
  currentCost: number;
  inflationRate: number;
  duration: number;
  savingsPercent: number;
  currentSavings: number;
  returnRate: number;
  taxRate: number;
  yearsUntilCollege: number;
  collegeType: string;
}

interface CollegeResults {
  futureCost: number;
  totalCost: number;
  requiredSavings: number;
  currentSavingsGrowth: number;
  additionalSavingsNeeded: number;
  monthlySavingsNeeded: number;
  yearlyProjection: Array<{
    year: number;
    cost: number;
    savings: number;
    gap: number;
  }>;
  costBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  error?: string;
}

const COLLEGE_PRESETS = {
  'private-4': { name: '4-year Private', cost: 62990 },
  'public-in-4': { name: '4-year Public (In-State)', cost: 29910 },
  'public-out-4': { name: '4-year Public (Out-of-State)', cost: 49080 },
  'public-2': { name: '2-year Public', cost: 20570 }
};

const CollegeCostCalculatorComponent = () => {
  const [inputs, setInputs] = useState<CollegeInputs>({
    currentCost: 29910,
    inflationRate: 5,
    duration: 4,
    savingsPercent: 35,
    currentSavings: 0,
    returnRate: 5,
    taxRate: 25,
    yearsUntilCollege: 3,
    collegeType: 'public-in-4'
  });

  const [results, setResults] = useState<CollegeResults>({
    futureCost: 0,
    totalCost: 0,
    requiredSavings: 0,
    currentSavingsGrowth: 0,
    additionalSavingsNeeded: 0,
    monthlySavingsNeeded: 0,
    yearlyProjection: [],
    costBreakdown: []
  });
  const [activeTab, setActiveTab] = useState('calculator');

  // Enhanced college cost calculation
  const calculateCollegeCosts = (inputs: CollegeInputs): CollegeResults => {
    const {
      currentCost,
      inflationRate,
      duration,
      savingsPercent,
      currentSavings,
      returnRate,
      taxRate,
      yearsUntilCollege
    } = inputs;

    // Input validation
    if (currentCost <= 0 || duration <= 0 || yearsUntilCollege < 0) {
      return { error: 'Please check your input values' } as CollegeResults;
    }

    const inflationDecimal = inflationRate / 100;
    const returnDecimal = returnRate / 100;
    const taxDecimal = taxRate / 100;
    const afterTaxReturn = returnDecimal * (1 - taxDecimal);

    // Calculate future cost when college starts
    const futureCostFirstYear = currentCost * Math.pow(1 + inflationDecimal, yearsUntilCollege);
    
    // Calculate total cost over college duration with continued inflation
    let totalCost = 0;
    const yearlyProjection = [];
    
    for (let year = 0; year < duration; year++) {
      const yearCost = futureCostFirstYear * Math.pow(1 + inflationDecimal, year);
      totalCost += yearCost;
    }

    // Calculate required savings (percentage of total cost)
    const requiredSavings = totalCost * (savingsPercent / 100);

    // Calculate growth of current savings
    const currentSavingsGrowth = currentSavings * Math.pow(1 + afterTaxReturn, yearsUntilCollege);

    // Calculate additional savings needed
    const additionalSavingsNeeded = Math.max(0, requiredSavings - currentSavingsGrowth);

    // Calculate monthly savings needed
    const monthsToSave = yearsUntilCollege * 12;
    let monthlySavingsNeeded = 0;
    
    if (monthsToSave > 0 && additionalSavingsNeeded > 0) {
      // PMT formula for annuity
      const monthlyRate = afterTaxReturn / 12;
      if (monthlyRate > 0) {
        monthlySavingsNeeded = additionalSavingsNeeded * monthlyRate / (Math.pow(1 + monthlyRate, monthsToSave) - 1);
      } else {
        monthlySavingsNeeded = additionalSavingsNeeded / monthsToSave;
      }
    }

    // Generate yearly projection
    for (let year = 0; year <= yearsUntilCollege + duration; year++) {
      let savings = currentSavings * Math.pow(1 + afterTaxReturn, year);
      
      // Add monthly contributions if within savings period
      if (year <= yearsUntilCollege && monthlySavingsNeeded > 0) {
        const monthsContributed = year * 12;
        if (afterTaxReturn > 0) {
          const monthlyRate = afterTaxReturn / 12;
          const futureValueContributions = monthlySavingsNeeded * 
            (Math.pow(1 + monthlyRate, monthsContributed) - 1) / monthlyRate;
          savings += futureValueContributions;
        } else {
          savings += monthlySavingsNeeded * monthsContributed;
        }
      }

      let cost = 0;
      if (year >= yearsUntilCollege && year < yearsUntilCollege + duration) {
        const collegeYear = year - yearsUntilCollege;
        cost = futureCostFirstYear * Math.pow(1 + inflationDecimal, collegeYear);
      }

      yearlyProjection.push({
        year: year,
        cost: Math.round(cost),
        savings: Math.round(savings),
        gap: Math.round(Math.max(0, cost - savings))
      });
    }

    // Cost breakdown for pie chart
    const savingsAmount = requiredSavings;
    const loanAmount = Math.max(0, totalCost - savingsAmount);
    
    const costBreakdown = [
      { name: 'From Savings', value: savingsAmount, color: '#10b981' },
      { name: 'From Loans/Other', value: loanAmount, color: '#ef4444' }
    ].filter(item => item.value > 0);

    return {
      futureCost: Math.round(futureCostFirstYear),
      totalCost: Math.round(totalCost),
      requiredSavings: Math.round(requiredSavings),
      currentSavingsGrowth: Math.round(currentSavingsGrowth),
      additionalSavingsNeeded: Math.round(additionalSavingsNeeded),
      monthlySavingsNeeded: Math.round(monthlySavingsNeeded),
      yearlyProjection,
      costBreakdown
    };
  };

  // Handle college type preset changes
  const handleCollegeTypeChange = (value: string) => {
    const preset = COLLEGE_PRESETS[value as keyof typeof COLLEGE_PRESETS];
    if (preset) {
      setInputs(prev => ({
        ...prev,
        collegeType: value,
        currentCost: preset.cost
      }));
    }
  };

  // Handle input changes with real-time calculation
  const handleInputChange = (field: keyof CollegeInputs, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Input validation with bounds
    const validatedValue = (() => {
      switch (field) {
        case 'currentCost':
          return Math.max(0, Math.min(numValue, 200000)); // $0 to $200K
        case 'inflationRate':
        case 'returnRate':
          return Math.max(0, Math.min(numValue, 20)); // 0% to 20%
        case 'duration':
          return Math.max(1, Math.min(numValue, 8)); // 1 to 8 years
        case 'savingsPercent':
          return Math.max(0, Math.min(numValue, 100)); // 0% to 100%
        case 'currentSavings':
          return Math.max(0, Math.min(numValue, 1000000)); // $0 to $1M
        case 'taxRate':
          return Math.max(0, Math.min(numValue, 50)); // 0% to 50%
        case 'yearsUntilCollege':
          return Math.max(0, Math.min(numValue, 18)); // 0 to 18 years
        default:
          return numValue;
      }
    })();
    
    setInputs(prev => ({ ...prev, [field]: validatedValue }));
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Format percentage
  const formatPercent = (value: number): string => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Calculate results on input changes
  useEffect(() => {
    const calculationResults = calculateCollegeCosts(inputs);
    setResults(calculationResults);
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            College Cost Calculator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate future college costs with inflation and determine how much you need to save. 
            Plan your education funding strategy with detailed projections and savings recommendations.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                College Cost Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* College Type Preset */}
              <div>
                <Label className="text-sm font-medium mb-2 block">College Type</Label>
                <Select value={inputs.collegeType} onValueChange={handleCollegeTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COLLEGE_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.name} - {formatCurrency(preset.cost)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Annual Cost */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Current Annual College Cost
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.currentCost}
                    onChange={(e) => handleInputChange('currentCost', e.target.value)}
                    className="pl-10"
                    placeholder="29910"
                  />
                </div>
              </div>

              {/* Inflation Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  College Cost Increase Rate
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.inflationRate}
                    onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                    className="pl-10"
                    placeholder="5.0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">5% recommended</p>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Expected College Duration
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="pl-10"
                    placeholder="4"
                  />
                </div>
              </div>

              {/* Years Until College */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  College Will Start In
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.yearsUntilCollege}
                    onChange={(e) => handleInputChange('yearsUntilCollege', e.target.value)}
                    className="pl-10"
                    placeholder="3"
                  />
                </div>
              </div>

              {/* Savings Percentage */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Percent of Costs from Savings
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.savingsPercent}
                    onChange={(e) => handleInputChange('savingsPercent', e.target.value)}
                    className="pl-10"
                    placeholder="35"
                  />
                </div>
              </div>

              {/* Current Savings */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  College Savings Balance Now
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.currentSavings}
                    onChange={(e) => handleInputChange('currentSavings', e.target.value)}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Amount saved so far</p>
              </div>

              {/* Return Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Investment Return Rate
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.returnRate}
                    onChange={(e) => handleInputChange('returnRate', e.target.value)}
                    className="pl-10"
                    placeholder="5.0"
                  />
                </div>
              </div>

              {/* Tax Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Tax Rate on Investment Returns
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                    className="pl-10"
                    placeholder="25"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Use 0% for 529 plan savings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {results.error ? (
            <Card className="shadow-lg border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{results.error}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Results */}
              <Card className="shadow-lg border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    College Cost Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-blue-600 font-medium">First Year Cost</div>
                      <div className="text-xl font-bold text-blue-900">
                        {formatCurrency(results.futureCost)}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">When college starts</div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-purple-600 font-medium">Total Cost</div>
                      <div className="text-xl font-bold text-purple-900">
                        {formatCurrency(results.totalCost)}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">{inputs.duration} years</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-green-600 font-medium">Required Savings</div>
                      <div className="text-xl font-bold text-green-900">
                        {formatCurrency(results.requiredSavings)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">{inputs.savingsPercent}% of total</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-orange-600 font-medium">Monthly Savings</div>
                      <div className="text-xl font-bold text-orange-900">
                        {formatCurrency(results.monthlySavingsNeeded)}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">Needed to reach goal</div>
                    </div>
                  </div>

                  {/* Savings Progress */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Current Savings Progress</span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(results.currentSavingsGrowth)} of {formatCurrency(results.requiredSavings)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (results.currentSavingsGrowth / results.requiredSavings) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {results.additionalSavingsNeeded > 0 
                        ? `Additional ${formatCurrency(results.additionalSavingsNeeded)} needed`
                        : 'Savings goal achieved!'
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Savings vs Cost Projection */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Savings vs Cost Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.yearlyProjection || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="savings" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          name="Savings Growth"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          name="Annual Cost"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Funding Breakdown */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Funding Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={results.costBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {results.costBreakdown?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* College Cost Reference */}
              <Card className="shadow-lg border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    2024-2025 Average College Costs Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(COLLEGE_PRESETS).map(([key, preset]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-sm font-medium text-gray-700">{preset.name}</div>
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(preset.cost)}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Source: The College Board. These figures include tuition, fees, room, board, and other expenses.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Educational Content */}
        <div className="lg:col-span-3 mt-12 space-y-12">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                Understanding College Costs: A Comprehensive Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-8">
              <div className="text-xl leading-relaxed">
                <p className="mb-6">
                  Planning for college expenses is one of the most significant financial challenges families face today. With the average cost of a four-year degree continuing to rise, understanding how to calculate, plan, and save for college expenses has become crucial for financial security and educational accessibility.
                </p>

                <p className="mb-8">
                  Our College Cost Calculator helps you estimate the total cost of a college education while factoring in inflation, potential savings growth, and various funding sources. This comprehensive tool enables you to make informed decisions about education planning and develop effective savings strategies.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                  How College Costs Work
                </h3>
                
                <p className="mb-4">
                  College costs encompass multiple components that vary significantly by institution type, location, and student circumstances. Understanding these cost components is essential for accurate planning:
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong className="text-gray-900">Tuition and Fees:</strong>
                        <p className="text-gray-600 text-sm">The primary instructional costs charged by institutions, including mandatory fees for technology, athletics, and student services.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong className="text-gray-900">Room and Board:</strong>
                        <p className="text-gray-600 text-sm">Housing and meal plan expenses, which can vary dramatically between on-campus and off-campus options.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <strong className="text-gray-900">Books and Supplies:</strong>
                        <p className="text-gray-600 text-sm">Textbooks, digital resources, laboratory materials, and other academic supplies required for coursework.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <strong className="text-gray-900">Transportation:</strong>
                        <p className="text-gray-600 text-sm">Costs for traveling to and from campus, including airfare, gas, vehicle maintenance, and local transportation.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <strong className="text-gray-900">Personal Expenses:</strong>
                        <p className="text-gray-600 text-sm">Clothing, entertainment, healthcare, and other personal needs during the academic year.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-blue-100">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">Cost by Institution Type (2024-2025 Academic Year)</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-1">Public Four-Year (In-State)</div>
                        <div className="text-lg font-bold text-blue-900">$27,000-$35,000</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-1">Public Four-Year (Out-of-State)</div>
                        <div className="text-lg font-bold text-blue-900">$43,000-$55,000</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-1">Private Four-Year</div>
                        <div className="text-lg font-bold text-blue-900">$55,000-$75,000</div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-800 mb-1">Community College</div>
                        <div className="text-lg font-bold text-blue-900">$4,500-$8,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl border border-orange-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  The Impact of Inflation on College Costs
                </h3>
                
                <p className="mb-4">
                  College costs have historically increased at rates higher than general inflation. Over the past three decades, college costs have increased at an average annual rate of 5-7%, significantly outpacing the general inflation rate of 2-3%. This trend makes early planning and aggressive saving strategies essential.
                </p>

                <p className="mb-6">
                  Our calculator uses a default inflation rate of 5% annually, but you can adjust this based on current economic conditions and historical trends. Consider these factors when setting your inflation rate:
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-orange-100">
                    <h4 className="font-semibold text-orange-900 mb-2">Historical Factors</h4>
                    <ul className="text-orange-800 space-y-1 text-sm">
                      <li>• Historical college cost inflation rates for your target institutions</li>
                      <li>• Technology investments and infrastructure improvements</li>
                      <li>• Faculty salary increases and benefit costs</li>
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-orange-100">
                    <h4 className="font-semibold text-orange-900 mb-2">Economic Factors</h4>
                    <ul className="text-orange-800 space-y-1 text-sm">
                      <li>• Current economic conditions and federal policies</li>
                      <li>• State funding trends for public institutions</li>
                      <li>• Regional economic growth and cost of living</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="h-6 w-6 text-green-600" />
                  529 Education Savings Plans
                </h3>
                
                <p className="mb-6">
                  529 plans are tax-advantaged savings vehicles designed specifically for education expenses. These plans offer significant benefits for college savings strategies and should be a cornerstone of most families' education funding approach.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg border border-green-100">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">529 Plan Advantages</h4>
                    <ul className="text-green-800 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Tax-free growth on investments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Tax-free withdrawals for qualified expenses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>High contribution limits ($300,000+ in most states)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>State tax deductions in many states</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Professional investment management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Flexibility to change beneficiaries</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-yellow-100">
                    <h4 className="text-lg font-semibold text-yellow-900 mb-4">529 Plan Considerations</h4>
                    <ul className="text-yellow-800 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">!</span>
                        <span>Penalties for non-qualified withdrawals</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">!</span>
                        <span>Limited investment options</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">!</span>
                        <span>Impact on financial aid eligibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">!</span>
                        <span>State-specific plan variations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">!</span>
                        <span>Annual contribution limits for gift tax purposes</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-green-100">
                  <h4 className="text-lg font-semibold text-green-900 mb-3">Investment Growth Expectations</h4>
                  <p className="text-green-800 mb-3">
                    When using a 529 plan, consider the investment growth potential based on your risk tolerance and time horizon:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4-6%</div>
                      <div className="text-sm text-green-700">Conservative Portfolios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">6-8%</div>
                      <div className="text-sm text-green-700">Moderate Portfolios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">7-9%</div>
                      <div className="text-sm text-green-700">Aggressive Portfolios</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Info className="h-6 w-6 text-purple-600" />
                  Financial Aid and Funding Strategies
                </h3>
                
                <p className="mb-6">
                  Understanding the financial aid landscape is crucial for comprehensive college cost planning. Financial aid comes in several forms, each with different qualification criteria and repayment terms. A strategic approach combines savings, aid, and smart borrowing.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-purple-100">
                    <h4 className="text-xl font-semibold text-purple-900 mb-4">Federal Financial Aid</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <strong className="text-purple-800">Pell Grants:</strong>
                          <p className="text-purple-700 text-sm">Need-based grants that don't require repayment, with maximum awards around $7,000-$8,000 annually</p>
                        </div>
                        <div>
                          <strong className="text-purple-800">Federal Direct Loans:</strong>
                          <p className="text-purple-700 text-sm">Low-interest loans with flexible repayment options and borrower protections</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-purple-800">Work-Study Programs:</strong>
                          <p className="text-purple-700 text-sm">Part-time employment opportunities that help students earn money for education expenses</p>
                        </div>
                        <div>
                          <strong className="text-purple-800">PLUS Loans:</strong>
                          <p className="text-purple-700 text-sm">Federal loans for parents and graduate students with higher borrowing limits</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-purple-100">
                    <h4 className="text-xl font-semibold text-purple-900 mb-4">Institutional and Private Aid</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <strong className="text-purple-800">Merit Scholarships:</strong>
                          <p className="text-purple-700 text-sm">Awards based on academic, athletic, or artistic achievements</p>
                        </div>
                        <div>
                          <strong className="text-purple-800">Need-Based Grants:</strong>
                          <p className="text-purple-700 text-sm">Institutional aid for students demonstrating financial need</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <strong className="text-purple-800">Private Scholarships:</strong>
                          <p className="text-purple-700 text-sm">Awards from organizations, foundations, and corporations</p>
                        </div>
                        <div>
                          <strong className="text-purple-800">State Grants:</strong>
                          <p className="text-purple-700 text-sm">Need and merit-based aid programs administered by state governments</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3">FAFSA and Expected Family Contribution (EFC)</h4>
                    <p className="text-blue-800 mb-3">
                      The Free Application for Federal Student Aid (FAFSA) determines your Expected Family Contribution (EFC), which affects eligibility for need-based aid. Key factors include:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ul className="text-blue-700 space-y-1 text-sm">
                        <li>• Family income and assets</li>
                        <li>• Number of children in college</li>
                      </ul>
                      <ul className="text-blue-700 space-y-1 text-sm">
                        <li>• Parent and student age</li>
                        <li>• Family size and composition</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-8 rounded-xl border border-indigo-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  Savings Strategies and Timing
                </h3>
                
                <p className="mb-6">
                  Effective college savings requires a combination of strategic planning, consistent contributions, and appropriate investment allocation. The power of compound growth makes early saving particularly valuable, but it's never too late to start.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-indigo-100">
                    <h4 className="text-xl font-semibold text-indigo-900 mb-4">Age-Based Savings Strategies</h4>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-blue-900">Ages 0-8: Aggressive Growth Phase</h5>
                        <p className="text-blue-800 text-sm">Focus on growth-oriented investments with 80-90% equity allocation. Long time horizon allows for market volatility recovery.</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-green-900">Ages 9-14: Moderate Growth Phase</h5>
                        <p className="text-green-800 text-sm">Gradually shift to more balanced portfolio with 60-70% equity allocation. Begin reducing risk as college approaches.</p>
                      </div>
                      <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-yellow-900">Ages 15-18: Capital Preservation Phase</h5>
                        <p className="text-yellow-800 text-sm">Prioritize capital preservation with 30-40% equity allocation. Focus on maintaining purchasing power and avoiding significant losses.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-indigo-100">
                    <h4 className="text-xl font-semibold text-indigo-900 mb-4">Monthly Contribution Guidelines</h4>
                    <p className="text-indigo-800 mb-4">
                      Consistent monthly contributions often prove more manageable than large annual deposits. Consider these general guidelines for monthly savings targets:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-2">Birth to Age 5</h5>
                        <div className="text-indigo-800 text-sm space-y-1">
                          <div><strong>Public College:</strong> $300-500/month</div>
                          <div><strong>Private College:</strong> $500-800/month</div>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-2">Age 6-12</h5>
                        <div className="text-indigo-800 text-sm space-y-1">
                          <div><strong>Public College:</strong> $400-700/month</div>
                          <div><strong>Private College:</strong> $700-1,200/month</div>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h5 className="font-semibold text-indigo-900 mb-2">Age 13-18</h5>
                        <div className="text-indigo-800 text-sm space-y-1">
                          <div><strong>Public College:</strong> $600-1,000/month</div>
                          <div><strong>Private College:</strong> $1,000-2,000/month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-xl border border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-gray-600" />
                  Alternative Funding and Cost-Reduction Strategies
                </h3>
                
                <p className="mb-6">
                  Beyond traditional savings and financial aid, families can employ various strategies to reduce college costs and explore alternative funding approaches. These strategies can significantly impact the total cost of education.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">Cost Reduction Strategies</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Community College Transfer:</strong>
                        <p className="text-gray-700 text-sm">Complete general education requirements at lower-cost community colleges before transferring to four-year institutions.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Advanced Placement (AP) Credits:</strong>
                        <p className="text-gray-700 text-sm">Earn college credit during high school through AP examinations, potentially reducing degree completion time.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Dual Enrollment:</strong>
                        <p className="text-gray-700 text-sm">Take college courses while still in high school, often at reduced or no cost.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Accelerated Programs:</strong>
                        <p className="text-gray-700 text-sm">Complete bachelor's degree in three years instead of four through summer courses and heavy course loads.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold text-gray-800">Alternative Funding Sources</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Employer Tuition Assistance:</strong>
                        <p className="text-gray-700 text-sm">Many employers offer education benefits for employees and their children, often overlooked funding sources.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Military Service Benefits:</strong>
                        <p className="text-gray-700 text-sm">GI Bill benefits for military service members and veterans provide substantial education funding.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Coverdell ESA:</strong>
                        <p className="text-gray-700 text-sm">Education Savings Account with additional K-12 expense coverage and investment flexibility.</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <strong className="text-gray-900">Roth IRA Contributions:</strong>
                        <p className="text-gray-700 text-sm">Retirement accounts allowing penalty-free education withdrawals of contributions (not earnings).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-xl border border-emerald-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Percent className="h-6 w-6 text-emerald-600" />
                  Tax Considerations and Benefits
                </h3>
                
                <p className="mb-6">
                  Understanding tax implications can significantly impact your college funding strategy. Several tax benefits and considerations apply to education expenses and savings, potentially saving thousands of dollars over time.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-emerald-100">
                    <h4 className="text-xl font-semibold text-emerald-900 mb-4">Education Tax Credits</h4>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-emerald-800">American Opportunity Tax Credit:</strong>
                        <p className="text-emerald-700 text-sm">Up to $2,500 per student for the first four years of college, 40% refundable.</p>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Lifetime Learning Credit:</strong>
                        <p className="text-emerald-700 text-sm">Up to $2,000 per tax return for qualified education expenses, no year limit.</p>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Tuition and Fees Deduction:</strong>
                        <p className="text-emerald-700 text-sm">Above-the-line deduction for qualified education expenses (when available).</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-emerald-100">
                    <h4 className="text-xl font-semibold text-emerald-900 mb-4">Tax-Advantaged Savings</h4>
                    <div className="space-y-3">
                      <div>
                        <strong className="text-emerald-800">529 Plan State Deductions:</strong>
                        <p className="text-emerald-700 text-sm">Many states offer tax deductions for 529 plan contributions to in-state plans.</p>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Coverdell ESA Benefits:</strong>
                        <p className="text-emerald-700 text-sm">Tax-free growth and withdrawals for qualified education expenses K-12 and higher education.</p>
                      </div>
                      <div>
                        <strong className="text-emerald-800">Series EE/I Savings Bonds:</strong>
                        <p className="text-emerald-700 text-sm">Tax-free interest when used for qualified education expenses (income limits apply).</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8 rounded-xl border border-rose-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-rose-600" />
                  Using This Calculator Effectively
                </h3>
                
                <p className="mb-6">
                  Our College Cost Calculator provides comprehensive projections to help you make informed decisions about education planning. Understanding how to use it effectively can help you develop the most accurate and actionable savings strategy.
                </p>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border border-rose-100">
                    <h4 className="text-lg font-semibold text-rose-900 mb-3">Step-by-Step Guide</h4>
                    <ol className="text-rose-800 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <span><strong>Select College Type:</strong> Choose the institution type that matches your target schools for accurate cost estimates.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <span><strong>Input Current Costs:</strong> Research actual costs for target institutions rather than using national averages.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                        <span><strong>Set Inflation Rate:</strong> Adjust based on historical trends and current economic conditions (typically 4-6% for college costs).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                        <span><strong>Enter Current Savings:</strong> Include all education-designated savings across all account types.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                        <span><strong>Set Expected Returns:</strong> Be realistic about investment returns based on your risk tolerance and time horizon.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-rose-200 text-rose-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">6</span>
                        <span><strong>Review Results:</strong> Analyze the charts and projections to understand funding gaps and opportunities.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h4 className="text-lg font-semibold text-green-900 mb-3">Pro Tips</h4>
                      <ul className="text-green-800 space-y-1 text-sm">
                        <li>• Run scenarios for multiple children with different timelines</li>
                        <li>• Test various inflation rates and expected returns</li>
                        <li>• Consider how savings levels might impact financial aid</li>
                        <li>• Update calculations annually as circumstances change</li>
                        <li>• Compare costs between public and private options</li>
                        <li>• Factor in potential merit scholarship opportunities</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-900 mb-3">Common Mistakes to Avoid</h4>
                      <ul className="text-blue-800 space-y-1 text-sm">
                        <li>• Using only national average costs instead of specific schools</li>
                        <li>• Underestimating the impact of inflation on education costs</li>
                        <li>• Not accounting for taxes on investment gains</li>
                        <li>• Focusing only on tuition while ignoring other expenses</li>
                        <li>• Not considering financial aid impact of savings</li>
                        <li>• Setting unrealistic investment return expectations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Key Takeaways</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Start Early:</strong> Time is your greatest ally in college savings due to compound growth.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Be Consistent:</strong> Regular monthly contributions often outperform sporadic large deposits.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Use Tax Advantages:</strong> 529 plans and education tax credits can significantly boost your savings.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Balance Goals:</strong> Don't sacrifice retirement savings for college funding.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Stay Flexible:</strong> Regularly review and adjust your strategy as circumstances change.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Research Options:</strong> Explore all funding sources including scholarships and alternative programs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How much should I save for my child's college education?</h3>
                <p className="text-gray-700">
                  The amount depends on your target institution type and timeline. Generally, aim to save 1/3 of projected costs, with financial aid and current income covering the remainder. For a public four-year college, consider saving $300-500 monthly starting from birth. For private colleges, target $500-800 monthly.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">When should I start saving for college?</h3>
                <p className="text-gray-700">
                  Start as early as possible to maximize compound growth. Even starting with $50-100 monthly in your child's early years can grow significantly by college age. If starting later, you'll need larger monthly contributions to reach your goals. It's never too late to start, but earlier is always better.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Will my 529 savings affect financial aid eligibility?</h3>
                <p className="text-gray-700">
                  529 plans owned by parents are considered parental assets on the FAFSA, assessed at a maximum rate of 5.64%. This is generally more favorable than other investment accounts. Student-owned 529 plans are assessed at 20%. For most middle-class families, 529 savings won't significantly impact aid eligibility.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What if my child doesn't go to college?</h3>
                <p className="text-gray-700">
                  529 plans offer flexibility: you can change beneficiaries to siblings or other family members, use funds for graduate school, trade schools, or even K-12 tuition. Recent law changes also allow 529 funds to roll to Roth IRAs under certain conditions. Non-qualified withdrawals incur penalties on earnings only.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Should I prioritize college savings over retirement?</h3>
                <p className="text-gray-700">
                  Financial advisors typically recommend prioritizing retirement savings, especially if your employer offers matching contributions. Students can borrow for college, but you can't borrow for retirement. A balanced approach might involve maximizing employer matches first, then splitting additional savings between retirement and education.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I choose between different 529 plans?</h3>
                <p className="text-gray-700">
                  Consider your state's tax benefits, investment options, fees, and performance history. You're not limited to your state's plan, but in-state plans often offer tax deductions. Compare expense ratios, investment choices, minimum contribution requirements, and available age-based or static portfolios.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the difference between a 529 and Coverdell ESA?</h3>
                <p className="text-gray-700">
                  529 plans have higher contribution limits and no income restrictions, while Coverdell ESAs have a $2,000 annual limit but can be used for K-12 expenses and offer more investment flexibility. Many families use 529 plans as their primary vehicle and Coverdell ESAs for supplemental savings or specific investment strategies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How often should I review my college savings strategy?</h3>
                <p className="text-gray-700">
                  Review your strategy annually or when major life changes occur (income changes, additional children, divorce, etc.). Rebalance investments according to your age-based strategy, adjust contributions based on performance, and update cost projections with current tuition information from target schools.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CollegeCostCalculatorComponent;
