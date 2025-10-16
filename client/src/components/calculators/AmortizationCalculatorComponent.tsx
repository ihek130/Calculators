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
  Home,
  Car,
  CreditCard
} from 'lucide-react';

interface AmortizationInputs {
  loanAmount: number;
  loanTermYears: number;
  loanTermMonths: number;
  interestRate: number;
  startDate: string;
  extraPayment: number;
}

interface AmortizationResults {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  principalPercentage: number;
  interestPercentage: number;
  payoffDate: string;
  error?: string;
}

interface PaymentSchedule {
  paymentNumber: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  totalPayment: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

interface AnnualSummary {
  year: number;
  interest: number;
  principal: number;
  endingBalance: number;
  paymentsThisYear: number;
}

interface ChartDataPoint {
  period: number;
  balance: number;
  interest: number;
  payment: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

const AmortizationCalculatorComponent = () => {
  const [inputs, setInputs] = useState<AmortizationInputs>({
    loanAmount: 200000,
    loanTermYears: 15,
    loanTermMonths: 0,
    interestRate: 6,
    startDate: new Date().toISOString().split('T')[0],
    extraPayment: 0
  });

  const [results, setResults] = useState<AmortizationResults>({
    monthlyPayment: 0,
    totalPayments: 0,
    totalInterest: 0,
    principalPercentage: 0,
    interestPercentage: 0,
    payoffDate: ''
  });

  const [schedule, setSchedule] = useState<PaymentSchedule[]>([]);
  const [annualSummary, setAnnualSummary] = useState<AnnualSummary[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showExtraPayments, setShowExtraPayments] = useState(false);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  // Calculate amortization
  const calculateAmortization = (inputs: AmortizationInputs): AmortizationResults => {
    const {
      loanAmount,
      loanTermYears,
      loanTermMonths,
      interestRate,
      startDate,
      extraPayment
    } = inputs;

    if (loanAmount <= 0 || interestRate < 0 || (loanTermYears === 0 && loanTermMonths === 0)) {
      throw new Error('Please enter valid loan amount, interest rate, and loan term');
    }

    const totalMonths = (loanTermYears * 12) + loanTermMonths;
    const monthlyRate = interestRate / 100 / 12;
    
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPayment = loanAmount / totalMonths;
    }

    // Generate payment schedule
    const paymentSchedule: PaymentSchedule[] = [];
    let remainingBalance = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let paymentNumber = 1;
    const startDateObj = new Date(startDate);

    while (remainingBalance > 0.01 && paymentNumber <= totalMonths * 2) { // Safety limit
      const currentDate = new Date(startDateObj);
      currentDate.setMonth(startDateObj.getMonth() + paymentNumber - 1);

      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      let actualExtraPayment = extraPayment;

      // Ensure we don't overpay
      if (principalPayment + actualExtraPayment > remainingBalance) {
        principalPayment = remainingBalance;
        actualExtraPayment = 0;
      }

      const totalPayment = interestPayment + principalPayment + actualExtraPayment;
      remainingBalance -= (principalPayment + actualExtraPayment);
      cumulativeInterest += interestPayment;
      cumulativePrincipal += principalPayment + actualExtraPayment;

      paymentSchedule.push({
        paymentNumber,
        date: currentDate.toLocaleDateString(),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        extraPayment: actualExtraPayment,
        totalPayment,
        balance: Math.max(0, remainingBalance),
        cumulativeInterest,
        cumulativePrincipal
      });

      paymentNumber++;
      
      if (remainingBalance <= 0.01) break;
    }

    const totalPayments = paymentSchedule.reduce((sum, payment) => sum + payment.totalPayment, 0);
    const totalInterest = cumulativeInterest;
    const principalPercentage = (loanAmount / totalPayments) * 100;
    const interestPercentage = (totalInterest / totalPayments) * 100;
    
    const lastPayment = paymentSchedule[paymentSchedule.length - 1];
    const payoffDate = lastPayment ? lastPayment.date : '';

    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalPayments: Math.round(totalPayments * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      principalPercentage: Math.round(principalPercentage * 100) / 100,
      interestPercentage: Math.round(interestPercentage * 100) / 100,
      payoffDate
    };
  };

  // Generate annual summary
  const generateAnnualSummary = (schedule: PaymentSchedule[]): AnnualSummary[] => {
    const annualData: { [year: number]: AnnualSummary } = {};
    
    schedule.forEach(payment => {
      const year = new Date(payment.date).getFullYear();
      
      if (!annualData[year]) {
        annualData[year] = {
          year,
          interest: 0,
          principal: 0,
          endingBalance: 0,
          paymentsThisYear: 0
        };
      }
      
      annualData[year].interest += payment.interest;
      annualData[year].principal += payment.principal + payment.extraPayment;
      annualData[year].endingBalance = payment.balance;
      annualData[year].paymentsThisYear++;
    });

    return Object.values(annualData).sort((a, b) => a.year - b.year);
  };

  // Generate chart data
  const generateChartData = (schedule: PaymentSchedule[]): ChartDataPoint[] => {
    return schedule.map((payment, index) => ({
      period: index + 1,
      balance: payment.balance,
      interest: payment.interest,
      payment: payment.totalPayment,
      cumulativeInterest: payment.cumulativeInterest,
      cumulativePrincipal: payment.cumulativePrincipal
    }));
  };

  // Handle input changes
  const handleInputChange = (id: keyof AmortizationInputs, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const newInputs = { ...inputs, [id]: numValue };
    setInputs(newInputs);
    
    setTimeout(() => {
      try {
        const calculationResults = calculateAmortization(newInputs);
        setResults(calculationResults);
        
        // Generate payment schedule
        const paymentSchedule = generatePaymentSchedule(newInputs);
        setSchedule(paymentSchedule);
        
        // Generate annual summary
        const annualData = generateAnnualSummary(paymentSchedule);
        setAnnualSummary(annualData);
        
        // Generate chart data
        const chartDataResults = generateChartData(paymentSchedule);
        setChartData(chartDataResults);
      } catch (error: any) {
        console.error('Calculation error:', error);
        setResults({ 
          ...results,
          error: error.message || 'Please check your inputs and try again.' 
        });
      }
    }, 100);
  };

  // Generate complete payment schedule
  const generatePaymentSchedule = (inputs: AmortizationInputs): PaymentSchedule[] => {
    const {
      loanAmount,
      loanTermYears,
      loanTermMonths,
      interestRate,
      startDate,
      extraPayment
    } = inputs;

    const totalMonths = (loanTermYears * 12) + loanTermMonths;
    const monthlyRate = interestRate / 100 / 12;
    
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    } else {
      monthlyPayment = loanAmount / totalMonths;
    }

    const paymentSchedule: PaymentSchedule[] = [];
    let remainingBalance = loanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;
    let paymentNumber = 1;
    const startDateObj = new Date(startDate);

    while (remainingBalance > 0.01 && paymentNumber <= totalMonths * 2) {
      const currentDate = new Date(startDateObj);
      currentDate.setMonth(startDateObj.getMonth() + paymentNumber - 1);

      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      let actualExtraPayment = extraPayment;

      if (principalPayment + actualExtraPayment > remainingBalance) {
        principalPayment = remainingBalance;
        actualExtraPayment = 0;
      }

      const totalPayment = interestPayment + principalPayment + actualExtraPayment;
      remainingBalance -= (principalPayment + actualExtraPayment);
      cumulativeInterest += interestPayment;
      cumulativePrincipal += principalPayment + actualExtraPayment;

      paymentSchedule.push({
        paymentNumber,
        date: currentDate.toLocaleDateString(),
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        extraPayment: actualExtraPayment,
        totalPayment,
        balance: Math.max(0, remainingBalance),
        cumulativeInterest,
        cumulativePrincipal
      });

      paymentNumber++;
      
      if (remainingBalance <= 0.01) break;
    }

    return paymentSchedule;
  };

  // Initialize calculations
  useEffect(() => {
    handleInputChange('loanAmount', inputs.loanAmount);
  }, []);

  // Pie chart data
  const pieData: PieDataPoint[] = [
    { name: 'Principal', value: results.principalPercentage, color: '#3B82F6' },
    { name: 'Interest', value: results.interestPercentage, color: '#EF4444' }
  ].filter(item => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Amortization Calculator</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Calculate loan payments, view amortization schedules, and understand how your loan 
          balance decreases over time with detailed payment breakdowns.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
          <Home className="h-6 w-6 text-blue-600" />
          <div className="text-center">
            <div className="font-semibold">Mortgage</div>
            <div className="text-sm text-gray-600">Calculator</div>
          </div>
        </Button>
        
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
          <Car className="h-6 w-6 text-green-600" />
          <div className="text-center">
            <div className="font-semibold">Auto Loan</div>
            <div className="text-sm text-gray-600">Calculator</div>
          </div>
        </Button>
        
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
          <CreditCard className="h-6 w-6 text-purple-600" />
          <div className="text-center">
            <div className="font-semibold">Personal Loan</div>
            <div className="text-sm text-gray-600">Calculator</div>
          </div>
        </Button>
        
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
          <TrendingUp className="h-6 w-6 text-orange-600" />
          <div className="text-center">
            <div className="font-semibold">Investment</div>
            <div className="text-sm text-gray-600">Calculator</div>
          </div>
        </Button>
      </div>

      {/* Main Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Loan Information
              </CardTitle>
              <CardDescription>Enter your loan details to calculate amortization</CardDescription>
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
                <Label>Loan Term</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="loanTermYears" className="text-sm">Years</Label>
                    <Input
                      id="loanTermYears"
                      type="number"
                      value={inputs.loanTermYears}
                      onChange={(e) => handleInputChange('loanTermYears', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="loanTermMonths" className="text-sm">Months</Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      min="0"
                      max="11"
                      value={inputs.loanTermMonths}
                      onChange={(e) => handleInputChange('loanTermMonths', e.target.value)}
                    />
                  </div>
                </div>
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
                <Label htmlFor="startDate">Loan Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={inputs.startDate}
                  onChange={(e) => setInputs({...inputs, startDate: e.target.value})}
                />
              </div>

              {/* Extra Payments */}
              <Button
                variant="outline"
                onClick={() => setShowExtraPayments(!showExtraPayments)}
                className="w-full flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>{showExtraPayments ? 'Hide' : 'Show'} Extra Payments</span>
              </Button>

              {showExtraPayments && (
                <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                  <Label htmlFor="extraPayment">Extra Monthly Payment ($)</Label>
                  <Input
                    id="extraPayment"
                    type="number"
                    value={inputs.extraPayment}
                    onChange={(e) => handleInputChange('extraPayment', e.target.value)}
                  />
                  <p className="text-sm text-gray-600">
                    Additional payment applied to principal each month
                  </p>
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
                        <p className="text-sm font-medium text-gray-600">Monthly Payment</p>
                        <p className="text-3xl font-bold text-blue-600">{formatCurrency(results.monthlyPayment)}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Payments</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalPayments)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
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
              </div>

              {/* Principal vs Interest Breakdown */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Payment Breakdown</CardTitle>
                  <CardDescription>Distribution of principal and interest over the life of the loan</CardDescription>
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
                              const shortName = name === "Principal" ? "P" : "I";
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
                            formatter={(value) => `${Number(value).toFixed(1)}%`}
                            contentStyle={{fontSize: '12px'}}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                          <span className="font-medium">Principal</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{formatCurrency(inputs.loanAmount)}</div>
                          <div className="text-sm text-blue-600">{formatPercentage(results.principalPercentage)}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full bg-red-600"></div>
                          <span className="font-medium">Interest</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">{formatCurrency(results.totalInterest)}</div>
                          <div className="text-sm text-red-600">{formatPercentage(results.interestPercentage)}</div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Payoff Date:</span>
                          <span className="font-bold">{results.payoffDate}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">Number of Payments:</span>
                          <span className="font-bold">{schedule.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Charts and Visualizations */}
      <Tabs defaultValue="balance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance" className="flex items-center space-x-1 md:space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Balance Chart</span>
            <span className="sm:hidden">Balance</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-1 md:space-x-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Payment Analysis</span>
            <span className="sm:hidden">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="cumulative" className="flex items-center space-x-1 md:space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Cumulative View</span>
            <span className="sm:hidden">Total</span>
          </TabsTrigger>
        </TabsList>

        {/* Balance Chart */}
        <TabsContent value="balance">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Loan Balance Over Time</CardTitle>
              <CardDescription className="text-sm">Track how your loan balance decreases with each payment</CardDescription>
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
                      formatter={(value, name) => [formatCurrency(Number(value)), "Balance"]}
                      labelFormatter={(label) => `Payment #${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="balance" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} name="Balance" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Analysis */}
        <TabsContent value="payments">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Monthly Payment Breakdown</CardTitle>
              <CardDescription className="text-sm">Principal vs. interest breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.slice(0, Math.min(60, chartData.length))}>
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
                      formatter={(value, name) => [formatCurrency(Number(value)), name === "interest" ? "Interest" : "Principal"]}
                      labelFormatter={(label) => `Payment #${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Area type="monotone" dataKey="interest" stackId="1" stroke="#EF4444" fill="#EF4444" name="Interest" />
                    <Area type="monotone" dataKey="payment" stackId="1" stroke="#10B981" fill="#10B981" name="Principal" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cumulative View */}
        <TabsContent value="cumulative">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Total Interest & Principal</CardTitle>
              <CardDescription className="text-sm">Running totals over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
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
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === "cumulativeInterest" ? "Total Interest" : "Total Principal"
                      ]}
                      labelFormatter={(label) => `Payment #${label}`}
                      contentStyle={{fontSize: '12px'}}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeInterest" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      name="Interest" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativePrincipal" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      name="Principal" 
                    />
                  </LineChart>
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
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Amortization Schedule</span>
          </CardTitle>
          <CardDescription>
            Detailed payment-by-payment breakdown of your loan amortization
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
                      <th className="text-right p-3 font-semibold">Interest</th>
                      <th className="text-right p-3 font-semibold">Principal</th>
                      <th className="text-right p-3 font-semibold">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualSummary.map((year, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{year.year}</td>
                        <td className="p-3 text-right">{formatCurrency(year.interest)}</td>
                        <td className="p-3 text-right">{formatCurrency(year.principal)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(year.endingBalance)}</td>
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
                        <th className="text-left p-3 font-semibold">Payment #</th>
                        <th className="text-left p-3 font-semibold">Date</th>
                        <th className="text-right p-3 font-semibold">Payment</th>
                        <th className="text-right p-3 font-semibold">Principal</th>
                        <th className="text-right p-3 font-semibold">Interest</th>
                        {inputs.extraPayment > 0 && <th className="text-right p-3 font-semibold">Extra</th>}
                        <th className="text-right p-3 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((payment, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{payment.paymentNumber}</td>
                          <td className="p-3">{payment.date}</td>
                          <td className="p-3 text-right">{formatCurrency(payment.payment)}</td>
                          <td className="p-3 text-right">{formatCurrency(payment.principal)}</td>
                          <td className="p-3 text-right">{formatCurrency(payment.interest)}</td>
                          {inputs.extraPayment > 0 && <td className="p-3 text-right">{formatCurrency(payment.extraPayment)}</td>}
                          <td className="p-3 text-right font-medium">{formatCurrency(payment.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 max-h-96 overflow-y-auto">
                {schedule.map((payment, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Payment {payment.paymentNumber}</h3>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {payment.date}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className="font-medium">{formatCurrency(payment.payment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-medium">{formatCurrency(payment.principal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-medium">{formatCurrency(payment.interest)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-medium">{formatCurrency(payment.balance)}</span>
                      </div>
                      {inputs.extraPayment > 0 && (
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-600">Extra Payment:</span>
                          <span className="font-medium">{formatCurrency(payment.extraPayment)}</span>
                        </div>
                      )}
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
            <span>Complete Guide to Amortization</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Master the concepts of loan amortization, payment structures, and strategies for 
            optimizing your debt management and financial planning.
          </p>
        </div>

        {/* Educational Sections */}
        <div className="space-y-12">
          {/* Understanding Amortization */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Info className="h-6 w-6 text-blue-600" />
                <span>Understanding Amortization</span>
              </h3>
              <p className="text-gray-600 mt-2">Learn the fundamental concepts and mechanics of loan amortization</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>What is Amortization?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Amortization has two primary definitions in finance. In lending, it refers to the 
                    systematic repayment of a loan over time through regular payments that cover both 
                    principal and interest. In accounting, it's the process of spreading the cost of an 
                    intangible asset over its useful life.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Key Amortization Principles:</h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Equal payment amounts throughout the loan term</li>
                      <li>• Interest portion decreases over time</li>
                      <li>• Principal portion increases over time</li>
                      <li>• Total payment remains constant (for fixed-rate loans)</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-700">
                    Most common amortized loans include mortgages, auto loans, and personal loans. 
                    Each payment reduces the outstanding balance, with early payments being 
                    interest-heavy and later payments being principal-heavy.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>How Amortization Works</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    When you make a loan payment, it's divided into two components: interest and principal. 
                    Interest is calculated on the remaining balance, while the principal payment reduces 
                    the outstanding debt.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Interest Calculation</h4>
                        <p className="text-sm text-gray-600">Monthly Interest = Remaining Balance × (Annual Rate ÷ 12)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Principal Payment</h4>
                        <p className="text-sm text-gray-600">Principal = Total Payment - Interest Payment</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">New Balance</h4>
                        <p className="text-sm text-gray-600">New Balance = Previous Balance - Principal Payment</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Example:</strong> On a $200,000 loan at 6% interest, the first payment's 
                      interest is $1,000 ($200,000 × 0.06 ÷ 12). If your payment is $1,687.71, 
                      then $687.71 goes to principal.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <span>Amortization Schedule Benefits</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    An amortization schedule provides a complete roadmap of your loan repayment, 
                    showing exactly how much of each payment goes to interest versus principal 
                    throughout the entire loan term.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-800">Financial Planning</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Plan future budgets and understand total interest costs over the loan's life.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Tax Planning</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Track deductible interest payments for mortgages and business loans.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Equity Building</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Monitor principal payments to understand asset equity accumulation.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-800">Refinancing Decisions</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Compare current payment breakdown with potential new loan terms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <span>Amortized vs. Non-Amortized Loans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Understanding the difference between amortized and non-amortized loans helps 
                    you choose the right financing option for your needs and budget.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">Amortized Loans</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Fixed payment amounts</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Principal and interest combined</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Guaranteed payoff date</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Examples: Mortgages, auto loans</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-3">Non-Amortized Loans</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Variable payment amounts</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Interest-only or minimum payments</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>No guaranteed payoff</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Examples: Credit cards, lines of credit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> Interest-only loans and balloon loans are also 
                      non-amortized, requiring large payments at maturity or refinancing.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Strategies */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Target className="h-6 w-6 text-green-600" />
                <span>Payment Strategies & Optimization</span>
              </h3>
              <p className="text-gray-600 mt-2">Advanced techniques for optimizing your loan payments and saving money</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <span>Extra Principal Payments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Making extra principal payments is one of the most effective ways to reduce 
                    total interest costs and shorten your loan term. Even small additional payments 
                    can result in significant savings.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Impact of Extra Payments:</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div className="flex justify-between">
                        <span>$100/month extra on $200K loan:</span>
                        <span className="font-medium">Save ~$32K interest</span>
                      </div>
                      <div className="flex justify-between">
                        <span>$200/month extra on $200K loan:</span>
                        <span className="font-medium">Save ~$56K interest</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payoff time reduction:</span>
                        <span className="font-medium">3-6 years shorter</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Annual Bonus Strategy</h4>
                        <p className="text-sm text-gray-600">
                          Apply tax refunds, bonuses, or windfalls directly to principal.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Biweekly Payments</h4>
                        <p className="text-sm text-gray-600">
                          Pay half your monthly payment every two weeks (26 payments = 13 months).
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Round-Up Method</h4>
                        <p className="text-sm text-gray-600">
                          Round your payment to the nearest $50 or $100 for consistent extra principal.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span>Timing Your Extra Payments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The timing of extra payments significantly impacts their effectiveness. 
                    Earlier in the loan term, extra payments have the greatest impact on 
                    interest savings due to the front-loaded interest structure.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Early Years (Years 1-5)</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Maximum impact - each extra dollar saves multiple dollars in future interest. 
                        Priority time for aggressive extra payments.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-semibold text-yellow-800">Middle Years (Years 6-20)</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Moderate impact - still beneficial but consider other investment opportunities 
                        that might yield higher returns.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-800">Later Years (Final 5 years)</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Minimal impact - payments are mostly principal anyway. Consider investing 
                        extra money elsewhere for potentially higher returns.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Pro Tip:</strong> If your loan interest rate is below 4-5%, consider 
                      investing extra money in diversified index funds instead of paying down the loan early.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Refinancing Considerations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Refinancing can significantly change your amortization schedule by adjusting 
                    interest rates, loan terms, or both. Understanding when refinancing makes 
                    sense can save thousands of dollars.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">When to Refinance</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Interest rates drop 0.5%+ below current rate</li>
                        <li>• Credit score improved significantly</li>
                        <li>• Need to change loan terms</li>
                        <li>• Remove PMI from mortgage</li>
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Refinancing Costs</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• Application and origination fees</li>
                        <li>• Appraisal and inspection costs</li>
                        <li>• Title insurance and legal fees</li>
                        <li>• Lost progress on current loan</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-800">Break-Even Analysis</h4>
                    <p className="text-gray-700 text-sm mt-1">
                      Calculate break-even point: Refinancing Costs ÷ Monthly Savings = Months to break even. 
                      Only refinance if you'll stay in the loan longer than the break-even period.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Remember:</strong> Refinancing restarts your amortization schedule, 
                      meaning early payments will again be heavily weighted toward interest.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    <span>Loan Term Optimization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Choosing the right loan term involves balancing monthly payment affordability 
                    with total interest costs. Shorter terms mean higher payments but substantial 
                    interest savings.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">15-Year vs 30-Year Mortgage Example</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-orange-700">15-Year Loan</h5>
                          <p className="text-orange-600">Payment: $1,688/month</p>
                          <p className="text-orange-600">Total Interest: $103,788</p>
                          <p className="font-bold text-orange-800">Total Cost: $303,788</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-blue-700">30-Year Loan</h5>
                          <p className="text-blue-600">Payment: $1,199/month</p>
                          <p className="text-blue-600">Total Interest: $231,676</p>
                          <p className="font-bold text-blue-800">Total Cost: $431,676</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">*Based on $200,000 loan at 6% interest</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Shorter Terms</h4>
                        <p className="text-sm text-gray-600">Higher payments, less total interest, faster equity building</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Longer Terms</h4>
                        <p className="text-sm text-gray-600">Lower payments, more total interest, slower equity building</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-800">Hybrid Strategy</h4>
                        <p className="text-sm text-gray-600">Take longer term for flexibility, make extra payments when possible</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Business & Accounting Applications */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <TrendingDown className="h-6 w-6 text-purple-600" />
                <span>Business & Accounting Applications</span>
              </h3>
              <p className="text-gray-600 mt-2">Understanding amortization in business contexts and asset management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Asset Amortization in Business</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    In business accounting, amortization refers to spreading the cost of intangible 
                    assets over their useful life. This differs from depreciation, which applies 
                    to tangible assets like equipment and buildings.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Intangible Assets Subject to Amortization</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <ul className="space-y-1">
                          <li>• Patents and copyrights</li>
                          <li>• Trademarks and trade names</li>
                          <li>• Customer relationships</li>
                          <li>• Software and technology</li>
                        </ul>
                        <ul className="space-y-1">
                          <li>• Licenses and permits</li>
                          <li>• Non-compete agreements</li>
                          <li>• Franchise rights</li>
                          <li>• Goodwill (sometimes)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Section 197 Assets (US Tax Code)</h4>
                    <p className="text-sm text-blue-700">
                      Many business intangible assets must be amortized over exactly 15 years for 
                      tax purposes, regardless of their actual useful life. This includes acquired 
                      goodwill, customer lists, and certain licenses.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded">
                      <h5 className="font-medium text-green-800">Amortizable</h5>
                      <p className="text-green-700">Limited useful life, acquired in business transaction</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <h5 className="font-medium text-red-800">Not Amortizable</h5>
                      <p className="text-red-700">Indefinite life or self-created assets</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    <span>Startup Cost Amortization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Business startup costs have special amortization rules under U.S. tax law. 
                    Understanding these rules helps new businesses properly deduct initial expenses 
                    and plan their early-year tax strategies.
                  </p>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Startup Cost Rules:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• First $5,000 can be deducted immediately</li>
                      <li>• Remaining costs amortized over 180 months (15 years)</li>
                      <li>• Must be costs that would be deductible if business was active</li>
                      <li>• Must be incurred before business begins operations</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-green-700">✓</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Qualifying Startup Costs</h4>
                        <p className="text-sm text-gray-600">
                          Market research, legal fees, accounting setup, employee training, 
                          advertising before opening
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-red-700">✗</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Non-Qualifying Costs</h4>
                        <p className="text-sm text-gray-600">
                          Equipment purchases, inventory, real estate, costs after business starts, 
                          personal expenses
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Planning Tip:</strong> If startup costs exceed $50,000, the immediate 
                      deduction phases out dollar-for-dollar above that threshold.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span>Loan vs. Asset Amortization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    While both involve spreading costs over time, loan amortization and asset 
                    amortization serve different purposes and follow different methodologies 
                    in business financial management.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-3">Loan Amortization</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Reduces liability over time</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Interest expense + principal payment</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Cash flow impact</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Based on payment schedule</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-3">Asset Amortization</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Reduces asset value over time</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Non-cash expense recognition</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>No direct cash flow impact</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Based on useful life</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Financial Statement Impact</h4>
                    <p className="text-sm text-gray-700">
                      Loan amortization affects both balance sheet (reducing liability) and cash flow 
                      statement (cash outflow). Asset amortization affects income statement (expense) 
                      and balance sheet (reducing asset value) but not cash flow directly.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    <span>Tax Planning & Strategy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Understanding amortization's tax implications helps optimize both personal 
                    and business tax strategies. Different types of amortization offer various 
                    tax benefits and timing opportunities.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-indigo-800">Personal Tax Benefits</h4>
                      <ul className="text-gray-700 text-sm mt-2 space-y-1">
                        <li>• Mortgage interest deduction on primary residence</li>
                        <li>• Investment property depreciation and interest</li>
                        <li>• Student loan interest deduction (up to $2,500)</li>
                        <li>• Business loan interest for self-employed individuals</li>
                      </ul>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Business Tax Strategies</h4>
                      <ul className="text-gray-700 text-sm mt-2 space-y-1">
                        <li>• Section 179 immediate expensing vs. amortization</li>
                        <li>• Bonus depreciation for qualifying assets</li>
                        <li>• Strategic timing of asset acquisitions</li>
                        <li>• Loan vs. lease decisions based on tax treatment</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-indigo-800 mb-2">Key Tax Considerations:</h4>
                    <div className="space-y-2 text-sm text-indigo-700">
                      <p>• Loan interest is generally deductible when used for business or investment</p>
                      <p>• Asset amortization creates non-cash deductions that reduce taxable income</p>
                      <p>• Timing of deductions can be strategically planned around income levels</p>
                      <p>• Recapture rules may apply when amortized assets are sold</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Practical Applications & Tools */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <Award className="h-6 w-6 text-orange-600" />
                <span>Practical Applications & Best Practices</span>
              </h3>
              <p className="text-gray-600 mt-2">Real-world applications and actionable strategies for effective amortization management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <span>Mortgage Amortization Strategies</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Mortgages represent the largest amortized loan for most people. Understanding 
                    mortgage amortization strategies can save tens of thousands of dollars over 
                    the loan's life.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">PMI Removal Strategy</h4>
                        <p className="text-sm text-gray-600">
                          Make extra principal payments to reach 20% equity faster and eliminate 
                          private mortgage insurance premiums.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Recast vs. Refinance</h4>
                        <p className="text-sm text-gray-600">
                          Consider loan recasting (re-amortizing with large principal payment) 
                          versus refinancing when you have a lump sum.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-blue-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">ARM Transition Planning</h4>
                        <p className="text-sm text-gray-600">
                          Plan for adjustable-rate mortgage rate changes by understanding 
                          how they affect your amortization schedule.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Mortgage Tip:</strong> The first 7-10 years of a 30-year mortgage 
                      offer the greatest opportunity for interest savings through extra payments.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-green-600" />
                    <span>Auto Loan Optimization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Auto loans typically have shorter terms but higher rates than mortgages. 
                    Smart amortization strategies can save money and help avoid being "underwater" 
                    on your vehicle loan.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-800">Gap Insurance Considerations</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Early in the loan term, you may owe more than the car's value. 
                        Extra payments help reach positive equity faster.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-semibold text-yellow-800">Trade-In Timing</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Understanding your payoff balance vs. trade value helps time 
                        vehicle upgrades to minimize out-of-pocket costs.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold text-blue-800">Rate Shopping Benefits</h4>
                      <p className="text-gray-700 text-sm mt-1">
                        Even a 1% rate difference on a $30,000 auto loan saves 
                        approximately $1,000 over the loan term.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Auto Loan Strategy:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Consider 3-4 year terms to minimize interest</li>
                      <li>• Make extra payments early to avoid negative equity</li>
                      <li>• Shop rates with banks, credit unions, and dealers</li>
                      <li>• Consider larger down payment to reduce loan amount</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <span>Using Amortization Calculators Effectively</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Amortization calculators are powerful tools for financial planning, but 
                    understanding how to use them effectively and interpret results is crucial 
                    for making informed decisions.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Scenario Comparison</h4>
                        <p className="text-sm text-gray-600">
                          Run multiple scenarios (different rates, terms, extra payments) 
                          to understand the impact of each variable.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Break-Even Analysis</h4>
                        <p className="text-sm text-gray-600">
                          Use calculators to determine break-even points for refinancing, 
                          extra payments, or different loan products.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <span className="text-xs font-bold text-purple-700">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Long-Term Planning</h4>
                        <p className="text-sm text-gray-600">
                          Model different life scenarios (income changes, extra payments, 
                          early payoff) to plan financial strategies.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Key Metrics to Track:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-purple-700">
                      <ul className="space-y-1">
                        <li>• Total interest paid</li>
                        <li>• Payoff timeline</li>
                        <li>• Monthly payment amounts</li>
                      </ul>
                      <ul className="space-y-1">
                        <li>• Break-even points</li>
                        <li>• Equity building rate</li>
                        <li>• Interest vs. principal ratio</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <span>Common Amortization Mistakes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Avoiding common amortization mistakes can save significant money and prevent 
                    financial complications. Learn from these frequent errors to optimize your 
                    loan management strategy.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-red-700">✗</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800">Focusing Only on Monthly Payment</h4>
                          <p className="text-sm text-red-600 mt-1">
                            Ignoring total interest cost can lead to expensive long-term loans with low payments.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-red-700">✗</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800">Not Considering Extra Payments</h4>
                          <p className="text-sm text-red-600 mt-1">
                            Missing opportunities to save thousands through strategic extra principal payments.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-red-700">✗</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800">Refinancing Too Frequently</h4>
                          <p className="text-sm text-red-600 mt-1">
                            Constantly resetting amortization schedules and paying closing costs repeatedly.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-xs font-bold text-red-700">✗</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800">Ignoring Tax Implications</h4>
                          <p className="text-sm text-red-600 mt-1">
                            Failing to consider mortgage interest deductions and business expense implications.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Best Practice:</strong> Use amortization calculators to model 
                      different scenarios before making loan decisions, and review your strategy 
                      annually as your financial situation changes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
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
                <h3 className="font-semibold text-lg text-gray-800">Essential Amortization Principles</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Front-Loaded Interest:</strong> Early payments are primarily interest, 
                      making extra principal payments most effective in the first third of the loan.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Payment Timing:</strong> Extra payments applied to principal early 
                      in the loan term provide exponentially greater savings than later payments.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Rate vs. Term:</strong> Balance the benefits of lower monthly payments 
                      (longer terms) against total interest costs when choosing loan terms.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm text-gray-700">
                      <strong>Strategic Planning:</strong> Use amortization schedules for tax planning, 
                      refinancing decisions, and long-term financial goal setting.
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
                      Calculate your current loan amortization schedules to understand where you stand today.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">2</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Model extra payment scenarios to identify opportunities for interest savings.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">3</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Review refinancing opportunities if rates have dropped significantly since origination.
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-green-700">4</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Implement a systematic extra payment strategy based on your financial capacity and goals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Master Your Amortization Strategy</h3>
                  <p className="text-gray-700 text-sm">
                    Understanding amortization is fundamental to smart financial management. Whether you're 
                    managing personal loans, business financing, or investment properties, the principles 
                    of amortization help you make informed decisions that can save thousands of dollars 
                    and accelerate your path to financial freedom. Use our calculator regularly to 
                    evaluate different scenarios and optimize your debt management strategy.
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

export default AmortizationCalculatorComponent;
