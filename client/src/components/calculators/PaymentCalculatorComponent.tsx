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
  CreditCard,
  Home,
  Car
} from 'lucide-react';

interface PaymentInputs {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  calculationType: 'fixed-term' | 'fixed-payment';
  paymentFrequency: string;
  extraPayment: number;
}

interface PaymentResults {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  payoffTime: number;
  totalCost: number;
  interestSavings: number;
  principalPaid: number;
  error?: string;
}

interface AmortizationEntry {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalInterest: number;
  totalPrincipal: number;
}

interface ChartDataPoint {
  period: number;
  balance: number;
  principalPaid: number;
  interestPaid: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const PaymentCalculatorComponent = () => {
  const [inputs, setInputs] = useState<PaymentInputs>({
    loanAmount: 250000,
    interestRate: 6.5,
    loanTerm: 30,
    monthlyPayment: 1580,
    calculationType: 'fixed-term',
    paymentFrequency: 'monthly',
    extraPayment: 0
  });

  const [results, setResults] = useState<PaymentResults>({
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    payoffTime: 0,
    totalCost: 0,
    interestSavings: 0,
    principalPaid: 0
  });

  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationEntry[]>([]);
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

  // Calculate payment details
  const calculatePayment = (inputs: PaymentInputs): PaymentResults => {
    const { 
      loanAmount, 
      interestRate, 
      loanTerm, 
      monthlyPayment, 
      calculationType, 
      paymentFrequency,
      extraPayment 
    } = inputs;

    if (loanAmount <= 0 || interestRate < 0) {
      throw new Error('Invalid input values');
    }

    // Convert annual rate to period rate
    const periodsPerYear = paymentFrequency === 'weekly' ? 52 : 
                          paymentFrequency === 'bi-weekly' ? 26 : 
                          paymentFrequency === 'monthly' ? 12 : 12;
    
    const periodRate = interestRate / 100 / periodsPerYear;
    const totalPeriods = loanTerm * periodsPerYear;

    let calculatedPayment = 0;
    let calculatedTerm = 0;
    let totalInterestPaid = 0;
    let totalPaymentsMade = 0;

    if (calculationType === 'fixed-term') {
      // Calculate monthly payment for fixed term
      if (periodRate === 0) {
        calculatedPayment = loanAmount / totalPeriods;
      } else {
        calculatedPayment = loanAmount * (periodRate * Math.pow(1 + periodRate, totalPeriods)) / 
                           (Math.pow(1 + periodRate, totalPeriods) - 1);
      }
      
      // Add extra payment
      const totalPaymentAmount = calculatedPayment + extraPayment;
      
      // Calculate payoff with extra payments
      let balance = loanAmount;
      let period = 0;
      
      while (balance > 0.01 && period < totalPeriods * 2) {
        const interestPayment = balance * periodRate;
        let principalPayment = totalPaymentAmount - interestPayment;
        
        if (principalPayment > balance) {
          principalPayment = balance;
        }
        
        balance -= principalPayment;
        totalInterestPaid += interestPayment;
        totalPaymentsMade += interestPayment + principalPayment;
        period++;
      }
      
      calculatedTerm = period;
      
    } else {
      // Fixed payment - calculate term
      if (monthlyPayment <= 0) {
        throw new Error('Monthly payment must be greater than 0');
      }
      
      const totalPaymentAmount = monthlyPayment + extraPayment;
      
      // Check if payment is sufficient
      const minPayment = loanAmount * periodRate;
      if (totalPaymentAmount <= minPayment && periodRate > 0) {
        throw new Error('Payment amount is too low to pay off the loan');
      }
      
      let balance = loanAmount;
      let period = 0;
      
      while (balance > 0.01 && period < 1000) { // Limit to prevent infinite loops
        const interestPayment = balance * periodRate;
        let principalPayment = totalPaymentAmount - interestPayment;
        
        if (principalPayment > balance) {
          principalPayment = balance;
        }
        
        balance -= principalPayment;
        totalInterestPaid += interestPayment;
        totalPaymentsMade += interestPayment + principalPayment;
        period++;
      }
      
      calculatedTerm = period;
      calculatedPayment = monthlyPayment;
    }

    // Calculate interest savings with extra payments
    let baseInterest = 0;
    if (extraPayment > 0) {
      // Calculate interest without extra payments
      if (periodRate === 0) {
        baseInterest = 0;
      } else {
        let baseBalance = loanAmount;
        for (let i = 0; i < totalPeriods; i++) {
          const interestPayment = baseBalance * periodRate;
          const principalPayment = calculatedPayment - interestPayment;
          baseBalance -= principalPayment;
          baseInterest += interestPayment;
          if (baseBalance <= 0) break;
        }
      }
    }

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      monthlyPayment: round(calculatedPayment),
      totalPayments: round(totalPaymentsMade),
      totalInterest: round(totalInterestPaid),
      payoffTime: round(calculatedTerm / periodsPerYear),
      totalCost: round(totalPaymentsMade),
      interestSavings: round(baseInterest - totalInterestPaid),
      principalPaid: round(loanAmount)
    };
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (inputs: PaymentInputs): AmortizationEntry[] => {
    const { loanAmount, interestRate, paymentFrequency, extraPayment } = inputs;
    const periodsPerYear = paymentFrequency === 'weekly' ? 52 : 
                          paymentFrequency === 'bi-weekly' ? 26 : 
                          paymentFrequency === 'monthly' ? 12 : 12;
    
    const periodRate = interestRate / 100 / periodsPerYear;
    const paymentAmount = results.monthlyPayment + extraPayment;
    
    const schedule: AmortizationEntry[] = [];
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPrincipal = 0;
    let period = 1;

    while (balance > 0.01 && period <= 1000) {
      const interestPayment = balance * periodRate;
      let principalPayment = paymentAmount - interestPayment;
      
      if (principalPayment > balance) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      totalPrincipal += principalPayment;
      
      schedule.push({
        period,
        payment: Math.round((interestPayment + principalPayment) * 100) / 100,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPrincipal: Math.round(totalPrincipal * 100) / 100
      });
      
      period++;
    }

    return schedule;
  };

  // Generate chart data
  const generateChartData = (schedule: AmortizationEntry[]): ChartDataPoint[] => {
    return schedule.map(entry => ({
      period: entry.period,
      balance: entry.balance,
      principalPaid: entry.principal,
      interestPaid: entry.interest,
      cumulativePrincipal: entry.totalPrincipal,
      cumulativeInterest: entry.totalInterest
    }));
  };

  // Handle input changes
  const handleInputChange = (id: keyof PaymentInputs, value: string | boolean) => {
    const numValue = typeof value === 'boolean' ? value : (typeof value === 'string' && isNaN(Number(value)) ? value : parseFloat(value as string) || 0);
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculatePayment(newInputs);
        setResults(calculationResults);
        
        const schedule = generateAmortizationSchedule(newInputs);
        setAmortizationSchedule(schedule);
        
        const chartResults = generateChartData(schedule);
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
    handleInputChange('loanAmount', inputs.loanAmount.toString());
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Principal', value: results.principalPaid, color: '#3B82F6' },
    { name: 'Interest', value: results.totalInterest, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Payment Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate loan payments, payoff times, and total costs. Choose between fixed-term or fixed-payment calculations 
          to find the best loan strategy for your financial situation.
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
                Payment Details
              </CardTitle>
              <CardDescription>Configure your loan parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Calculation Type */}
              <div className="space-y-2">
                <Label htmlFor="calculationType">Calculation Type</Label>
                <Select value={inputs.calculationType} onValueChange={(value) => handleInputChange('calculationType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed-term">Fixed Term</SelectItem>
                    <SelectItem value="fixed-payment">Fixed Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {inputs.calculationType === 'fixed-term' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    value={inputs.monthlyPayment}
                    onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
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
                    <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                    <Select value={inputs.paymentFrequency} onValueChange={(value) => handleInputChange('paymentFrequency', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraPayment">Extra Payment ($)</Label>
                    <Input
                      id="extraPayment"
                      type="number"
                      value={inputs.extraPayment}
                      onChange={(e) => handleInputChange('extraPayment', e.target.value)}
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
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {inputs.calculationType === 'fixed-term' ? 'Monthly Payment' : 'Payoff Time'}
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {inputs.calculationType === 'fixed-term' 
                            ? formatCurrency(results.monthlyPayment)
                            : `${results.payoffTime.toFixed(1)} years`}
                        </p>
                      </div>
                      <Calculator className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
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

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Cost</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(results.totalCost)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal Amount:</span>
                      <span className="font-medium">{formatCurrency(inputs.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Interest:</span>
                      <span className="font-medium text-red-600">{formatCurrency(results.totalInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Payments:</span>
                      <span className="font-medium">{formatCurrency(results.totalPayments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Frequency:</span>
                      <span className="font-medium capitalize">{inputs.paymentFrequency}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interest Rate:</span>
                      <span className="font-medium">{formatPercentage(inputs.interestRate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loan Term:</span>
                      <span className="font-medium">{results.payoffTime.toFixed(1)} years</span>
                    </div>
                    {inputs.extraPayment > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Extra Payment:</span>
                          <span className="font-medium">{formatCurrency(inputs.extraPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Savings:</span>
                          <span className="font-medium text-green-600">{formatCurrency(results.interestSavings)}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Performance Indicators */}
              {inputs.extraPayment > 0 && results.interestSavings > 0 && (
                <Card className="bg-green-50 border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Extra Payment Benefits</h3>
                    </div>
                    <p className="text-green-700">
                      Your extra payment of {formatCurrency(inputs.extraPayment)} will save you {formatCurrency(results.interestSavings)} in interest 
                      and help you pay off your loan faster.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown" className="flex items-center space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Breakdown</span>
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Balance Chart</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Payment Chart</span>
          </TabsTrigger>
        </TabsList>

        {/* Breakdown Chart */}
        <TabsContent value="breakdown">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Principal vs Interest Breakdown</CardTitle>
              <CardDescription>Visual breakdown of your total loan cost</CardDescription>
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

        {/* Balance Chart */}
        <TabsContent value="balance">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Loan Balance Over Time</CardTitle>
              <CardDescription>Track how your loan balance decreases over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Payment ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="balance" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} name="Remaining Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Chart */}
        <TabsContent value="payments">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Principal vs Interest Payments</CardTitle>
              <CardDescription>See how your payments are allocated between principal and interest</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                      labelFormatter={(label) => `Payment ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="cumulativePrincipal" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} name="Cumulative Principal" />
                    <Area type="monotone" dataKey="cumulativeInterest" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} name="Cumulative Interest" />
                  </AreaChart>
                </ResponsiveContainer>
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
            <span>Payment Schedule</span>
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each payment showing principal and interest allocation
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
                        <th className="text-right p-3 font-semibold">Payment</th>
                        <th className="text-right p-3 font-semibold">Principal</th>
                        <th className="text-right p-3 font-semibold">Interest</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                        <th className="text-right p-3 font-semibold">Total Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const yearlyData = [];
                        const periodsPerYear = inputs.paymentFrequency === 'weekly' ? 52 : 
                                             inputs.paymentFrequency === 'bi-weekly' ? 26 : 12;
                        
                        for (let year = 1; year <= Math.ceil(amortizationSchedule.length / periodsPerYear); year++) {
                          const startIndex = (year - 1) * periodsPerYear;
                          const endIndex = Math.min(year * periodsPerYear - 1, amortizationSchedule.length - 1);
                          
                          if (startIndex < amortizationSchedule.length) {
                            const yearData = amortizationSchedule.slice(startIndex, endIndex + 1);
                            const totalPayment = yearData.reduce((sum, entry) => sum + entry.payment, 0);
                            const totalPrincipal = yearData.reduce((sum, entry) => sum + entry.principal, 0);
                            const totalInterest = yearData.reduce((sum, entry) => sum + entry.interest, 0);
                            const endBalance = yearData[yearData.length - 1]?.balance || 0;
                            const cumulativeInterest = yearData[yearData.length - 1]?.totalInterest || 0;
                            
                            yearlyData.push({
                              year,
                              payment: totalPayment,
                              principal: totalPrincipal,
                              interest: totalInterest,
                              balance: endBalance,
                              totalInterest: cumulativeInterest
                            });
                          }
                        }
                        
                        return yearlyData.map((year, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{year.year}</td>
                            <td className="p-3 text-right">{formatCurrency(year.payment)}</td>
                            <td className="p-3 text-right text-blue-600">{formatCurrency(year.principal)}</td>
                            <td className="p-3 text-right text-red-600">{formatCurrency(year.interest)}</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(year.balance)}</td>
                            <td className="p-3 text-right">{formatCurrency(year.totalInterest)}</td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {(() => {
                  const yearlyData = [];
                  const periodsPerYear = inputs.paymentFrequency === 'weekly' ? 52 : 
                                       inputs.paymentFrequency === 'bi-weekly' ? 26 : 12;
                  
                  for (let year = 1; year <= Math.ceil(amortizationSchedule.length / periodsPerYear); year++) {
                    const startIndex = (year - 1) * periodsPerYear;
                    const endIndex = Math.min(year * periodsPerYear - 1, amortizationSchedule.length - 1);
                    
                    if (startIndex < amortizationSchedule.length) {
                      const yearData = amortizationSchedule.slice(startIndex, endIndex + 1);
                      const totalPayment = yearData.reduce((sum, entry) => sum + entry.payment, 0);
                      const totalPrincipal = yearData.reduce((sum, entry) => sum + entry.principal, 0);
                      const totalInterest = yearData.reduce((sum, entry) => sum + entry.interest, 0);
                      const endBalance = yearData[yearData.length - 1]?.balance || 0;
                      
                      yearlyData.push({
                        year,
                        payment: totalPayment,
                        principal: totalPrincipal,
                        interest: totalInterest,
                        balance: endBalance
                      });
                    }
                  }
                  
                  return yearlyData.map((year, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg">Year {year.year}</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formatCurrency(year.balance)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment:</span>
                          <span className="font-medium">{formatCurrency(year.payment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Principal:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(year.principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest:</span>
                          <span className="font-medium text-red-600">{formatCurrency(year.interest)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Balance:</span>
                          <span className="font-medium">{formatCurrency(year.balance)}</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
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
                        <th className="text-left p-3 font-semibold">Payment #</th>
                        <th className="text-right p-3 font-semibold">Payment</th>
                        <th className="text-right p-3 font-semibold">Principal</th>
                        <th className="text-right p-3 font-semibold">Interest</th>
                        <th className="text-right p-3 font-semibold">Balance</th>
                        <th className="text-right p-3 font-semibold">Total Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortizationSchedule.map((entry, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{entry.period}</td>
                          <td className="p-3 text-right">{formatCurrency(entry.payment)}</td>
                          <td className="p-3 text-right text-blue-600">{formatCurrency(entry.principal)}</td>
                          <td className="p-3 text-right text-red-600">{formatCurrency(entry.interest)}</td>
                          <td className="p-3 text-right font-medium">{formatCurrency(entry.balance)}</td>
                          <td className="p-3 text-right">{formatCurrency(entry.totalInterest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 max-h-96 overflow-y-auto">
                {amortizationSchedule.map((entry, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Payment {entry.period}</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {formatCurrency(entry.balance)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-medium">{formatCurrency(entry.payment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(entry.principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-medium text-red-600">{formatCurrency(entry.interest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Interest:</span>
                        <span className="font-medium">{formatCurrency(entry.totalInterest)}</span>
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
      <div className="mt-12 space-y-8">
        <Separator />
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Understanding Loan Payments and Strategies</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Master loan payment calculations and optimize your borrowing strategy with our comprehensive guide to payment types, 
            interest rates, and repayment optimization techniques.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Understanding Loan Fundamentals */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Loan Payment Fundamentals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                A loan represents a contractual agreement where a borrower receives a sum of money (principal) with the obligation 
                to repay it over time with interest. Payment calculations determine how this debt is structured and resolved.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Core Payment Components</h4>
              <p>
                Every loan payment consists of two parts: <strong>principal</strong> (amount toward the original debt) 
                and <strong>interest</strong> (cost of borrowing). Early payments typically have more interest, 
                while later payments focus more on principal reduction.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Payment Calculation Methods</h4>
              <p>
                <strong>Fixed Term:</strong> Calculates payment amount based on predetermined loan duration. 
                Common for mortgages (15-30 years) and auto loans (2-8 years).
                <br /><strong>Fixed Payment:</strong> Determines payoff time based on set payment amount. 
                Useful for credit card debt elimination and accelerated payoff strategies.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Mathematical Foundation</h4>
              <p>
                Payment calculations use the present value of annuity formula: <strong>PMT = PV × [r(1+r)^n] / [(1+r)^n - 1]</strong>
                <br />Where: PMT = payment, PV = present value, r = period rate, n = number of periods
              </p>
            </CardContent>
          </Card>

          {/* Fixed Term vs Fixed Payment Strategies */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Payment Strategy Selection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Choosing between fixed-term and fixed-payment approaches significantly impacts your financial strategy 
                and long-term wealth building. Each method serves different financial goals and circumstances.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Fixed Term Advantages</h4>
              <p>
                <strong>Predictable budgeting:</strong> Known payment amounts enable precise financial planning.
                <br /><strong>Rate optimization:</strong> Shorter terms typically offer lower interest rates.
                <br /><strong>Forced discipline:</strong> Structured timeline ensures debt elimination.
                <br /><strong>Interest minimization:</strong> Shorter terms reduce total interest paid.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Fixed Payment Benefits</h4>
              <p>
                <strong>Flexibility:</strong> Adjust payment amounts based on financial capacity.
                <br /><strong>Acceleration opportunity:</strong> Higher payments reduce payoff time dramatically.
                <br /><strong>Cash flow management:</strong> Lower payments preserve liquidity when needed.
                <br /><strong>Strategic optimization:</strong> Balance debt payoff with other investment opportunities.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Decision Framework</h4>
              <p>
                Choose fixed-term for stable income and clear payoff goals. Select fixed-payment for variable income, 
                aggressive payoff strategies, or when optimizing cash flow for other investments.
              </p>
            </CardContent>
          </Card>

          {/* Interest Rate Types and Impact */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Percent className="h-5 w-5 text-purple-600" />
                <span>Interest Rate Dynamics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Interest rates represent the cost of borrowing money and significantly impact your total payment obligations. 
                Understanding rate types and their implications helps optimize borrowing decisions.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Interest Rate vs APR</h4>
              <p>
                <strong>Interest Rate:</strong> Pure cost of borrowing the principal amount.
                <br /><strong>APR (Annual Percentage Rate):</strong> Comprehensive cost including fees, points, and other charges 
                spread over the loan term. APR provides more accurate total borrowing cost comparison.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Fixed vs Variable Rates</h4>
              <p>
                <strong>Fixed rates:</strong> Remain constant throughout the loan term, providing payment predictability 
                and protection against rate increases. Common for mortgages, auto loans, and personal loans.
              </p>
              
              <p>
                <strong>Variable rates:</strong> Fluctuate based on market indices (Fed rates, LIBOR). 
                Often start lower than fixed rates but carry uncertainty risk. Common for credit cards and HELOCs.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Rate Impact Analysis</h4>
              <p>
                Small rate differences create massive long-term cost variations. A 1% rate difference on a $300,000 
                30-year mortgage costs approximately $60,000 over the loan term. Rate shopping is crucial.
              </p>
            </CardContent>
          </Card>

          {/* Payment Frequency and Extra Payments */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Payment Optimization Techniques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Payment frequency and extra payment strategies can dramatically reduce total interest costs 
                and accelerate debt elimination without requiring significant lifestyle changes.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Payment Frequency Benefits</h4>
              <p>
                <strong>Bi-weekly payments:</strong> 26 payments yearly equal 13 monthly payments, reducing 30-year mortgages 
                to approximately 26 years and saving substantial interest.
                <br /><strong>Weekly payments:</strong> Further acceleration with 52 payments annually, though administrative 
                complexity may outweigh benefits for some borrowers.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Extra Payment Strategies</h4>
              <p>
                <strong>Consistent extra principal:</strong> Adding fixed amounts to each payment creates predictable acceleration.
                <br /><strong>Windfall applications:</strong> Tax refunds, bonuses, and inheritance directly to principal.
                <br /><strong>Round-up payments:</strong> Rounding payments to nearest $50 or $100 for manageable acceleration.
                <br /><strong>Targeted principal payments:</strong> Focusing extra payments during high-interest early years.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Strategic Considerations</h4>
              <p>
                Extra payments make most sense for high-interest debt (&gt;6-7%) and when lacking higher-return investment alternatives. 
                Consider opportunity cost versus guaranteed debt reduction returns.
              </p>
            </CardContent>
          </Card>

          {/* Loan Types and Applications */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-indigo-600" />
                <span>Loan Types and Payment Applications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Different loan types have unique payment characteristics and optimization opportunities. 
                Understanding these distinctions helps tailor payment strategies to specific debt types.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Mortgage Payments</h4>
              <p>
                <strong>Term selection impact:</strong> 15-year vs 30-year mortgages offer dramatically different payment profiles. 
                Shorter terms mean higher payments but massive interest savings.
                <br /><strong>Refinancing opportunities:</strong> Rate decreases of 0.5-1% often justify refinancing costs.
                <br /><strong>PMI considerations:</strong> Extra principal payments toward 20% equity eliminate private mortgage insurance.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Auto Loan Optimization</h4>
              <p>
                Auto loans typically range from 24-84 months. While longer terms reduce payments, 
                they often result in negative equity (owing more than vehicle value) and higher total costs. 
                Consider vehicle depreciation in payment term decisions.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Credit Card Debt</h4>
              <p>
                Credit cards typically use variable rates and minimum payment structures designed to maximize interest revenue. 
                Fixed payment strategies dramatically outperform minimum payment approaches. 
                Target highest-rate cards first (avalanche method) for optimal mathematical results.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Student Loan Strategies</h4>
              <p>
                Federal student loans offer income-driven repayment plans and forgiveness programs that complicate optimal payment strategies. 
                Consider loan forgiveness eligibility before aggressive repayment approaches.
              </p>
            </CardContent>
          </Card>

          {/* Advanced Payment Strategies */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Advanced Payment Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                Sophisticated borrowers can employ advanced strategies to optimize payment timing, 
                tax implications, and overall financial outcomes through strategic debt management.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Debt Consolidation Analysis</h4>
              <p>
                Combining multiple debts into single payments can simplify management and potentially reduce rates. 
                However, extending terms may increase total interest despite lower payments. 
                Calculate total costs carefully before consolidating.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Tax-Deductible Interest Strategy</h4>
              <p>
                Mortgage interest deductibility may favor slower payoff in favor of investing in tax-advantaged accounts. 
                Compare after-tax borrowing costs with investment returns for optimal allocation decisions.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Opportunity Cost Evaluation</h4>
              <p>
                Low-rate debt (sub-4%) may warrant minimum payments while directing extra funds toward higher-return investments. 
                Consider risk tolerance, investment timeline, and guaranteed debt reduction returns versus market uncertainty.
              </p>
              
              <h4 className="font-semibold mt-4 mb-2">Cash Flow Optimization</h4>
              <p>
                Balance debt reduction with emergency fund maintenance, retirement contributions, and other financial goals. 
                Avoid over-paying debt at the expense of financial flexibility and other opportunities.
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
                <h4 className="font-semibold mb-2 text-blue-700">Scenario Analysis</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Compare fixed-term vs fixed-payment strategies for your situation</li>
                  <li>• Test different payment frequencies to see acceleration benefits</li>
                  <li>• Model extra payment impacts on total interest and payoff time</li>
                  <li>• Analyze rate sensitivity by testing different interest rates</li>
                  <li>• Evaluate refinancing benefits with new rate scenarios</li>
                  <li>• Calculate break-even points for different loan terms</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Strategic Applications</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Use amortization schedule to plan extra payment timing</li>
                  <li>• Identify high-interest periods for targeted principal payments</li>
                  <li>• Compare total costs across different loan structures</li>
                  <li>• Plan cash flow with payment frequency options</li>
                  <li>• Evaluate opportunity costs of accelerated payoff</li>
                  <li>• Optimize payment strategies across multiple debts</li>
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
              <span>Key Insights & Important Considerations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">Payment Optimization Principles</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Small rate differences create massive long-term cost impacts</li>
                  <li>• Extra principal payments provide guaranteed returns equal to the interest rate</li>
                  <li>• Shorter loan terms typically offer better rates and lower total costs</li>
                  <li>• Payment frequency changes can significantly accelerate payoff</li>
                  <li>• Early payments have maximum impact on total interest reduction</li>
                  <li>• Consider opportunity costs before aggressive debt payoff strategies</li>
                  <li>• Maintain emergency funds while optimizing debt payments</li>
                  <li>• Automate payments to ensure consistency and avoid late fees</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-red-700">Critical Warnings</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Calculations assume constant rates for variable rate loans</li>
                  <li>• Additional fees and costs may not be reflected in basic calculations</li>
                  <li>• Early payoff may trigger prepayment penalties on some loans</li>
                  <li>• Tax implications of debt vs investment strategies require professional advice</li>
                  <li>• Market conditions affect optimal payment vs investment decisions</li>
                  <li>• Insurance and tax escrows may add to actual payment amounts</li>
                  <li>• Rate changes affect payment amounts in variable rate loans</li>
                  <li>• Credit score impacts may affect refinancing opportunities</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> This calculator provides estimates for educational purposes only and should not replace 
                professional financial advice. Actual loan terms, rates, and costs may vary. Payment obligations are legally binding 
                regardless of calculator results. Always verify calculations with lenders and consider consulting financial advisors 
                for complex debt management decisions. Market conditions and personal circumstances significantly impact optimal strategies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCalculatorComponent;
