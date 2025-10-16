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
  Award,
  User,
  Banknote,
  PiggyBank
} from 'lucide-react';

interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentIncome: number;
  incomeGrowthRate: number;
  incomeNeededPercentage: number;
  investmentReturn: number;
  inflationRate: number;
  currentRetirementSavings: number;
  futureRetirementSavingsPercentage: number;
  otherMonthlyIncome: number;
  monthlyContribution: number;
  targetRetirementAmount: number;
  monthlyWithdrawal: number;
  calculationType: string;
}

interface RetirementResults {
  totalNeeded: number;
  monthlyContributionNeeded: number;
  projectedSavings: number;
  shortfall: number;
  monthlyWithdrawalAmount: number;
  moneyLastsYears: number;
  inflationAdjustedIncome: number;
  replacementRatio: number;
  totalContributions: number;
  totalGrowth: number;
  finalBalance: number;
  error?: string;
}

interface RetirementProjection {
  age: number;
  year: number;
  annualContribution: number;
  balance: number;
  interest: number;
  cumulativeContributions: number;
  realValue: number;
  monthlyIncome: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const RetirementCalculatorComponent = () => {
  const [inputs, setInputs] = useState<RetirementInputs>({
    currentAge: 35,
    retirementAge: 67,
    lifeExpectancy: 85,
    currentIncome: 70000,
    incomeGrowthRate: 3,
    incomeNeededPercentage: 75,
    investmentReturn: 6,
    inflationRate: 3,
    currentRetirementSavings: 30000,
    futureRetirementSavingsPercentage: 10,
    otherMonthlyIncome: 0,
    monthlyContribution: 500,
    targetRetirementAmount: 600000,
    monthlyWithdrawal: 5000,
    calculationType: 'retirement-needs'
  });

  const [results, setResults] = useState<RetirementResults>({
    totalNeeded: 0,
    monthlyContributionNeeded: 0,
    projectedSavings: 0,
    shortfall: 0,
    monthlyWithdrawalAmount: 0,
    moneyLastsYears: 0,
    inflationAdjustedIncome: 0,
    replacementRatio: 0,
    totalContributions: 0,
    totalGrowth: 0,
    finalBalance: 0
  });

  const [projections, setProjections] = useState<RetirementProjection[]>([]);
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

  // Calculate retirement needs and projections
  const calculateRetirement = (inputs: RetirementInputs): RetirementResults => {
    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentIncome,
      incomeGrowthRate,
      incomeNeededPercentage,
      investmentReturn,
      inflationRate,
      currentRetirementSavings,
      futureRetirementSavingsPercentage,
      otherMonthlyIncome,
      monthlyContribution,
      targetRetirementAmount,
      monthlyWithdrawal,
      calculationType
    } = inputs;

    if (currentAge >= retirementAge || retirementAge >= lifeExpectancy) {
      throw new Error('Please check your age inputs - retirement age must be after current age and before life expectancy');
    }

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;
    const monthlyReturn = investmentReturn / 100 / 12;
    const monthlyInflation = inflationRate / 100 / 12;
    const annualReturn = investmentReturn / 100;
    const annualInflation = inflationRate / 100;

    let totalNeeded = 0;
    let projectedSavings = 0;
    let monthlyContributionNeeded = 0;
    let monthlyWithdrawalAmount = 0;
    let moneyLastsYears = 0;
    let finalBalance = 0;

    if (calculationType === 'retirement-needs') {
      // Calculate how much is needed for retirement
      
      // Project income at retirement with growth
      const incomeAtRetirement = currentIncome * Math.pow(1 + incomeGrowthRate / 100, yearsToRetirement);
      const annualIncomeNeeded = incomeAtRetirement * (incomeNeededPercentage / 100);
      const monthlyIncomeNeeded = annualIncomeNeeded / 12;
      
      // Calculate present value of retirement income needed (adjusted for inflation)
      const realReturnRate = (1 + annualReturn) / (1 + annualInflation) - 1;
      
      // Calculate total retirement corpus needed using annuity present value
      if (realReturnRate > 0) {
        totalNeeded = (monthlyIncomeNeeded - otherMonthlyIncome) * 12 * 
                     ((1 - Math.pow(1 + realReturnRate, -yearsInRetirement)) / realReturnRate);
      } else {
        totalNeeded = (monthlyIncomeNeeded - otherMonthlyIncome) * 12 * yearsInRetirement;
      }
      
      // Project current savings growth
      let currentSavingsGrowth = currentRetirementSavings * Math.pow(1 + annualReturn, yearsToRetirement);
      
      // Calculate future savings projections
      const annualContribution = currentIncome * (futureRetirementSavingsPercentage / 100);
      let futureValue = 0;
      
      for (let year = 1; year <= yearsToRetirement; year++) {
        const yearContribution = annualContribution * Math.pow(1 + incomeGrowthRate / 100, year - 1);
        const contributionGrowth = yearContribution * Math.pow(1 + annualReturn, yearsToRetirement - year);
        futureValue += contributionGrowth;
      }
      
      projectedSavings = currentSavingsGrowth + futureValue;
      
      // Calculate shortfall and required monthly contribution
      const shortfall = Math.max(0, totalNeeded - projectedSavings);
      
      if (shortfall > 0) {
        // Calculate required monthly contribution to meet shortfall
        const monthsToRetirement = yearsToRetirement * 12;
        if (monthlyReturn > 0) {
          monthlyContributionNeeded = shortfall / (((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn) * Math.pow(1 + monthlyReturn, monthsToRetirement));
        } else {
          monthlyContributionNeeded = shortfall / monthsToRetirement;
        }
      }
      
      finalBalance = projectedSavings;
      
    } else if (calculationType === 'savings-plan') {
      // Calculate based on target amount
      const shortfall = Math.max(0, targetRetirementAmount - currentRetirementSavings);
      const monthsToRetirement = yearsToRetirement * 12;
      
      if (monthlyReturn > 0) {
        monthlyContributionNeeded = shortfall / (((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn));
      } else {
        monthlyContributionNeeded = shortfall / monthsToRetirement;
      }
      
      totalNeeded = targetRetirementAmount;
      projectedSavings = targetRetirementAmount;
      finalBalance = targetRetirementAmount;
      
    } else if (calculationType === 'withdrawal-amount') {
      // Calculate withdrawal amount based on savings
      let balance = currentRetirementSavings;
      
      // Project balance at retirement with contributions
      for (let month = 1; month <= yearsToRetirement * 12; month++) {
        balance = balance * (1 + monthlyReturn) + monthlyContribution;
      }
      
      // Calculate sustainable withdrawal using 4% rule adjusted for actual return
      const safeWithdrawalRate = Math.min(0.04, investmentReturn / 100);
      monthlyWithdrawalAmount = (balance * safeWithdrawalRate) / 12;
      
      finalBalance = balance;
      projectedSavings = balance;
      
    } else if (calculationType === 'money-duration') {
      // Calculate how long money will last
      let balance = targetRetirementAmount;
      let months = 0;
      
      while (balance > 0 && months < 600) { // Max 50 years
        const monthlyGrowth = balance * monthlyReturn;
        balance = balance + monthlyGrowth - monthlyWithdrawal;
        months++;
        
        if (balance <= 0) break;
      }
      
      moneyLastsYears = months / 12;
      finalBalance = targetRetirementAmount;
    }

    const inflationAdjustedIncome = currentIncome * Math.pow(1 + annualInflation, yearsToRetirement);
    const replacementRatio = totalNeeded > 0 ? (projectedSavings / totalNeeded) * 100 : 100;
    const totalContributions = currentRetirementSavings + (monthlyContribution * 12 * yearsToRetirement);
    const totalGrowth = finalBalance - totalContributions;

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      totalNeeded: round(totalNeeded),
      monthlyContributionNeeded: round(monthlyContributionNeeded),
      projectedSavings: round(projectedSavings),
      shortfall: round(Math.max(0, totalNeeded - projectedSavings)),
      monthlyWithdrawalAmount: round(monthlyWithdrawalAmount),
      moneyLastsYears: round(moneyLastsYears),
      inflationAdjustedIncome: round(inflationAdjustedIncome),
      replacementRatio: round(replacementRatio),
      totalContributions: round(totalContributions),
      totalGrowth: round(totalGrowth),
      finalBalance: round(finalBalance)
    };
  };

  // Generate retirement projections
  const generateProjections = (inputs: RetirementInputs): RetirementProjection[] => {
    const {
      currentAge,
      retirementAge,
      currentIncome,
      incomeGrowthRate,
      investmentReturn,
      inflationRate,
      currentRetirementSavings,
      futureRetirementSavingsPercentage,
      monthlyContribution
    } = inputs;

    const projections: RetirementProjection[] = [];
    const yearsToRetirement = retirementAge - currentAge;
    const annualReturn = investmentReturn / 100;
    const annualInflation = inflationRate / 100;
    
    let balance = currentRetirementSavings;
    let cumulativeContributions = currentRetirementSavings;
    
    // Add starting point
    projections.push({
      age: currentAge,
      year: 0,
      annualContribution: 0,
      balance: currentRetirementSavings,
      interest: 0,
      cumulativeContributions: currentRetirementSavings,
      realValue: currentRetirementSavings,
      monthlyIncome: 0
    });

    for (let year = 1; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      const yearIncome = currentIncome * Math.pow(1 + incomeGrowthRate / 100, year - 1);
      const annualContribution = (yearIncome * (futureRetirementSavingsPercentage / 100)) + (monthlyContribution * 12);
      
      // Add contribution at beginning of year
      balance += annualContribution;
      cumulativeContributions += annualContribution;
      
      // Apply investment return
      const interest = balance * annualReturn;
      balance += interest;
      
      const realValue = balance / Math.pow(1 + annualInflation, year);
      const monthlyIncome = (balance * 0.04) / 12; // 4% rule for monthly income

      projections.push({
        age,
        year,
        annualContribution: Math.round(annualContribution),
        balance: Math.round(balance),
        interest: Math.round(interest),
        cumulativeContributions: Math.round(cumulativeContributions),
        realValue: Math.round(realValue),
        monthlyIncome: Math.round(monthlyIncome)
      });
    }

    return projections;
  };

  // Handle input changes
  const handleInputChange = (id: keyof RetirementInputs, value: string | boolean) => {
    const numValue = typeof value === 'boolean' ? value : (typeof value === 'string' && isNaN(Number(value)) ? value : parseFloat(value as string) || 0);
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculateRetirement(newInputs);
        setResults(calculationResults);
        
        const projectionResults = generateProjections(newInputs);
        setProjections(projectionResults);
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
    handleInputChange('currentAge', inputs.currentAge.toString());
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Current Savings', value: inputs.currentRetirementSavings, color: '#3B82F6' },
    { name: 'Future Contributions', value: results.totalContributions - inputs.currentRetirementSavings, color: '#10B981' },
    { name: 'Investment Growth', value: results.totalGrowth, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <PiggyBank className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Retirement Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Plan your retirement with comprehensive calculations for savings goals, withdrawal strategies, 
          and financial projections. Make informed decisions about your retirement future.
        </p>
      </div>

      {/* Calculator Type Selection */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Calculation Type
          </CardTitle>
          <CardDescription>Choose your retirement planning scenario</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant={inputs.calculationType === 'retirement-needs' ? 'default' : 'outline'}
              onClick={() => handleInputChange('calculationType', 'retirement-needs')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Target className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">How much to retire?</div>
                <div className="text-sm text-gray-600">Calculate retirement needs</div>
              </div>
            </Button>
            
            <Button
              variant={inputs.calculationType === 'savings-plan' ? 'default' : 'outline'}
              onClick={() => handleInputChange('calculationType', 'savings-plan')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <PiggyBank className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">How to save?</div>
                <div className="text-sm text-gray-600">Create savings plan</div>
              </div>
            </Button>
            
            <Button
              variant={inputs.calculationType === 'withdrawal-amount' ? 'default' : 'outline'}
              onClick={() => handleInputChange('calculationType', 'withdrawal-amount')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Banknote className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">How much to withdraw?</div>
                <div className="text-sm text-gray-600">Safe withdrawal amount</div>
              </div>
            </Button>
            
            <Button
              variant={inputs.calculationType === 'money-duration' ? 'default' : 'outline'}
              onClick={() => handleInputChange('calculationType', 'money-duration')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Clock className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">How long will it last?</div>
                <div className="text-sm text-gray-600">Money duration</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
              <CardDescription>Enter your retirement planning details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentAge">Current Age</Label>
                <Input
                  id="currentAge"
                  type="number"
                  value={inputs.currentAge}
                  onChange={(e) => handleInputChange('currentAge', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retirementAge">Planned Retirement Age</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  value={inputs.retirementAge}
                  onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifeExpectancy">Life Expectancy</Label>
                <Input
                  id="lifeExpectancy"
                  type="number"
                  value={inputs.lifeExpectancy}
                  onChange={(e) => handleInputChange('lifeExpectancy', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentIncome">Current Annual Income ($)</Label>
                <Input
                  id="currentIncome"
                  type="number"
                  value={inputs.currentIncome}
                  onChange={(e) => handleInputChange('currentIncome', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentRetirementSavings">Current Retirement Savings ($)</Label>
                <Input
                  id="currentRetirementSavings"
                  type="number"
                  value={inputs.currentRetirementSavings}
                  onChange={(e) => handleInputChange('currentRetirementSavings', e.target.value)}
                  className="text-lg"
                />
              </div>

              {inputs.calculationType === 'retirement-needs' && (
                <div className="space-y-2">
                  <Label htmlFor="incomeNeededPercentage">Income Needed in Retirement (%)</Label>
                  <Input
                    id="incomeNeededPercentage"
                    type="number"
                    value={inputs.incomeNeededPercentage}
                    onChange={(e) => handleInputChange('incomeNeededPercentage', e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}

              {inputs.calculationType === 'savings-plan' && (
                <div className="space-y-2">
                  <Label htmlFor="targetRetirementAmount">Target Retirement Amount ($)</Label>
                  <Input
                    id="targetRetirementAmount"
                    type="number"
                    value={inputs.targetRetirementAmount}
                    onChange={(e) => handleInputChange('targetRetirementAmount', e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}

              {(inputs.calculationType === 'withdrawal-amount' || inputs.calculationType === 'money-duration') && (
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
              )}

              {inputs.calculationType === 'money-duration' && (
                <div className="space-y-2">
                  <Label htmlFor="monthlyWithdrawal">Monthly Withdrawal ($)</Label>
                  <Input
                    id="monthlyWithdrawal"
                    type="number"
                    value={inputs.monthlyWithdrawal}
                    onChange={(e) => handleInputChange('monthlyWithdrawal', e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}

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
                    <Label htmlFor="incomeGrowthRate">Annual Income Growth (%)</Label>
                    <Input
                      id="incomeGrowthRate"
                      type="number"
                      step="0.1"
                      value={inputs.incomeGrowthRate}
                      onChange={(e) => handleInputChange('incomeGrowthRate', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investmentReturn">Average Investment Return (%)</Label>
                    <Input
                      id="investmentReturn"
                      type="number"
                      step="0.1"
                      value={inputs.investmentReturn}
                      onChange={(e) => handleInputChange('investmentReturn', e.target.value)}
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

                  {inputs.calculationType === 'retirement-needs' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="futureRetirementSavingsPercentage">Future Retirement Savings (% of income)</Label>
                        <Input
                          id="futureRetirementSavingsPercentage"
                          type="number"
                          step="0.1"
                          value={inputs.futureRetirementSavingsPercentage}
                          onChange={(e) => handleInputChange('futureRetirementSavingsPercentage', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="otherMonthlyIncome">Other Monthly Income (Social Security, etc.)</Label>
                        <Input
                          id="otherMonthlyIncome"
                          type="number"
                          value={inputs.otherMonthlyIncome}
                          onChange={(e) => handleInputChange('otherMonthlyIncome', e.target.value)}
                        />
                      </div>
                    </>
                  )}
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
                {inputs.calculationType === 'retirement-needs' && (
                  <>
                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Needed</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.totalNeeded)}</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Projected Savings</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(results.projectedSavings)}</p>
                          </div>
                          <PiggyBank className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              {results.shortfall > 0 ? 'Shortfall' : 'Surplus'}
                            </p>
                            <p className={`text-2xl font-bold ${results.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(results.shortfall > 0 ? results.shortfall : results.projectedSavings - results.totalNeeded)}
                            </p>
                          </div>
                          <TrendingUp className={`h-8 w-8 ${results.shortfall > 0 ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {inputs.calculationType === 'savings-plan' && (
                  <>
                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Target Amount</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(inputs.targetRetirementAmount)}</p>
                          </div>
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Contribution Needed</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(results.monthlyContributionNeeded)}</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Years to Retirement</p>
                            <p className="text-2xl font-bold text-purple-600">{inputs.retirementAge - inputs.currentAge}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {inputs.calculationType === 'withdrawal-amount' && (
                  <>
                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Projected Balance</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.finalBalance)}</p>
                          </div>
                          <PiggyBank className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Safe Monthly Withdrawal</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(results.monthlyWithdrawalAmount)}</p>
                          </div>
                          <Banknote className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Annual Withdrawal</p>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(results.monthlyWithdrawalAmount * 12)}</p>
                          </div>
                          <Calendar className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {inputs.calculationType === 'money-duration' && (
                  <>
                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Starting Amount</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(inputs.targetRetirementAmount)}</p>
                          </div>
                          <PiggyBank className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Money Lasts</p>
                            <p className="text-2xl font-bold text-green-600">{results.moneyLastsYears.toFixed(1)} years</p>
                          </div>
                          <Clock className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Monthly Withdrawal</p>
                            <p className="text-2xl font-bold text-purple-600">{formatCurrency(inputs.monthlyWithdrawal)}</p>
                          </div>
                          <Banknote className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Retirement Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Years to Retirement:</span>
                      <span className="font-medium">{inputs.retirementAge - inputs.currentAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Years in Retirement:</span>
                      <span className="font-medium">{inputs.lifeExpectancy - inputs.retirementAge}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Savings:</span>
                      <span className="font-medium">{formatCurrency(inputs.currentRetirementSavings)}</span>
                    </div>
                    {inputs.calculationType === 'retirement-needs' && results.monthlyContributionNeeded > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Additional Monthly Needed:</span>
                        <span className="font-medium text-red-600">{formatCurrency(results.monthlyContributionNeeded)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Financial Projections</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Return:</span>
                      <span className="font-medium">{formatPercentage(inputs.investmentReturn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inflation Rate:</span>
                      <span className="font-medium">{formatPercentage(inputs.inflationRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Growth:</span>
                      <span className="font-medium">{formatPercentage(inputs.incomeGrowthRate)}</span>
                    </div>
                    {inputs.calculationType === 'retirement-needs' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Replacement Ratio:</span>
                        <Badge variant={results.replacementRatio >= 100 ? "default" : "destructive"}>
                          {formatPercentage(results.replacementRatio)}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Indicators */}
              {inputs.calculationType === 'retirement-needs' && results.shortfall === 0 && (
                <Card className="bg-green-50 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Retirement Goal Achieved!</h3>
                    </div>
                    <p className="text-green-700">
                      Your current savings plan will meet your retirement income needs. 
                      You're on track to maintain {formatPercentage(inputs.incomeNeededPercentage)} of your current income in retirement.
                    </p>
                  </CardContent>
                </Card>
              )}

              {inputs.calculationType === 'retirement-needs' && results.shortfall > 0 && (
                <Card className="bg-amber-50 border-amber-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Info className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold text-amber-800">Action Required</h3>
                    </div>
                    <p className="text-amber-700">
                      You have a shortfall of {formatCurrency(results.shortfall)}. Consider increasing your monthly contributions 
                      by {formatCurrency(results.monthlyContributionNeeded)} to meet your retirement goals.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Tabs defaultValue="projection" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projection" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Projection</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Breakdown</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Income</span>
          </TabsTrigger>
        </TabsList>

        {/* Projection Chart */}
        <TabsContent value="projection">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Retirement Savings Projection</CardTitle>
              <CardDescription>Track your savings growth over time with contributions and investment returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Age ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="balance" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} name="Total Balance" />
                    <Area type="monotone" dataKey="cumulativeContributions" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Total Contributions" />
                    <Area type="monotone" dataKey="realValue" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.4} name="Inflation-Adjusted Value" />
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
              <CardTitle>Retirement Savings Breakdown</CardTitle>
              <CardDescription>Composition of your retirement savings at retirement</CardDescription>
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

        {/* Income Chart */}
        <TabsContent value="income">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Retirement Income Potential</CardTitle>
              <CardDescription>Potential monthly income from your retirement savings (4% rule)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(1)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Age ${label}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="monthlyIncome" stroke="#3B82F6" strokeWidth={3} name="Monthly Income Potential" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Retirement Schedule */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Retirement Savings Schedule</span>
          </CardTitle>
          <CardDescription>
            Year-by-year breakdown of your retirement savings growth and projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="yearly" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="yearly">Yearly Schedule</TabsTrigger>
              <TabsTrigger value="milestones">Key Milestones</TabsTrigger>
            </TabsList>

            {/* Yearly Schedule */}
            <TabsContent value="yearly" className="mt-6">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Age</th>
                        <th className="text-right p-3 font-semibold">Annual Contribution</th>
                        <th className="text-right p-3 font-semibold">Investment Growth</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                        <th className="text-right p-3 font-semibold">Real Value</th>
                        <th className="text-right p-3 font-semibold">Monthly Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections.slice(1).map((projection, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{projection.age}</td>
                          <td className="p-3 text-right">{formatCurrency(projection.annualContribution)}</td>
                          <td className="p-3 text-right text-green-600">{formatCurrency(projection.interest)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(projection.balance)}</td>
                          <td className="p-3 text-right">{formatCurrency(projection.realValue)}</td>
                          <td className="p-3 text-right">{formatCurrency(projection.monthlyIncome)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 max-h-96 overflow-y-auto">
                {projections.slice(1).map((projection, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Age {projection.age}</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatCurrency(projection.balance)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contribution:</span>
                        <span className="font-medium">{formatCurrency(projection.annualContribution)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth:</span>
                        <span className="font-medium text-green-600">{formatCurrency(projection.interest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Real Value:</span>
                        <span className="font-medium">{formatCurrency(projection.realValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Income:</span>
                        <span className="font-medium">{formatCurrency(projection.monthlyIncome)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Key Milestones */}
            <TabsContent value="milestones" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* $100K Milestone */}
                {(() => {
                  const milestone = projections.find(p => p.balance >= 100000);
                  return milestone ? (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-green-800">First $100K</h3>
                        </div>
                        <p className="text-green-700">Age {milestone.age}</p>
                        <p className="text-sm text-green-600">{formatCurrency(milestone.balance)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* $500K Milestone */}
                {(() => {
                  const milestone = projections.find(p => p.balance >= 500000);
                  return milestone ? (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-blue-800">Half Million</h3>
                        </div>
                        <p className="text-blue-700">Age {milestone.age}</p>
                        <p className="text-sm text-blue-600">{formatCurrency(milestone.balance)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* $1M Milestone */}
                {(() => {
                  const milestone = projections.find(p => p.balance >= 1000000);
                  return milestone ? (
                    <Card className="bg-purple-50 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-purple-800">Millionaire</h3>
                        </div>
                        <p className="text-purple-700">Age {milestone.age}</p>
                        <p className="text-sm text-purple-600">{formatCurrency(milestone.balance)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Retirement Balance */}
                {(() => {
                  const retirementProjection = projections[projections.length - 1];
                  return retirementProjection ? (
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <PiggyBank className="h-5 w-5 text-orange-600" />
                          <h3 className="font-semibold text-orange-800">At Retirement</h3>
                        </div>
                        <p className="text-orange-700">Age {inputs.retirementAge}</p>
                        <p className="text-sm text-orange-600">{formatCurrency(retirementProjection.balance)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Monthly Income at Retirement */}
                {(() => {
                  const retirementProjection = projections[projections.length - 1];
                  return retirementProjection ? (
                    <Card className="bg-indigo-50 border-indigo-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Banknote className="h-5 w-5 text-indigo-600" />
                          <h3 className="font-semibold text-indigo-800">Monthly Income</h3>
                        </div>
                        <p className="text-indigo-700">At Retirement</p>
                        <p className="text-sm text-indigo-600">{formatCurrency(retirementProjection.monthlyIncome)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}

                {/* Real Value at Retirement */}
                {(() => {
                  const retirementProjection = projections[projections.length - 1];
                  return retirementProjection ? (
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-5 w-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-800">Inflation-Adjusted</h3>
                        </div>
                        <p className="text-gray-700">Real Purchasing Power</p>
                        <p className="text-sm text-gray-600">{formatCurrency(retirementProjection.realValue)}</p>
                      </CardContent>
                    </Card>
                  ) : null;
                })()}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <div className="space-y-8">
        <Separator className="my-8" />
        
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span>Complete Guide to Retirement Planning</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master the art of retirement planning with comprehensive insights, strategies, and expert guidance 
            for building a secure financial future.
          </p>
        </div>

        {/* Educational Sections */}
        <div className="space-y-12">
          {/* Retirement Basics */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span>Retirement Basics</span>
              </h3>
              <p className="text-gray-600 mt-2">Foundation knowledge for understanding retirement planning</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <span>What is Retirement?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Retirement is the phase of life when you withdraw from active working life, typically lasting 
                    for the rest of your lifetime. It represents a fundamental shift from earning income through 
                    employment to living off accumulated savings and passive income sources.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Key Retirement Considerations:</h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Financial independence from employment income</li>
                      <li>• Maintaining desired lifestyle and standard of living</li>
                      <li>• Healthcare and long-term care planning</li>
                      <li>• Legacy and estate planning considerations</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-700">
                    The average retirement age varies by country and profession, typically occurring between 
                    ages 60-70. However, the trend toward earlier retirement through the FIRE (Financial 
                    Independence, Retire Early) movement shows that retirement age is increasingly flexible.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span>Why Plan for Retirement?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Retirement planning is essential because Social Security and employer pensions typically 
                    replace only 40-60% of pre-retirement income. Without personal savings, maintaining your 
                    current lifestyle becomes nearly impossible.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Financial Security</h4>
                        <p className="text-sm text-gray-600">Maintain independence and dignity in your golden years</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Inflation Protection</h4>
                        <p className="text-sm text-gray-600">Preserve purchasing power over 20-30 year retirement</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Healthcare Costs</h4>
                        <p className="text-sm text-gray-600">Cover increasing medical expenses in later life</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Legacy Planning</h4>
                        <p className="text-sm text-gray-600">Leave financial resources for heirs and causes you care about</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span>The Power of Compound Interest</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Compound interest is the most powerful force in retirement planning. It's the process where 
                    your investment earnings generate their own earnings over time, creating exponential growth.
                  </p>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-3">Example: The Early Bird Advantage</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-purple-700">Early Starter (Age 25)</h5>
                        <p className="text-purple-600">$200/month for 10 years</p>
                        <p className="text-purple-600">Total invested: $24,000</p>
                        <p className="font-bold text-purple-800">At 65: $602,000</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-purple-700">Late Starter (Age 35)</h5>
                        <p className="text-purple-600">$200/month for 30 years</p>
                        <p className="text-purple-600">Total invested: $72,000</p>
                        <p className="font-bold text-purple-800">At 65: $566,000</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">*Assuming 7% annual return</p>
                  </div>
                  
                  <p className="text-gray-700">
                    This example shows how starting early, even with smaller contributions, can outperform 
                    larger contributions started later due to the power of compound growth.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span>Inflation's Impact on Retirement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Inflation gradually reduces the purchasing power of money over time. With an average 
                    inflation rate of 2.6% annually, prices double approximately every 27 years.
                  </p>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Inflation Reality Check:</h4>
                    <div className="space-y-2 text-sm text-red-700">
                      <div className="flex justify-between">
                        <span>What $100 buys today:</span>
                        <span className="font-medium">$100 worth</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In 20 years (3% inflation):</span>
                        <span className="font-medium">$55 worth</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In 30 years (3% inflation):</span>
                        <span className="font-medium">$41 worth</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">
                    This is why retirement planning must account for inflation through investments that 
                    historically outpace inflation, such as stocks, real estate, and Treasury Inflation-Protected 
                    Securities (TIPS).
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Pro Tip:</strong> A balanced portfolio with 60-70% stocks and 30-40% bonds 
                      has historically provided inflation-beating returns over long periods.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Planning Strategies */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Target className="h-6 w-6 text-green-600" />
                <span>Planning Strategies</span>
              </h3>
              <p className="text-gray-600 mt-2">Proven methods and rules for successful retirement planning</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Popular Retirement Planning Rules</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">The 10% Rule</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Save 10-15% of your pre-tax income annually during working years. Starting at age 25 
                        with 10% savings rate can build a $1 million nest egg by retirement.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">The 80% Rule</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Plan to need 70-80% of your pre-retirement income to maintain your standard of living. 
                        Some expenses decrease (commuting, work clothes), while others may increase (healthcare, travel).
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-800">The 4% Rule</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Withdraw 4% of your retirement portfolio annually to maintain purchasing power throughout 
                        a 30-year retirement. This rule assumes a balanced investment portfolio.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-800">The 25x Rule</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Save 25 times your annual retirement expenses. If you need $40,000 per year, 
                        you'll need $1 million in retirement savings (25 × $40,000).
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> These are guidelines, not absolutes. Your specific situation, 
                      goals, and market conditions should drive your personal retirement strategy.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span>Age-Based Savings Milestones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Track your progress with these age-based savings benchmarks, expressed as multiples 
                    of your annual salary:
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      { age: '30', target: '1x', description: 'Have 1 year of salary saved' },
                      { age: '35', target: '2x', description: 'Have 2 years of salary saved' },
                      { age: '40', target: '3x', description: 'Have 3 years of salary saved' },
                      { age: '45', target: '4x', description: 'Have 4 years of salary saved' },
                      { age: '50', target: '6x', description: 'Have 6 years of salary saved' },
                      { age: '55', target: '7x', description: 'Have 7 years of salary saved' },
                      { age: '60', target: '8x', description: 'Have 8 years of salary saved' },
                      { age: '67', target: '10x', description: 'Have 10 years of salary saved' }
                    ].map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-700">{milestone.age}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Age {milestone.age}</p>
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {milestone.target} Salary
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Example:</strong> If you earn $60,000 at age 40, you should have approximately 
                      $180,000 (3x) in retirement savings across all accounts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Asset Allocation by Age</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Your investment allocation should evolve as you age, generally becoming more conservative 
                    as you approach and enter retirement.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">Age 20-30: Aggressive Growth</h4>
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '90%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">90% Stocks</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '10%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">10% Bonds</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">Age 40-50: Balanced Growth</h4>
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '70%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">70% Stocks</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '30%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">30% Bonds</span>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">Age 60+: Conservative</h4>
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '40%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">40% Stocks</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '60%'}}></div>
                        </div>
                        <span className="text-sm text-gray-600">60% Bonds</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-purple-700">
                      <strong>Rule of Thumb:</strong> Stock percentage = 100 - Your Age. A 30-year-old 
                      might have 70% stocks, while a 60-year-old might have 40% stocks.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span>Catch-Up Strategies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    If you're behind on retirement savings, these strategies can help accelerate your progress:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-orange-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Maximize Employer Match</h4>
                        <p className="text-sm text-gray-600">
                          Contribute at least enough to get full employer 401(k) match - it's free money 
                          with immediate 100% return on investment.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-orange-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Use Catch-Up Contributions</h4>
                        <p className="text-sm text-gray-600">
                          If you're 50+, make additional catch-up contributions: $7,500 extra to 401(k), 
                          $1,000 extra to IRA annually.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-orange-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Delay Retirement</h4>
                        <p className="text-sm text-gray-600">
                          Each year you delay retirement past 62 increases Social Security benefits and 
                          provides more time to save.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-orange-700">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Reduce Expenses</h4>
                        <p className="text-sm text-gray-600">
                          Downsizing housing, eliminating debt, and reducing discretionary spending can 
                          free up money for retirement savings.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-orange-700">5</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Work Part-Time in Retirement</h4>
                        <p className="text-sm text-gray-600">
                          Even modest part-time income can significantly extend the life of your retirement savings.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Retirement Accounts */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <PiggyBank className="h-6 w-6 text-purple-600" />
                <span>Retirement Accounts</span>
              </h3>
              <p className="text-gray-600 mt-2">Understanding different types of retirement savings vehicles</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PiggyBank className="h-5 w-5 text-blue-600" />
                    <span>401(k) and 403(b) Plans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Employer-sponsored retirement plans that offer tax advantages and often include 
                    employer matching contributions.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">2024 Contribution Limits</h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span>Under 50:</span>
                          <span className="font-medium">$23,000</span>
                        </div>
                        <div className="flex justify-between">
                          <span>50 and over:</span>
                          <span className="font-medium">$30,500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Catch-up:</span>
                          <span className="font-medium">+$7,500</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Key Benefits</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Tax-deferred growth</li>
                        <li>• Employer matching</li>
                        <li>• Automatic payroll deduction</li>
                        <li>• Professional management</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-800">Employer Matching</h4>
                    <p className="text-gray-700 text-sm mt-1">
                      Common match: 50% of first 6% you contribute. On a $60,000 salary, contributing 
                      6% ($3,600) gets you $1,800 in free employer money annually.
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Important:</strong> Traditional 401(k) contributions reduce current taxable income 
                      but are taxed as ordinary income in retirement. Roth 401(k) contributions are after-tax 
                      but withdrawals are tax-free in retirement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span>Traditional vs. Roth IRA</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Individual Retirement Accounts (IRAs) provide additional tax-advantaged retirement savings 
                    beyond employer plans.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">Traditional IRA</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Tax-deductible contributions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Tax-deferred growth</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Taxed as income in retirement</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Required distributions at 73</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">Roth IRA</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>After-tax contributions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Tax-free growth</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Tax-free withdrawals in retirement</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>No required distributions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">2024 IRA Contribution Limits</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Under 50:</span>
                        <span className="font-medium ml-2">$7,000</span>
                      </div>
                      <div>
                        <span className="text-gray-600">50 and over:</span>
                        <span className="font-medium ml-2">$8,000</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Decision Guide:</strong> Choose Traditional IRA if you expect to be in a lower 
                      tax bracket in retirement. Choose Roth IRA if you expect higher taxes in retirement 
                      or want tax-free legacy planning.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span>Social Security Benefits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Social Security provides a foundation of retirement income, designed to replace about 
                    40% of average pre-retirement income for most workers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">Full Retirement Age</h4>
                      <div className="space-y-1 text-sm text-purple-700">
                        <div className="flex justify-between">
                          <span>Born 1943-1954:</span>
                          <span className="font-medium">Age 66</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Born 1955-1959:</span>
                          <span className="font-medium">66 + 2-10 mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Born 1960+:</span>
                          <span className="font-medium">Age 67</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Claiming Strategies</h4>
                      <div className="space-y-1 text-sm text-orange-700">
                        <div className="flex justify-between">
                          <span>Age 62 (early):</span>
                          <span className="font-medium">75% of benefit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Full retirement:</span>
                          <span className="font-medium">100% of benefit</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Age 70 (delayed):</span>
                          <span className="font-medium">132% of benefit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-800">Benefit Calculation</h4>
                    <p className="text-gray-700 text-sm mt-1">
                      Benefits are based on your highest 35 years of earnings, adjusted for inflation. 
                      The formula favors lower-income workers with higher replacement ratios.
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">
                      <strong>Planning Note:</strong> Social Security faces long-term funding challenges. 
                      Conservative planning assumes benefits may be reduced by 20-25% unless Congress acts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <span>Other Retirement Vehicles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Beyond traditional retirement accounts, several other vehicles can supplement your 
                    retirement income and provide additional benefits.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">Health Savings Account (HSA)</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Triple tax advantage: deductible contributions, tax-free growth, tax-free 
                        withdrawals for qualified medical expenses.
                      </p>
                      <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                        <strong>Retirement Strategy:</strong> Use as investment account after age 65 - 
                        withdrawals for non-medical expenses are taxed like Traditional IRA.
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">Taxable Investment Accounts</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        No contribution limits or withdrawal restrictions. Ideal for early retirement 
                        or bridge funding before accessing retirement accounts.
                      </p>
                      <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                        <strong>Tax Efficiency:</strong> Focus on tax-efficient index funds and 
                        tax-loss harvesting to minimize annual tax burden.
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">Real Estate Investment</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Rental properties can provide ongoing income and inflation protection. 
                        REITs offer real estate exposure without direct ownership challenges.
                      </p>
                      <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                        <strong>Considerations:</strong> Requires active management, maintenance costs, 
                        and market risk. Typically 5-10% of portfolio allocation.
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">Annuities</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Insurance products that provide guaranteed income for life. Can protect 
                        against longevity risk and market volatility.
                      </p>
                      <div className="bg-indigo-50 p-2 rounded text-xs text-indigo-700">
                        <strong>Trade-offs:</strong> Guaranteed income vs. higher fees and reduced 
                        liquidity. Best for portion of conservative portfolio.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Topics */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <span>Advanced Topics</span>
              </h3>
              <p className="text-gray-600 mt-2">Sophisticated strategies for optimizing your retirement plan</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-red-600" />
                    <span>Withdrawal Strategies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    How you withdraw money in retirement can significantly impact how long your savings last 
                    and your tax burden.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-red-800">The 4% Rule Refined</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Start with 4% of initial portfolio value, then adjust annually for inflation. 
                        May need to be more conservative (3-3.5%) in low-return environments.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Bucket Strategy</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Divide portfolio into 3 buckets: immediate needs (1-2 years cash), 
                        medium-term (3-10 years bonds), long-term growth (stocks).
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Tax-Efficient Sequencing</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Generally withdraw from taxable accounts first, then traditional retirement 
                        accounts, then Roth accounts to optimize tax efficiency.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-800">Dynamic Adjustment</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Adjust withdrawal rates based on portfolio performance and market conditions. 
                        Reduce spending in down years, potentially increase in good years.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Required Minimum Distributions (RMDs)</h4>
                    <p className="text-sm text-yellow-700">
                      Starting at age 73, you must withdraw minimum amounts from traditional retirement 
                      accounts annually. Plan for the tax impact and consider Roth conversions before RMDs begin.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Healthcare & Long-Term Care</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Healthcare costs are one of the largest and most unpredictable retirement expenses, 
                    requiring special planning consideration.
                  </p>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Healthcare Cost Reality</h4>
                    <div className="space-y-2 text-sm text-red-700">
                      <p>• Average couple needs $300,000+ for healthcare in retirement</p>
                      <p>• Medicare doesn't cover long-term care, dental, or vision</p>
                      <p>• Long-term care can cost $50,000-$100,000+ annually</p>
                      <p>• 70% of people will need some long-term care</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Health Savings Account (HSA)</h4>
                        <p className="text-sm text-gray-600">
                          Maximize HSA contributions for triple tax advantage. Use as retirement 
                          healthcare fund after age 65.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Long-Term Care Insurance</h4>
                        <p className="text-sm text-gray-600">
                          Consider purchasing in your 50s when premiums are lower and you're 
                          more likely to qualify.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Medicare Planning</h4>
                        <p className="text-sm text-gray-600">
                          Understand Medicare parts A, B, C, and D. Consider Medicare supplement 
                          insurance for gap coverage.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Tax Planning in Retirement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Strategic tax planning can help you keep more of your retirement income and 
                    extend the life of your savings.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Roth Conversions</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Convert traditional IRA/401(k) funds to Roth during low-income years 
                        or when in lower tax brackets.
                      </p>
                      <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                        <strong>Strategy:</strong> Do conversions in years between retirement and RMDs, 
                        or when income is temporarily lower.
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Tax-Loss Harvesting</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Sell losing investments to offset gains and reduce taxable income. 
                        Can carry forward $3,000 annually against ordinary income.
                      </p>
                      <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                        <strong>Caution:</strong> Avoid wash sale rules - can't repurchase same 
                        security within 30 days.
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Asset Location</h4>
                      <p className="text-sm text-gray-700 mb-2">
                        Place tax-inefficient investments in tax-deferred accounts, 
                        tax-efficient investments in taxable accounts.
                      </p>
                      <div className="bg-green-50 p-2 rounded text-xs text-green-700">
                        <strong>Example:</strong> Bonds and REITs in 401(k), index funds and 
                        individual stocks in taxable accounts.
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Important:</strong> Tax laws change frequently. Consult with a tax professional 
                      to optimize your specific situation and stay current with regulations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span>Estate Planning & Legacy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Thoughtful estate planning ensures your retirement savings are efficiently 
                    transferred to heirs and causes you care about.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Beneficiary Designations</h4>
                        <p className="text-sm text-gray-600">
                          Keep beneficiaries current on all retirement accounts. These designations 
                          override wills and avoid probate.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Stretch Opportunities</h4>
                        <p className="text-sm text-gray-600">
                          Spousal rollovers and inherited IRA rules can extend tax-deferred 
                          growth across generations.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Charitable Strategies</h4>
                        <p className="text-sm text-gray-600">
                          Qualified Charitable Distributions from IRA can satisfy RMDs while 
                          supporting causes you care about.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Trust Considerations</h4>
                        <p className="text-sm text-gray-600">
                          Trusts can provide protection and control over retirement asset 
                          distributions to beneficiaries.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Roth IRA Legacy Benefits</h4>
                    <p className="text-sm text-purple-700">
                      Roth IRAs have no RMDs during owner's lifetime and provide tax-free growth 
                      for beneficiaries. Excellent for legacy planning when estate taxes aren't a concern.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Key Takeaways & Action Steps</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Essential Retirement Principles</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Start Early:</strong> Time is your greatest asset. Even small contributions 
                      in your 20s can outperform larger contributions started later.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Maximize Matches:</strong> Always contribute enough to get full employer 
                      match - it's an immediate 100% return on investment.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Diversify Investments:</strong> Use age-appropriate asset allocation 
                      and diversify across different asset classes and accounts.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Plan for Healthcare:</strong> Healthcare costs are significant and rising. 
                      HSAs and long-term care insurance provide important protection.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Your Next Steps</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">1</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Calculate your retirement needs using our calculator and establish specific savings goals.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">2</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Review and optimize your current retirement account contributions and investment allocations.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">3</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Consider opening additional retirement accounts (IRA, HSA) if you haven't maximized all options.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">4</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Schedule annual reviews to adjust your strategy based on life changes and market conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Remember: Retirement Planning is a Marathon, Not a Sprint</h3>
                  <p className="text-gray-700 text-sm">
                    Success in retirement planning comes from consistent contributions, smart investment choices, 
                    and regular plan adjustments over time. Small improvements made today can have dramatic 
                    impacts on your financial security in retirement. Start where you are, use what you have, 
                    and do what you can - your future self will thank you.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RetirementCalculatorComponent;
