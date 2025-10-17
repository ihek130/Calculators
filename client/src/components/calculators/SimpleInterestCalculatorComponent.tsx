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
  Target,
  BookOpen,
  Building,
  Info,
  AlertCircle,
  PieChart as PieChartIcon
} from 'lucide-react';

interface SimpleInterestInputs {
  principal: number;
  rate: number;
  time: number;
  frequency: string;
  calculationMode: string;
}

interface SimpleInterestResults {
  endBalance: number;
  totalInterest: number;
  monthlyInterest: number;
  yearlyInterest: number;
  schedule: Array<{
    year: number;
    period: string;
    interest: number;
    balance: number;
    cumulativeInterest: number;
  }>;
  balanceProjection: Array<{
    year: number;
    principal: number;
    interest: number;
    total: number;
  }>;
  breakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  error?: string;
}

const FREQUENCY_OPTIONS = {
  'yearly': { name: 'Per Year', multiplier: 1, periods: 1 },
  'monthly': { name: 'Per Month', multiplier: 12, periods: 12 },
  'quarterly': { name: 'Per Quarter', multiplier: 4, periods: 4 },
  'daily': { name: 'Per Day', multiplier: 365, periods: 365 }
};

const SimpleInterestCalculatorComponent = () => {
  const [inputs, setInputs] = useState<SimpleInterestInputs>({
    principal: 20000,
    rate: 3,
    time: 0,
    frequency: 'yearly',
    calculationMode: 'balance'
  });

  const [results, setResults] = useState<SimpleInterestResults>({
    endBalance: 0,
    totalInterest: 0,
    monthlyInterest: 0,
    yearlyInterest: 0,
    schedule: [],
    balanceProjection: [],
    breakdown: []
  });

  const [activeTab, setActiveTab] = useState('calculator');

  // Simple Interest Calculation
  const calculateSimpleInterest = (inputs: SimpleInterestInputs): SimpleInterestResults => {
    const { principal, rate, time, frequency } = inputs;
    
    // Input validation
    if (principal <= 0 || rate < 0 || time <= 0) {
      return {
        ...results,
        error: 'Please enter valid positive values for principal and time, and non-negative rate.'
      };
    }

    const rateDecimal = rate / 100;
    const frequencyData = FREQUENCY_OPTIONS[frequency as keyof typeof FREQUENCY_OPTIONS];
    
    // Calculate based on frequency
    let totalInterest: number;
    let endBalance: number;
    
    if (frequency === 'yearly') {
      // Simple Interest Formula: I = P × r × t
      totalInterest = principal * rateDecimal * time;
    } else {
      // For other frequencies: I = P × r × n (where r is rate per period, n is number of periods)
      const ratePerPeriod = rateDecimal / frequencyData.multiplier;
      const totalPeriods = time * frequencyData.multiplier;
      totalInterest = principal * ratePerPeriod * totalPeriods;
    }
    
    endBalance = principal + totalInterest;
    
    // Calculate periodic interest amounts
    const yearlyInterest = totalInterest / time;
    const monthlyInterest = totalInterest / (time * 12);

    // Generate year-by-year schedule
    const schedule = [];
    for (let year = 1; year <= time; year++) {
      const yearInterest = yearlyInterest;
      const yearBalance = principal + (yearInterest * year);
      const cumulativeInterest = yearInterest * year;
      
      schedule.push({
        year,
        period: `Year ${year}`,
        interest: yearInterest,
        balance: yearBalance,
        cumulativeInterest
      });
    }

    // Generate balance projection for chart
    const balanceProjection = [
      { year: 0, principal: principal, interest: 0, total: principal }
    ];
    
    for (let year = 1; year <= time; year++) {
      const interestToDate = yearlyInterest * year;
      balanceProjection.push({
        year,
        principal: principal,
        interest: interestToDate,
        total: principal + interestToDate
      });
    }

    // Create breakdown for pie chart
    const breakdown = [
      { name: 'Principal', value: principal, color: '#3b82f6' },
      { name: 'Interest', value: totalInterest, color: '#10b981' }
    ];

    return {
      endBalance: Math.round(endBalance * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      monthlyInterest: Math.round(monthlyInterest * 100) / 100,
      yearlyInterest: Math.round(yearlyInterest * 100) / 100,
      schedule,
      balanceProjection,
      breakdown
    };
  };

  // Handle input changes with real-time calculation
  const handleInputChange = (field: keyof SimpleInterestInputs, value: string | number) => {
    // For string inputs, handle empty strings and non-numeric inputs specially
    if (typeof value === 'string') {
      // If it's an empty string, allow it for text inputs
      if (value === '') {
        if (field === 'time') {
          setInputs(prev => ({ ...prev, [field]: 0 }));
          return;
        }
      }
      
      // Check if it's a valid number
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        // If not a valid number, don't update the state
        return;
      }
      
      // Apply validation bounds only to valid numbers
      const validatedValue = (() => {
        switch (field) {
          case 'principal':
            return Math.max(0, Math.min(numValue, 10000000)); // $0 to $10M
          case 'rate':
            return Math.max(0, Math.min(numValue, 50)); // 0% to 50%
          case 'time':
            return numValue <= 0 ? 0 : Math.max(0.1, Math.min(numValue, 50)); // 0.1 to 50 years, but allow 0 for empty state
          default:
            return numValue;
        }
      })();
      
      setInputs(prev => ({ ...prev, [field]: validatedValue }));
    } else {
      // Direct number value (from select components)
      setInputs(prev => ({ ...prev, [field]: value }));
    }
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate results whenever inputs change
  useEffect(() => {
    const calculationResults = calculateSimpleInterest(inputs);
    setResults(calculationResults);
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Simple Interest Calculator
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate simple interest earnings or payments with our comprehensive calculator. 
            Visualize growth over time and understand the impact of different rates and terms.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Simple Interest Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Principal Amount */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Principal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    value={inputs.principal}
                    onChange={(e) => handleInputChange('principal', e.target.value)}
                    className="pl-8"
                    placeholder="20,000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">The initial amount of money</p>
              </div>

              {/* Interest Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Interest Rate</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={inputs.rate}
                    onChange={(e) => handleInputChange('rate', e.target.value)}
                    className="pr-8"
                    placeholder="3"
                    step="0.1"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Annual interest rate</p>
              </div>

              {/* Time Period */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Time Period</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={inputs.time === 0 ? '' : inputs.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="pr-16"
                    placeholder="Enter years (e.g., 5, 10, 15)"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Length of investment or loan</p>
              </div>

              {/* Calculation Frequency */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Interest Frequency</Label>
                <Select value={inputs.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_OPTIONS).map(([key, option]) => (
                      <SelectItem key={key} value={key}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">How often interest is calculated</p>
              </div>

              {/* Quick Results Summary */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">Quick Results</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">End Balance:</span>
                    <span className="font-semibold text-green-900">{formatCurrency(results.endBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Interest:</span>
                    <span className="font-semibold text-green-900">{formatCurrency(results.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Yearly Interest:</span>
                    <span className="font-semibold text-green-900">{formatCurrency(results.yearlyInterest)}</span>
                  </div>
                </div>
              </div>

              {/* Calculation Steps */}
              {results.totalInterest > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Calculation Steps</h3>
                  <div className="space-y-2 text-sm">
                    <div className="text-gray-700">
                      <strong>Total Interest =</strong> {formatCurrency(inputs.principal)} × {formatPercentage(inputs.rate)} × {inputs.time} years
                    </div>
                    <div className="text-gray-700">
                      <strong>=</strong> {formatCurrency(results.totalInterest)}
                    </div>
                    <div className="mt-2 text-gray-700">
                      <strong>End Balance =</strong> {formatCurrency(inputs.principal)} + {formatCurrency(results.totalInterest)}
                    </div>
                    <div className="text-gray-700">
                      <strong>=</strong> {formatCurrency(results.endBalance)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {results.error ? (
            <Card className="shadow-lg border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">{results.error}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Main Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      Final Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-green-700 mb-1">End Balance</div>
                        <div className="text-2xl font-bold text-green-900">{formatCurrency(results.endBalance)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700">Total Interest</div>
                          <div className="text-lg font-semibold text-blue-900">{formatCurrency(results.totalInterest)}</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-purple-700">Monthly Interest</div>
                          <div className="text-lg font-semibold text-purple-900">{formatCurrency(results.monthlyInterest)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-blue-600" />
                      Balance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={results.breakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {results.breakdown?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Principal</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {((inputs.principal / results.endBalance) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Interest</div>
                        <div className="text-lg font-semibold text-green-600">
                          {((results.totalInterest / results.endBalance) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Balance Growth Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Balance Accumulation Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={results.balanceProjection || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tickFormatter={(value) => `${value} yr`}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(Number(value)), name]}
                        labelFormatter={(value) => `Year ${value}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="principal" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        name="Principal"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="interest" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981" 
                        name="Interest"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Interest Payment Schedule */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Interest Payment Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left p-3 font-semibold">Year</th>
                          <th className="text-right p-3 font-semibold">Interest</th>
                          <th className="text-right p-3 font-semibold">Balance</th>
                          <th className="text-right p-3 font-semibold">Total Interest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.schedule.map((row, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-3 font-medium">{row.year}</td>
                            <td className="p-3 text-right text-green-600">{formatCurrency(row.interest)}</td>
                            <td className="p-3 text-right font-semibold">{formatCurrency(row.balance)}</td>
                            <td className="p-3 text-right text-blue-600">{formatCurrency(row.cumulativeInterest)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Interest Rate Comparison */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-orange-600" />
                    Rate Comparison Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { rate: Math.max(0.5, inputs.rate - 1), label: 'Lower Rate', color: 'blue' },
                      { rate: inputs.rate, label: 'Current Rate', color: 'green' },
                      { rate: inputs.rate + 1, label: 'Higher Rate', color: 'orange' }
                    ].map((scenario) => {
                      const interest = inputs.principal * (scenario.rate / 100) * inputs.time;
                      const balance = inputs.principal + interest;
                      
                      return (
                        <div key={scenario.label} className={`p-4 rounded-lg border bg-${scenario.color}-50 border-${scenario.color}-200`}>
                          <div className={`text-sm font-medium text-${scenario.color}-700 mb-2`}>
                            {scenario.label} ({formatPercentage(scenario.rate)})
                          </div>
                          <div className={`text-lg font-bold text-${scenario.color}-900`}>
                            {formatCurrency(balance)}
                          </div>
                          <div className={`text-sm text-${scenario.color}-600`}>
                            Interest: {formatCurrency(interest)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Compare how different interest rates affect your final balance over {inputs.time} years.
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
                <BookOpen className="h-8 w-8 text-green-600" />
                Understanding Simple Interest: A Complete Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-8">
              <div className="text-xl leading-relaxed">
                <p className="mb-6">
                  Simple interest is one of the fundamental concepts in finance and mathematics. Unlike compound interest, simple interest is calculated only on the principal amount, making it easier to understand and calculate. This straightforward approach to interest calculation is used in various financial products and situations.
                </p>

                <p className="mb-8">
                  Our Simple Interest Calculator helps you determine interest payments, final balances, and payment schedules for loans, investments, and savings accounts that use simple interest calculations. Understanding simple interest is crucial for making informed financial decisions.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-green-600" />
                  What is Simple Interest?
                </h3>
                
                <p className="mb-6">
                  Simple interest is a method of calculating interest charges based only on the principal amount. This means that interest is calculated solely on the original sum of money, and any interest earned or paid does not affect future interest calculations. The interest amount remains constant throughout the term of the loan or investment.
                </p>

                <div className="bg-white p-6 rounded-lg border border-green-100 mb-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-4">Key Characteristics of Simple Interest</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <strong className="text-green-800">Fixed Interest Amount:</strong>
                          <p className="text-green-700 text-sm">The interest amount remains the same for each period throughout the term.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <strong className="text-green-800">Principal-Based Calculation:</strong>
                          <p className="text-green-700 text-sm">Interest is always calculated on the original principal amount only.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <strong className="text-green-800">Linear Growth:</strong>
                          <p className="text-green-700 text-sm">The total amount grows at a constant rate over time.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <strong className="text-green-800">Easy to Calculate:</strong>
                          <p className="text-green-700 text-sm">Simple formula makes calculations straightforward and predictable.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-green-100 p-6 rounded-lg border border-blue-200">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Simple Interest vs. Compound Interest</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-blue-800 mb-2">Simple Interest</h5>
                      <ul className="text-blue-700 space-y-1 text-sm">
                        <li>• Interest calculated on principal only</li>
                        <li>• Fixed interest amount each period</li>
                        <li>• Linear growth pattern</li>
                        <li>• Lower total interest over time</li>
                        <li>• Common in short-term loans</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-green-800 mb-2">Compound Interest</h5>
                      <ul className="text-green-700 space-y-1 text-sm">
                        <li>• Interest calculated on principal + accumulated interest</li>
                        <li>• Growing interest amount each period</li>
                        <li>• Exponential growth pattern</li>
                        <li>• Higher total interest over time</li>
                        <li>• Common in savings accounts and long-term investments</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Target className="h-6 w-6 text-blue-600" />
                  Simple Interest Formula and Calculations
                </h3>
                
                <p className="mb-6">
                  The simple interest formula is straightforward and easy to remember. Understanding this formula and its variations will help you calculate interest in different scenarios and frequencies.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-blue-100">
                    <h4 className="text-xl font-semibold text-blue-900 mb-4">Basic Simple Interest Formula</h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900 mb-2">I = P × r × t</div>
                        <div className="text-lg font-bold text-blue-900 mb-4">Simple Interest = Principal × Rate × Time</div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div><strong className="text-blue-800">I</strong> = Interest amount earned or paid</div>
                        <div><strong className="text-blue-800">P</strong> = Principal (initial amount)</div>
                      </div>
                      <div className="space-y-2">
                        <div><strong className="text-blue-800">r</strong> = Annual interest rate (as decimal)</div>
                        <div><strong className="text-blue-800">t</strong> = Time period in years</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-blue-100">
                    <h4 className="text-xl font-semibold text-blue-900 mb-4">Alternative Formula Variations</h4>
                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-green-900">For Different Time Periods:</h5>
                        <p className="text-green-800 text-sm">I = P × r × (t ÷ frequency) where frequency adjusts for monthly, quarterly, or daily calculations</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-purple-900">Total Amount Formula:</h5>
                        <p className="text-purple-800 text-sm">A = P + I = P + (P × r × t) = P(1 + rt)</p>
                      </div>
                      <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-3 rounded-r-lg">
                        <h5 className="font-semibold text-orange-900">Solving for Principal:</h5>
                        <p className="text-orange-800 text-sm">P = I ÷ (r × t)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Building className="h-6 w-6 text-purple-600" />
                  Practical Examples and Calculations
                </h3>
                
                <p className="mb-6">
                  Let's explore real-world examples to understand how simple interest works in different scenarios. These examples will help you apply the concept to your own financial situations.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-purple-100">
                    <h4 className="text-xl font-semibold text-purple-900 mb-4">Example 1: Personal Loan</h4>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-4">
                      <p className="text-purple-800">
                        <strong>Scenario:</strong> You borrow $10,000 at 6% simple interest for 3 years.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-purple-800 mb-2">Given:</h5>
                          <ul className="text-purple-700 space-y-1 text-sm">
                            <li>• Principal (P) = $10,000</li>
                            <li>• Rate (r) = 6% = 0.06</li>
                            <li>• Time (t) = 3 years</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-purple-800 mb-2">Calculation:</h5>
                          <ul className="text-purple-700 space-y-1 text-sm">
                            <li>• I = $10,000 × 0.06 × 3</li>
                            <li>• I = $1,800</li>
                            <li>• Total Amount = $10,000 + $1,800 = $11,800</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg mt-4">
                        <p className="text-purple-800 font-medium">
                          Result: You'll pay $1,800 in interest over 3 years, with a total repayment of $11,800.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-purple-100">
                    <h4 className="text-xl font-semibold text-purple-900 mb-4">Example 2: Short-term Investment</h4>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                      <p className="text-green-800">
                        <strong>Scenario:</strong> You invest $5,000 in a certificate of deposit with 4% simple interest for 18 months.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-green-800 mb-2">Given:</h5>
                          <ul className="text-green-700 space-y-1 text-sm">
                            <li>• Principal (P) = $5,000</li>
                            <li>• Rate (r) = 4% = 0.04</li>
                            <li>• Time (t) = 18 months = 1.5 years</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-green-800 mb-2">Calculation:</h5>
                          <ul className="text-green-700 space-y-1 text-sm">
                            <li>• I = $5,000 × 0.04 × 1.5</li>
                            <li>• I = $300</li>
                            <li>• Total Amount = $5,000 + $300 = $5,300</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg mt-4">
                        <p className="text-green-800 font-medium">
                          Result: Your investment will earn $300 in interest, growing to $5,300 after 18 months.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-purple-100">
                    <h4 className="text-xl font-semibold text-purple-900 mb-4">Example 3: Monthly Interest Calculation</h4>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <p className="text-blue-800">
                        <strong>Scenario:</strong> Calculate monthly interest on a $20,000 loan at 9% annual simple interest.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-blue-800 mb-2">Method 1 - Annual then Monthly:</h5>
                          <ul className="text-blue-700 space-y-1 text-sm">
                            <li>• Annual Interest = $20,000 × 0.09 = $1,800</li>
                            <li>• Monthly Interest = $1,800 ÷ 12 = $150</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-blue-800 mb-2">Method 2 - Direct Monthly:</h5>
                          <ul className="text-blue-700 space-y-1 text-sm">
                            <li>• Monthly Rate = 9% ÷ 12 = 0.75%</li>
                            <li>• Monthly Interest = $20,000 × 0.0075 = $150</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg mt-4">
                        <p className="text-blue-800 font-medium">
                          Result: Monthly interest payment is $150, regardless of calculation method.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl border border-orange-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                  Financial Instruments Using Simple Interest
                </h3>
                
                <p className="mb-6">
                  While compound interest is more common in modern finance, simple interest is still used in various financial products and situations. Understanding where you'll encounter simple interest helps you make informed financial decisions.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-orange-100">
                    <h4 className="text-xl font-semibold text-orange-900 mb-4">Common Simple Interest Applications</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border-l-4 border-green-500 pl-4">
                          <h5 className="font-semibold text-green-900">Short-term Loans</h5>
                          <p className="text-green-800 text-sm">Personal loans, payday loans, and some auto loans with terms under 2 years often use simple interest.</p>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <h5 className="font-semibold text-blue-900">Government Bonds</h5>
                          <p className="text-blue-800 text-sm">Some government securities pay simple interest as periodic coupon payments.</p>
                        </div>
                        <div className="border-l-4 border-purple-500 pl-4">
                          <h5 className="font-semibold text-purple-900">Promissory Notes</h5>
                          <p className="text-purple-800 text-sm">Business-to-business lending often uses simple interest for clarity and simplicity.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="border-l-4 border-yellow-500 pl-4">
                          <h5 className="font-semibold text-yellow-900">Certificate of Deposits (Some)</h5>
                          <p className="text-yellow-800 text-sm">Short-term CDs may use simple interest, especially for terms under one year.</p>
                        </div>
                        <div className="border-l-4 border-red-500 pl-4">
                          <h5 className="font-semibold text-red-900">Legal Settlements</h5>
                          <p className="text-red-800 text-sm">Court-ordered payments often accrue simple interest to avoid complexity.</p>
                        </div>
                        <div className="border-l-4 border-indigo-500 pl-4">
                          <h5 className="font-semibold text-indigo-900">Educational Purposes</h5>
                          <p className="text-indigo-800 text-sm">Teaching basic finance concepts before introducing compound interest complexity.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-orange-100">
                    <h4 className="text-xl font-semibold text-orange-900 mb-4">When Simple Interest Benefits You</h4>
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-2">As a Borrower</h5>
                        <ul className="text-green-800 space-y-1 text-sm">
                          <li>• Lower total interest cost compared to compound interest over time</li>
                          <li>• Predictable, fixed interest payments make budgeting easier</li>
                          <li>• No penalty for early payment since interest doesn't compound</li>
                          <li>• Easier to understand and verify calculations</li>
                        </ul>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h5 className="font-semibold text-red-900 mb-2">As a Lender/Investor</h5>
                        <ul className="text-red-800 space-y-1 text-sm">
                          <li>• Simple interest typically offers lower returns than compound interest</li>
                          <li>• May be preferred for short-term, low-risk investments</li>
                          <li>• Provides steady, predictable income stream</li>
                          <li>• Easier to calculate and track returns</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-8 rounded-xl border border-teal-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                  Simple vs. Compound Interest: Detailed Comparison
                </h3>
                
                <p className="mb-6">
                  Understanding the difference between simple and compound interest is crucial for making informed financial decisions. Let's explore detailed comparisons with real examples to see how these two methods impact your money over time.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-teal-100">
                    <h4 className="text-xl font-semibold text-teal-900 mb-4">Comparative Example: $10,000 at 5% for 10 Years</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h5 className="font-semibold text-blue-900 mb-3">Simple Interest</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Principal:</span>
                            <span className="font-medium text-blue-900">$10,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Interest per year:</span>
                            <span className="font-medium text-blue-900">$500</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Total interest:</span>
                            <span className="font-medium text-blue-900">$5,000</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-blue-700 font-semibold">Final amount:</span>
                            <span className="font-bold text-blue-900">$15,000</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-900 mb-3">Compound Interest (Annual)</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">Principal:</span>
                            <span className="font-medium text-green-900">$10,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Interest grows yearly:</span>
                            <span className="font-medium text-green-900">Variable</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Total interest:</span>
                            <span className="font-medium text-green-900">$6,289</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-green-700 font-semibold">Final amount:</span>
                            <span className="font-bold text-green-900">$16,289</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800 font-medium">
                        <strong>Difference:</strong> Compound interest earns $1,289 more over 10 years – a 25.8% increase in returns!
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-teal-100">
                    <h4 className="text-xl font-semibold text-teal-900 mb-4">Growth Pattern Analysis</h4>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-semibold text-teal-800 mb-2">Simple Interest Growth</h5>
                          <ul className="text-teal-700 space-y-1 text-sm">
                            <li>• Linear growth pattern</li>
                            <li>• Same interest amount each period</li>
                            <li>• Growth rate decreases over time (as % of total)</li>
                            <li>• Predictable and easy to calculate</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-teal-800 mb-2">Compound Interest Growth</h5>
                          <ul className="text-teal-700 space-y-1 text-sm">
                            <li>• Exponential growth pattern</li>
                            <li>• Increasing interest amount each period</li>
                            <li>• Accelerating growth over time</li>
                            <li>• More complex but higher returns</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                        <h5 className="font-semibold text-teal-900 mb-2">Key Insight</h5>
                        <p className="text-teal-800 text-sm">
                          The longer the time period, the greater the difference between simple and compound interest. 
                          For short-term investments (under 2 years), the difference is minimal. For long-term investments (10+ years), 
                          compound interest significantly outperforms simple interest.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-8 rounded-xl border border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Info className="h-6 w-6 text-gray-600" />
                  Using This Calculator Effectively
                </h3>
                
                <p className="mb-6">
                  Our Simple Interest Calculator is designed to help you understand and calculate simple interest in various scenarios. Here's how to make the most of its features and ensure accurate calculations.
                </p>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Calculator Features Guide</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Input Options</h5>
                          <ul className="text-gray-700 space-y-1 text-sm">
                            <li>• <strong>Principal Amount:</strong> Enter the initial sum (up to $10 million)</li>
                            <li>• <strong>Interest Rate:</strong> Annual percentage rate (0% to 50%)</li>
                            <li>• <strong>Time Period:</strong> Duration in years (supports decimals)</li>
                            <li>• <strong>Interest Frequency:</strong> How often interest is calculated</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Calculation Features</h5>
                          <ul className="text-gray-700 space-y-1 text-sm">
                            <li>• Real-time calculations as you type</li>
                            <li>• Multiple frequency options (yearly, monthly, quarterly, daily)</li>
                            <li>• Step-by-step calculation breakdown</li>
                            <li>• Input validation and error handling</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Visual Outputs</h5>
                          <ul className="text-gray-700 space-y-1 text-sm">
                            <li>• Balance accumulation chart over time</li>
                            <li>• Principal vs. interest breakdown pie chart</li>
                            <li>• Year-by-year payment schedule table</li>
                            <li>• Interest rate comparison analysis</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Results Display</h5>
                          <ul className="text-gray-700 space-y-1 text-sm">
                            <li>• Final balance and total interest</li>
                            <li>• Monthly and yearly interest amounts</li>
                            <li>• Percentage breakdown of principal vs. interest</li>
                            <li>• Formatted currency display for clarity</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Best Practices for Accurate Calculations</h4>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h5 className="font-semibold text-blue-900 mb-2">Interest Rate Entry</h5>
                          <ul className="text-blue-800 space-y-1 text-sm">
                            <li>• Enter as percentage (e.g., 5 for 5%)</li>
                            <li>• Use decimal for precise rates (e.g., 4.25)</li>
                            <li>• Verify annual vs. monthly rates</li>
                          </ul>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h5 className="font-semibold text-green-900 mb-2">Time Period Input</h5>
                          <ul className="text-green-800 space-y-1 text-sm">
                            <li>• Enter years as decimal (1.5 for 18 months)</li>
                            <li>• Convert months to years (divide by 12)</li>
                            <li>• Convert days to years (divide by 365)</li>
                          </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h5 className="font-semibold text-purple-900 mb-2">Frequency Selection</h5>
                          <ul className="text-purple-800 space-y-1 text-sm">
                            <li>• Choose based on payment schedule</li>
                            <li>• Match loan or investment terms</li>
                            <li>• Consider calculation convenience</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h5 className="font-semibold text-yellow-900 mb-2">Common Calculation Scenarios</h5>
                        <div className="grid md:grid-cols-2 gap-4 mt-3">
                          <div>
                            <strong className="text-yellow-800">Loan Calculations:</strong>
                            <p className="text-yellow-700 text-sm">Enter loan amount as principal, annual interest rate, and loan term to find total interest cost.</p>
                          </div>
                          <div>
                            <strong className="text-yellow-800">Investment Returns:</strong>
                            <p className="text-yellow-700 text-sm">Enter investment amount, expected return rate, and time period to project earnings.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border-2 border-gray-200 shadow-lg">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">Key Takeaways</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Simple Interest Formula:</strong> I = P × r × t is easy to remember and apply in various financial situations.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Linear Growth:</strong> Simple interest grows at a constant rate, making it predictable and easy to budget for.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Borrower Advantage:</strong> Simple interest loans typically cost less than compound interest loans over time.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Short-term Focus:</strong> Simple interest is most commonly used for short-term financial products and loans.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Time Matters:</strong> The longer the time period, the greater the advantage of compound over simple interest.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                      <p className="text-gray-700"><strong>Clear Understanding:</strong> Master simple interest concepts before exploring compound interest and complex financial products.</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">When is simple interest used instead of compound interest?</h3>
                <p className="text-gray-700">
                  Simple interest is commonly used for short-term loans (under 2 years), some government bonds, promissory notes, and certain certificates of deposit. It's also used when lenders want to provide borrowers with predictable payments and lower total interest costs.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I calculate simple interest for partial years?</h3>
                <p className="text-gray-700">
                  Convert the time period to years by dividing by the appropriate factor: months ÷ 12, quarters ÷ 4, or days ÷ 365. For example, 18 months = 18 ÷ 12 = 1.5 years. Then use the standard formula: Interest = Principal × Rate × 1.5.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Can I pay off a simple interest loan early?</h3>
                <p className="text-gray-700">
                  Yes, and it's advantageous! With simple interest, early payment reduces the total interest paid since interest is calculated only on the outstanding principal. There's no compound interest to catch up on, making early payment straightforward and beneficial.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Why would someone choose simple interest over compound interest for investments?</h3>
                <p className="text-gray-700">
                  For investments, simple interest is rarely preferred as it provides lower returns. However, it might be chosen for its predictability, ease of calculation, or in situations where the investor wants to withdraw interest payments regularly rather than reinvesting them.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How does the frequency of calculation affect simple interest?</h3>
                <p className="text-gray-700">
                  In true simple interest, the frequency shouldn't change the total interest amount – it only affects when payments are made. However, some financial products labeled as "simple interest" may calculate and capitalize interest at different frequencies, which can slightly affect the total cost.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What's the difference between nominal and effective interest rates in simple interest?</h3>
                <p className="text-gray-700">
                  For simple interest, the nominal and effective rates are the same since there's no compounding. A 5% simple interest rate is exactly 5% regardless of how often interest is calculated or paid. This differs from compound interest where effective rates can be higher than nominal rates.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Are there any tax implications for simple interest?</h3>
                <p className="text-gray-700">
                  Interest earned is generally taxable income when received, while interest paid on qualified loans may be tax-deductible. The simple vs. compound nature doesn't change the tax treatment – what matters is when interest is received or paid and the purpose of the loan or investment.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How accurate is simple interest for real-world financial planning?</h3>
                <p className="text-gray-700">
                  Simple interest provides a good baseline for understanding interest concepts and quick calculations. For precise financial planning, especially long-term goals, compound interest calculations are more accurate since most modern financial products use compounding. Use simple interest for basic estimates and educational purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimpleInterestCalculatorComponent;
