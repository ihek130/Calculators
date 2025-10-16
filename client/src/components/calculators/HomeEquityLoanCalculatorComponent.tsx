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
  Home,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  Info,
  Settings,
  BookOpen,
  TrendingDown,
  Shield
} from 'lucide-react';

interface HomeEquityLoanInputs {
  homeValue: number;
  mortgageBalance: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  loanType: string;
  paymentType: string;
  drawPeriod: number;
  repaymentPeriod: number;
  closingCosts: number;
}

interface HomeEquityLoanResults {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  payoffDate: Date;
  loanToValue: number;
  combinedLoanToValue: number;
  availableEquity: number;
  taxDeductibleInterest: number;
  error?: string;
}

interface ChartDataPoint {
  month: number;
  balance: number;
  totalInterest: number;
  payment: number;
  principal: number;
  interest: number;
  equity: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const HomeEquityLoanCalculatorComponent = () => {
  const [inputs, setInputs] = useState<HomeEquityLoanInputs>({
    homeValue: 400000,
    mortgageBalance: 200000,
    loanAmount: 50000,
    interestRate: 7.5,
    loanTerm: 15,
    loanType: 'fixed',
    paymentType: 'principal_interest',
    drawPeriod: 10,
    repaymentPeriod: 20,
    closingCosts: 3000
  });

  const [results, setResults] = useState<HomeEquityLoanResults>({
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    payoffDate: new Date(),
    loanToValue: 0,
    combinedLoanToValue: 0,
    availableEquity: 0,
    taxDeductibleInterest: 0
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([]);
  const [scheduleView, setScheduleView] = useState<'monthly' | 'annual'>('monthly');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Advanced Home Equity Loan Calculation
  const calculateHomeEquityLoan = (inputs: HomeEquityLoanInputs): HomeEquityLoanResults => {
    const { 
      homeValue, 
      mortgageBalance, 
      loanAmount, 
      interestRate, 
      loanTerm, 
      loanType,
      paymentType,
      drawPeriod,
      repaymentPeriod,
      closingCosts
    } = inputs;

    if (homeValue <= 0 || loanAmount <= 0 || interestRate < 0 || loanTerm <= 0) {
      throw new Error('Invalid input values');
    }

    const availableEquity = homeValue - mortgageBalance;
    const loanToValue = (loanAmount / homeValue) * 100;
    const combinedLoanToValue = ((mortgageBalance + loanAmount) / homeValue) * 100;

    if (loanAmount > availableEquity * 0.85) {
      throw new Error('Loan amount exceeds 85% of available equity');
    }

    const monthlyRate = interestRate / 100 / 12;
    let monthlyPayment = 0;
    let numPayments = loanTerm * 12;
    let totalPayments = 0;
    let totalInterest = 0;

    if (loanType === 'fixed') {
      // Fixed Home Equity Loan
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                      (Math.pow(1 + monthlyRate, numPayments) - 1);
      totalPayments = monthlyPayment * numPayments + closingCosts;
      totalInterest = totalPayments - loanAmount - closingCosts;
    } else {
      // HELOC (Home Equity Line of Credit)
      const drawMonths = drawPeriod * 12;
      const repayMonths = repaymentPeriod * 12;
      
      if (paymentType === 'interest_only') {
        // Interest-only during draw period
        const drawPayment = loanAmount * monthlyRate;
        const drawTotal = drawPayment * drawMonths;
        
        // Principal + Interest during repayment period
        const repayPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, repayMonths)) / 
                            (Math.pow(1 + monthlyRate, repayMonths) - 1);
        const repayTotal = repayPayment * repayMonths;
        
        monthlyPayment = drawPayment; // Show draw period payment
        totalPayments = drawTotal + repayTotal + closingCosts;
        totalInterest = totalPayments - loanAmount - closingCosts;
      } else {
        // Principal + Interest during repayment period only
        numPayments = repaymentPeriod * 12;
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                        (Math.pow(1 + monthlyRate, numPayments) - 1);
        totalPayments = monthlyPayment * numPayments + closingCosts;
        totalInterest = totalPayments - loanAmount - closingCosts;
      }
    }

    // Tax deductible interest (simplified - assumes loan used for home improvements)
    const taxDeductibleInterest = totalInterest; // Most home equity loan interest is deductible

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + numPayments);

    const round = (num: number) => Math.round(num * 100) / 100;

    return {
      monthlyPayment: round(monthlyPayment),
      totalPayments: round(totalPayments),
      totalInterest: round(totalInterest),
      payoffDate,
      loanToValue: round(loanToValue),
      combinedLoanToValue: round(combinedLoanToValue),
      availableEquity: round(availableEquity),
      taxDeductibleInterest: round(taxDeductibleInterest)
    };
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (inputs: HomeEquityLoanInputs): any[] => {
    const { loanAmount, interestRate, loanTerm, loanType, paymentType, drawPeriod, repaymentPeriod } = inputs;
    const monthlyRate = interestRate / 100 / 12;
    
    const calculationResults = calculateHomeEquityLoan(inputs);
    let monthlyPayment = calculationResults.monthlyPayment;

    const schedule: any[] = [];
    let remainingBalance = loanAmount;
    let totalInterest = 0;

    let numPayments = loanTerm * 12;
    if (loanType === 'heloc') {
      numPayments = (drawPeriod + repaymentPeriod) * 12;
    }

    for (let month = 1; month <= numPayments; month++) {
      let interestPayment = remainingBalance * monthlyRate;
      let principalPayment = 0;

      if (loanType === 'heloc' && paymentType === 'interest_only') {
        if (month <= drawPeriod * 12) {
          // Interest-only during draw period
          principalPayment = 0;
        } else {
          // Principal + Interest during repayment period
          const remainingRepayMonths = numPayments - (drawPeriod * 12) - (month - drawPeriod * 12 - 1);
          monthlyPayment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, remainingRepayMonths)) / 
                          (Math.pow(1 + monthlyRate, remainingRepayMonths) - 1);
          principalPayment = monthlyPayment - interestPayment;
        }
      } else {
        principalPayment = monthlyPayment - interestPayment;
      }

      principalPayment = Math.min(principalPayment, remainingBalance);
      remainingBalance -= principalPayment;
      totalInterest += interestPayment;
      
      if (remainingBalance < 0) remainingBalance = 0;

      const currentEquity = inputs.homeValue - inputs.mortgageBalance - remainingBalance;

      schedule.push({
        month,
        year: Math.ceil(month / 12),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        totalInterest,
        remainingBalance,
        equity: currentEquity,
        date: new Date(Date.now() + (month - 1) * 30.44 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
      
      if (remainingBalance <= 0.01) break;
    }

    return schedule;
  };

  // Generate annual schedule
  const generateAnnualSchedule = (monthlySchedule: any[]): any[] => {
    const annualData: any[] = [];
    const years = Math.ceil(monthlySchedule.length / 12);
    
    for (let year = 1; year <= years; year++) {
      const yearStart = (year - 1) * 12;
      const yearEnd = Math.min(year * 12, monthlySchedule.length);
      const yearPayments = monthlySchedule.slice(yearStart, yearEnd);
      
      if (yearPayments.length === 0) continue;
      
      const totalPayment = yearPayments.reduce((sum, payment) => sum + payment.payment, 0);
      const totalPrincipal = yearPayments.reduce((sum, payment) => sum + payment.principal, 0);
      const totalInterest = yearPayments.reduce((sum, payment) => sum + payment.interest, 0);
      const endingBalance = yearPayments[yearPayments.length - 1].remainingBalance;
      const endingEquity = yearPayments[yearPayments.length - 1].equity;
      
      annualData.push({
        year,
        payment: totalPayment,
        principal: totalPrincipal,
        interest: totalInterest,
        remainingBalance: endingBalance,
        equity: endingEquity,
        paymentsInYear: yearPayments.length
      });
    }
    
    return annualData;
  };

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value: number | undefined): string => {
    return `${(value || 0).toFixed(2)}%`;
  };

  // Handle input changes
  const handleInputChange = (id: keyof HomeEquityLoanInputs, value: string | boolean) => {
    const numValue = typeof value === 'boolean' ? value : (typeof value === 'string' && isNaN(Number(value)) ? value : parseFloat(value as string) || 0);
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculateHomeEquityLoan(newInputs);
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
          equity: Math.round(payment.equity)
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
    handleInputChange('homeValue', inputs.homeValue.toString());
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Principal', value: inputs.loanAmount, color: '#3B82F6' },
    { name: 'Interest', value: results.totalInterest, color: '#EF4444' },
    { name: 'Closing Costs', value: inputs.closingCosts, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Home className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Home Equity Loan Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate payments for home equity loans and HELOCs. Compare fixed-rate home equity loans 
          with flexible credit lines. Get detailed amortization schedules and equity analysis.
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
              <CardDescription>Enter your home and loan information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="homeValue">Home Value ($)</Label>
                  <Input
                    id="homeValue"
                    type="number"
                    value={inputs.homeValue}
                    onChange={(e) => handleInputChange('homeValue', e.target.value)}
                    placeholder="400000"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="mortgageBalance">Current Mortgage Balance ($)</Label>
                  <Input
                    id="mortgageBalance"
                    type="number"
                    value={inputs.mortgageBalance}
                    onChange={(e) => handleInputChange('mortgageBalance', e.target.value)}
                    placeholder="200000"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="loanAmount">Loan Amount ($)</Label>
                  <Input
                    id="loanAmount"
                    type="number"
                    value={inputs.loanAmount}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    placeholder="50000"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={inputs.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    placeholder="7.5"
                    className="text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="loanType">Loan Type</Label>
                  <Select value={inputs.loanType} onValueChange={(value) => handleInputChange('loanType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Home Equity Loan</SelectItem>
                      <SelectItem value="heloc">HELOC (Line of Credit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {inputs.loanType === 'fixed' && (
                  <div>
                    <Label htmlFor="loanTerm">Loan Term (years)</Label>
                    <Input
                      id="loanTerm"
                      type="number"
                      value={inputs.loanTerm}
                      onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                      placeholder="15"
                      className="text-lg"
                    />
                  </div>
                )}

                {inputs.loanType === 'heloc' && (
                  <>
                    <div>
                      <Label htmlFor="paymentType">Payment Type</Label>
                      <Select value={inputs.paymentType} onValueChange={(value) => handleInputChange('paymentType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interest_only">Interest-Only (Draw Period)</SelectItem>
                          <SelectItem value="principal_interest">Principal + Interest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="drawPeriod">Draw Period (years)</Label>
                      <Input
                        id="drawPeriod"
                        type="number"
                        value={inputs.drawPeriod}
                        onChange={(e) => handleInputChange('drawPeriod', e.target.value)}
                        placeholder="10"
                        className="text-lg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="repaymentPeriod">Repayment Period (years)</Label>
                      <Input
                        id="repaymentPeriod"
                        type="number"
                        value={inputs.repaymentPeriod}
                        onChange={(e) => handleInputChange('repaymentPeriod', e.target.value)}
                        placeholder="20"
                        className="text-lg"
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  variant="outline"
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                </Button>

                {showAdvancedOptions && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="closingCosts">Closing Costs ($)</Label>
                      <Input
                        id="closingCosts"
                        type="number"
                        value={inputs.closingCosts}
                        onChange={(e) => handleInputChange('closingCosts', e.target.value)}
                        placeholder="3000"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.monthlyPayment)}</p>
                    {inputs.loanType === 'heloc' && inputs.paymentType === 'interest_only' && (
                      <p className="text-xs text-gray-500">Draw period payment</p>
                    )}
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
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalPayments)}</p>
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

          {/* Equity Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Available Equity</h3>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(results.availableEquity)}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Home Value:</span>
                      <span>{formatCurrency(inputs.homeValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mortgage Balance:</span>
                      <span>{formatCurrency(inputs.mortgageBalance)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Loan-to-Value Ratios</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Loan LTV:</span>
                      <Badge variant={results.loanToValue > 80 ? "destructive" : "secondary"}>
                        {formatPercentage(results.loanToValue)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Combined LTV:</span>
                      <Badge variant={results.combinedLoanToValue > 85 ? "destructive" : "secondary"}>
                        {formatPercentage(results.combinedLoanToValue)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Benefits */}
          {results.taxDeductibleInterest > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Potential Tax Benefits</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(results.taxDeductibleInterest)}</p>
                    <p className="text-sm text-green-700">
                      Potentially tax-deductible interest (consult your tax advisor)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {results.error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Info className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Calculation Error</h3>
                    <p className="text-red-700">{results.error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Section */}
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto overflow-x-auto">
              <TabsTrigger value="balance" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Balance & Equity</span>
                <span className="sm:hidden">Balance</span>
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Cost Breakdown</span>
                <span className="sm:hidden">Breakdown</span>
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Payment Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Loan Balance vs Home Equity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          labelFormatter={(month) => `Month ${month}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#EF4444" 
                          strokeWidth={3}
                          name="Loan Balance"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="equity" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          name="Home Equity"
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
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="h-64 sm:h-80">
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
                            ></div>
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

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Monthly Payment Components</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(0, 12)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          labelFormatter={(month) => `Month ${month}`}
                        />
                        <Legend />
                        <Bar dataKey="principal" stackId="a" fill="#3B82F6" name="Principal" />
                        <Bar dataKey="interest" stackId="a" fill="#EF4444" name="Interest" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Amortization Schedule */}
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
                  {generateAnnualSchedule(amortizationSchedule).map((year, index) => (
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
                      {generateAnnualSchedule(amortizationSchedule).map((year, index) => (
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

      {/* Comprehensive Educational Content */}
      <div className="space-y-8">
        {/* What is a Home Equity Loan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-blue-600" />
              <span>What is a Home Equity Loan?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-gray-700 leading-relaxed">
                A home equity loan allows homeowners to borrow against the equity they've built in their property. 
                Home equity is the difference between your home's current market value and the outstanding balance 
                on your mortgage. These loans provide access to substantial funds at relatively low interest rates 
                because your home serves as collateral for the loan.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How Home Equity Works</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                As you make mortgage payments and your home appreciates in value, you build equity. For example, 
                if your home is worth $400,000 and you owe $200,000 on your mortgage, you have $200,000 in equity. 
                Most lenders allow you to borrow up to 80-85% of your home's value, minus existing mortgage debt.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Equity Calculation Example:</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Home Value: $400,000</li>
                  <li>• Mortgage Balance: $200,000</li>
                  <li>• Available Equity: $200,000</li>
                  <li>• Maximum Borrowable (85%): $340,000 - $200,000 = $140,000</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Uses for Home Equity Loans</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Smart Financial Uses:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Home improvements and renovations</li>
                    <li>• Debt consolidation at lower rates</li>
                    <li>• Education expenses</li>
                    <li>• Investment property down payments</li>
                    <li>• Starting a business</li>
                    <li>• Emergency home repairs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Uses to Avoid:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Luxury vacations or lifestyle expenses</li>
                    <li>• Speculative investments</li>
                    <li>• Paying for consumables</li>
                    <li>• Vehicles that depreciate quickly</li>
                    <li>• Credit card debt without financial discipline</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Home Equity Loan vs HELOC */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Fixed Home Equity Loan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                A traditional home equity loan provides a lump sum of money upfront with a fixed interest rate 
                and predictable monthly payments over a set term, typically 5-30 years.
              </p>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Advantages:</h4>
                <ul className="text-green-800 text-sm space-y-1">
                  <li>• Fixed interest rate provides payment certainty</li>
                  <li>• Predictable monthly payments for budgeting</li>
                  <li>• Interest rates typically lower than credit cards</li>
                  <li>• No temptation to re-borrow once paid down</li>
                  <li>• Simple repayment structure</li>
                  <li>• Forced discipline through fixed payments</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Disadvantages:</h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• No flexibility to access additional funds</li>
                  <li>• Interest charged on full amount immediately</li>
                  <li>• Less flexible than a credit line</li>
                  <li>• Closing costs and origination fees</li>
                  <li>• Risk of foreclosure if unable to pay</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">
                  <strong>Best for:</strong> One-time expenses like major home renovations, 
                  debt consolidation, or education costs where you know the exact amount needed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span>HELOC (Home Equity Line of Credit)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                A HELOC functions like a credit card secured by your home, providing access to funds 
                as needed during a draw period, followed by a repayment period.
              </p>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Advantages:</h4>
                <ul className="text-purple-800 text-sm space-y-1">
                  <li>• Flexibility to borrow only what you need</li>
                  <li>• Interest-only payments during draw period</li>
                  <li>• Access to funds for multiple projects</li>
                  <li>• Can re-borrow as you pay down balance</li>
                  <li>• Lower initial payments</li>
                  <li>• Revolving credit availability</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Disadvantages:</h4>
                <ul className="text-red-800 text-sm space-y-1">
                  <li>• Variable interest rates can increase</li>
                  <li>• Payment shock when repayment period begins</li>
                  <li>• Temptation to overspend</li>
                  <li>• More complex payment structure</li>
                  <li>• Interest rates may be higher than fixed loans</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">
                  <strong>Best for:</strong> Ongoing projects, emergency funds, or situations where 
                  you need flexible access to capital over time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Qualification Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-orange-600" />
              <span>Qualification Requirements & Application Process</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Credit and Income Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Excellent Credit (740+)</h4>
                  <ul className="text-green-800 text-xs space-y-1">
                    <li>• Best interest rates available</li>
                    <li>• Up to 90% combined LTV possible</li>
                    <li>• Minimal documentation required</li>
                    <li>• Fastest approval process</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Good Credit (680-739)</h4>
                  <ul className="text-yellow-800 text-xs space-y-1">
                    <li>• Competitive rates with slight premium</li>
                    <li>• Up to 85% combined LTV typical</li>
                    <li>• Standard documentation needed</li>
                    <li>• Normal approval timeline</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Fair Credit (620-679)</h4>
                  <ul className="text-red-800 text-xs space-y-1">
                    <li>• Higher interest rates</li>
                    <li>• Maximum 80% combined LTV</li>
                    <li>• Extensive documentation required</li>
                    <li>• Longer approval process</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Financial Documents:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Recent pay stubs (last 30 days)</li>
                    <li>• Tax returns (last 2 years)</li>
                    <li>• Bank statements (last 2-3 months)</li>
                    <li>• Investment account statements</li>
                    <li>• Debt payment verification</li>
                    <li>• Employment verification letter</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Property Documents:</h4>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Property deed or title</li>
                    <li>• Current mortgage statements</li>
                    <li>• Property tax records</li>
                    <li>• Homeowners insurance policy</li>
                    <li>• Recent home appraisal (if available)</li>
                    <li>• HOA documentation (if applicable)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Debt-to-Income Ratio Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Most lenders require a debt-to-income (DTI) ratio of 43% or lower, including the new 
                home equity loan payment. Some lenders may accept higher DTI ratios for borrowers 
                with excellent credit or significant assets.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">DTI Calculation Example:</h4>
                <div className="text-blue-800 text-sm space-y-1">
                  <p>Monthly Income: $8,000</p>
                  <p>Current Debt Payments: $2,400</p>
                  <p>New Home Equity Payment: $500</p>
                  <p>Total Monthly Debt: $2,900</p>
                  <p><strong>DTI Ratio: $2,900 ÷ $8,000 = 36.25% ✓</strong></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Implications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-indigo-600" />
              <span>Tax Implications & Interest Deductibility</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Tax Rules (2025)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Tax Cuts and Jobs Act of 2017 significantly changed home equity loan interest deductibility. 
                Interest is now only deductible if the loan proceeds are used to "buy, build, or substantially 
                improve" the home that secures the loan.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Deductible Uses:</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Kitchen or bathroom renovations</li>
                    <li>• Adding rooms or square footage</li>
                    <li>• New roof, HVAC, or major systems</li>
                    <li>• Accessibility improvements</li>
                    <li>• Energy efficiency upgrades</li>
                    <li>• Structural repairs and improvements</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Non-Deductible Uses:</h4>
                  <ul className="text-red-800 text-sm space-y-1">
                    <li>• Debt consolidation</li>
                    <li>• Investment purchases</li>
                    <li>• Education expenses</li>
                    <li>• Personal expenses</li>
                    <li>• Vehicle purchases</li>
                    <li>• Business investments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Deduction Limits and Requirements</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                The total mortgage debt (including your primary mortgage and home equity loans) must not 
                exceed $750,000 for married filing jointly or $375,000 for single filers. Interest on 
                amounts above these limits is not deductible.
              </p>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Record Keeping Requirements:</h4>
                <ul className="text-indigo-800 text-sm space-y-1">
                  <li>• Keep detailed records of how loan proceeds were used</li>
                  <li>• Save receipts for all home improvement expenses</li>
                  <li>• Maintain contractor invoices and permits</li>
                  <li>• Document the timeline of improvements</li>
                  <li>• Consult a tax professional for complex situations</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">State Tax Considerations</h3>
              <p className="text-gray-700 leading-relaxed">
                State tax laws vary significantly regarding home equity loan interest deductibility. 
                Some states follow federal rules, while others have their own regulations. High-tax 
                states may offer additional benefits, while states with no income tax provide no 
                deduction benefit. Always consult with a local tax professional.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Market Trends and Interest Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <span>Market Trends & Interest Rate Analysis (2025)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Interest Rate Environment</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Home equity loan rates in 2025 typically range from 6.5% to 11%, depending on credit score, 
                loan-to-value ratio, and lender. HELOC rates are generally 0.5-1% higher due to their 
                variable nature and increased flexibility.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <h4 className="font-medium text-blue-900">Fixed Home Equity Loans</h4>
                  <p className="text-2xl font-bold text-blue-600">6.5% - 9.5%</p>
                  <p className="text-blue-700 text-sm">Typical range for qualified borrowers</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <h4 className="font-medium text-purple-900">HELOC Variable Rates</h4>
                  <p className="text-2xl font-bold text-purple-600">7.0% - 11.0%</p>
                  <p className="text-purple-700 text-sm">Initial rates, subject to change</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <h4 className="font-medium text-green-900">Prime Rate</h4>
                  <p className="text-2xl font-bold text-green-600">8.50%</p>
                  <p className="text-green-700 text-sm">Base rate for HELOC pricing</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Factors Affecting Your Rate</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Credit Score Impact</h4>
                  <p className="text-sm text-gray-600">
                    A 100-point difference in credit score can affect your rate by 1-2 percentage points. 
                    Borrowers with scores above 740 receive the best available rates.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">Loan-to-Value Ratio</h4>
                  <p className="text-sm text-gray-600">
                    Lower LTV ratios (under 80%) typically qualify for better rates. Higher LTV loans 
                    (80-90%) may face rate premiums of 0.25-0.75%.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-gray-900">Loan Amount</h4>
                  <p className="text-sm text-gray-600">
                    Larger loan amounts often receive better pricing due to economies of scale. 
                    Very small loans (under $25,000) may face higher rates or minimum fees.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Regional Market Variations</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Home equity lending varies significantly by geographic region, influenced by local 
                economic conditions, property values, and regulatory environments.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">High-Cost Areas (CA, NY, MA):</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Higher property values enable larger loans</li>
                    <li>• More competitive lending environment</li>
                    <li>• Stricter underwriting due to volatility</li>
                    <li>• Additional state regulations may apply</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Moderate-Cost Areas:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Stable property values and lending</li>
                    <li>• Standard underwriting guidelines</li>
                    <li>• Competitive rates from multiple lenders</li>
                    <li>• Fewer regulatory complications</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Strategies and Risk Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>Smart Borrowing Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Maximize Your Home's Value</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Focus home equity loans on improvements that add value: kitchens, bathrooms, 
                  energy efficiency upgrades, and additional living space typically provide 
                  the best return on investment.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Strategic Debt Consolidation</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Using home equity to consolidate high-interest debt can save thousands annually. 
                  However, you're converting unsecured debt to secured debt, increasing foreclosure risk. 
                  Ensure you have discipline to avoid re-accumulating credit card debt.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Investment Property Strategy</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Some investors use home equity to fund rental property down payments. While potentially 
                  profitable, this strategy increases overall leverage and risk. Ensure positive cash 
                  flow and maintain emergency reserves.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Emergency Fund Considerations</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  A HELOC can serve as an emergency fund, providing access to capital when needed. 
                  However, during economic downturns, lenders may freeze credit lines, so maintain 
                  traditional emergency savings as well.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Rate Shopping Tips</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Compare offers from banks, credit unions, and online lenders. Consider total costs 
                  including origination fees, appraisal costs, and ongoing fees. Credit unions often 
                  offer competitive rates for members.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-red-600" />
                <span>Risks & Mitigation Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Foreclosure Risk</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Your home secures the loan, so failure to pay can result in foreclosure. Never 
                  borrow more than you can comfortably repay, and maintain emergency funds to cover 
                  payments during income disruptions.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Interest Rate Risk (HELOCs)</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Variable rates can increase significantly during your loan term. Consider rate caps, 
                  conversion options to fixed rates, and stress-test your budget against potential 
                  rate increases of 3-5 percentage points.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Property Value Decline</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  If property values fall, you could owe more than your home's worth. Maintain reasonable 
                  LTV ratios and avoid borrowing the maximum available. Consider market timing and 
                  local economic factors.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Overspending Temptation</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Easy access to large amounts can lead to overspending. Create a specific plan for 
                  loan proceeds and stick to it. Avoid using home equity for lifestyle inflation 
                  or non-appreciating assets.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Economic Downturns</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  During recessions, lenders may reduce credit lines or demand immediate repayment. 
                  Maintain conservative borrowing levels and diversified income sources. Avoid 
                  borrowing if your industry is cyclical or unstable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alternatives to Home Equity Loans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-purple-600" />
              <span>Alternative Financing Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Consider Alternatives</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Home equity loans aren't always the best choice. Consider alternatives if you have 
                limited equity, unstable income, or need funds for purposes that don't justify 
                risking your home as collateral.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Personal Loans</h4>
                <div className="text-blue-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> No collateral risk, faster approval, fixed terms</p>
                  <p><strong>Cons:</strong> Higher rates, lower amounts, shorter terms</p>
                  <p><strong>Best for:</strong> Smaller amounts ($5,000-$50,000), debt consolidation</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Cash-Out Refinance</h4>
                <div className="text-green-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> Single payment, potentially lower rate, larger amounts</p>
                  <p><strong>Cons:</strong> Resets mortgage term, closing costs, rate risk</p>
                  <p><strong>Best for:</strong> Large amounts, when refinancing makes sense anyway</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">401(k) Loans</h4>
                <div className="text-purple-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> No credit check, pay interest to yourself, quick access</p>
                  <p><strong>Cons:</strong> Lost investment growth, job loss risk, limited amounts</p>
                  <p><strong>Best for:</strong> Short-term needs, stable employment</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Investment Liquidation</h4>
                <div className="text-orange-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> No debt, no interest, immediate access</p>
                  <p><strong>Cons:</strong> Tax implications, lost growth potential, market timing</p>
                  <p><strong>Best for:</strong> Large investment portfolios, tax-advantaged accounts</p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Credit Cards</h4>
                <div className="text-red-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> No collateral, rewards, introductory rates</p>
                  <p><strong>Cons:</strong> High ongoing rates, variable terms, debt trap risk</p>
                  <p><strong>Best for:</strong> Short-term financing, emergency expenses</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">Business Loans</h4>
                <div className="text-yellow-800 text-sm space-y-2">
                  <p><strong>Pros:</strong> Business tax benefits, builds business credit</p>
                  <p><strong>Cons:</strong> Personal guarantees, business asset risk</p>
                  <p><strong>Best for:</strong> Business purposes, established businesses</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context and Future Outlook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <span>Historical Context & Future Outlook</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Evolution of Home Equity Lending</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Home equity lending gained popularity in the 1980s with tax deductibility and rising 
                property values. The 2008 financial crisis highlighted risks of excessive leverage, 
                leading to stricter underwriting standards that remain in place today.
              </p>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Key Historical Milestones:</h4>
                <ul className="text-indigo-800 text-sm space-y-1">
                  <li>• 1986: Tax Reform Act made home equity interest deductible</li>
                  <li>• 1990s-2000s: Explosive growth in HELOC popularity</li>
                  <li>• 2008: Financial crisis led to widespread defaults</li>
                  <li>• 2010s: Stricter regulations and conservative underwriting</li>
                  <li>• 2017: Tax law changes limited deductibility</li>
                  <li>• 2020s: Renewed growth with rising property values</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Market Conditions</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                The 2020-2025 period has seen significant home price appreciation, creating substantial 
                equity for homeowners. However, higher interest rates have moderated borrowing activity 
                compared to the ultra-low rate environment of 2020-2022.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Positive Factors:</h4>
                  <ul className="text-green-800 text-sm space-y-1">
                    <li>• Strong home price appreciation</li>
                    <li>• Increased borrower equity positions</li>
                    <li>• Conservative lending standards</li>
                    <li>• Low unemployment supporting payments</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Challenges:</h4>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Higher interest rate environment</li>
                    <li>• Economic uncertainty</li>
                    <li>• Inflation pressures on household budgets</li>
                    <li>• Regional market variations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Future Outlook</h3>
              <p className="text-gray-700 leading-relaxed">
                Experts predict continued evolution in home equity products, with potential innovations 
                in digital lending, alternative credit scoring, and hybrid products combining features 
                of traditional loans and lines of credit. Regulatory environment will likely remain 
                focused on consumer protection and responsible lending practices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeEquityLoanCalculatorComponent;