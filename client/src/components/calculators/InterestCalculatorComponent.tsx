import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  DollarSign, 
  Calendar, 
  Percent,
  TrendingUp,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Settings,
  BookOpen,
  Target,
  Shield,
  Clock,
  Zap,
  TrendingDown,
  Award
} from 'lucide-react';

interface InterestInputs {
  initialInvestment: number;
  annualContribution: number;
  monthlyContribution: number;
  interestRate: number;
  investmentLength: number;
  compoundFrequency: string;
  taxRate: number;
  inflationRate: number;
  contributionGrowthRate: number;
  taxDeferred: boolean;
}

interface InterestResults {
  finalAmount: number;
  totalContributions: number;
  totalInterest: number;
  afterTaxAmount: number;
  inflationAdjustedAmount: number;
  realReturn: number;
  effectiveAnnualRate: number;
  totalTaxes: number;
  averageAnnualGrowth: number;
  error?: string;
}

interface ChartDataPoint {
  year: number;
  balance: number;
  contributions: number;
  interest: number;
  cumulativeContributions: number;
  cumulativeInterest: number;
  afterTax: number;
  inflationAdjusted: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const InterestCalculatorComponent = () => {
  const [inputs, setInputs] = useState<InterestInputs>({
    initialInvestment: 10000,
    annualContribution: 5000,
    monthlyContribution: 0,
    interestRate: 7.0,
    investmentLength: 20,
    compoundFrequency: 'monthly',
    taxRate: 25,
    inflationRate: 3.0,
    contributionGrowthRate: 0,
    taxDeferred: false
  });

  const [results, setResults] = useState<InterestResults>({
    finalAmount: 0,
    totalContributions: 0,
    totalInterest: 0,
    afterTaxAmount: 0,
    inflationAdjustedAmount: 0,
    realReturn: 0,
    effectiveAnnualRate: 0,
    totalTaxes: 0,
    averageAnnualGrowth: 0
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  // Advanced Interest Calculation with Compound Interest, Taxes, and Inflation
  const calculateInterest = (inputs: InterestInputs): InterestResults => {
    const { 
      initialInvestment,
      annualContribution,
      monthlyContribution,
      interestRate,
      investmentLength,
      compoundFrequency,
      taxRate,
      inflationRate,
      contributionGrowthRate,
      taxDeferred
    } = inputs;

    if (initialInvestment < 0 || interestRate < 0 || investmentLength <= 0) {
      throw new Error('Invalid input values');
    }

    // Calculate compound frequency
    const compoundPerYear = compoundFrequency === 'daily' ? 365 :
                           compoundFrequency === 'monthly' ? 12 :
                           compoundFrequency === 'quarterly' ? 4 :
                           compoundFrequency === 'semi-annually' ? 2 :
                           compoundFrequency === 'annually' ? 1 : 12;

    const periodicRate = interestRate / 100 / compoundPerYear;
    const totalPeriods = investmentLength * compoundPerYear;
    
    // Calculate total annual contributions (monthly + annual)
    const totalAnnualContribution = annualContribution + (monthlyContribution * 12);

    let balance = initialInvestment;
    let totalContributions = initialInvestment;
    let totalInterestEarned = 0;
    let totalTaxesPaid = 0;

    // Year-by-year calculation for detailed tracking
    for (let year = 1; year <= investmentLength; year++) {
      const yearContribution = totalAnnualContribution * Math.pow(1 + contributionGrowthRate / 100, year - 1);
      
      // Add annual contribution at the beginning of the year
      balance += yearContribution;
      totalContributions += yearContribution;

      // Calculate compound interest for the year
      const yearlyGrowth = balance * Math.pow(1 + periodicRate, compoundPerYear) - balance;
      balance += yearlyGrowth;
      totalInterestEarned += yearlyGrowth;

      // Calculate taxes (if not tax-deferred)
      let taxesThisYear = 0;
      if (!taxDeferred) {
        taxesThisYear = yearlyGrowth * (taxRate / 100);
        balance -= taxesThisYear;
        totalTaxesPaid += taxesThisYear;
      }
    }

    // Final calculations
    const finalAmount = balance;
    
    // If tax-deferred, calculate taxes on final amount
    if (taxDeferred) {
      totalTaxesPaid = (finalAmount - totalContributions) * (taxRate / 100);
    }
    
    const afterTaxAmount = taxDeferred ? finalAmount - totalTaxesPaid : finalAmount;
    const inflationAdjustedAmount = afterTaxAmount / Math.pow(1 + inflationRate / 100, investmentLength);
    
    // Calculate real return (after inflation)
    const realReturn = ((inflationAdjustedAmount / totalContributions) ** (1 / investmentLength) - 1) * 100;
    
    // Calculate effective annual rate
    const effectiveAnnualRate = ((finalAmount / totalContributions) ** (1 / investmentLength) - 1) * 100;
    
    // Calculate average annual growth
    const averageAnnualGrowth = (totalInterestEarned / investmentLength);

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      finalAmount: round(finalAmount),
      totalContributions: round(totalContributions),
      totalInterest: round(totalInterestEarned),
      afterTaxAmount: round(afterTaxAmount),
      inflationAdjustedAmount: round(inflationAdjustedAmount),
      realReturn: round(realReturn),
      effectiveAnnualRate: round(effectiveAnnualRate),
      totalTaxes: round(totalTaxesPaid),
      averageAnnualGrowth: round(averageAnnualGrowth)
    };
  };

  // Generate detailed chart data
  const generateChartData = (inputs: InterestInputs): ChartDataPoint[] => {
    const { 
      initialInvestment,
      annualContribution,
      monthlyContribution,
      interestRate,
      investmentLength,
      compoundFrequency,
      taxRate,
      inflationRate,
      contributionGrowthRate,
      taxDeferred
    } = inputs;

    const compoundPerYear = compoundFrequency === 'daily' ? 365 :
                           compoundFrequency === 'monthly' ? 12 :
                           compoundFrequency === 'quarterly' ? 4 :
                           compoundFrequency === 'semi-annually' ? 2 :
                           compoundFrequency === 'annually' ? 1 : 12;

    const periodicRate = interestRate / 100 / compoundPerYear;
    const totalAnnualContribution = annualContribution + (monthlyContribution * 12);

    let balance = initialInvestment;
    let totalContributions = initialInvestment;
    let totalInterestEarned = 0;

    const chartData: ChartDataPoint[] = [{
      year: 0,
      balance: Math.round(initialInvestment),
      contributions: Math.round(initialInvestment),
      interest: 0,
      cumulativeContributions: Math.round(initialInvestment),
      cumulativeInterest: 0,
      afterTax: Math.round(initialInvestment),
      inflationAdjusted: Math.round(initialInvestment)
    }];

    for (let year = 1; year <= investmentLength; year++) {
      const yearContribution = totalAnnualContribution * Math.pow(1 + contributionGrowthRate / 100, year - 1);
      
      balance += yearContribution;
      totalContributions += yearContribution;

      const yearlyGrowth = balance * Math.pow(1 + periodicRate, compoundPerYear) - balance;
      balance += yearlyGrowth;
      totalInterestEarned += yearlyGrowth;

      let afterTaxBalance = balance;
      if (!taxDeferred) {
        afterTaxBalance -= yearlyGrowth * (taxRate / 100);
      }

      const inflationAdjusted = afterTaxBalance / Math.pow(1 + inflationRate / 100, year);

      chartData.push({
        year,
        balance: Math.round(balance),
        contributions: Math.round(yearContribution),
        interest: Math.round(yearlyGrowth),
        cumulativeContributions: Math.round(totalContributions),
        cumulativeInterest: Math.round(totalInterestEarned),
        afterTax: Math.round(afterTaxBalance),
        inflationAdjusted: Math.round(inflationAdjusted)
      });
    }

    return chartData;
  };

  // Handle input changes
  const handleInputChange = (id: keyof InterestInputs, value: string | boolean) => {
    const numValue = typeof value === 'boolean' ? value : (typeof value === 'string' && isNaN(Number(value)) ? value : parseFloat(value as string) || 0);
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculateInterest(newInputs);
        setResults(calculationResults);
        
        const chartResults = generateChartData(newInputs);
        setChartData(chartResults);
      } catch (error: any) {
        console.error('Calculation error:', error);
        setResults({ 
          ...results,
          error: error.message || 'Please check your inputs and try again.' 
        });
      }
    }, 100);
  };

  // Initialize calculations
  useEffect(() => {
    handleInputChange('initialInvestment', inputs.initialInvestment.toString());
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Initial Investment', value: inputs.initialInvestment, color: '#3B82F6' },
    { name: 'Contributions', value: results.totalContributions - inputs.initialInvestment, color: '#10B981' },
    { name: 'Interest Earned', value: results.totalInterest, color: '#F59E0B' },
    { name: 'Taxes Paid', value: results.totalTaxes, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Interest Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate compound interest growth with advanced features including taxes, inflation, and varying contribution schedules. 
          Plan your investment strategy with detailed projections and comprehensive analysis.
        </p>
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Investment Details
              </CardTitle>
              <CardDescription>Enter your investment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initialInvestment">Initial Investment ($)</Label>
                <Input
                  id="initialInvestment"
                  type="number"
                  value={inputs.initialInvestment}
                  onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualContribution">Annual Contribution ($)</Label>
                <Input
                  id="annualContribution"
                  type="number"
                  value={inputs.annualContribution}
                  onChange={(e) => handleInputChange('annualContribution', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Monthly Contribution ($)</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={inputs.monthlyContribution}
                  onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={inputs.interestRate}
                  onChange={(e) => handleInputChange('interestRate', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentLength">Investment Length (years)</Label>
                <Input
                  id="investmentLength"
                  type="number"
                  value={inputs.investmentLength}
                  onChange={(e) => handleInputChange('investmentLength', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compoundFrequency">Compound Frequency</Label>
                <Select value={inputs.compoundFrequency} onValueChange={(value) => handleInputChange('compoundFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compound frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annually">Semi-Annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Options */}
              <Button
                variant="outline"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>{showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options</span>
              </Button>

              {showAdvancedOptions && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={inputs.taxRate}
                      onChange={(e) => handleInputChange('taxRate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inflationRate">Inflation Rate (%)</Label>
                    <Input
                      id="inflationRate"
                      type="number"
                      step="0.1"
                      value={inputs.inflationRate}
                      onChange={(e) => handleInputChange('inflationRate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contributionGrowthRate">Contribution Growth Rate (% annually)</Label>
                    <Input
                      id="contributionGrowthRate"
                      type="number"
                      step="0.1"
                      value={inputs.contributionGrowthRate}
                      onChange={(e) => handleInputChange('contributionGrowthRate', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="taxDeferred"
                      checked={inputs.taxDeferred}
                      onChange={(e) => handleInputChange('taxDeferred', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="taxDeferred">Tax-Deferred Account (401k, IRA)</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {results.error ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{results.error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Final Amount</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.finalAmount)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Interest</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalInterest)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Effective Annual Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{formatPercentage(results.effectiveAnnualRate)}</p>
                      </div>
                      <Percent className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Investment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Contributions:</span>
                      <span className="font-medium">{formatCurrency(results.totalContributions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Earned:</span>
                      <span className="font-medium text-green-600">{formatCurrency(results.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Taxes:</span>
                      <span className="font-medium text-red-600">{formatCurrency(results.totalTaxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After-Tax Amount:</span>
                      <span className="font-medium">{formatCurrency(results.afterTaxAmount)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Real Return (after inflation):</span>
                      <Badge variant={results.realReturn > 0 ? "default" : "destructive"}>
                        {formatPercentage(results.realReturn)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inflation-Adjusted Value:</span>
                      <span className="font-medium">{formatCurrency(results.inflationAdjustedAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Annual Growth:</span>
                      <span className="font-medium">{formatCurrency(results.averageAnnualGrowth)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Indicators */}
              {results.realReturn > 0 && (
                <Card className="bg-green-50 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Positive Real Return</h3>
                    </div>
                    <p className="text-green-700">
                      Your investment is outpacing inflation by {formatPercentage(results.realReturn)} annually, 
                      preserving and growing your purchasing power over time.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="growth" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Growth Chart</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Breakdown</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Comparison</span>
          </TabsTrigger>
        </TabsList>

        {/* Growth Chart */}
        <TabsContent value="growth">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Investment Growth Over Time</CardTitle>
              <CardDescription>Track your investment balance, contributions, and interest growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="balance" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} name="Total Balance" />
                    <Area type="monotone" dataKey="cumulativeContributions" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Contributions" />
                    <Area type="monotone" dataKey="cumulativeInterest" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Interest" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Chart */}
        <TabsContent value="breakdown">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Investment Breakdown</CardTitle>
              <CardDescription>Final distribution of your investment components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparison Chart */}
        <TabsContent value="comparison">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Before vs After Tax & Inflation</CardTitle>
              <CardDescription>Compare nominal returns with real purchasing power</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={3} name="Nominal Value" />
                    <Line type="monotone" dataKey="afterTax" stroke="#10B981" strokeWidth={2} name="After Tax" />
                    <Line type="monotone" dataKey="inflationAdjusted" stroke="#F59E0B" strokeWidth={2} name="Real Value (Inflation Adjusted)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investment Schedule */}
        <TabsContent value="schedule">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Year-by-Year Investment Schedule</CardTitle>
              <CardDescription>Detailed breakdown of annual growth and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Mobile-friendly cards */}
                <div className="grid gap-4">
                  {chartData.slice(1).map((year, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Year {year.year}</h3>
                        <Badge>{formatCurrency(year.balance)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Contributions:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.contributions)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest:</span>
                          <span className="ml-2 font-medium text-green-600">{formatCurrency(year.interest)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">After Tax:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.afterTax)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Real Value:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.inflationAdjusted)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investment Schedule */}
        <TabsContent value="schedule">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Year-by-Year Investment Schedule</CardTitle>
              <CardDescription>Detailed breakdown of annual growth and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {/* Mobile-friendly cards */}
                <div className="grid gap-4">
                  {chartData.slice(1).map((year, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-lg">Year {year.year}</h3>
                        <Badge>{formatCurrency(year.balance)}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Contributions:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.contributions)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest:</span>
                          <span className="ml-2 font-medium text-green-600">{formatCurrency(year.interest)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">After Tax:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.afterTax)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Real Value:</span>
                          <span className="ml-2 font-medium">{formatCurrency(year.inflationAdjusted)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Amortization Schedule */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Investment Growth Schedule</span>
          </CardTitle>
          <CardDescription>
            Detailed year-by-year breakdown of your investment growth, contributions, and returns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="yearly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="yearly">Yearly Schedule</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Schedule</TabsTrigger>
            </TabsList>

            {/* Yearly Schedule */}
            <TabsContent value="yearly" className="mt-6">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Year</th>
                        <th className="text-right p-3 font-semibold">Contributions</th>
                        <th className="text-right p-3 font-semibold">Interest Earned</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                        <th className="text-right p-3 font-semibold">After Tax</th>
                        <th className="text-right p-3 font-semibold">Real Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.slice(1).map((year, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{year.year}</td>
                          <td className="p-3 text-right">{formatCurrency(year.contributions)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(year.interest)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(year.balance)}</td>
                          <td className="p-3 text-right">{formatCurrency(year.afterTax)}</td>
                          <td className="p-3 text-right">{formatCurrency(year.inflationAdjusted)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {chartData.slice(1).map((year, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Year {year.year}</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatCurrency(year.balance)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contributions:</span>
                        <span className="font-medium">{formatCurrency(year.contributions)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-medium text-green-600">{formatCurrency(year.interest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">After Tax:</span>
                        <span className="font-medium">{formatCurrency(year.afterTax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Real Value:</span>
                        <span className="font-medium">{formatCurrency(year.inflationAdjusted)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Monthly Schedule */}
            <TabsContent value="monthly" className="mt-6">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Month</th>
                        <th className="text-right p-3 font-semibold">Monthly Contribution</th>
                        <th className="text-right p-3 font-semibold">Interest Earned</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                        <th className="text-right p-3 font-semibold">After Tax</th>
                        <th className="text-right p-3 font-semibold">Real Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const monthlyData = [];
                        const { 
                          initialInvestment,
                          monthlyContribution,
                          interestRate,
                          investmentLength,
                          taxRate,
                          inflationRate,
                          taxDeferred
                        } = inputs;

                        const monthlyRate = interestRate / 100 / 12;
                        let balance = initialInvestment;
                        
                        for (let month = 1; month <= investmentLength * 12; month++) {
                          const year = Math.ceil(month / 12);
                          const monthInYear = ((month - 1) % 12) + 1;
                          
                          // Add monthly contribution
                          balance += monthlyContribution;
                          
                          // Calculate monthly interest
                          const monthlyInterest = balance * monthlyRate;
                          balance += monthlyInterest;
                          
                          // Calculate taxes (if not tax-deferred)
                          let afterTaxBalance = balance;
                          if (!taxDeferred) {
                            afterTaxBalance -= monthlyInterest * (taxRate / 100);
                          }
                          
                          // Calculate inflation-adjusted value
                          const inflationAdjusted = afterTaxBalance / Math.pow(1 + inflationRate / 100, year);
                          
                          monthlyData.push({
                            month,
                            year,
                            monthInYear,
                            monthlyContribution,
                            monthlyInterest,
                            balance,
                            afterTaxBalance,
                            inflationAdjusted
                          });
                        }
                        
                        return monthlyData.map((data, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">
                              Year {data.year}, Month {data.monthInYear}
                            </td>
                            <td className="p-3 text-right">{formatCurrency(data.monthlyContribution)}</td>
                            <td className="p-3 text-right text-green-600">{formatCurrency(data.monthlyInterest)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(data.balance)}</td>
                            <td className="p-3 text-right">{formatCurrency(data.afterTaxBalance)}</td>
                            <td className="p-3 text-right">{formatCurrency(data.inflationAdjusted)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 max-h-96 overflow-y-auto">
                {(() => {
                  const monthlyData = [];
                  const { 
                    initialInvestment,
                    monthlyContribution,
                    interestRate,
                    investmentLength,
                    taxRate,
                    inflationRate,
                    taxDeferred
                  } = inputs;

                  const monthlyRate = interestRate / 100 / 12;
                  let balance = initialInvestment;
                  
                  for (let month = 1; month <= investmentLength * 12; month++) {
                    const year = Math.ceil(month / 12);
                    const monthInYear = ((month - 1) % 12) + 1;
                    
                    // Add monthly contribution
                    balance += monthlyContribution;
                    
                    // Calculate monthly interest
                    const monthlyInterest = balance * monthlyRate;
                    balance += monthlyInterest;
                    
                    // Calculate taxes (if not tax-deferred)
                    let afterTaxBalance = balance;
                    if (!taxDeferred) {
                      afterTaxBalance -= monthlyInterest * (taxRate / 100);
                    }
                    
                    // Calculate inflation-adjusted value
                    const inflationAdjusted = afterTaxBalance / Math.pow(1 + inflationRate / 100, year);
                    
                    monthlyData.push({
                      month,
                      year,
                      monthInYear,
                      monthlyContribution,
                      monthlyInterest,
                      balance,
                      afterTaxBalance,
                      inflationAdjusted
                    });
                  }
                  
                  return monthlyData.map((data, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">Year {data.year}, Month {data.monthInYear}</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formatCurrency(data.balance)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contribution:</span>
                          <span className="font-medium">{formatCurrency(data.monthlyContribution)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest:</span>
                          <span className="font-medium text-green-600">{formatCurrency(data.monthlyInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">After Tax:</span>
                          <span className="font-medium">{formatCurrency(data.afterTaxBalance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Real Value:</span>
                          <span className="font-medium">{formatCurrency(data.inflationAdjusted)}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <div className="mt-12 space-y-8">
        <Separator />
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Understanding Interest and Investment Growth</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Master the power of compound interest and make informed investment decisions with our comprehensive guide to interest calculations, 
            tax optimization, and long-term wealth building strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* The Science of Compound Interest */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>The Science of Compound Interest</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Compound interest represents one of the most powerful concepts in finance, often called the "eighth wonder of the world." 
                Unlike simple interest, which is calculated only on the principal amount, compound interest includes interest earned on previously earned interest.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">The Mathematical Foundation</h4>
              <p>
                The compound interest formula is: <strong>A = P(1 + r/n)^(nt)</strong>
                <br />Where: A = final amount, P = principal, r = annual rate, n = compound frequency, t = time in years
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Historical Context</h4>
              <p>
                The concept dates back to ancient Babylon (2000 BC) where clay tablets recorded compound interest calculations. 
                Benjamin Franklin famously demonstrated its power by leaving money to Boston and Philadelphia that grew from $1,000 to over $6.5 million over 200 years.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">The Rule of 72</h4>
              <p>
                A quick way to estimate doubling time: divide 72 by your annual return rate. At 8% annual return, your money doubles every 9 years (72 ÷ 8 = 9).
                This rule helps visualize long-term growth potential and compare investment opportunities.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Compound Frequency Impact</h4>
              <p>
                The frequency of compounding significantly affects returns. Daily compounding typically yields only marginally more than monthly, 
                but monthly compounding substantially outperforms annual compounding over long periods. Our calculator models various frequencies 
                to show these differences clearly.
              </p>
            </CardContent>
          </Card>

          {/* Investment Psychology and Behavior */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Investment Psychology & Strategy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Successful investing requires understanding both mathematical principles and human psychology. 
                Behavioral finance shows that emotions often lead to poor investment decisions that can significantly impact long-term returns.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Dollar-Cost Averaging</h4>
              <p>
                Regular contributions regardless of market conditions can reduce the impact of volatility. This strategy, built into our calculator's 
                monthly contribution feature, helps smooth out market fluctuations and builds disciplined investing habits.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">The Time Value of Money</h4>
              <p>
                Starting early dramatically impacts final results. A 25-year-old investing $2,000 annually until age 35 (10 years, $20,000 total) 
                can accumulate more wealth by age 65 than someone who starts at 35 and invests $2,000 annually for 30 years ($60,000 total), 
                assuming identical 8% returns.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Risk and Return Relationship</h4>
              <p>
                Higher returns typically require accepting higher risk. Historical stock market returns (10% annually) exceed bond returns (5-6%) 
                and savings accounts (2-3%), but with greater volatility. Your risk tolerance should match your investment timeline and financial goals.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Behavioral Pitfalls</h4>
              <p>
                Common mistakes include market timing attempts, chasing last year's winners, emotional decisions during volatility, 
                and analysis paralysis. Successful investors focus on time in the market rather than timing the market.
              </p>
            </CardContent>
          </Card>

          {/* Tax Optimization Strategies */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Tax Optimization Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Tax efficiency can significantly impact your investment returns. Understanding various account types and tax implications 
                helps maximize your after-tax wealth accumulation over time.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Tax-Deferred vs Taxable Accounts</h4>
              <p>
                <strong>401(k)/IRA accounts:</strong> Contributions may be tax-deductible, growth is tax-deferred, but withdrawals are taxed as ordinary income. 
                Best for high earners expecting lower retirement tax rates.
              </p>
              
              <p>
                <strong>Roth accounts:</strong> After-tax contributions, tax-free growth, tax-free qualified withdrawals. 
                Ideal for younger investors and those expecting higher future tax rates.
              </p>
              
              <p>
                <strong>Taxable accounts:</strong> No contribution limits, but gains are taxed annually. Use tax-efficient investments 
                like index funds to minimize annual tax drag.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Tax-Loss Harvesting</h4>
              <p>
                In taxable accounts, strategically realizing losses to offset gains can reduce your tax burden. 
                Be aware of wash sale rules that prevent repurchasing the same security within 30 days.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Asset Location Strategy</h4>
              <p>
                Place tax-inefficient investments (bonds, REITs) in tax-deferred accounts and tax-efficient investments 
                (stock index funds) in taxable accounts to optimize overall tax efficiency.
              </p>
            </CardContent>
          </Card>

          {/* Economic Factors and Market Dynamics */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span>Economic Factors & Market Dynamics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Investment returns don't occur in a vacuum. Economic factors like inflation, interest rates, and market cycles 
                significantly impact real investment returns and purchasing power over time.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Inflation's Hidden Tax</h4>
              <p>
                Inflation erodes purchasing power over time. Historical U.S. inflation averages ~3% annually, meaning $1 today 
                buys what $0.55 bought in 1990. Real returns (nominal returns minus inflation) matter more than absolute returns.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Interest Rate Environment</h4>
              <p>
                Federal Reserve policies impact investment returns across all asset classes. Low interest rate environments 
                typically favor stocks over bonds, while rising rates can pressure stock valuations but improve bond yields.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Market Cycles and Volatility</h4>
              <p>
                Markets experience regular cycles of expansion and contraction. Historical data shows that despite numerous 
                recessions and market crashes, long-term investors who stayed invested and continued regular contributions 
                have been rewarded over 20+ year periods.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Global Economic Integration</h4>
              <p>
                Modern portfolios benefit from global diversification. International exposure can provide growth opportunities 
                and risk reduction, though currency fluctuations add another layer of complexity to return calculations.
              </p>
            </CardContent>
          </Card>

          {/* Advanced Investment Concepts */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Advanced Investment Concepts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Beyond basic compound interest, sophisticated investors consider additional factors that can significantly 
                impact long-term wealth accumulation and investment strategy optimization.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Sequence of Returns Risk</h4>
              <p>
                The order of investment returns matters enormously, especially during contribution and withdrawal phases. 
                Poor returns early in your accumulation phase or early in retirement can dramatically impact final outcomes 
                compared to the same returns in different order.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Rebalancing and Drift</h4>
              <p>
                Asset allocation naturally drifts as different investments perform differently. Regular rebalancing maintains 
                target allocations and can enhance returns through disciplined "buy low, sell high" behavior, 
                though it may increase tax consequences in taxable accounts.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Monte Carlo Analysis</h4>
              <p>
                Rather than assuming constant returns, Monte Carlo simulations model thousands of possible market scenarios 
                to estimate probability ranges for investment outcomes. This provides more realistic planning expectations 
                than simple compound interest calculations.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Contribution Optimization</h4>
              <p>
                Our calculator's contribution growth feature models salary increases over time. Even modest annual increases 
                in contributions (3-5%) can dramatically improve final outcomes by leveraging compound growth on larger amounts.
              </p>
            </CardContent>
          </Card>

          {/* Practical Implementation Guide */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <span>Practical Implementation Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Moving from calculation to action requires practical steps and systematic implementation. 
                Success comes from consistent execution of a well-planned strategy rather than perfect market timing.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Getting Started Action Plan</h4>
              <p>
                <strong>1. Emergency Fund:</strong> Build 3-6 months expenses in high-yield savings before investing.
                <br /><strong>2. Employer Match:</strong> Always capture full 401(k) match—it's free money.
                <br /><strong>3. High-Interest Debt:</strong> Pay off credit cards before investing (interest rates often exceed investment returns).
                <br /><strong>4. Automate Everything:</strong> Set up automatic transfers to remove emotion and ensure consistency.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Investment Account Priority</h4>
              <p>
                <strong>Step 1:</strong> 401(k) up to employer match
                <br /><strong>Step 2:</strong> Roth IRA (if income eligible)
                <br /><strong>Step 3:</strong> Maximize 401(k) contribution
                <br /><strong>Step 4:</strong> Taxable investment accounts
                <br /><strong>Step 5:</strong> Consider backdoor Roth conversions if high income
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Portfolio Construction Basics</h4>
              <p>
                <strong>Age-based allocation:</strong> Common rule: bond percentage = your age (30-year-old: 30% bonds, 70% stocks).
                <br /><strong>Diversification:</strong> Don't put all eggs in one basket—spread across asset classes, geographies, sectors.
                <br /><strong>Low costs matter:</strong> A 1% annual fee difference can cost hundreds of thousands over decades.
                <br /><strong>Simplicity works:</strong> Three-fund portfolio (total stock, international, bonds) often outperforms complex strategies.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Regular Review and Adjustment</h4>
              <p>
                <strong>Annual reviews:</strong> Assess progress, rebalance if needed, adjust contributions with income changes.
                <br /><strong>Life changes:</strong> Marriage, children, job changes may require strategy adjustments.
                <br /><strong>Stay the course:</strong> Resist urge to drastically change strategy based on short-term market movements.
                <br /><strong>Increase contributions:</strong> Boost savings rate with raises, bonuses, and windfalls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Using This Calculator Effectively */}
        <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span>Using This Calculator Effectively</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">Scenario Planning</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Try different contribution amounts to see impact on final wealth</li>
                  <li>• Compare monthly vs. annual contribution strategies</li>
                  <li>• Test various interest rates to understand return sensitivity</li>
                  <li>• Model contribution growth rates matching your career trajectory</li>
                  <li>• Compare tax-deferred vs. taxable account strategies</li>
                  <li>• Analyze real returns using different inflation assumptions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Optimization Tips</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use the comparison chart to understand inflation impact</li>
                  <li>• Focus on real returns for meaningful wealth planning</li>
                  <li>• Consider tax implications in your actual investment accounts</li>
                  <li>• Model realistic interest rates based on your investment mix</li>
                  <li>• Use the schedule view to plan year-by-year milestones</li>
                  <li>• Test sensitivity to economic changes with different scenarios</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Tips and Warnings */}
        <Card className="shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-amber-600" />
              <span>Key Takeaways & Important Disclaimers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Success Principles</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Start investing as early as possible—time is your greatest asset</li>
                  <li>• Consistency beats perfection—regular contributions matter more than timing</li>
                  <li>• Keep costs low—fees compound negatively over time</li>
                  <li>• Stay diversified—don't concentrate risk in any single investment</li>
                  <li>• Automate your investments—remove emotion from the equation</li>
                  <li>• Think long-term—ignore short-term market noise</li>
                  <li>• Increase contributions with income growth</li>
                  <li>• Focus on what you can control: savings rate, costs, time horizon</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Important Warnings</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Past performance doesn't guarantee future results</li>
                  <li>• This calculator provides estimates, not guarantees</li>
                  <li>• Consult a financial advisor for personalized advice</li>
                  <li>• Consider all risks including loss of principal</li>
                  <li>• Tax laws may change affecting your strategy</li>
                  <li>• Inflation assumptions may not match reality</li>
                  <li>• Market returns vary significantly from year to year</li>
                  <li>• Emergency funds and debt payoff should precede investing</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This calculator is for educational purposes only and should not be considered financial advice. 
                Investment returns are not guaranteed and you could lose money. Always consult with a qualified financial advisor 
                before making investment decisions. Consider your individual circumstances, risk tolerance, and investment objectives. 
                The calculations assume constant returns and contribution amounts, which may not reflect real-world scenarios.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterestCalculatorComponent;
