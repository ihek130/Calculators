import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Calendar, Percent, PiggyBank, Clock, Home } from 'lucide-react';

interface PayoffResult {
  originalMonthlyPayment: number;
  newMonthlyPayment: number;
  originalPayoffMonths: number;
  newPayoffMonths: number;
  timeSavingsMonths: number;
  interestSavings: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  originalTotalPayments: number;
  newTotalPayments: number;
  remainingBalance?: number;
  originalPayoffTime: string;
  newPayoffTime: string;
  timeSavings: string;
  chartData: ChartData[];
}

interface ChartData {
  period: number;
  originalBalance: number;
  newBalance: number;
  originalInterest: number;
  newInterest: number;
}

interface PayoffInputs {
  // Mode 1: Known remaining term
  originalAmount: string;
  originalTerm: string;
  interestRate: string;
  remainingYears: string;
  remainingMonths: string;
  
  // Mode 2: Unknown remaining term
  unpaidBalance: string;
  monthlyPayment: string;
  interestRate2: string;
  
  // Extra payments
  extraMonthly: string;
  extraYearly: string;
  extraOneTime: string;
}

const MortgagePayoffCalculatorComponent: React.FC = () => {
  const [mode, setMode] = useState<'known' | 'unknown'>('known');
  const [inputs, setInputs] = useState<PayoffInputs>({
    // Mode 1: Known remaining term
    originalAmount: '400000',
    originalTerm: '30',
    interestRate: '6',
    remainingYears: '25',
    remainingMonths: '0',
    
    // Mode 2: Unknown remaining term
    unpaidBalance: '230000',
    monthlyPayment: '1500',
    interestRate2: '6',
    
    // Extra payments
    extraMonthly: '500',
    extraYearly: '0',
    extraOneTime: '0'
  });

  const [result, setResult] = useState<PayoffResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time calculation effect
  useEffect(() => {
    handleCalculate();
  }, [inputs, mode]);

  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === 'known') {
      const requiredFields = ['originalAmount', 'originalTerm', 'interestRate', 'remainingYears'];
      requiredFields.forEach(field => {
        const value = inputs[field as keyof PayoffInputs];
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[field] = `${field} must be a positive number`;
        }
      });
    } else {
      const requiredFields = ['unpaidBalance', 'monthlyPayment', 'interestRate2'];
      requiredFields.forEach(field => {
        const value = inputs[field as keyof PayoffInputs];
        if (!value || isNaN(Number(value)) || Number(value) <= 0) {
          newErrors[field] = `${field} must be a positive number`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateMonthlyPayment = (principal: number, rate: number, months: number): number => {
    if (rate === 0) return principal / months;
    const monthlyRate = rate / 100 / 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const calculateRemainingBalance = (originalAmount: number, rate: number, originalTermMonths: number, paymentsMade: number): number => {
    if (rate === 0) {
      return originalAmount - (originalAmount / originalTermMonths * paymentsMade);
    }
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = calculateMonthlyPayment(originalAmount, rate, originalTermMonths);
    
    let balance = originalAmount;
    for (let i = 0; i < paymentsMade; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
    }
    return Math.max(0, balance);
  };

  const calculatePayoffSchedule = (
    currentBalance: number,
    rate: number,
    basePayment: number,
    extraMonthly: number,
    extraYearly: number,
    extraOneTime: number
  ) => {
    const monthlyRate = rate / 100 / 12;
    let balance = currentBalance - extraOneTime;
    let month = 0;
    let totalInterest = 0;
    const scheduleData = [];

    while (balance > 0.01 && month < 600) { // 50 year max
      const interestPayment = balance * monthlyRate;
      const extraThisMonth = extraMonthly + (month % 12 === 0 && month > 0 ? extraYearly / 12 : 0);
      const totalPayment = Math.min(basePayment + extraThisMonth, balance + interestPayment);
      const principalPayment = totalPayment - interestPayment;
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      month++;

      // Store data for chart (every 6 months)
      if (month % 6 === 0 || balance <= 0.01) {
        scheduleData.push({
          period: month / 12,
          balance: Math.max(0, balance),
          interest: totalInterest
        });
      }
    }

    return { months: month, totalInterest, scheduleData };
  };

  const calculateRemainingTerm = (balance: number, payment: number, rate: number): number => {
    if (rate === 0) return balance / payment;
    const monthlyRate = rate / 100 / 12;
    return -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate);
  };

  const formatTime = (months: number): string => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const handleCalculate = () => {
    if (!validateInputs()) {
      setResult(null);
      return;
    }

    try {
      let currentBalance: number;
      let baseMonthlyPayment: number;
      let originalTermMonths: number;

      if (mode === 'known') {
        const principal = parseFloat(inputs.originalAmount);
        const rate = parseFloat(inputs.interestRate);
        const origTermMonths = parseFloat(inputs.originalTerm) * 12;
        const remYears = parseFloat(inputs.remainingYears);
        const remMonths = parseFloat(inputs.remainingMonths) || 0;
        const remainingTermMonths = remYears * 12 + remMonths;
        const paymentsMade = origTermMonths - remainingTermMonths;

        currentBalance = calculateRemainingBalance(principal, rate, origTermMonths, paymentsMade);
        baseMonthlyPayment = calculateMonthlyPayment(principal, rate, origTermMonths);
        originalTermMonths = remainingTermMonths;
      } else {
        currentBalance = parseFloat(inputs.unpaidBalance);
        baseMonthlyPayment = parseFloat(inputs.monthlyPayment);
        const rate = parseFloat(inputs.interestRate2);
        originalTermMonths = calculateRemainingTerm(currentBalance, baseMonthlyPayment, rate);
      }

      const rate = mode === 'known' ? parseFloat(inputs.interestRate) : parseFloat(inputs.interestRate2);
      const extraMo = parseFloat(inputs.extraMonthly) || 0;
      const extraYr = parseFloat(inputs.extraYearly) || 0;
      const extraOne = parseFloat(inputs.extraOneTime) || 0;

      // Original payoff calculation
      const originalPayoff = calculatePayoffSchedule(currentBalance, rate, baseMonthlyPayment, 0, 0, 0);
      
      // With extra payments
      const newPayoff = calculatePayoffSchedule(currentBalance, rate, baseMonthlyPayment, extraMo, extraYr, extraOne);

      const timeSavingsMonths = originalPayoff.months - newPayoff.months;
      const interestSavings = originalPayoff.totalInterest - newPayoff.totalInterest;

      // Prepare chart data
      const chartData = [];
      const maxLength = Math.max(originalPayoff.scheduleData.length, newPayoff.scheduleData.length);
      for (let i = 0; i < maxLength; i++) {
        const original = originalPayoff.scheduleData[i] || { period: 0, balance: 0, interest: originalPayoff.totalInterest };
        const withExtra = newPayoff.scheduleData[i] || { period: 0, balance: 0, interest: newPayoff.totalInterest };
        chartData.push({
          period: Math.max(original.period, withExtra.period),
          originalBalance: original.balance,
          newBalance: withExtra.balance,
          originalInterest: original.interest,
          newInterest: withExtra.interest
        });
      }

      setResult({
        originalMonthlyPayment: baseMonthlyPayment,
        newMonthlyPayment: baseMonthlyPayment + extraMo,
        originalPayoffMonths: originalPayoff.months,
        newPayoffMonths: newPayoff.months,
        timeSavingsMonths,
        interestSavings,
        originalTotalInterest: originalPayoff.totalInterest,
        newTotalInterest: newPayoff.totalInterest,
        originalTotalPayments: baseMonthlyPayment * originalPayoff.months,
        newTotalPayments: (baseMonthlyPayment + extraMo) * newPayoff.months + extraYr * (newPayoff.months / 12) + extraOne,
        remainingBalance: currentBalance,
        originalPayoffTime: formatTime(originalPayoff.months),
        newPayoffTime: formatTime(newPayoff.months),
        timeSavings: formatTime(timeSavingsMonths),
        chartData
      });

      setErrors({});
    } catch (error) {
      setErrors({ general: 'Please check your input values' });
      setResult(null);
    }
  };

  const formatCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Format for mobile display to prevent overflow
    if (absValue >= 1000000) {
      return `${value < 0 ? '-' : ''}$${(absValue / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}$${(absValue / 1000).toFixed(0)}K`;
    }
    return formatter.format(value);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-1 sm:p-4 space-y-3 sm:space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Home className="h-8 w-8 text-blue-600" />
          Mortgage Payoff Calculator
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This mortgage payoff calculator helps evaluate how adding extra payments or bi-weekly payments can save on interest and shorten mortgage term.
          Features real-time calculations that update automatically as you type.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              Mortgage Payoff Calculator
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Calculate mortgage payoff scenarios with extra payments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <Tabs value={mode} onValueChange={(value: any) => setMode(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="known" className="text-xs sm:text-sm">Known Term</TabsTrigger>
                <TabsTrigger value="unknown" className="text-xs sm:text-sm">Unknown Term</TabsTrigger>
              </TabsList>

              <TabsContent value="known" className="space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-3">
                  Use this if you know the remaining loan term and original loan information.
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="originalAmount" className="flex items-center gap-1 text-sm sm:text-base">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Original loan amount</span>
                    </Label>
                    <Input
                      id="originalAmount"
                      type="number"
                      value={inputs.originalAmount}
                      onChange={(e) => setInputs(prev => ({ ...prev, originalAmount: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="400000"
                    />
                    {errors.originalAmount && <p className="text-sm text-red-600 break-words">{errors.originalAmount}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalTerm" className="flex items-center gap-1 text-sm sm:text-base">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Original term (years)</span>
                    </Label>
                    <Input
                      id="originalTerm"
                      type="number"
                      value={inputs.originalTerm}
                      onChange={(e) => setInputs(prev => ({ ...prev, originalTerm: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="30"
                    />
                    {errors.originalTerm && <p className="text-sm text-red-600 break-words">{errors.originalTerm}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate" className="flex items-center gap-1 text-sm sm:text-base">
                      <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Interest rate (%)</span>
                    </Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={inputs.interestRate}
                      onChange={(e) => setInputs(prev => ({ ...prev, interestRate: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="6"
                    />
                    {errors.interestRate && <p className="text-sm text-red-600 break-words">{errors.interestRate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-sm sm:text-base">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Remaining term</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={inputs.remainingYears}
                        onChange={(e) => setInputs(prev => ({ ...prev, remainingYears: e.target.value }))}
                        placeholder="Years"
                        className="h-8 sm:h-10 text-sm sm:text-base"
                      />
                      <Input
                        type="number"
                        value={inputs.remainingMonths}
                        onChange={(e) => setInputs(prev => ({ ...prev, remainingMonths: e.target.value }))}
                        placeholder="Months"
                        className="h-8 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                    {errors.remainingYears && <p className="text-sm text-red-600 break-words">{errors.remainingYears}</p>}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="unknown" className="space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm text-gray-600 mb-3">
                  Use this if you don't know the remaining term but have the unpaid balance and monthly payment.
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unpaidBalance" className="flex items-center gap-1 text-sm sm:text-base">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Unpaid balance</span>
                    </Label>
                    <Input
                      id="unpaidBalance"
                      type="number"
                      value={inputs.unpaidBalance}
                      onChange={(e) => setInputs(prev => ({ ...prev, unpaidBalance: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="230000"
                    />
                    {errors.unpaidBalance && <p className="text-sm text-red-600 break-words">{errors.unpaidBalance}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyPayment" className="flex items-center gap-1 text-sm sm:text-base">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Monthly payment</span>
                    </Label>
                    <Input
                      id="monthlyPayment"
                      type="number"
                      value={inputs.monthlyPayment}
                      onChange={(e) => setInputs(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="1500"
                    />
                    {errors.monthlyPayment && <p className="text-sm text-red-600 break-words">{errors.monthlyPayment}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate2" className="flex items-center gap-1 text-sm sm:text-base">
                      <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Interest rate (%)</span>
                    </Label>
                    <Input
                      id="interestRate2"
                      type="number"
                      step="0.01"
                      value={inputs.interestRate2}
                      onChange={(e) => setInputs(prev => ({ ...prev, interestRate2: e.target.value }))}
                      className="h-8 sm:h-10 text-sm sm:text-base"
                      placeholder="6"
                    />
                    {errors.interestRate2 && <p className="text-sm text-red-600 break-words">{errors.interestRate2}</p>}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Extra Payment Options */}
            <div className="border-t pt-3 sm:pt-4">
                            <h4 className="text-base sm:text-lg font-medium mb-3">Repayment options:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extraMonthly" className="flex items-center gap-1 text-sm sm:text-base">
                    <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Extra per month</span>
                  </Label>
                  <Input
                    id="extraMonthly"
                    type="number"
                    value={inputs.extraMonthly}
                    onChange={(e) => setInputs(prev => ({ ...prev, extraMonthly: e.target.value }))}
                    className="h-8 sm:h-10 text-sm sm:text-base"
                    placeholder="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraYearly" className="flex items-center gap-1 text-sm sm:text-base">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">Extra per year</span>
                  </Label>
                  <Input
                    id="extraYearly"
                    type="number"
                    value={inputs.extraYearly}
                    onChange={(e) => setInputs(prev => ({ ...prev, extraYearly: e.target.value }))}
                    className="h-8 sm:h-10 text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extraOneTime" className="flex items-center gap-1 text-sm sm:text-base">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">One time payment</span>
                  </Label>
                  <Input
                    id="extraOneTime"
                    type="number"
                    value={inputs.extraOneTime}
                    onChange={(e) => setInputs(prev => ({ ...prev, extraOneTime: e.target.value }))}
                    className="h-8 sm:h-10 text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="text-sm sm:text-base text-red-600 bg-red-50 p-2 rounded">
                {errors.general}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                Payoff Results
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Payoff in {result.newPayoffTime}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-sm sm:text-base text-green-600 font-medium">Interest Savings</div>
                  <div className="text-lg sm:text-xl font-bold text-green-700">
                    {formatCurrency(result.interestSavings)}
                  </div>
                  <div className="text-sm text-green-600">
                    Pay {Math.round((result.interestSavings / result.originalTotalInterest) * 100)}% less
                  </div>
                </div>

                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                  <div className="text-sm sm:text-base text-blue-600 font-medium">Time Savings</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-700">
                    {result.timeSavings}
                  </div>
                  <div className="text-sm text-blue-600">
                    Payoff {Math.round((result.timeSavingsMonths / result.originalPayoffMonths) * 100)}% faster
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {mode === 'known' && result.remainingBalance && (
                    <span>The remaining balance is <span className="font-semibold">{formatCurrency(result.remainingBalance)}</span>. </span>
                  )}
                  By paying extra <span className="font-semibold">{formatCurrency(parseFloat(inputs.extraMonthly) || 0)}</span> per month
                  {parseFloat(inputs.extraYearly) > 0 && (
                    <span> and <span className="font-semibold">{formatCurrency(parseFloat(inputs.extraYearly))}</span> per year</span>
                  )}
                  {parseFloat(inputs.extraOneTime) > 0 && (
                    <span> and a one-time payment of <span className="font-semibold">{formatCurrency(parseFloat(inputs.extraOneTime))}</span></span>
                  )}, the loan will be paid off in <span className="font-semibold text-green-600">{result.newPayoffTime}</span>. 
                  It is <span className="font-semibold text-blue-600">{result.timeSavings} earlier</span>. 
                  This results in savings of <span className="font-semibold text-green-600">{formatCurrency(result.interestSavings)}</span> in interest.
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-1 sm:p-2 font-medium"></th>
                      <th className="text-center p-1 sm:p-2 font-medium text-gray-600">Original</th>
                      <th className="text-center p-1 sm:p-2 font-medium text-green-600">With Payoff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-1 sm:p-2 font-medium">Monthly pay</td>
                      <td className="text-center p-1 sm:p-2">{formatCurrency(result.originalMonthlyPayment)}</td>
                      <td className="text-center p-1 sm:p-2 text-green-600">{formatCurrency(result.newMonthlyPayment)}</td>
                    </tr>
                    <tr>
                      <td className="p-1 sm:p-2 font-medium">Total payments</td>
                      <td className="text-center p-1 sm:p-2">{formatCurrency(result.originalTotalPayments)}</td>
                      <td className="text-center p-1 sm:p-2 text-green-600">{formatCurrency(result.newTotalPayments)}</td>
                    </tr>
                    <tr>
                      <td className="p-1 sm:p-2 font-medium">Total interest</td>
                      <td className="text-center p-1 sm:p-2">{formatCurrency(result.originalTotalInterest)}</td>
                      <td className="text-center p-1 sm:p-2 text-green-600">{formatCurrency(result.newTotalInterest)}</td>
                    </tr>
                    <tr>
                      <td className="p-1 sm:p-2 font-medium">Payoff time</td>
                      <td className="text-center p-1 sm:p-2">{result.originalPayoffTime}</td>
                      <td className="text-center p-1 sm:p-2 text-green-600">{result.newPayoffTime}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      {result && (
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Balance Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-4">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 8 }}
                      width={30}
                      tickFormatter={(value) => `${value}yr`}
                    />
                    <YAxis 
                      tick={{ fontSize: 8 }}
                      width={30}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'originalBalance' ? 'Original' : 'With Payoff'
                      ]}
                      labelFormatter={(value) => `Year ${value}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="originalBalance" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Original Balance"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newBalance" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="New Balance"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Interest Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-1 sm:p-4">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 8 }}
                      width={30}
                      tickFormatter={(value) => `${value}yr`}
                    />
                    <YAxis 
                      tick={{ fontSize: 8 }}
                      width={30}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'originalInterest' ? 'Original' : 'With Payoff'
                      ]}
                      labelFormatter={(value) => `Year ${value}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="originalInterest" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Original Interest"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newInterest" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="New Interest"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Educational Content - Step 2 */}
      <div className="space-y-3 sm:space-y-6">
        {/* Basic Concepts */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="bg-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calculator className="h-6 w-6 text-blue-600" />
              Understanding Mortgage Payoff Fundamentals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-blue-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-800">Principal and Interest Components</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Every mortgage payment consists of two fundamental components: principal and interest. The principal represents the original loan amount borrowed, while interest constitutes the lender's compensation for providing the funds. This interest charge is calculated as a percentage of the outstanding principal balance, forming the foundation of mortgage amortization schedules.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The payment allocation follows a specific pattern where interest is satisfied first, and the remaining portion reduces the principal balance. During the early years of a mortgage, the outstanding principal balance is highest, resulting in larger interest charges that consume most of each payment. As the principal balance decreases over time, interest costs diminish proportionally, allowing more of each payment to reduce the principal.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This amortization process creates a powerful opportunity for early mortgage payoff strategies. Since interest is calculated on the remaining balance, any additional principal payments immediately reduce future interest charges. The compound effect of these savings becomes particularly significant when extra payments are made during the early years of the loan term.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-800">Mortgage Payoff Calculator Benefits</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our advanced Mortgage Payoff Calculator evaluates multiple accelerated payment strategies, including one-time lump sum payments, recurring monthly extra payments, annual windfalls, and biweekly payment schedules. The calculator precisely determines the remaining payoff time, time savings achieved, and total interest cost reductions for each scenario.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The interactive amortization visualization demonstrates how different payment strategies affect the loan balance over time. Users can compare original payment schedules with accelerated payoff scenarios, clearly illustrating the financial benefits of various approaches. Real-time calculations update automatically as payment parameters change, enabling immediate comparison of different strategies.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Beyond simple calculations, the tool provides comprehensive analysis including total payment comparisons, interest savings percentages, and payoff acceleration timelines. This detailed information empowers borrowers to make informed decisions about mortgage acceleration strategies based on their financial circumstances and goals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Strategies */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="bg-green-100">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Proven Mortgage Acceleration Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-green-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Extra Payment Techniques</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Additional principal payments represent the most straightforward mortgage acceleration method. These supplemental payments can be structured as one-time contributions, recurring monthly additions, or annual lump sums using tax refunds or bonuses. Every dollar of extra payment directly reduces the principal balance, immediately decreasing future interest calculations.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                The impact of extra payments varies significantly based on timing and amount. For instance, a single $1,000 additional payment on a $200,000, 30-year loan at 5% interest can eliminate four months from the loan term while saving approximately $3,420 in total interest. Even modest recurring extra payments of $50 monthly can reduce loan terms by several years and generate substantial interest savings.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Strategic timing maximizes extra payment effectiveness. Payments made during the early loan years produce the greatest impact due to the higher principal balances and longer remaining terms. Borrowers should prioritize consistency over large sporadic payments, as regular additional contributions create predictable progress toward payoff goals.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Biweekly Payment Systems</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Biweekly mortgage payments involve making half the monthly payment amount every two weeks instead of one full monthly payment. With 52 weeks annually, this schedule results in 26 biweekly payments, equivalent to 13 monthly payments per year. The additional month's payment each year applies entirely to principal reduction.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This payment structure aligns perfectly with biweekly payroll schedules, making budget management more natural for many borrowers. The psychological benefit of smaller, more frequent payments can improve payment discipline while the slight timing acceleration provides marginal additional interest savings compared to equivalent monthly extra payments.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Borrowers considering biweekly payments should verify their lender's processing procedures and fee structure. Some lenders offer formal biweekly programs, while others allow borrowers to make additional payments independently. Understanding the administrative aspects ensures maximum benefit from this acceleration strategy.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Refinancing for Acceleration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mortgage refinancing to shorter terms can dramatically reduce total interest costs while potentially maintaining similar monthly payments when interest rates have declined. A 30-year mortgage refinanced to a 15-year term typically features lower interest rates and builds equity substantially faster, though monthly payments increase significantly.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Refinancing decisions require comprehensive analysis of closing costs, current market rates compared to existing loan terms, and borrower capacity for higher payments. A detailed break-even calculation determines the timeframe required for interest savings to offset refinancing expenses, ensuring the strategy provides net financial benefit.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Cash-out refinancing can fund home improvements that increase property value, potentially offsetting increased loan balances. However, this strategy demands careful evaluation of improvement costs versus value enhancement, combined with assessment of overall financial objectives and cash flow implications.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="bg-orange-100">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <PiggyBank className="h-6 w-6 text-orange-600" />
              Financial Risk Assessment and Opportunity Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-orange-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Prepayment Penalties and Restrictions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Certain mortgage agreements include prepayment penalties that impose fees for early loan payoff or substantial additional payments. These clauses protect lenders from losing anticipated interest income when borrowers accelerate payoff schedules. Understanding penalty terms is essential before implementing any mortgage acceleration strategy.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Prepayment penalties typically apply during the initial loan years and may be calculated as a percentage of outstanding balance or specified months of interest payments. Some penalties apply only to complete payoff scenarios, while others include large extra payments. Careful review of loan documentation or lender consultation clarifies these restrictions.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Government-backed loans including FHA, VA, and USDA mortgages generally prohibit prepayment penalties, providing greater flexibility for acceleration strategies. Conventional loans may include these penalties, though they have become less common in recent years. When penalties exist, borrowers must calculate whether long-term interest savings exceed penalty costs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Investment Opportunity Analysis</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mortgage prepayment provides a guaranteed return equivalent to the loan's interest rate, but this return should be evaluated against alternative investment opportunities. High-yield savings accounts, certificates of deposit, stock market investments, bonds, and retirement accounts all compete for available funds and may offer superior risk-adjusted returns.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Emergency fund adequacy must take priority over mortgage prepayment for most borrowers. Financial experts typically recommend maintaining three to six months of living expenses in readily accessible accounts before focusing on mortgage acceleration. This emergency cushion provides financial security and prevents the need to access home equity during unexpected financial difficulties.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                High-interest debt elimination, particularly credit card balances, should generally precede mortgage prepayment efforts. Credit card interest rates often exceed 20% annually, making debt elimination a higher priority than mortgage acceleration. Student loans, auto loans, and other debts require evaluation based on their interest rates and tax implications relative to mortgage costs.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-orange-800">Tax-Advantaged Account Prioritization</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Maximizing employer 401(k) matching contributions should typically precede mortgage prepayment for most borrowers. Employer matches represent guaranteed 100% returns on contributed funds, significantly exceeding mortgage interest savings. After securing full employer matches, the decision between additional retirement contributions and mortgage prepayment depends on individual circumstances.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Tax-advantaged retirement accounts including 401(k), 403(b), and IRA contributions provide immediate tax deductions and tax-deferred growth that can substantially enhance long-term wealth accumulation. These tax benefits, combined with potential investment returns, often outweigh guaranteed savings from mortgage prepayment, particularly for younger borrowers with extended investment horizons.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Mortgage interest deductions reduce the effective borrowing cost for taxpayers who itemize deductions. The Tax Cuts and Jobs Act of 2017 limited these deductions and increased standard deductions, reducing tax benefits for many borrowers. Understanding current tax implications helps determine the true cost of mortgage debt versus prepayment value.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Real-World Applications */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="bg-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Home className="h-6 w-6 text-purple-600" />
              Strategic Decision-Making and Case Studies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 bg-purple-50">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Case Study: High-Interest Debt Priority</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Christine initially planned to accelerate her mortgage payoff to achieve the emotional satisfaction of homeownership without debt obligations. After confirming her mortgage contract contained no prepayment penalties, she prepared to allocate extra funds toward principal reduction to expedite payoff completion.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                During a consultation with her financial advisor friend, Christine discovered a more effective strategy for interest cost reduction. Her three credit cards carried interest rates as high as 20% annually, while her mortgage charged only 5% interest. These high-interest payments consumed a disproportionate amount of her monthly income.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By prioritizing credit card debt elimination before mortgage acceleration, Christine could reduce her total interest costs more effectively. The mathematical advantage of eliminating 20% interest debt versus accelerating 5% mortgage payoff was substantial, resulting in faster overall debt freedom and improved cash flow for future financial goals.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Case Study: Emergency Fund Prioritization</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Bob maintained only mortgage debt after successfully eliminating student loans, auto loans, and credit card balances. With substantial discretionary income available, he faced a decision between mortgage acceleration and stock market investment. Historical market performance suggested potential returns exceeding his 4% mortgage interest rate.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                However, Bob's financial advisor identified a critical vulnerability: his emergency fund contained insufficient reserves for financial security. Additionally, his employer had recently announced layoffs, and his manager warned him about potential job loss. This employment uncertainty significantly altered his financial strategy priorities.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Given the employment instability, Bob's optimal strategy involved building a robust emergency fund covering six to nine months of expenses before considering mortgage acceleration or market investments. Financial security through adequate emergency reserves took precedence over potential investment gains or guaranteed mortgage interest savings.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Case Study: Pre-Retirement Strategy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Charles approached retirement with comprehensive financial preparation, having maximized tax-advantaged account contributions and established a substantial emergency fund. With no debt except his mortgage and consistent employment, he possessed extra cash for either continued investing or mortgage acceleration.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                As Charles neared retirement, his risk tolerance decreased, making guaranteed mortgage interest savings more attractive than potentially volatile market investments. His financial advisor recommended mortgage acceleration to achieve debt-free retirement, providing both financial security and psychological peace of mind.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                This strategy aligned with Charles's conservative retirement approach, ensuring he would enter retirement without monthly mortgage obligations. The guaranteed savings from mortgage acceleration, combined with reduced monthly expenses in retirement, created a solid foundation for his post-employment financial security.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-800">Implementation Best Practices</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Successful mortgage acceleration requires consistent execution and periodic strategy review. Automating extra payments ensures reliability and removes the temptation to redirect funds elsewhere. Many borrowers benefit from automatic transfers to dedicated savings accounts for annual lump sum payments, providing flexibility while maintaining discipline.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Regular strategy assessments accommodate changing financial circumstances, interest rate environments, and life objectives. Initial strategies may require adjustment as income changes, family situations evolve, or investment opportunities arise. Flexibility and willingness to adapt ensure strategies continue serving long-term financial goals effectively.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Documentation and progress tracking provide motivation and accountability. Calculating annual progress, projected payoff dates, and cumulative interest savings helps maintain focus and celebrates achievements. Many borrowers find that visualizing progress through charts or spreadsheets reinforces their commitment to acceleration strategies.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MortgagePayoffCalculatorComponent;
