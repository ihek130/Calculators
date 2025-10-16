import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Percent, 
  BarChart3, 
  PieChart as PieChartIcon,
  Info,
  Calculator,
  Target,
  FileText,
  BookOpen
} from 'lucide-react';

// Types
interface InvestmentInputs {
  calculationType: 'endAmount' | 'returnRate' | 'startingAmount' | 'investmentLength' | 'additionalContribution';
  startingAmount: number;
  additionalContribution: number;
  contributionFrequency: 'monthly' | 'quarterly' | 'annually';
  contributionTiming: 'beginning' | 'end';
  returnRate: number;
  compoundFrequency: 'monthly' | 'quarterly' | 'annually';
  investmentLength: number;
  endAmount: number;
}

interface InvestmentResults {
  endBalance: number;
  totalContributions: number;
  totalInterest: number;
  startingAmount: number;
  calculatedValue?: number;
  error?: string;
}

interface ScheduleEntry {
  year: number;
  deposit: number;
  interest: number;
  endingBalance: number;
  cumulativeContributions: number;
  cumulativeInterest: number;
}

interface MonthlyScheduleEntry {
  period: number;
  month: string;
  deposit: number;
  interest: number;
  endingBalance: number;
}

interface ChartDataPoint {
  period: number;
  startingAmount: number;
  contributions: number;
  interest: number;
  balance: number;
}

const InvestmentCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<InvestmentInputs>({
    calculationType: 'endAmount',
    startingAmount: 20000,
    additionalContribution: 1000,
    contributionFrequency: 'annually',
    contributionTiming: 'end',
    returnRate: 6,
    compoundFrequency: 'annually',
    investmentLength: 10,
    endAmount: 200000
  });

  const [results, setResults] = useState<InvestmentResults>({
    endBalance: 0,
    totalContributions: 0,
    totalInterest: 0,
    startingAmount: 0
  });

  const [annualSchedule, setAnnualSchedule] = useState<ScheduleEntry[]>([]);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlyScheduleEntry[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  // Get frequency multiplier
  const getFrequencyMultiplier = (frequency: string): number => {
    switch (frequency) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'annually': return 1;
      default: return 1;
    }
  };

  // Calculate investment based on type
  const calculateInvestment = (inputs: InvestmentInputs): InvestmentResults => {
    const {
      calculationType,
      startingAmount,
      additionalContribution,
      contributionFrequency,
      contributionTiming,
      returnRate,
      compoundFrequency,
      investmentLength,
      endAmount
    } = inputs;

    try {
      const periodsPerYear = getFrequencyMultiplier(compoundFrequency);
      const contributionsPerYear = getFrequencyMultiplier(contributionFrequency);
      const totalPeriods = investmentLength * periodsPerYear;
      const periodRate = returnRate / 100 / periodsPerYear;
      const contributionAmount = additionalContribution;
      const contributionPerPeriod = contributionAmount / (periodsPerYear / contributionsPerYear);

      let calculatedValue: number | undefined;
      let finalBalance: number;
      let totalContributions: number;

      switch (calculationType) {
        case 'endAmount':
          // Calculate future value
          const fvPrincipal = startingAmount * Math.pow(1 + periodRate, totalPeriods);
          
          let fvAnnuity = 0;
          if (contributionPerPeriod > 0) {
            if (contributionTiming === 'beginning') {
              fvAnnuity = contributionPerPeriod * (Math.pow(1 + periodRate, totalPeriods) - 1) / periodRate * (1 + periodRate);
            } else {
              fvAnnuity = contributionPerPeriod * (Math.pow(1 + periodRate, totalPeriods) - 1) / periodRate;
            }
          }
          
          finalBalance = fvPrincipal + fvAnnuity;
          totalContributions = startingAmount + (contributionAmount * investmentLength);
          calculatedValue = finalBalance;
          break;

        case 'returnRate':
          // Calculate required return rate using Newton-Raphson method
          let rate = 0.05; // Initial guess
          const targetAmount = endAmount;
          const maxIterations = 100;
          const tolerance = 0.0001;
          
          for (let i = 0; i < maxIterations; i++) {
            const fv = startingAmount * Math.pow(1 + rate, investmentLength) + 
                      contributionAmount * ((Math.pow(1 + rate, investmentLength) - 1) / rate);
            const derivative = startingAmount * investmentLength * Math.pow(1 + rate, investmentLength - 1) +
                              contributionAmount * (investmentLength * Math.pow(1 + rate, investmentLength - 1) / rate - 
                              (Math.pow(1 + rate, investmentLength) - 1) / (rate * rate));
            
            const newRate = rate - (fv - targetAmount) / derivative;
            if (Math.abs(newRate - rate) < tolerance) {
              rate = newRate;
              break;
            }
            rate = newRate;
          }
          
          calculatedValue = rate * 100;
          finalBalance = endAmount;
          totalContributions = startingAmount + (contributionAmount * investmentLength);
          break;

        case 'startingAmount':
          // Calculate required starting amount
          const futureValueAnnuity = contributionAmount * ((Math.pow(1 + returnRate/100, investmentLength) - 1) / (returnRate/100));
          const requiredPrincipal = (endAmount - futureValueAnnuity) / Math.pow(1 + returnRate/100, investmentLength);
          calculatedValue = requiredPrincipal;
          finalBalance = endAmount;
          totalContributions = requiredPrincipal + (contributionAmount * investmentLength);
          break;

        case 'investmentLength':
          // Calculate required time using logarithms
          if (contributionAmount === 0) {
            const requiredTime = Math.log(endAmount / startingAmount) / Math.log(1 + returnRate/100);
            calculatedValue = requiredTime;
          } else {
            // Use iterative method for annuity case
            let years = 1;
            let currentValue = startingAmount;
            while (currentValue < endAmount && years <= 100) {
              currentValue = currentValue * (1 + returnRate/100) + contributionAmount;
              years++;
            }
            calculatedValue = years - 1;
          }
          finalBalance = endAmount;
          totalContributions = startingAmount + (contributionAmount * (calculatedValue || investmentLength));
          break;

        case 'additionalContribution':
          // Calculate required additional contribution
          const fvPrincipalOnly = startingAmount * Math.pow(1 + returnRate/100, investmentLength);
          const requiredFromContributions = endAmount - fvPrincipalOnly;
          const requiredContribution = requiredFromContributions / ((Math.pow(1 + returnRate/100, investmentLength) - 1) / (returnRate/100));
          calculatedValue = requiredContribution;
          finalBalance = endAmount;
          totalContributions = startingAmount + (requiredContribution * investmentLength);
          break;

        default:
          throw new Error('Invalid calculation type');
      }

      const totalInterest = finalBalance - totalContributions;

      return {
        endBalance: Math.round(finalBalance * 100) / 100,
        totalContributions: Math.round(totalContributions * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        startingAmount: startingAmount,
        calculatedValue: calculatedValue ? Math.round(calculatedValue * 100) / 100 : undefined
      };
    } catch (error: any) {
      return {
        endBalance: 0,
        totalContributions: 0,
        totalInterest: 0,
        startingAmount: 0,
        error: error.message || 'Calculation error occurred'
      };
    }
  };

  // Generate annual schedule
  const generateAnnualSchedule = (inputs: InvestmentInputs): ScheduleEntry[] => {
    const { startingAmount, additionalContribution, returnRate, investmentLength } = inputs;
    const schedule: ScheduleEntry[] = [];
    let balance = startingAmount;
    let cumulativeContributions = startingAmount;
    let cumulativeInterest = 0;

    for (let year = 1; year <= investmentLength; year++) {
      const interestEarned = balance * (returnRate / 100);
      const deposit = additionalContribution;
      
      balance += interestEarned + deposit;
      cumulativeContributions += deposit;
      cumulativeInterest += interestEarned;

      schedule.push({
        year,
        deposit,
        interest: Math.round(interestEarned * 100) / 100,
        endingBalance: Math.round(balance * 100) / 100,
        cumulativeContributions: Math.round(cumulativeContributions * 100) / 100,
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100
      });
    }

    return schedule;
  };

  // Generate monthly schedule
  const generateMonthlySchedule = (inputs: InvestmentInputs): MonthlyScheduleEntry[] => {
    const { startingAmount, additionalContribution, returnRate, investmentLength, contributionFrequency } = inputs;
    const schedule: MonthlyScheduleEntry[] = [];
    let balance = startingAmount;
    const monthlyRate = returnRate / 100 / 12;
    const monthlyContribution = contributionFrequency === 'monthly' ? additionalContribution : additionalContribution / 12;
    const totalMonths = investmentLength * 12;

    for (let month = 1; month <= Math.min(totalMonths, 120); month++) { // Limit to 10 years for display
      const interestEarned = balance * monthlyRate;
      const deposit = monthlyContribution;
      
      balance += interestEarned + deposit;

      const date = new Date();
      date.setMonth(date.getMonth() + month - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      schedule.push({
        period: month,
        month: monthName,
        deposit: Math.round(deposit * 100) / 100,
        interest: Math.round(interestEarned * 100) / 100,
        endingBalance: Math.round(balance * 100) / 100
      });
    }

    return schedule;
  };

  // Generate chart data
  const generateChartData = (schedule: ScheduleEntry[]): ChartDataPoint[] => {
    let cumulativeStarting = inputs.startingAmount;
    let cumulativeContributions = 0;
    let cumulativeInterest = 0;

    return schedule.map((entry, index) => {
      if (index === 0) {
        cumulativeContributions = entry.deposit;
        cumulativeInterest = entry.interest;
      } else {
        cumulativeContributions += entry.deposit;
        cumulativeInterest += entry.interest;
      }

      return {
        period: entry.year,
        startingAmount: cumulativeStarting,
        contributions: cumulativeContributions,
        interest: cumulativeInterest,
        balance: entry.endingBalance
      };
    });
  };

  // Handle input changes
  const handleInputChange = (field: keyof InvestmentInputs, value: string | number) => {
    // String fields that should not be converted to numbers
    const stringFields = ['calculationType', 'contributionFrequency', 'contributionTiming', 'compoundFrequency'];
    
    let processedValue: string | number;
    if (stringFields.includes(field)) {
      processedValue = value as string;
    } else {
      processedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    
    const newInputs = { ...inputs, [field]: processedValue };
    setInputs(newInputs);
  };

  // Calculate results when inputs change
  useEffect(() => {
    const calculationResults = calculateInvestment(inputs);
    setResults(calculationResults);
    
    const annualData = generateAnnualSchedule(inputs);
    setAnnualSchedule(annualData);
    
    const monthlyData = generateMonthlySchedule(inputs);
    setMonthlySchedule(monthlyData);
    
    const chartResults = generateChartData(annualData);
    setChartData(chartResults);
  }, [inputs]);

  // Pie chart data
  const pieData = [
    { 
      name: 'Starting Amount', 
      value: ((results.startingAmount / results.endBalance) * 100) || 0, 
      color: '#3B82F6',
      amount: results.startingAmount
    },
    { 
      name: 'Contributions', 
      value: (((results.totalContributions - results.startingAmount) / results.endBalance) * 100) || 0, 
      color: '#10B981',
      amount: results.totalContributions - results.startingAmount
    },
    { 
      name: 'Interest', 
      value: ((results.totalInterest / results.endBalance) * 100) || 0, 
      color: '#F59E0B',
      amount: results.totalInterest
    }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center space-x-3">
          <TrendingUp className="h-10 w-10 text-blue-600" />
          <span>Investment Calculator</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate investment returns, plan your financial goals, and optimize your investment strategy 
          with comprehensive projections and detailed analysis.
        </p>
      </div>

      {/* Calculator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span>Investment Parameters</span>
              </CardTitle>
              <CardDescription>
                Enter your investment details and select what you want to calculate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Calculation Type */}
              <div className="space-y-2">
                <Label htmlFor="calculationType">Calculate</Label>
                <Select value={inputs.calculationType} onValueChange={(value) => handleInputChange('calculationType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endAmount">End Amount</SelectItem>
                    <SelectItem value="returnRate">Return Rate</SelectItem>
                    <SelectItem value="startingAmount">Starting Amount</SelectItem>
                    <SelectItem value="investmentLength">Investment Length</SelectItem>
                    <SelectItem value="additionalContribution">Additional Contribution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Starting Amount */}
              {inputs.calculationType !== 'startingAmount' && (
                <div className="space-y-2">
                  <Label htmlFor="startingAmount">Starting Amount ($)</Label>
                  <Input
                    id="startingAmount"
                    type="number"
                    value={inputs.startingAmount}
                    onChange={(e) => handleInputChange('startingAmount', e.target.value)}
                  />
                </div>
              )}

              {/* Additional Contribution */}
              {inputs.calculationType !== 'additionalContribution' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="additionalContribution">Additional Contribution ($)</Label>
                    <Input
                      id="additionalContribution"
                      type="number"
                      value={inputs.additionalContribution}
                      onChange={(e) => handleInputChange('additionalContribution', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contributionFrequency">Frequency</Label>
                      <Select value={inputs.contributionFrequency} onValueChange={(value) => handleInputChange('contributionFrequency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contributionTiming">Timing</Label>
                      <Select value={inputs.contributionTiming} onValueChange={(value) => handleInputChange('contributionTiming', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginning">Beginning</SelectItem>
                          <SelectItem value="end">End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Return Rate */}
              {inputs.calculationType !== 'returnRate' && (
                <div className="space-y-2">
                  <Label htmlFor="returnRate">Return Rate (%)</Label>
                  <Input
                    id="returnRate"
                    type="number"
                    step="0.1"
                    value={inputs.returnRate}
                    onChange={(e) => handleInputChange('returnRate', e.target.value)}
                  />
                </div>
              )}

              {/* Compound Frequency */}
              <div className="space-y-2">
                <Label htmlFor="compoundFrequency">Compound Frequency</Label>
                <Select value={inputs.compoundFrequency} onValueChange={(value) => handleInputChange('compoundFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Investment Length */}
              {inputs.calculationType !== 'investmentLength' && (
                <div className="space-y-2">
                  <Label htmlFor="investmentLength">Investment Length (years)</Label>
                  <Input
                    id="investmentLength"
                    type="number"
                    value={inputs.investmentLength}
                    onChange={(e) => handleInputChange('investmentLength', e.target.value)}
                  />
                </div>
              )}

              {/* End Amount */}
              {(inputs.calculationType === 'returnRate' || inputs.calculationType === 'startingAmount' || 
                inputs.calculationType === 'investmentLength' || inputs.calculationType === 'additionalContribution') && (
                <div className="space-y-2">
                  <Label htmlFor="endAmount">Target End Amount ($)</Label>
                  <Input
                    id="endAmount"
                    type="number"
                    value={inputs.endAmount}
                    onChange={(e) => handleInputChange('endAmount', e.target.value)}
                  />
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
              {/* Calculated Value Display */}
              {results.calculatedValue !== undefined && (
                <Card className="shadow-lg border-2 border-blue-200 bg-blue-50">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-lg font-medium text-blue-800 mb-2">
                        Calculated {typeof inputs.calculationType === 'string' 
                          ? inputs.calculationType.replace(/([A-Z])/g, ' $1').toLowerCase()
                          : 'value'}
                      </p>
                      <p className="text-4xl font-bold text-blue-600">
                        {inputs.calculationType === 'returnRate' 
                          ? formatPercentage(results.calculatedValue)
                          : inputs.calculationType === 'investmentLength'
                          ? `${results.calculatedValue.toFixed(1)} years`
                          : formatCurrency(results.calculatedValue)
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">End Balance</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.endBalance)}</p>
                      </div>
                      <Target className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.totalContributions)}</p>
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
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(results.totalInterest)}</p>
                      </div>
                      <Percent className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Investment Breakdown */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Investment Breakdown</CardTitle>
                  <CardDescription>Distribution of your investment components</CardDescription>
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
                            label={({name, value, x, y}) => {
                              const shortName = name === "Starting Amount" ? "Start" : name === "Contributions" ? "Contrib" : "Interest";
                              const labelText = window.innerWidth < 640 ? `${shortName}: ${value.toFixed(0)}%` : `${name}: ${value.toFixed(1)}%`;
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="#374151" 
                                  textAnchor="middle" 
                                  dominantBaseline="central"
                                  fontSize="12"
                                  fontWeight="500"
                                >
                                  {labelText}
                                </text>
                              );
                            }}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [
                              `${Number(value).toFixed(1)}%`,
                              name
                            ]}
                            contentStyle={{fontSize: '12px'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {pieData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg" 
                             style={{backgroundColor: `${item.color}10`}}>
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{backgroundColor: item.color}}></div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold" style={{color: item.color}}>{formatCurrency(item.amount)}</div>
                            <div className="text-sm" style={{color: item.color}}>{formatPercentage(item.value)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Tabs defaultValue="accumulation" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accumulation" className="flex items-center space-x-1 md:space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Accumulation Schedule</span>
            <span className="sm:hidden">Growth</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center space-x-1 md:space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Component Breakdown</span>
            <span className="sm:hidden">Breakdown</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center space-x-1 md:space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Year-over-Year</span>
            <span className="sm:hidden">Annual</span>
          </TabsTrigger>
        </TabsList>

        {/* Accumulation Chart */}
        <TabsContent value="accumulation">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Investment Growth Over Time</CardTitle>
              <CardDescription className="text-sm">See how your investment grows with contributions and compound interest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{fontSize: 12}}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{fontSize: 12}}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="startingAmount" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Starting Amount" />
                    <Area type="monotone" dataKey="contributions" stackId="1" stroke="#10B981" fill="#10B981" name="Contributions" />
                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Interest" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Component Breakdown */}
        <TabsContent value="breakdown">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Annual Component Breakdown</CardTitle>
              <CardDescription className="text-sm">Yearly breakdown of contributions vs interest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={annualSchedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      tick={{fontSize: 12}}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{fontSize: 12}}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name === "deposit" ? "Contribution" : "Interest"]}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Bar dataKey="deposit" fill="#10B981" name="Contribution" />
                    <Bar dataKey="interest" fill="#F59E0B" name="Interest" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Year-over-Year Comparison */}
        <TabsContent value="comparison">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Balance Growth Trend</CardTitle>
              <CardDescription className="text-sm">Track your investment balance growth year by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={annualSchedule}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      tick={{fontSize: 12}}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                      tick={{fontSize: 12}}
                      width={60}
                    />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), "Balance"]}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Line 
                      type="monotone" 
                      dataKey="endingBalance" 
                      stroke="#3B82F6" 
                      strokeWidth={3} 
                      name="Balance" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investment Schedule */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Investment Schedule</span>
          </CardTitle>
          <CardDescription>
            Detailed year-by-year and month-by-month breakdown of your investment growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="annual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="annual">Annual Schedule</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Schedule</TabsTrigger>
            </TabsList>

            {/* Annual Schedule */}
            <TabsContent value="annual" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold">Year</th>
                      <th className="text-right p-3 font-semibold">Deposit</th>
                      <th className="text-right p-3 font-semibold">Interest</th>
                      <th className="text-right p-3 font-semibold">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualSchedule.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{entry.year}</td>
                        <td className="p-3 text-right">{formatCurrency(entry.deposit)}</td>
                        <td className="p-3 text-right">{formatCurrency(entry.interest)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(entry.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Monthly Schedule */}
            <TabsContent value="monthly" className="mt-6">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Month</th>
                        <th className="text-right p-3 font-semibold">Deposit</th>
                        <th className="text-right p-3 font-semibold">Interest</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlySchedule.map((entry, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{entry.month}</td>
                          <td className="p-3 text-right">{formatCurrency(entry.deposit)}</td>
                          <td className="p-3 text-right">{formatCurrency(entry.interest)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(entry.endingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 max-h-96 overflow-y-auto">
                {monthlySchedule.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Month {entry.period}</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {entry.month}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit:</span>
                        <span className="font-medium">{formatCurrency(entry.deposit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-medium">{formatCurrency(entry.interest)}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-medium">{formatCurrency(entry.endingBalance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
            <span>Complete Guide to Investment Planning</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master the fundamentals of investing, understand different investment vehicles, develop strategic 
            approaches, and learn how to build wealth through informed investment decisions.
          </p>
        </div>

        {/* Educational Sections */}
        <div className="space-y-12">
          {/* Investment Fundamentals */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Info className="h-6 w-6 text-blue-600" />
                <span>Investment Fundamentals</span>
              </h3>
              <p className="text-gray-600 mt-2">Understanding the core principles and variables that drive investment success</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Key Investment Variables</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Starting Amount (Principal)</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        The initial capital you invest. This could be savings, inheritance, or any lump sum 
                        available for investment. Larger starting amounts benefit more from compound growth.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">Return Rate</h4>
                      <p className="text-green-700 text-sm mt-1">
                        The annual percentage gain (or loss) on your investment. Historical averages: 
                        stocks 10%, bonds 5%, savings accounts 1-2%. Higher returns typically mean higher risk.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Time Horizon</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        Investment duration significantly impacts outcomes. Longer periods allow compound 
                        interest to work and help ride out market volatility. Time is your greatest ally.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Additional Contributions</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Regular additions to your investment (dollar-cost averaging). Consistent contributions 
                        can be more powerful than large initial amounts due to disciplined investing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>The Power of Compound Interest</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Compound interest is earning returns on both your original investment and previously 
                    earned returns. Einstein allegedly called it the "eighth wonder of the world."
                  </p>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Example: $10,000 at 7% Annual Return</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Year 10:</span>
                        <span className="font-semibold">$19,672</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Year 20:</span>
                        <span className="font-semibold">$38,697</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Year 30:</span>
                        <span className="font-semibold text-green-600">$76,123</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h5 className="font-medium text-yellow-900">Compound Frequency Impact</h5>
                      <p className="text-yellow-700 text-sm mt-1">
                        More frequent compounding increases returns. Daily compounding yields slightly more 
                        than annual, but the difference is modest compared to rate and time effects.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-900">Rule of 72</h5>
                      <p className="text-blue-700 text-sm mt-1">
                        Divide 72 by your annual return rate to estimate doubling time. 
                        At 6% return: 72 ÷ 6 = 12 years to double your money.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Investment Types & Vehicles */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span>Investment Types & Vehicles</span>
              </h3>
              <p className="text-gray-600 mt-2">Explore different investment options and understand their characteristics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-600">Low-Risk Investments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Certificates of Deposit (CDs)</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        FDIC-insured, fixed-rate investments. Terms from 3 months to 5 years. 
                        Higher rates for longer terms. Penalties for early withdrawal.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Typical Return:</strong> 1-4% annually
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">High-Yield Savings</h4>
                      <p className="text-green-700 text-sm mt-1">
                        FDIC-insured, liquid, competitive interest rates. Perfect for emergency 
                        funds and short-term goals. No investment risk.
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        <strong>Typical Return:</strong> 0.5-5% annually
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">Treasury Securities</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        Government bonds (T-bills, notes, bonds). Extremely safe, backed by 
                        U.S. government. TIPS adjust for inflation.
                      </p>
                      <div className="mt-2 text-xs text-purple-600">
                        <strong>Typical Return:</strong> 2-5% annually
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">Moderate-Risk Investments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Corporate Bonds</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Company debt securities. Higher yields than government bonds but with 
                        credit risk. Investment-grade vs. high-yield (junk) bonds.
                      </p>
                      <div className="mt-2 text-xs text-orange-600">
                        <strong>Typical Return:</strong> 3-8% annually
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900">Dividend Stocks</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Shares in established companies that pay regular dividends. 
                        Provides income plus potential capital appreciation.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <strong>Typical Return:</strong> 4-12% annually
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900">REITs</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Real Estate Investment Trusts. Own income-producing real estate. 
                        Provide exposure to real estate without direct ownership.
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        <strong>Typical Return:</strong> 6-12% annually
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Higher-Risk Investments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-900">Growth Stocks</h4>
                      <p className="text-red-700 text-sm mt-1">
                        Shares in companies expected to grow faster than market average. 
                        Higher volatility but potential for significant returns.
                      </p>
                      <div className="mt-2 text-xs text-red-600">
                        <strong>Typical Return:</strong> 8-15% annually (variable)
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900">International Stocks</h4>
                      <p className="text-purple-700 text-sm mt-1">
                        Foreign company shares. Provides diversification but adds currency 
                        and political risks. Emerging markets offer higher potential returns.
                      </p>
                      <div className="mt-2 text-xs text-purple-600">
                        <strong>Typical Return:</strong> 6-16% annually (variable)
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <h4 className="font-semibold text-orange-900">Commodities</h4>
                      <p className="text-orange-700 text-sm mt-1">
                        Physical goods (gold, oil, agricultural products). Hedge against 
                        inflation but can be highly volatile and complex.
                      </p>
                      <div className="mt-2 text-xs text-orange-600">
                        <strong>Typical Return:</strong> Highly variable
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Investment Strategies */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <span>Investment Strategies & Best Practices</span>
              </h3>
              <p className="text-gray-600 mt-2">Proven approaches and techniques for successful long-term investing</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span>Dollar-Cost Averaging</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Investing a fixed amount regularly regardless of market conditions. This strategy 
                    reduces the impact of market volatility and removes the need to time the market.
                  </p>

                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">DCA Example: $500 Monthly</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Month 1 (Stock at $50):</span>
                        <span>10 shares purchased</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Month 2 (Stock at $40):</span>
                        <span>12.5 shares purchased</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Month 3 (Stock at $60):</span>
                        <span>8.33 shares purchased</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2 text-purple-600">
                        <span>Average Cost per Share:</span>
                        <span>$48.39 (vs. $50 average price)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-900">Advantages</h5>
                      <ul className="text-green-700 text-sm mt-1 space-y-1">
                        <li>• Reduces timing risk</li>
                        <li>• Builds disciplined investing habits</li>
                        <li>• Lower average cost in volatile markets</li>
                        <li>• Emotionally easier to maintain</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h5 className="font-medium text-yellow-900">Considerations</h5>
                      <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                        <li>• May underperform lump-sum in rising markets</li>
                        <li>• Requires consistent cash flow</li>
                        <li>• Transaction costs can add up</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    <span>Portfolio Diversification</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Spreading investments across different asset classes, sectors, and geographic 
                    regions to reduce risk. "Don't put all your eggs in one basket."
                  </p>

                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">Sample Conservative Portfolio (Age 60+)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bonds & Fixed Income:</span>
                          <span className="font-semibold">60%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Large-Cap Stocks:</span>
                          <span className="font-semibold">25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>International Stocks:</span>
                          <span className="font-semibold">10%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>REITs/Commodities:</span>
                          <span className="font-semibold">5%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Sample Aggressive Portfolio (Age 30)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Growth Stocks:</span>
                          <span className="font-semibold">50%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>International Stocks:</span>
                          <span className="font-semibold">25%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Small-Cap Stocks:</span>
                          <span className="font-semibold">15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonds:</span>
                          <span className="font-semibold">10%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h5 className="font-medium text-purple-900">Age-Based Rule of Thumb</h5>
                      <p className="text-purple-700 text-sm mt-1">
                        Stock percentage = 100 - your age. A 30-year-old might hold 70% stocks, 
                        30% bonds. Adjust based on risk tolerance and goals.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Practical Applications */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Target className="h-6 w-6 text-orange-600" />
                <span>Practical Investment Applications</span>
              </h3>
              <p className="text-gray-600 mt-2">Real-world scenarios and actionable investment planning strategies</p>
            </div>

            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span>Goal-Based Investment Planning</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">Retirement Planning</h4>
                      <div className="space-y-3 text-sm text-green-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Goal:</strong> $1M by age 65 (starting age 25)
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Strategy:</strong> 401(k) with employer match + IRA
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Required:</strong> ~$400/month at 7% return
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Portfolio:</strong> 80% stocks, 20% bonds
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">Home Down Payment</h4>
                      <div className="space-y-3 text-sm text-blue-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Goal:</strong> $50K in 5 years
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Strategy:</strong> Conservative, liquid investments
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Required:</strong> ~$800/month at 4% return
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Portfolio:</strong> CDs, bonds, high-yield savings
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-3">Child's Education</h4>
                      <div className="space-y-3 text-sm text-purple-700">
                        <div className="p-3 bg-white rounded border">
                          <strong>Goal:</strong> $200K in 18 years
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Strategy:</strong> 529 Education Savings Plan
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Required:</strong> ~$550/month at 6% return
                        </div>
                        <div className="p-3 bg-white rounded border">
                          <strong>Portfolio:</strong> Age-based automatic adjustment
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5 text-orange-600" />
                      <span>Common Investment Mistakes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <h4 className="font-semibold text-red-900">Emotional Investing</h4>
                        <p className="text-red-700 text-sm mt-1">
                          Buying high during market euphoria and selling low during panic. 
                          Stick to your long-term plan regardless of short-term market moves.
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                        <h4 className="font-semibold text-orange-900">Lack of Diversification</h4>
                        <p className="text-orange-700 text-sm mt-1">
                          Concentrating too much in one stock, sector, or asset class. 
                          Even great companies can fail—spread your risk.
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-semibold text-yellow-900">Chasing Performance</h4>
                        <p className="text-yellow-700 text-sm mt-1">
                          Investing in last year's best performers. Past performance doesn't 
                          guarantee future results. Focus on consistent, diversified strategies.
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                        <h4 className="font-semibold text-purple-900">Ignoring Fees</h4>
                        <p className="text-purple-700 text-sm mt-1">
                          High fees compound over time. A 2% annual fee can reduce your 
                          portfolio by 40% over 30 years compared to a 0.5% fee.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Investment Action Plan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 flex items-center">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                          Set Clear Goals
                        </h4>
                        <p className="text-blue-700 text-sm mt-1 ml-8">
                          Define specific, measurable objectives with timelines. What are you 
                          investing for and when do you need the money?
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 flex items-center">
                          <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                          Assess Risk Tolerance
                        </h4>
                        <p className="text-green-700 text-sm mt-1 ml-8">
                          Understand how much volatility you can handle emotionally and 
                          financially. Age, income, and goals all factor in.
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-900 flex items-center">
                          <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                          Choose Your Strategy
                        </h4>
                        <p className="text-purple-700 text-sm mt-1 ml-8">
                          Select appropriate asset allocation, investment vehicles, and 
                          contribution schedule based on your goals and risk tolerance.
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-900 flex items-center">
                          <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                          Start Investing
                        </h4>
                        <p className="text-orange-700 text-sm mt-1 ml-8">
                          Begin with what you can afford, even if it's small. Consistency 
                          matters more than amount. You can increase contributions over time.
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <span className="bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
                          Monitor & Rebalance
                        </h4>
                        <p className="text-gray-700 text-sm mt-1 ml-8">
                          Review annually and rebalance if allocations drift significantly. 
                          Adjust strategy as life circumstances change.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Key Investment Principles to Remember</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Time is Your Greatest Asset</p>
                          <p className="text-gray-700 text-sm">Start early to harness the full power of compound interest.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Consistency Beats Perfection</p>
                          <p className="text-gray-700 text-sm">Regular investing is more important than timing the market perfectly.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Diversification Reduces Risk</p>
                          <p className="text-gray-700 text-sm">Spread investments across different assets, sectors, and regions.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Keep Costs Low</p>
                          <p className="text-gray-700 text-sm">High fees significantly impact long-term returns through compounding.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Stay Disciplined</p>
                          <p className="text-gray-700 text-sm">Stick to your plan through market ups and downs. Emotion is the enemy of returns.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="font-semibold text-gray-900">Review and Adjust</p>
                          <p className="text-gray-700 text-sm">Periodically review your strategy and adjust as life circumstances change.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculatorComponent;
