import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, PieChart, TrendingUp, DollarSign, Calendar, Percent, Anchor, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BoatLoanInputs {
  boatPrice: number;
  downPayment: number;
  tradeInValue: number;
  salesTaxRate: number;
  fees: number;
  interestRate: number;
  loanTermYears: number;
}

interface BoatLoanResults {
  totalLoanAmount: number;
  salesTax: number;
  upfrontPayment: number;
  monthlyPayment: number;
  totalLoanPayments: number;
  totalLoanInterest: number;
  totalCost: number;
  principalPercentage: number;
  interestPercentage: number;
  schedule: Array<{
    year: number;
    month: number;
    interest: number;
    principal: number;
    endingBalance: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
  }>;
}

const BoatLoanCalculatorComponent = () => {
  const [inputs, setInputs] = useState<BoatLoanInputs>({
    boatPrice: 35000,
    downPayment: 7000,
    tradeInValue: 0,
    salesTaxRate: 7,
    fees: 2000,
    interestRate: 7,
    loanTermYears: 10
  });

  const [results, setResults] = useState<BoatLoanResults>({
    totalLoanAmount: 0,
    salesTax: 0,
    upfrontPayment: 0,
    monthlyPayment: 0,
    totalLoanPayments: 0,
    totalLoanInterest: 0,
    totalCost: 0,
    principalPercentage: 0,
    interestPercentage: 0,
    schedule: []
  });

  const [showMonthlySchedule, setShowMonthlySchedule] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  const calculateBoatLoan = (): BoatLoanResults => {
    const { boatPrice, downPayment, tradeInValue, salesTaxRate, fees, interestRate, loanTermYears } = inputs;
    
    if (boatPrice <= 0 || loanTermYears <= 0) {
      return {
        totalLoanAmount: 0,
        salesTax: 0,
        upfrontPayment: 0,
        monthlyPayment: 0,
        totalLoanPayments: 0,
        totalLoanInterest: 0,
        totalCost: 0,
        principalPercentage: 0,
        interestPercentage: 0,
        schedule: []
      };
    }

    // Calculate sales tax (on boat price minus trade-in)
    const taxableAmount = boatPrice - tradeInValue;
    const salesTax = (taxableAmount * salesTaxRate) / 100;

    // Calculate total loan amount
    const totalLoanAmount = boatPrice - downPayment - tradeInValue + fees;

    // Calculate upfront payment
    const upfrontPayment = downPayment + salesTax;

    // Calculate monthly payment using standard amortization formula
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    
    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = totalLoanAmount / numberOfPayments;
    } else {
      monthlyPayment = totalLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }

    // Calculate totals
    const totalLoanPayments = monthlyPayment * numberOfPayments;
    const totalLoanInterest = totalLoanPayments - totalLoanAmount;
    const totalCost = boatPrice + totalLoanInterest + salesTax + fees;

    // Calculate percentages for pie chart
    const principalPercentage = totalLoanAmount > 0 ? (totalLoanAmount / totalLoanPayments) * 100 : 0;
    const interestPercentage = totalLoanAmount > 0 ? (totalLoanInterest / totalLoanPayments) * 100 : 0;

    // Generate amortization schedule
    const schedule = [];
    let remainingBalance = totalLoanAmount;
    let cumulativeInterest = 0;
    let cumulativePrincipal = 0;

    if (showMonthlySchedule) {
      // Monthly schedule
      for (let month = 1; month <= numberOfPayments; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        cumulativeInterest += interestPayment;
        cumulativePrincipal += principalPayment;

        // Prevent negative balance due to floating point precision
        if (remainingBalance < 0.01) remainingBalance = 0;

        schedule.push({
          year: Math.ceil(month / 12),
          month: month,
          interest: interestPayment,
          principal: principalPayment,
          endingBalance: remainingBalance,
          cumulativeInterest: cumulativeInterest,
          cumulativePrincipal: cumulativePrincipal
        });
      }
    } else {
      // Annual schedule
      for (let year = 1; year <= loanTermYears; year++) {
        let yearInterest = 0;
        let yearPrincipal = 0;
        const startingBalance = remainingBalance;
        
        const monthsInYear = 12;
        for (let month = 1; month <= monthsInYear; month++) {
          const interestPayment = remainingBalance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          yearInterest += interestPayment;
          yearPrincipal += principalPayment;
          remainingBalance -= principalPayment;
          
          if (remainingBalance < 0.01) remainingBalance = 0;
        }

        cumulativeInterest += yearInterest;
        cumulativePrincipal += yearPrincipal;

        schedule.push({
          year: year,
          month: year * 12,
          interest: yearInterest,
          principal: yearPrincipal,
          endingBalance: remainingBalance,
          cumulativeInterest: cumulativeInterest,
          cumulativePrincipal: cumulativePrincipal
        });
      }
    }

    return {
      totalLoanAmount,
      salesTax,
      upfrontPayment,
      monthlyPayment,
      totalLoanPayments,
      totalLoanInterest,
      totalCost,
      principalPercentage,
      interestPercentage,
      schedule
    };
  };

  useEffect(() => {
    const newResults = calculateBoatLoan();
    setResults(newResults);
  }, [inputs, showMonthlySchedule]);

  const handleInputChange = (field: keyof BoatLoanInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <Anchor className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600" />
            Boat Loan Calculator
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Calculate your boat loan payments with detailed amortization schedules, tax considerations, 
            and comprehensive cost analysis to make informed financing decisions.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">Boat Loan Details</CardTitle>
            <CardDescription className="text-sm sm:text-base">Modify the values to calculate your boat loan</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              
              <div className="space-y-2">
                <Label htmlFor="boatPrice" className="text-sm font-medium text-gray-700">
                  Boat Price
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="boatPrice"
                    type="number"
                    value={inputs.boatPrice}
                    onChange={(e) => handleInputChange('boatPrice', e.target.value)}
                    className="pl-10"
                    placeholder="35000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanTermYears" className="text-sm font-medium text-gray-700">
                  Loan Term (Years)
                </Label>
                <Input
                  id="loanTermYears"
                  type="number"
                  value={inputs.loanTermYears}
                  onChange={(e) => handleInputChange('loanTermYears', e.target.value)}
                  placeholder="10"
                  min="1"
                  max="20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm font-medium text-gray-700">
                  Interest Rate (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={inputs.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    className="pl-10"
                    placeholder="7.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPayment" className="text-sm font-medium text-gray-700">
                  Down Payment
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="downPayment"
                    type="number"
                    value={inputs.downPayment}
                    onChange={(e) => handleInputChange('downPayment', e.target.value)}
                    className="pl-10"
                    placeholder="7000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeInValue" className="text-sm font-medium text-gray-700">
                  Trade-in Value
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="tradeInValue"
                    type="number"
                    value={inputs.tradeInValue}
                    onChange={(e) => handleInputChange('tradeInValue', e.target.value)}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesTaxRate" className="text-sm font-medium text-gray-700">
                  Sales Tax (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="salesTaxRate"
                    type="number"
                    step="0.1"
                    value={inputs.salesTaxRate}
                    onChange={(e) => handleInputChange('salesTaxRate', e.target.value)}
                    className="pl-10"
                    placeholder="7.0"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="fees" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Fees
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">Includes loan origination fees, survey fees, title/registration, and documentation fees</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="fees"
                    type="number"
                    value={inputs.fees}
                    onChange={(e) => handleInputChange('fees', e.target.value)}
                    className="pl-10"
                    placeholder="2000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Loan Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            
            {/* Main Result - Monthly Payment */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 sm:p-8 rounded-xl shadow-lg mb-6">
              <div className="text-center">
                <h3 className="text-white text-base sm:text-lg mb-2 font-medium">Monthly Payment</h3>
                <p className="text-white text-4xl sm:text-5xl font-bold">
                  {formatCurrency(results.monthlyPayment)}
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  for {inputs.loanTermYears * 12} months
                </p>
              </div>
            </div>

            {/* Loan Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
              
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-800">Total Loan Amount</h3>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{formatCurrency(results.totalLoanAmount)}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Principal to finance
                </p>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-green-800">Sales Tax</h3>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(results.salesTax)}</p>
                <p className="text-xs text-green-700 mt-1">
                  {inputs.salesTaxRate}% of taxable amount
                </p>
              </div>

              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-purple-800 flex items-center gap-1">
                    Upfront Payment
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-purple-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">Down payment + Sales tax</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h3>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">{formatCurrency(results.upfrontPayment)}</p>
                <p className="text-xs text-purple-700 mt-1">
                  Due at purchase
                </p>
              </div>

              <div className="bg-indigo-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-indigo-800">Total Loan Payments</h3>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-indigo-900">{formatCurrency(results.totalLoanPayments)}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Over loan term
                </p>
              </div>

              <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-red-800">Total Loan Interest</h3>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-900">{formatCurrency(results.totalLoanInterest)}</p>
                <p className="text-xs text-red-700 mt-1">
                  Cost of financing
                </p>
              </div>

              <div className="bg-orange-50 p-4 sm:p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-orange-800">Total Cost</h3>
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-orange-900">{formatCurrency(results.totalCost)}</p>
                <p className="text-xs text-orange-700 mt-1">
                  Price + interest + tax + fees
                </p>
              </div>
            </div>

            {/* Interactive Graphs */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              
              {/* Principal vs Interest Pie Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Loan Breakdown</h3>
                <div className="relative h-64 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    {/* Pie chart */}
                    {results.totalLoanAmount > 0 && (
                      <>
                        {/* Principal slice */}
                        <path
                          d={`M 100 100 L 100 20 A 80 80 0 ${results.principalPercentage > 50 ? 1 : 0} 1 ${
                            100 + 80 * Math.sin((results.principalPercentage / 100) * 2 * Math.PI)
                          } ${
                            100 - 80 * Math.cos((results.principalPercentage / 100) * 2 * Math.PI)
                          } Z`}
                          fill="#10B981"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                          <title>Principal: {formatPercent(results.principalPercentage)}</title>
                        </path>
                        
                        {/* Interest slice */}
                        <path
                          d={`M 100 100 L ${
                            100 + 80 * Math.sin((results.principalPercentage / 100) * 2 * Math.PI)
                          } ${
                            100 - 80 * Math.cos((results.principalPercentage / 100) * 2 * Math.PI)
                          } A 80 80 0 ${results.interestPercentage > 50 ? 1 : 0} 1 100 20 Z`}
                          fill="#EF4444"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                          <title>Interest: {formatPercent(results.interestPercentage)}</title>
                        </path>

                        {/* Center circle for donut effect */}
                        <circle cx="100" cy="100" r="40" fill="white" />
                        
                        {/* Center text */}
                        <text x="100" y="95" textAnchor="middle" className="text-xs fill-gray-600 font-semibold">
                          Total
                        </text>
                        <text x="100" y="110" textAnchor="middle" className="text-xs fill-gray-800 font-bold">
                          {formatCurrency(results.totalLoanPayments).replace('$', '$').slice(0, 8)}
                        </text>
                      </>
                    )}
                  </svg>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Principal ({formatPercent(results.principalPercentage)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">Interest ({formatPercent(results.interestPercentage)})</span>
                  </div>
                </div>
              </div>

              {/* Amortization Progress Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Amortization Schedule</h3>
                <div className="relative h-64">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="interestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines and labels */}
                    {[0, 25, 50, 75, 100].map((percent) => (
                      <g key={percent}>
                        <line
                          x1={40}
                          y1={20 + (160 * percent) / 100}
                          x2={380}
                          y2={20 + (160 * percent) / 100}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text
                          x={35}
                          y={25 + (160 * percent) / 100}
                          textAnchor="end"
                          className="text-xs fill-gray-600"
                        >
                          {100 - percent}%
                        </text>
                      </g>
                    ))}

                    {/* X-axis labels */}
                    {results.schedule.length > 0 && results.schedule.filter((_, i) => 
                      !showMonthlySchedule || i % Math.ceil(results.schedule.length / 5) === 0
                    ).slice(0, 6).map((item, index) => {
                      const totalItems = showMonthlySchedule ? 
                        Math.min(6, results.schedule.length) : 
                        Math.min(6, results.schedule.length);
                      const x = 40 + (340 * index) / Math.max(totalItems - 1, 1);
                      return (
                        <text
                          key={index}
                          x={x}
                          y={200}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {showMonthlySchedule ? `M${item.month}` : `Y${item.year}`}
                        </text>
                      );
                    })}

                    {/* Balance line */}
                    {results.schedule.length > 0 && (
                      <>
                        <polyline
                          points={`40,180 ${results.schedule.map((item, index) => {
                            const x = 40 + (340 * index) / (results.schedule.length - 1);
                            const y = 180 - (160 * (1 - item.endingBalance / results.totalLoanAmount));
                            return `${x},${y}`;
                          }).join(' ')}`}
                          fill="url(#balanceGradient)"
                          stroke="#3B82F6"
                          strokeWidth="2"
                        />

                        {/* Interest line */}
                        <polyline
                          points={`40,180 ${results.schedule.map((item, index) => {
                            const x = 40 + (340 * index) / (results.schedule.length - 1);
                            const y = 180 - (160 * (item.cumulativeInterest / results.totalLoanInterest));
                            return `${x},${y}`;
                          }).join(' ')}`}
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                        />
                      </>
                    )}
                  </svg>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <span className="text-sm text-gray-700">Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-0.5 bg-red-500" style={{ backgroundImage: 'repeating-linear-gradient(to right, #EF4444 0, #EF4444 4px, transparent 4px, transparent 8px)' }}></div>
                    <span className="text-sm text-gray-700">Interest</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amortization Schedule Table */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Amortization Schedule
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Detailed breakdown of principal and interest payments
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!showMonthlySchedule ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setShowMonthlySchedule(false)}
                >
                  Annual Schedule
                </Button>
                <Button
                  variant={showMonthlySchedule ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setShowMonthlySchedule(true)}
                >
                  Monthly Schedule
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                      {showMonthlySchedule ? 'Month' : 'Year'}
                    </th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Interest</th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Principal</th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Ending Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {results.schedule.map((row, index) => (
                    <tr key={showMonthlySchedule ? row.month : row.year} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-2 sm:p-3 text-gray-800 font-medium text-xs sm:text-sm">
                        {showMonthlySchedule ? row.month : row.year}
                      </td>
                      <td className="p-2 sm:p-3 text-right text-red-600 text-xs sm:text-sm">
                        {formatCurrency(row.interest)}
                      </td>
                      <td className="p-2 sm:p-3 text-right text-green-600 text-xs sm:text-sm">
                        {formatCurrency(row.principal)}
                      </td>
                      <td className="p-2 sm:p-3 text-right font-semibold text-gray-800 text-xs sm:text-sm">
                        {formatCurrency(row.endingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Educational Content */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Understanding Boat Loans: Complete Guide to Marine Financing
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600">
              Comprehensive guide to boat financing, associated costs, ownership expenses, and strategic approaches 
              for making informed decisions when purchasing watercraft through loan products.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 prose max-w-none">
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm sm:text-base text-blue-800 leading-relaxed">
                <strong>Important Note:</strong> The Boat Loan Calculator is primarily intended for boat purchases within 
                the United States. Users outside the U.S. may still use it but may need to make adjustments to better 
                suit their circumstances. The calculator provides accurate payment estimates based on standard amortization 
                formulas used by most marine lenders.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">What is a Boat Loan?</h3>
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                  A boat loan is a type of financing specifically designed to facilitate the purchase of a boat. Similar 
                  to auto loans or mortgages, boat loans typically involve borrowing money from a lender (such as a bank, 
                  credit union, or specialized marine finance company) to buy a boat. You repay the loan over time, usually 
                  in fixed monthly installments that include interest. Although unsecured loans can sometimes be used for 
                  boat purchases, typically the boat itself serves as collateral—meaning the lender can repossess it if 
                  payments aren't made.
                </p>
                
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                  Boat loans can be used to finance both new and used boats, ranging from small fishing boats to luxury 
                  yachts and commercial vessels. Lenders generally require a down payment and loan terms often ranging 
                  from 2 to 20 years. Similar to auto loans and mortgages, approval for boat loans—and the interest rates 
                  offered—depend on the applicant's credit score/history, income level, and other financial factors. To 
                  secure the best rates and terms, it's advisable to compare offers from multiple lenders.
                </p>

                <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800">Types of Boat Loans Available</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="font-semibold text-blue-800 text-sm sm:text-base">Secured Marine Loans</p>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                      The boat serves as collateral, typically offering lower interest rates than unsecured options. 
                      Terms can extend up to 20 years for larger vessels, with rates generally ranging from 5% to 10% 
                      depending on creditworthiness, loan amount, and boat age. Most lenders require 10-20% down payment.
                    </p>
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-sm sm:text-base">Unsecured Personal Loans</p>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                      No collateral required but typically feature higher interest rates (8-15%) and shorter terms 
                      (2-7 years). Best suited for smaller boats or borrowers with excellent credit. Approval is 
                      faster but loan amounts may be limited compared to secured options.
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                    <p className="font-semibold text-purple-800 text-sm sm:text-base">Home Equity Loans/Lines of Credit</p>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                      Borrowing against home equity can provide lower rates and tax-deductible interest in some cases. 
                      However, this puts your home at risk if you default. Best for homeowners with substantial equity 
                      seeking competitive rates for larger boat purchases.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Fees Associated with Buying a Boat</h3>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  When purchasing a boat, the initial price is just the starting point. It is essential to budget 
                  accordingly because there are various additional fees that can quickly add up, especially when 
                  financing with a loan. Examples of these fees are described below:
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <div className="border-l-4 border-red-300 pl-3 sm:pl-4 mb-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Sales Tax</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Most U.S. states charge a sales tax ranging from 4% to 8% of the boat's purchase price. Some 
                        states have tax caps and exemptions for trade-ins. For example, a $35,000 boat in a state with 
                        7% sales tax would incur $2,450 in tax (after trade-in exemption if applicable). Always verify 
                        your state's specific requirements as some coastal states have different marine tax structures.
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-orange-300 pl-3 sm:pl-4 mb-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Loan Origination Fees</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Many lenders charge a loan processing fee, typically 1% to 3% of the loan amount. For example, 
                        a $50,000 loan may include an upfront fee of $500 to $1,500. Some lenders roll this into the 
                        loan amount while others require payment at closing. Credit unions often offer lower origination 
                        fees than traditional banks or specialized marine lenders.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-300 pl-3 sm:pl-4 mb-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Marine Survey Fees</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Lenders often require a marine survey (similar to a home inspection) to assess the condition of 
                        used or larger boats. Professional surveys cost $15-$30 per foot of boat length, meaning a 30-foot 
                        vessel could incur $450-$900 in survey costs. This protects both you and the lender from purchasing 
                        a vessel with hidden structural or mechanical issues.
                      </p>
                    </div>

                    <div className="border-l-4 border-green-300 pl-3 sm:pl-4 mb-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Title and Registration Fees</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Boats need to be registered with state authorities, and fees vary based on location and boat size, 
                        typically ranging from $50 to $500 annually. Some states require one-time title fees of $100-$300. 
                        Dealers often assist with registration during the purchase, but in some cases, especially with private 
                        sales, buyers must handle registration themselves. Coast Guard documentation is an alternative for 
                        vessels over 26 feet, costing around $100.
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-300 pl-3 sm:pl-4 mb-3">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Documentation & Dealer Fees</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Dealers may charge fees for processing paperwork during the purchase, typically $200-$600. These 
                        fees cover title transfer, registration preparation, and loan documentation. While negotiable, 
                        they're standard practice at most dealerships. Always ask for an itemized breakdown before finalizing 
                        any purchase.
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Trailer Costs</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Small boats typically require a trailer for transport, which often needs to be purchased separately. 
                        Trailers range from $1,000 for basic models to $5,000+ for custom or tandem-axle versions. Consider 
                        trailer maintenance, registration, and insurance as additional ongoing costs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm sm:text-base text-orange-800 font-semibold mb-1">Total Fee Estimate</p>
                  <p className="text-xs sm:text-sm text-orange-700 leading-relaxed">
                    These fees can collectively amount to thousands of dollars, often representing 10-15% of the boat's 
                    purchase price. For a $35,000 boat, expect $3,500-$5,250 in additional costs. Always ask your lender 
                    or dealer for a detailed breakdown before finalizing the purchase to avoid surprises at closing.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Ongoing Costs of Boat Ownership</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Owning a boat involves ongoing expenses beyond loan payments, creating a long-term financial commitment. 
                The popular saying "a boat is a hole in the water you throw money into" highlights the reality that 
                ownership costs can be substantial. Understanding these expenses upfront helps prevent financial surprises 
                and ensures you budget adequately for the complete ownership experience. Here's what to anticipate:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Monthly Loan Payments
                    </h4>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Monthly payments depend on the loan amount, interest rate, and loan term. A $28,000 loan at 7% 
                      interest over 10 years results in approximately $325 monthly. Payments on larger vessels can easily 
                      exceed $1,000-$2,000 per month. Consider setting up automatic payments to avoid late fees and 
                      maintain good credit standing.
                    </p>
                    <p className="text-blue-600 text-xs italic">
                      Tip: Making extra principal payments early in the loan can save thousands in interest over time.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base flex items-center gap-2">
                      <Anchor className="h-4 w-4" />
                      Insurance Costs
                    </h4>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Boat insurance costs vary widely based on boat size, type, value, and usage. Annual premiums typically 
                      range from 1-5% of the boat's value. A $35,000 boat might cost $350-$1,750 annually. Insurance generally 
                      covers damage, liability, and theft, and is usually mandatory for financed boats. Additional coverage 
                      for personal property, towing, and uninsured boaters increases costs but provides valuable protection.
                    </p>
                    <p className="text-green-600 text-xs italic">
                      Coastal and saltwater use typically results in higher premiums due to increased risk.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-1 sm:mb-2 text-sm sm:text-base">Maintenance and Repairs</h4>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Regular upkeep—including engine servicing, hull cleaning, and winterization—is necessary to keep a 
                      boat in good condition. Budget 10-15% of the boat's value annually for maintenance. Annual costs for 
                      a mid-sized boat include oil changes ($150-$300), hull cleaning ($200-$500), winterization ($300-$600), 
                      and miscellaneous repairs ($500-$2,000). Saltwater use and older boats require more frequent maintenance.
                    </p>
                    <p className="text-purple-600 text-xs italic">
                      Preventive maintenance is far less expensive than major repairs from neglect.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">Fuel Expenses</h4>
                    <p className="text-red-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Fuel costs can vary significantly based on boat type, engine size, and usage patterns. Small boats 
                      might only use around $20-$50 per outing (4-8 gallons), whereas larger vessels with twin engines 
                      could require hundreds of dollars or more per trip. Most boats have lower fuel efficiency compared 
                      to vehicles—expect 2-6 miles per gallon for typical recreational boats. At current prices, budget 
                      $500-$3,000+ annually depending on usage.
                    </p>
                    <p className="text-red-600 text-xs italic">
                      Weekend warriors typically spend less on fuel than those who boat multiple times weekly.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">Storage and Docking</h4>
                    <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Unless you have private docking or storage facilities, you'll need to pay for marina slips or dry 
                      storage. Marina slip fees vary dramatically by location, from $1,500-$3,000 annually in rural areas 
                      to $10,000-$30,000+ in premium coastal locations. Dry storage (indoor/outdoor) typically costs less, 
                      ranging from $50-$200 monthly. Winter storage adds $500-$2,000 depending on your region.
                    </p>
                    <p className="text-yellow-600 text-xs italic">
                      Waterfront property ownership can eliminate storage costs but requires significant investment.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-1 sm:mb-2 text-sm sm:text-base">Gear and Accessories</h4>
                    <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Essential items such as life jackets, fire extinguishers, navigation electronics, fishing gear, and 
                      recreational upgrades can quickly add to your expenses. Initial safety equipment costs $300-$1,000. 
                      Electronics upgrades (GPS, fish finders, radar) range from $500-$5,000+. Ongoing replacement of safety 
                      gear, cleaning supplies, and accessories adds $200-$500 annually. Many states mandate specific safety 
                      equipment, so research requirements before purchasing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-r-lg">
                <h4 className="text-base sm:text-lg font-bold text-orange-900 mb-2 sm:mb-3">Total Annual Ownership Cost Example</h4>
                <p className="text-sm sm:text-base text-orange-800 leading-relaxed mb-3">
                  For a mid-sized boat valued at approximately $30,000-$35,000, annual costs could range from 
                  $3,000 to $7,000, excluding the loan itself. This represents roughly 10-20% of the boat's value annually:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-orange-900">
                  <div className="space-y-1">
                    <p>• Insurance: $400-$1,200</p>
                    <p>• Maintenance: $800-$1,500</p>
                    <p>• Storage/Docking: $1,000-$3,000</p>
                  </div>
                  <div className="space-y-1">
                    <p>• Fuel: $500-$1,500</p>
                    <p>• Registration: $100-$300</p>
                    <p>• Gear/Accessories: $200-$500</p>
                  </div>
                </div>
                <p className="text-sm text-orange-800 mt-3 font-semibold">
                  Planning for these expenses in advance can help prevent financial surprises and ensure you can 
                  fully enjoy boat ownership without stress.
                </p>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Strategic Financing Approaches</h3>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  Smart financing decisions can save thousands of dollars over the life of your boat loan. Understanding 
                  these strategies helps you negotiate better terms, reduce total interest paid, and maintain financial 
                  flexibility throughout ownership.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Down Payment Optimization</h4>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-2">
                      While many lenders accept 10-15% down payments, putting down 20% or more significantly reduces 
                      monthly payments and total interest paid. For a $35,000 boat, increasing your down payment from 
                      $3,500 (10%) to $7,000 (20%) reduces the loan amount by $3,500, potentially saving $2,000-$3,000 
                      in interest over a 10-year term while lowering monthly payments by approximately $40-$50.
                    </p>
                    <p className="text-blue-600 text-xs italic">
                      Larger down payments may also qualify you for lower interest rates from some lenders.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base">Term Length Considerations</h4>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Shorter loan terms mean higher monthly payments but substantially less total interest. A $28,000 
                      loan at 7% for 5 years costs approximately $554/month with $5,240 total interest, while the same 
                      loan for 10 years costs $325/month but $11,012 in total interest—more than double. Choose the 
                      shortest term you can comfortably afford to minimize total cost.
                    </p>
                    <p className="text-green-600 text-xs italic">
                      Consider your boat's expected lifespan—avoid loans longer than the boat's useful life.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-1 sm:mb-2 text-sm sm:text-base">Interest Rate Shopping</h4>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Interest rates can vary by 1-3% between lenders. On a $28,000 loan over 10 years, the difference 
                      between 7% and 6% interest saves approximately $1,500 in total interest. Always compare offers from 
                      multiple sources: credit unions (often lowest rates), banks, online lenders, and dealer financing. 
                      Check rates within a 14-day window to minimize credit score impact from multiple inquiries.
                    </p>
                    <p className="text-purple-600 text-xs italic">
                      Credit unions often offer rates 0.5-1.5% lower than traditional banks for marine loans.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-1 sm:mb-2 text-sm sm:text-base">Extra Payment Strategies</h4>
                    <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Making additional principal payments accelerates loan payoff and reduces total interest. Adding just 
                      $50-$100 extra monthly on a $28,000 loan at 7% can save $2,000-$4,000 in interest and shorten the 
                      loan by 2-4 years. Even annual lump-sum payments from tax refunds or bonuses make significant impact. 
                      Verify your loan has no prepayment penalties before implementing this strategy.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Making an Informed Buying Decision</h3>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  Buying a boat can be an exciting step toward enjoying leisure time on the water, starting a business, 
                  or pursuing other adventures. However, it's important to approach the decision thoughtfully, considering 
                  all financial aspects beyond just the sticker price and monthly payment.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">Credit Score Impact</h4>
                    <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Your credit score significantly affects loan approval and interest rates. Excellent credit (740+) 
                      typically qualifies for the best rates (5-7%), while good credit (670-739) sees moderate rates (7-9%). 
                      Fair credit (580-669) faces higher rates (9-12%) or may require co-signers. Before applying, check 
                      your credit report for errors and consider improving your score if time permits—each 20-point 
                      improvement can reduce your rate by 0.25-0.5%.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">New vs. Used Boat Considerations</h4>
                    <p className="text-red-700 text-xs sm:text-sm leading-relaxed mb-2">
                      New boats typically command lower interest rates (5-8%) and longer loan terms but depreciate 15-20% 
                      immediately. Used boats cost less upfront but may have higher rates (7-10%) and require marine surveys 
                      ($300-$1,000). A 3-5 year old boat offers the best value—past initial depreciation but still relatively 
                      modern. Boats over 10 years old may face financing challenges with some lenders requiring higher down 
                      payments or shorter terms.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="font-semibold text-teal-800 mb-1 sm:mb-2 text-sm sm:text-base">Depreciation and Resale Value</h4>
                    <p className="text-teal-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Boats depreciate faster than many other assets. New boats lose 15-20% in year one, then 7-10% annually 
                      for years 2-5, stabilizing at 5-7% thereafter. Popular brands and well-maintained boats hold value 
                      better. A $35,000 new boat might be worth $28,000 after one year and $20,000 after five years. This 
                      matters if you plan to upgrade—you could owe more than the boat's worth if you financed with minimal 
                      down payment.
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-sm sm:text-base">Seasonal Buying Advantages</h4>
                    <p className="text-orange-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Timing your purchase can save thousands. Late fall through winter (October-February in most regions) 
                      offers the best deals as dealers clear inventory and face less competition. Prices can be 10-20% lower 
                      than peak season (May-July). Trade-in values are also negotiable during off-season. However, selection 
                      is more limited, and you won't use the boat until spring—consider storage costs in your decision.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-r-lg">
                  <h4 className="text-sm sm:text-base font-bold text-green-900 mb-2">The 10% Rule of Thumb</h4>
                  <p className="text-xs sm:text-sm text-green-800 leading-relaxed">
                    A common guideline suggests your total boat-related expenses (loan payment + insurance + maintenance + 
                    storage + fuel) shouldn't exceed 10% of your gross annual income. For someone earning $75,000 annually, 
                    this means total monthly boat costs should stay under $625. This ensures boat ownership remains enjoyable 
                    rather than becoming a financial burden that limits other life goals and experiences.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                How to Use This Calculator Effectively
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Getting Started</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Enter the boat's purchase price from the dealer or private seller</li>
                    <li>• Input your planned down payment (typically 10-20% of price)</li>
                    <li>• Add trade-in value if you're trading an existing boat</li>
                    <li>• Set your state's sales tax rate (0% to 10% typically)</li>
                    <li>• Include estimated fees from your lender or dealer</li>
                    <li>• Choose your loan term (2-20 years available)</li>
                    <li>• Enter the interest rate quoted by your lender</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Interpreting Results</h4>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Monthly payment is your recurring obligation</li>
                    <li>• Total cost shows the complete financial commitment</li>
                    <li>• Review the amortization schedule to see interest vs. principal</li>
                    <li>• Use annual/monthly toggle to view payment breakdowns</li>
                    <li>• Compare different scenarios by adjusting inputs</li>
                    <li>• Add estimated ongoing costs to determine affordability</li>
                    <li>• Consider the loan breakdown chart to visualize interest impact</li>
                  </ul>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default BoatLoanCalculatorComponent;
