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
  CreditCard,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Settings,
  BookOpen,
  TrendingUp,
  Shield,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  loanPurpose: string;
  paymentFrequency: string;
  prepaymentAmount: number;
  prepaymentFrequency: string;
  creditScore: number;
  downPayment: number;
  closingCosts: number;
}

interface LoanResults {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  payoffDate: Date;
  loanToValue: number;
  effectiveAPR: number;
  totalCost: number;
  interestSavings: number;
  timeToPayoff: number;
  error?: string;
}

interface ChartDataPoint {
  month: number;
  balance: number;
  totalInterest: number;
  payment: number;
  principal: number;
  interest: number;
  cumulativePrincipal: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AnnualScheduleData {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  paymentsInYear: number;
}

const LoanCalculatorComponent = () => {
  const [inputs, setInputs] = useState<LoanInputs>({
    loanAmount: 250000,
    interestRate: 6.5,
    loanTerm: 30,
    loanPurpose: 'mortgage',
    paymentFrequency: 'monthly',
    prepaymentAmount: 0,
    prepaymentFrequency: 'monthly',
    creditScore: 750,
    downPayment: 50000,
    closingCosts: 5000
  });

  const [results, setResults] = useState<LoanResults>({
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    payoffDate: new Date(),
    loanToValue: 0,
    effectiveAPR: 0,
    totalCost: 0,
    interestSavings: 0,
    timeToPayoff: 0
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([]);
  const [scheduleView, setScheduleView] = useState<'monthly' | 'annual'>('monthly');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);

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

  // Advanced Loan Calculation
  const calculateLoan = (inputs: LoanInputs): LoanResults => {
    const { 
      loanAmount, 
      interestRate, 
      loanTerm, 
      paymentFrequency,
      prepaymentAmount,
      creditScore,
      downPayment,
      closingCosts
    } = inputs;

    if (loanAmount <= 0 || interestRate < 0 || loanTerm <= 0) {
      throw new Error('Invalid input values');
    }

    // Calculate payment frequency factor
    const paymentsPerYear = paymentFrequency === 'monthly' ? 12 : 
                           paymentFrequency === 'biweekly' ? 26 : 
                           paymentFrequency === 'weekly' ? 52 : 12;

    const periodicRate = interestRate / 100 / paymentsPerYear;
    const numPayments = loanTerm * paymentsPerYear;

    // Calculate base payment based on frequency
    let payment = 0;
    if (periodicRate > 0) {
      payment = loanAmount * (periodicRate * Math.pow(1 + periodicRate, numPayments)) / 
                      (Math.pow(1 + periodicRate, numPayments) - 1);
    } else {
      payment = loanAmount / numPayments;
    }

    // For display purposes, convert to monthly equivalent
    let monthlyPayment = payment;
    if (paymentFrequency === 'biweekly') {
      monthlyPayment = payment * 26 / 12;
    } else if (paymentFrequency === 'weekly') {
      monthlyPayment = payment * 52 / 12;
    }

    // Calculate with prepayments
    let adjustedPayment = monthlyPayment;
    if (prepaymentAmount > 0 && paymentFrequency === 'monthly') {
      adjustedPayment += prepaymentAmount;
    }

    // Calculate total costs using actual payment amount
    const totalPayments = payment * numPayments + closingCosts;
    const totalInterest = totalPayments - loanAmount - closingCosts;
    const totalCost = loanAmount + totalInterest + closingCosts + downPayment;

    // Calculate loan-to-value ratio
    const propertyValue = loanAmount + downPayment;
    const loanToValue = (loanAmount / propertyValue) * 100;

    // Calculate effective APR (including closing costs)
    const effectiveAPR = closingCosts > 0 ? 
      (((totalInterest + closingCosts) / loanAmount) / loanTerm) * 100 :
      interestRate;

    // Calculate payoff date
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + numPayments);

    // Calculate savings from prepayments
    const standardTotalInterest = (payment * numPayments) - loanAmount;
    const interestSavings = prepaymentAmount > 0 ? Math.max(0, standardTotalInterest - totalInterest) : 0;

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      monthlyPayment: round(monthlyPayment),
      totalPayments: round(totalPayments),
      totalInterest: round(totalInterest),
      payoffDate,
      loanToValue: round(loanToValue),
      effectiveAPR: round(effectiveAPR),
      totalCost: round(totalCost),
      interestSavings: round(interestSavings),
      timeToPayoff: numPayments
    };
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (inputs: LoanInputs) => {
    const { loanAmount, interestRate, loanTerm, paymentFrequency, prepaymentAmount } = inputs;
    
    const paymentsPerYear = paymentFrequency === 'monthly' ? 12 : 
                           paymentFrequency === 'biweekly' ? 26 : 
                           paymentFrequency === 'weekly' ? 52 : 12;

    const periodicRate = interestRate / 100 / paymentsPerYear;
    const numPayments = loanTerm * paymentsPerYear;

    let basePayment = 0;
    if (periodicRate > 0) {
      basePayment = loanAmount * (periodicRate * Math.pow(1 + periodicRate, numPayments)) / 
                   (Math.pow(1 + periodicRate, numPayments) - 1);
    } else {
      basePayment = loanAmount / numPayments;
    }

    // Convert to monthly for display purposes
    const periodicPayment = basePayment;
    const monthlyEquivalent = paymentFrequency === 'biweekly' ? basePayment * 26 / 12 :
                              paymentFrequency === 'weekly' ? basePayment * 52 / 12 : basePayment;

    const schedule = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;
    let cumulativePrincipal = 0;

    const currentDate = new Date();

    // Calculate schedule based on actual payment frequency but display monthly equivalent
    const totalPeriods = Math.min(numPayments, 360);
    const periodsPerMonth = paymentsPerYear / 12;

    for (let period = 1; period <= totalPeriods; period++) {
      const interestPayment = remainingBalance * periodicRate;
      let principalPayment = periodicPayment - interestPayment;
      
      // Add prepayment (only for monthly frequency)
      const extraPayment = (prepaymentAmount > 0 && paymentFrequency === 'monthly') ? prepaymentAmount : 0;
      principalPayment += extraPayment;

      // Don't pay more principal than remaining balance
      principalPayment = Math.min(principalPayment, remainingBalance);
      
      remainingBalance -= principalPayment;
      totalInterest += interestPayment;
      cumulativePrincipal += principalPayment;

      // Only add to schedule if it's a month boundary or monthly payments
      if (paymentFrequency === 'monthly' || period % Math.round(periodsPerMonth) === 0) {
        const displayMonth = paymentFrequency === 'monthly' ? period : Math.ceil(period / periodsPerMonth);
        const paymentDate = new Date(currentDate);
        paymentDate.setMonth(currentDate.getMonth() + displayMonth);

        schedule.push({
          month: displayMonth,
          date: paymentDate.toLocaleDateString(),
          payment: Math.round((monthlyEquivalent + extraPayment) * 100) / 100,
          principal: Math.round(principalPayment * 100) / 100,
          interest: Math.round(interestPayment * 100) / 100,
          remainingBalance: Math.round(remainingBalance * 100) / 100,
          totalInterest: Math.round(totalInterest * 100) / 100,
          cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100
        });
      }

      if (remainingBalance <= 0) break;
    }

    return schedule;
  };

  // Generate annual schedule
  const generateAnnualSchedule = (monthlySchedule: any[]): AnnualScheduleData[] => {
    const annualData: AnnualScheduleData[] = [];
    let year = 1;
    let yearlyPayment = 0;
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    let paymentsInYear = 0;

    monthlySchedule.forEach((payment, index) => {
      yearlyPayment += payment.payment;
      yearlyPrincipal += payment.principal;
      yearlyInterest += payment.interest;
      paymentsInYear++;

      if ((index + 1) % 12 === 0 || index === monthlySchedule.length - 1) {
        annualData.push({
          year,
          payment: Math.round(yearlyPayment * 100) / 100,
          principal: Math.round(yearlyPrincipal * 100) / 100,
          interest: Math.round(yearlyInterest * 100) / 100,
          remainingBalance: payment.remainingBalance,
          paymentsInYear
        });

        year++;
        yearlyPayment = 0;
        yearlyPrincipal = 0;
        yearlyInterest = 0;
        paymentsInYear = 0;
      }
    });

    return annualData;
  };

  // Handle input changes
  const handleInputChange = (id: keyof LoanInputs, value: string | boolean) => {
    const numValue = typeof value === 'boolean' ? value : (typeof value === 'string' && isNaN(Number(value)) ? value : parseFloat(value as string) || 0);
    let newInputs = { ...inputs, [id]: numValue };
    
    // Auto-adjust closing costs based on loan amount for better defaults
    if (id === 'loanAmount' && typeof numValue === 'number') {
      if (numValue < 10000) {
        newInputs.closingCosts = Math.max(0, numValue * 0.02); // 2% for small loans
      } else if (numValue < 100000) {
        newInputs.closingCosts = Math.max(200, numValue * 0.03); // 3% for medium loans
      } else {
        newInputs.closingCosts = Math.max(1000, numValue * 0.02); // 2% for large loans
      }
    }
    
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculateLoan(newInputs);
        setResults(calculationResults);
        
        const schedule = generateAmortizationSchedule(newInputs);
        setAmortizationSchedule(schedule);
        
        const chartData = schedule.slice(0, Math.min(36, schedule.length)).map(payment => ({
          month: payment.month,
          balance: Math.round(payment.remainingBalance),
          totalInterest: Math.round(payment.totalInterest),
          payment: Math.round(payment.payment),
          principal: Math.round(payment.principal),
          interest: Math.round(payment.interest),
          cumulativePrincipal: Math.round(payment.cumulativePrincipal)
        }));
        setChartData(chartData);
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
    handleInputChange('loanAmount', inputs.loanAmount.toString());
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Principal', value: inputs.loanAmount, color: '#3B82F6' },
    { name: 'Interest', value: results.totalInterest, color: '#EF4444' },
    { name: 'Down Payment', value: inputs.downPayment, color: '#10B981' },
    { name: 'Closing Costs', value: inputs.closingCosts, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Loan Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate loan payments, total interest, and amortization schedules for any type of loan. 
          Compare different loan terms, payment frequencies, and prepayment strategies.
        </p>
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Loan Details</span>
              </CardTitle>
              <CardDescription>Enter your loan information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={inputs.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPayment">Down Payment ($)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={inputs.downPayment}
                  onChange={(e) => handleInputChange('downPayment', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
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
                <Label htmlFor="loanTerm">Loan Term (years)</Label>
                <Input
                  id="loanTerm"
                  type="number"
                  value={inputs.loanTerm}
                  onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanPurpose">Loan Purpose</Label>
                <Select value={inputs.loanPurpose} onValueChange={(value) => handleInputChange('loanPurpose', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="auto">Auto Loan</SelectItem>
                    <SelectItem value="personal">Personal Loan</SelectItem>
                    <SelectItem value="business">Business Loan</SelectItem>
                    <SelectItem value="student">Student Loan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                <Select value={inputs.paymentFrequency} onValueChange={(value) => handleInputChange('paymentFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
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
                    <Label htmlFor="prepaymentAmount">Extra Payment ($ per month)</Label>
                    <Input
                      id="prepaymentAmount"
                      type="number"
                      value={inputs.prepaymentAmount}
                      onChange={(e) => handleInputChange('prepaymentAmount', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditScore">Credit Score</Label>
                    <Input
                      id="creditScore"
                      type="number"
                      value={inputs.creditScore}
                      onChange={(e) => handleInputChange('creditScore', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closingCosts">Closing Costs ($)</Label>
                    <Input
                      id="closingCosts"
                      type="number"
                      value={inputs.closingCosts}
                      onChange={(e) => handleInputChange('closingCosts', e.target.value)}
                    />
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
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.monthlyPayment)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalCost)}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Interest</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(results.totalInterest)}</p>
                      </div>
                      <Percent className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Value:</span>
                      <span className="font-medium">{formatCurrency(inputs.loanAmount + inputs.downPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loan-to-Value:</span>
                      <span className="font-medium">{formatPercentage(results.loanToValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective APR:</span>
                      <span className="font-medium">{formatPercentage(results.effectiveAPR)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payoff Date:</span>
                      <span className="font-medium">{results.payoffDate.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Loan-to-Value Ratios</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current LTV:</span>
                      <Badge variant={results.loanToValue > 80 ? "destructive" : "default"}>
                        {formatPercentage(results.loanToValue)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Credit Score Range:</span>
                      <Badge variant={inputs.creditScore >= 750 ? "default" : inputs.creditScore >= 650 ? "secondary" : "destructive"}>
                        {inputs.creditScore >= 750 ? "Excellent" : inputs.creditScore >= 650 ? "Good" : "Fair"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {inputs.prepaymentAmount > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Zap className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Prepayment Benefits</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-green-700">Interest Savings:</p>
                        <p className="text-2xl font-bold text-green-800">{formatCurrency(results.interestSavings)}</p>
                      </div>
                      <div>
                        <p className="text-green-700">Time Saved:</p>
                        <p className="text-2xl font-bold text-green-800">{Math.round((inputs.loanTerm * 12 - results.timeToPayoff) / 12)} years</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts and Analysis */}
      {!results.error && chartData.length > 0 && (
        <Tabs defaultValue="balance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Balance & Equity</span>
              <span className="sm:hidden">Balance</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center space-x-2">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cost Breakdown</span>
              <span className="sm:hidden">Breakdown</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Payment Analysis</span>
              <span className="sm:hidden">Payments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Loan Balance Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `Month ${value}`}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'balance' ? 'Remaining Balance' : 'Principal Paid'
                        ]}
                        labelFormatter={(label) => `Month ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#EF4444" 
                        strokeWidth={3}
                        name="Remaining Balance"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cumulativePrincipal" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        name="Principal Paid"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Total Cost Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Principal vs Interest Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `Month ${value}`}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'principal' ? 'Principal Payment' : 'Interest Payment'
                        ]}
                        labelFormatter={(label) => `Month ${label}`}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="principal"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                        name="Principal"
                      />
                      <Area
                        type="monotone"
                        dataKey="interest"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                        name="Interest"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Amortization Schedule */}
      {!results.error && amortizationSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="truncate">Amortization Schedule</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={scheduleView === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScheduleView('monthly')}
                  className="text-xs sm:text-sm"
                >
                  Monthly
                </Button>
                <Button
                  variant={scheduleView === 'annual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScheduleView('annual')}
                  className="text-xs sm:text-sm"
                >
                  Annual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {scheduleView === 'monthly' ? (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {amortizationSchedule.slice(0, 24).map((payment, index) => (
                      <Card key={index} className="p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-blue-600">Month {payment.month}</span>
                          <span className="text-sm text-gray-500">{payment.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Payment:</span>
                            <div className="font-medium">{formatCurrency(payment.payment)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Principal:</span>
                            <div className="font-medium text-green-600">{formatCurrency(payment.principal)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Interest:</span>
                            <div className="font-medium text-red-600">{formatCurrency(payment.interest)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Balance:</span>
                            <div className="font-medium">{formatCurrency(payment.remainingBalance)}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left">Month</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Date</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Payment</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Principal</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Interest</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortizationSchedule.slice(0, 24).map((payment, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-200 px-3 py-2 font-medium">{payment.month}</td>
                            <td className="border border-gray-200 px-3 py-2">{payment.date}</td>
                            <td className="border border-gray-200 px-3 py-2">{formatCurrency(payment.payment)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-green-600">{formatCurrency(payment.principal)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-red-600">{formatCurrency(payment.interest)}</td>
                            <td className="border border-gray-200 px-3 py-2">{formatCurrency(payment.remainingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Showing first 24 months of {inputs.loanTerm * 12} total payments
                  </p>
                </>
              ) : (
                <>
                  {/* Mobile Card View - Annual */}
                  <div className="block md:hidden space-y-3">
                    {generateAnnualSchedule(amortizationSchedule).map((year: AnnualScheduleData, index: number) => (
                      <Card key={index} className="p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-blue-600">Year {year.year}</span>
                          <span className="text-sm text-gray-500">12 payments</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Total Payments:</span>
                            <div className="font-medium">{formatCurrency(year.payment)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Principal:</span>
                            <div className="font-medium text-green-600">{formatCurrency(year.principal)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Interest:</span>
                            <div className="font-medium text-red-600">{formatCurrency(year.interest)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Ending Balance:</span>
                            <div className="font-medium">{formatCurrency(year.remainingBalance)}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View - Annual */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-3 py-2 text-left">Year</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Total Payments</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Principal</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Interest</th>
                          <th className="border border-gray-200 px-3 py-2 text-left">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateAnnualSchedule(amortizationSchedule).map((year: AnnualScheduleData, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-200 px-3 py-2 font-medium">{year.year}</td>
                            <td className="border border-gray-200 px-3 py-2">{formatCurrency(year.payment)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-green-600">{formatCurrency(year.principal)}</td>
                            <td className="border border-gray-200 px-3 py-2 text-red-600">{formatCurrency(year.interest)}</td>
                            <td className="border border-gray-200 px-3 py-2">{formatCurrency(year.remainingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Content */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Guide to Loan Calculations and Financial Planning</h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master the art of loan management with our comprehensive educational resources. Learn about different loan types, 
            calculation methods, optimization strategies, and expert tips for making informed financial decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Understanding Loans Fundamentals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Understanding Loan Fundamentals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-gray-700 mb-4">
                A loan is a financial instrument where a lender provides a sum of money to a borrower with the expectation 
                of repayment with interest over a specified period. Understanding loan mechanics is crucial for making 
                informed financial decisions that can save thousands of dollars over the loan's lifetime.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Essential Loan Components</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Principal Amount:</strong> The original loan amount borrowed, excluding interest and fees</li>
                <li><strong>Interest Rate:</strong> The annual percentage charged for borrowing money, expressed as APR</li>
                <li><strong>Loan Term:</strong> The time period for repayment, typically measured in months or years</li>
                <li><strong>Monthly Payment:</strong> Regular installment combining principal and interest payments</li>
                <li><strong>Amortization:</strong> The gradual reduction of loan balance through scheduled payments</li>
                <li><strong>Collateral:</strong> Assets securing the loan, reducing lender risk and borrower rates</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Loan Classification by Security</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Secured Loans:</strong> Backed by collateral such as real estate (mortgages) or vehicles (auto loans)</li>
                <li><strong>Unsecured Loans:</strong> No collateral required, typically including personal loans and credit cards</li>
                <li><strong>Semi-Secured Loans:</strong> Partially backed by collateral or guarantees</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interest Rate Structures</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Fixed-Rate Loans:</strong> Interest rate remains constant throughout the loan term</li>
                <li><strong>Variable-Rate Loans:</strong> Interest rate fluctuates based on market indices</li>
                <li><strong>Adjustable-Rate Loans:</strong> Initial fixed period followed by variable rates</li>
                <li><strong>Prime Rate Loans:</strong> Rates tied to the federal prime lending rate</li>
              </ul>
            </CardContent>
          </Card>

          {/* Advanced Loan Strategies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Advanced Loan Optimization Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Frequency Optimization</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Monthly Payments:</strong> Standard 12 payments per year, easiest budget management</li>
                <li><strong>Bi-Weekly Payments:</strong> 26 payments annually equals 13 monthly payments, reducing term</li>
                <li><strong>Weekly Payments:</strong> 52 payments per year, maximizing principal reduction frequency</li>
                <li><strong>Accelerated Payments:</strong> Any frequency faster than monthly reduces total interest</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Prepayment Strategies for Interest Savings</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Extra Principal Payments:</strong> Additional amounts applied directly to loan balance</li>
                <li><strong>Lump Sum Payments:</strong> Large one-time payments from bonuses or windfalls</li>
                <li><strong>Payment Rounding:</strong> Rounding payments to nearest $50 or $100</li>
                <li><strong>Tax Refund Applications:</strong> Using tax refunds for principal reduction</li>
                <li><strong>13th Payment Strategy:</strong> Making one extra payment annually</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Refinancing and Restructuring</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Rate Refinancing:</strong> Securing lower interest rates to reduce monthly payments</li>
                <li><strong>Term Refinancing:</strong> Adjusting loan length to optimize payments or total cost</li>
                <li><strong>Cash-Out Refinancing:</strong> Accessing equity while refinancing existing loans</li>
                <li><strong>Consolidation Refinancing:</strong> Combining multiple loans into single payment</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Credit Score Impact and Management</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Excellent Credit (750+):</strong> Qualifies for best rates and terms</li>
                <li><strong>Good Credit (650-749):</strong> Competitive rates with standard terms</li>
                <li><strong>Fair Credit (550-649):</strong> Higher rates, may require additional requirements</li>
                <li><strong>Poor Credit (Below 550):</strong> Limited options, often requiring secured loans</li>
              </ul>
            </CardContent>
          </Card>

          {/* Comprehensive Loan Comparison Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <span>Comprehensive Loan Comparison Guide</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Essential Comparison Metrics</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Annual Percentage Rate (APR):</strong> True cost including interest and fees</li>
                <li><strong>Total Interest Cost:</strong> Lifetime interest payments over entire loan term</li>
                <li><strong>Monthly Payment Amount:</strong> Required monthly cash flow commitment</li>
                <li><strong>Origination Fees:</strong> Upfront costs for loan processing and underwriting</li>
                <li><strong>Closing Costs:</strong> Additional fees for loan completion and documentation</li>
                <li><strong>Prepayment Penalties:</strong> Charges for early loan payoff or extra payments</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Strategic Loan Shopping Process</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Credit Report Review:</strong> Check credit score and history before applications</li>
                <li><strong>Multiple Lender Quotes:</strong> Compare offers from banks, credit unions, and online lenders</li>
                <li><strong>Rate Lock Periods:</strong> Understand interest rate guarantee timeframes</li>
                <li><strong>Pre-approval Process:</strong> Secure conditional approval before major purchases</li>
                <li><strong>Documentation Requirements:</strong> Prepare income, asset, and employment verification</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Loan Officer Negotiation Tactics</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Rate Negotiation:</strong> Use competing offers to secure better terms</li>
                <li><strong>Fee Reduction:</strong> Request waiver or reduction of origination fees</li>
                <li><strong>Closing Cost Credits:</strong> Negotiate lender credits for closing expenses</li>
                <li><strong>Point Purchases:</strong> Buy down interest rates with upfront payments</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Red Flags and Predatory Lending Warning Signs</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Pressure Tactics:</strong> High-pressure sales requiring immediate decisions</li>
                <li><strong>Guaranteed Approval Claims:</strong> Legitimate lenders always verify creditworthiness</li>
                <li><strong>Excessive Upfront Fees:</strong> Avoid lenders requiring large payments before approval</li>
                <li><strong>No Income Verification:</strong> Responsible lending requires income documentation</li>
                <li><strong>Balloon Payment Structures:</strong> Large final payments creating refinancing dependency</li>
              </ul>
            </CardContent>
          </Card>

          {/* Loan Types and Applications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <span>Loan Types and Strategic Applications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mortgage Loans and Real Estate Financing</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Conventional Mortgages:</strong> Traditional loans with 20% down payment requirements</li>
                <li><strong>FHA Loans:</strong> Government-backed loans with lower down payment options</li>
                <li><strong>VA Loans:</strong> Veterans Affairs loans with zero down payment benefits</li>
                <li><strong>USDA Loans:</strong> Rural development loans for eligible geographic areas</li>
                <li><strong>Jumbo Loans:</strong> High-value mortgages exceeding conforming loan limits</li>
                <li><strong>Investment Property Loans:</strong> Financing for rental and investment real estate</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Auto Loans and Vehicle Financing</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>New Car Loans:</strong> Manufacturer and dealer financing with promotional rates</li>
                <li><strong>Used Car Loans:</strong> Higher rates reflecting vehicle depreciation risks</li>
                <li><strong>Certified Pre-Owned Financing:</strong> Warranty-backed used vehicle loans</li>
                <li><strong>Auto Lease Alternatives:</strong> Loan vs. lease comparison considerations</li>
                <li><strong>Motorcycle and RV Loans:</strong> Specialized vehicle financing options</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal and Consumer Loans</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Debt Consolidation Loans:</strong> Combining multiple debts into single payment</li>
                <li><strong>Home Improvement Loans:</strong> Financing property upgrades and renovations</li>
                <li><strong>Medical Financing:</strong> Healthcare expense payment plans and loans</li>
                <li><strong>Wedding and Event Loans:</strong> Special occasion financing options</li>
                <li><strong>Emergency Loans:</strong> Quick access funding for unexpected expenses</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Business and Commercial Lending</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>SBA Loans:</strong> Small Business Administration guaranteed lending programs</li>
                <li><strong>Equipment Financing:</strong> Asset-based loans for business equipment purchases</li>
                <li><strong>Working Capital Loans:</strong> Short-term funding for operational expenses</li>
                <li><strong>Commercial Real Estate Loans:</strong> Property acquisition and development financing</li>
                <li><strong>Business Lines of Credit:</strong> Flexible borrowing for varying capital needs</li>
              </ul>
            </CardContent>
          </Card>

          {/* Advanced Mathematical Concepts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-indigo-600" />
                <span>Advanced Loan Mathematics and Calculations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Amortization Schedule Mathematics</h3>
              <p className="text-gray-700 mb-4">
                Amortization represents the systematic reduction of loan principal through scheduled payments. Early payments 
                consist primarily of interest, while later payments focus on principal reduction. This occurs because 
                interest calculations are based on the remaining principal balance, which decreases over time.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Present Value and Future Value Calculations</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Present Value:</strong> Current worth of future payments discounted by interest rate</li>
                <li><strong>Future Value:</strong> Expected value of payments after interest accumulation</li>
                <li><strong>Net Present Value:</strong> Comparison of investment returns vs. loan costs</li>
                <li><strong>Internal Rate of Return:</strong> Effective annual return on loan or investment</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compound Interest and Time Value of Money</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Simple Interest:</strong> Interest calculated only on principal amount</li>
                <li><strong>Compound Interest:</strong> Interest calculated on principal plus accumulated interest</li>
                <li><strong>Effective Annual Rate:</strong> True annual cost considering compounding frequency</li>
                <li><strong>Rule of 72:</strong> Quick estimation method for doubling time calculations</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Assessment and Pricing Models</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Credit Risk Pricing:</strong> Interest rate adjustments based on borrower risk</li>
                <li><strong>Loan-to-Value Ratios:</strong> Collateral coverage for secured loan protection</li>
                <li><strong>Debt-to-Income Ratios:</strong> Borrower capacity for additional debt service</li>
                <li><strong>Default Probability Models:</strong> Statistical analysis of repayment likelihood</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Payment Calculations</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Bi-weekly Payment Benefits:</strong> 26 payments equal 13 monthly payments annually</li>
                <li><strong>Principal-Only Payments:</strong> Direct balance reduction without interest</li>
                <li><strong>Interest-Only Periods:</strong> Payment structures for cash flow management</li>
                <li><strong>Balloon Payment Calculations:</strong> Large final payments in specialized loans</li>
              </ul>
            </CardContent>
          </Card>

          {/* Economic Factors and Market Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                <span>Economic Factors and Market Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Federal Reserve and Interest Rate Policy</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Federal Funds Rate:</strong> Base rate influencing all lending rates</li>
                <li><strong>Monetary Policy Impact:</strong> Economic stimulus and cooling measures</li>
                <li><strong>Yield Curve Analysis:</strong> Short-term vs. long-term rate relationships</li>
                <li><strong>Inflation Considerations:</strong> Real vs. nominal interest rate calculations</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Timing and Rate Cycles</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Rate Environment Assessment:</strong> Rising, falling, or stable rate periods</li>
                <li><strong>Lock-in Strategies:</strong> Timing fixed-rate loan commitments</li>
                <li><strong>Refinancing Opportunities:</strong> Optimal timing for loan restructuring</li>
                <li><strong>Economic Indicator Monitoring:</strong> GDP, employment, and inflation tracking</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Credit Market Conditions</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Lending Standards:</strong> Tight vs. loose credit availability periods</li>
                <li><strong>Bank Liquidity:</strong> Financial institution lending capacity</li>
                <li><strong>Secondary Market Activity:</strong> Loan sale and securitization impacts</li>
                <li><strong>Government Program Availability:</strong> Special lending initiative timing</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Global Economic Influences</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>International Rate Comparisons:</strong> Global interest rate environment</li>
                <li><strong>Currency Exchange Impacts:</strong> Foreign exchange rate considerations</li>
                <li><strong>Geopolitical Risk Factors:</strong> Political stability and lending risk</li>
                <li><strong>Commodity Price Influences:</strong> Energy and material cost impacts</li>
              </ul>
            </CardContent>
          </Card>

          {/* Tax Implications and Legal Considerations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Tax Implications and Legal Considerations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Interest Deduction Strategies</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Mortgage Interest Deduction:</strong> Primary residence interest deductibility</li>
                <li><strong>Home Equity Loan Interest:</strong> Tax deductible when used for home improvements</li>
                <li><strong>Student Loan Interest:</strong> Above-the-line deduction up to income limits</li>
                <li><strong>Business Loan Interest:</strong> Fully deductible as business operating expense</li>
                <li><strong>Investment Interest:</strong> Deductible against investment income</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Loan Forgiveness and Discharge Programs</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Public Service Loan Forgiveness:</strong> Government and non-profit employment benefits</li>
                <li><strong>Income-Driven Repayment Forgiveness:</strong> Balance forgiveness after 20-25 years</li>
                <li><strong>Teacher Loan Forgiveness:</strong> Education profession debt relief programs</li>
                <li><strong>Military Service Benefits:</strong> Armed forces loan forgiveness opportunities</li>
                <li><strong>Disability Discharge:</strong> Total and permanent disability loan cancellation</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bankruptcy and Default Implications</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Chapter 7 Bankruptcy:</strong> Asset liquidation and debt discharge</li>
                <li><strong>Chapter 13 Bankruptcy:</strong> Debt reorganization and payment plans</li>
                <li><strong>Student Loan Exceptions:</strong> Limited bankruptcy discharge availability</li>
                <li><strong>Secured Debt Treatment:</strong> Collateral implications in bankruptcy</li>
                <li><strong>Credit Score Recovery:</strong> Post-bankruptcy credit rebuilding strategies</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Consumer Protection Laws</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Truth in Lending Act:</strong> Required disclosure of loan terms and costs</li>
                <li><strong>Fair Credit Reporting Act:</strong> Credit report accuracy and dispute rights</li>
                <li><strong>Equal Credit Opportunity Act:</strong> Protection against lending discrimination</li>
                <li><strong>Real Estate Settlement Procedures Act:</strong> Closing cost disclosure requirements</li>
                <li><strong>Fair Debt Collection Practices Act:</strong> Protection from abusive collection practices</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Estate Planning and Loan Obligations</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Joint Liability:</strong> Co-signer and co-borrower obligations</li>
                <li><strong>Life Insurance Protection:</strong> Loan balance coverage strategies</li>
                <li><strong>Inheritance Implications:</strong> Estate asset and liability transfer</li>
                <li><strong>Trust Structures:</strong> Asset protection and loan management in trusts</li>
                <li><strong>Spousal Protection:</strong> Survivor benefits and liability limitations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Technology and Digital Lending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Digital Lending and Financial Technology</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Online Lending Platforms</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Peer-to-Peer Lending:</strong> Individual investor funding platforms</li>
                <li><strong>Marketplace Lending:</strong> Technology-driven loan origination systems</li>
                <li><strong>Digital-Only Banks:</strong> Online financial institutions with competitive rates</li>
                <li><strong>Automated Underwriting:</strong> Algorithm-based loan approval processes</li>
                <li><strong>Mobile Lending Apps:</strong> Smartphone-based loan applications and management</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Alternative Credit Scoring</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Cash Flow Analysis:</strong> Bank account transaction-based underwriting</li>
                <li><strong>Utility Payment History:</strong> Non-traditional credit data sources</li>
                <li><strong>Social Media Scoring:</strong> Digital footprint credit assessment</li>
                <li><strong>Employment Verification:</strong> Real-time income and job stability checking</li>
                <li><strong>Machine Learning Models:</strong> AI-driven risk assessment algorithms</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Blockchain and Cryptocurrency Integration</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                <li><strong>Smart Contract Lending:</strong> Automated loan execution and management</li>
                <li><strong>Decentralized Finance (DeFi):</strong> Blockchain-based lending protocols</li>
                <li><strong>Cryptocurrency Collateral:</strong> Digital asset-backed loan products</li>
                <li><strong>Stable Coin Lending:</strong> Cryptocurrency with stable value backing</li>
                <li><strong>Cross-Border Lending:</strong> International loan facilitation through blockchain</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Planning Integration</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Automated Savings:</strong> Loan payment and savings coordination</li>
                <li><strong>Goal-Based Planning:</strong> Loan selection aligned with financial objectives</li>
                <li><strong>Real-Time Monitoring:</strong> Continuous loan performance tracking</li>
                <li><strong>Predictive Analytics:</strong> Future payment capacity and risk assessment</li>
                <li><strong>Integrated Financial Dashboards:</strong> Comprehensive financial health monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Additional Resources and Expert Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Expert Tips and Advanced Strategies</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Advice</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Consult certified financial planners for complex loan decisions</li>
                  <li>Work with mortgage brokers for home loan optimization</li>
                  <li>Engage tax professionals for deduction strategies</li>
                  <li>Consider legal consultation for business lending</li>
                  <li>Use credit counselors for debt management planning</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Timing Strategies</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Monitor economic indicators for optimal borrowing timing</li>
                  <li>Plan major purchases around favorable rate cycles</li>
                  <li>Consider seasonal lending patterns and promotions</li>
                  <li>Time refinancing to maximize interest savings</li>
                  <li>Coordinate loan applications to minimize credit inquiries</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Long-term Planning</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Integrate loan decisions with retirement planning</li>
                  <li>Consider loan impacts on estate and inheritance planning</li>
                  <li>Plan for economic downturns and payment flexibility</li>
                  <li>Build emergency funds before taking on new debt</li>
                  <li>Regular review and optimization of loan portfolio</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoanCalculatorComponent;
