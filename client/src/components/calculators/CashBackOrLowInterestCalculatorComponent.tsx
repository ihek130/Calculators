import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Info, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Car,
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CalculatorInputs {
  cashBackAmount: number;
  highInterestRate: number;
  lowInterestRate: number;
  autoPrice: number;
  loanTermMonths: number;
  downPayment: number;
  tradeInValue: number;
  salesTax: number;
  otherFees: number;
}

interface OfferResults {
  totalLoanAmount: number;
  salesTaxAmount: number;
  upfrontPayment: number;
  monthlyPayment: number;
  totalLoanPayments: number;
  totalInterest: number;
  totalCost: number;
}

interface ComparisonResults {
  cashBackOffer: OfferResults;
  lowInterestOffer: OfferResults;
  betterOption: 'cashback' | 'lowinterest';
  savingsAmount: number;
}

const CashBackOrLowInterestCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    cashBackAmount: 1000,
    highInterestRate: 5,
    lowInterestRate: 2,
    autoPrice: 50000,
    loanTermMonths: 60,
    downPayment: 10000,
    tradeInValue: 0,
    salesTax: 7,
    otherFees: 2000
  });

  const [results, setResults] = useState<ComparisonResults | null>(null);

  useEffect(() => {
    calculateComparison();
  }, [
    inputs.cashBackAmount,
    inputs.highInterestRate,
    inputs.lowInterestRate,
    inputs.autoPrice,
    inputs.loanTermMonths,
    inputs.downPayment,
    inputs.tradeInValue,
    inputs.salesTax,
    inputs.otherFees
  ]);

  const calculateMonthlyPayment = (principal: number, annualRate: number, months: number): number => {
    if (annualRate === 0) {
      return principal / months;
    }
    const monthlyRate = annualRate / 100 / 12;
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };

  const calculateOffer = (
    price: number,
    cashBack: number,
    interestRate: number,
    months: number,
    downPayment: number,
    tradeIn: number,
    taxRate: number,
    fees: number
  ): OfferResults => {
    // Calculate price after cash back
    const priceAfterRebate = price - cashBack;
    
    // Calculate sales tax (on original price in most states)
    const salesTaxAmount = (price * taxRate) / 100;
    
    // Calculate loan amount (price after rebate - down payment - trade-in)
    const totalLoanAmount = priceAfterRebate - downPayment - tradeIn;
    
    // Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(totalLoanAmount, interestRate, months);
    
    // Calculate total loan payments
    const totalLoanPayments = monthlyPayment * months;
    
    // Calculate total interest
    const totalInterest = totalLoanPayments - totalLoanAmount;
    
    // Calculate upfront payment (down payment + trade-in + tax + fees)
    const upfrontPayment = downPayment + tradeIn + salesTaxAmount + fees;
    
    // Calculate total cost
    const totalCost = price + totalInterest + salesTaxAmount + fees;
    
    return {
      totalLoanAmount,
      salesTaxAmount,
      upfrontPayment,
      monthlyPayment,
      totalLoanPayments,
      totalInterest,
      totalCost
    };
  };

  const calculateComparison = () => {
    if (inputs.autoPrice <= 0 || inputs.loanTermMonths <= 0) {
      return;
    }

    // Calculate Cash Back Offer (with high interest rate)
    const cashBackOffer = calculateOffer(
      inputs.autoPrice,
      inputs.cashBackAmount,
      inputs.highInterestRate,
      inputs.loanTermMonths,
      inputs.downPayment,
      inputs.tradeInValue,
      inputs.salesTax,
      inputs.otherFees
    );

    // Calculate Low Interest Rate Offer (no cash back)
    const lowInterestOffer = calculateOffer(
      inputs.autoPrice,
      0, // No cash back
      inputs.lowInterestRate,
      inputs.loanTermMonths,
      inputs.downPayment,
      inputs.tradeInValue,
      inputs.salesTax,
      inputs.otherFees
    );

    // Determine which is better
    const betterOption = cashBackOffer.totalCost < lowInterestOffer.totalCost ? 'cashback' : 'lowinterest';
    const savingsAmount = Math.abs(cashBackOffer.totalCost - lowInterestOffer.totalCost);

    setResults({
      cashBackOffer,
      lowInterestOffer,
      betterOption,
      savingsAmount
    });
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numValue }));
  };

  const handleReset = () => {
    setInputs({
      cashBackAmount: 1000,
      highInterestRate: 5,
      lowInterestRate: 2,
      autoPrice: 50000,
      loanTermMonths: 60,
      downPayment: 10000,
      tradeInValue: 0,
      salesTax: 7,
      otherFees: 2000
    });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Chart data
  const comparisonData = results ? [
    {
      category: 'Monthly Payment',
      cashBack: results.cashBackOffer.monthlyPayment,
      lowInterest: results.lowInterestOffer.monthlyPayment
    },
    {
      category: 'Total Interest',
      cashBack: results.cashBackOffer.totalInterest,
      lowInterest: results.lowInterestOffer.totalInterest
    },
    {
      category: 'Total Cost',
      cashBack: results.cashBackOffer.totalCost,
      lowInterest: results.lowInterestOffer.totalCost
    }
  ] : [];

  const pieData = results ? [
    { name: 'Cash Back Offer', value: results.cashBackOffer.totalCost, color: '#f59e0b' },
    { name: 'Low Interest Offer', value: results.lowInterestOffer.totalCost, color: '#3b82f6' }
  ] : [];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl shadow-lg">
            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Cash Back or Low Interest Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed px-4">
          Auto manufacturers may offer either a cash back rebate or a low interest rate with a car purchase. 
          Use this calculator to find out which of the two offers is the better deal for you.
        </p>
      </div>

      {/* Main Calculator Card */}
      <Card className="shadow-xl border-t-4 border-t-orange-500">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            <span className="hidden sm:inline">Calculator Inputs</span>
            <span className="sm:hidden">Inputs</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Modify the values and click calculate to compare offers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cash Back Offer Section */}
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-5 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cash Back Offer
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashBackAmount" className="text-xs sm:text-sm font-medium">
                      Cash Back Amount ($)
                    </Label>
                    <Input
                      id="cashBackAmount"
                      type="number"
                      value={inputs.cashBackAmount || ''}
                      onChange={(e) => handleInputChange('cashBackAmount', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 1000"
                      step="100"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="highInterestRate" className="text-xs sm:text-sm font-medium">
                      Interest Rate - High (%)
                    </Label>
                    <Input
                      id="highInterestRate"
                      type="number"
                      value={inputs.highInterestRate || ''}
                      onChange={(e) => handleInputChange('highInterestRate', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 5"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Low Interest Rate Offer Section */}
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 sm:p-5 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5" />
                  Low Interest Rate Offer
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lowInterestRate" className="text-xs sm:text-sm font-medium">
                      Interest Rate - Low (%)
                    </Label>
                    <Input
                      id="lowInterestRate"
                      type="number"
                      value={inputs.lowInterestRate || ''}
                      onChange={(e) => handleInputChange('lowInterestRate', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 2"
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Information Section */}
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-5 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5" />
                  Other Information
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoPrice" className="text-xs sm:text-sm font-medium">
                      Auto Price ($)
                    </Label>
                    <Input
                      id="autoPrice"
                      type="number"
                      value={inputs.autoPrice || ''}
                      onChange={(e) => handleInputChange('autoPrice', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 50000"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loanTermMonths" className="text-xs sm:text-sm font-medium">
                      Loan Term (months)
                    </Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      value={inputs.loanTermMonths || ''}
                      onChange={(e) => handleInputChange('loanTermMonths', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 60"
                      step="12"
                      min="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downPayment" className="text-xs sm:text-sm font-medium">
                      Down Payment ($)
                    </Label>
                    <Input
                      id="downPayment"
                      type="number"
                      value={inputs.downPayment || ''}
                      onChange={(e) => handleInputChange('downPayment', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 10000"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradeInValue" className="text-xs sm:text-sm font-medium">
                      Trade-in Value ($)
                    </Label>
                    <Input
                      id="tradeInValue"
                      type="number"
                      value={inputs.tradeInValue || ''}
                      onChange={(e) => handleInputChange('tradeInValue', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 0"
                      step="1000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesTax" className="text-xs sm:text-sm font-medium">
                      Sales Tax (%)
                    </Label>
                    <Input
                      id="salesTax"
                      type="number"
                      value={inputs.salesTax || ''}
                      onChange={(e) => handleInputChange('salesTax', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 7"
                      step="0.1"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherFees" className="text-xs sm:text-sm font-medium">
                      Title, Registration & Other Fees ($)
                    </Label>
                    <Input
                      id="otherFees"
                      type="number"
                      value={inputs.otherFees || ''}
                      onChange={(e) => handleInputChange('otherFees', e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="e.g., 2000"
                      step="100"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="w-full text-xs sm:text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Calculator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <>
          {/* Winner Card */}
          <Card className={`shadow-xl border-t-4 ${
            results.betterOption === 'lowinterest' ? 'border-t-blue-500' : 'border-t-orange-500'
          }`}>
            <CardHeader className={`bg-gradient-to-r ${
              results.betterOption === 'lowinterest' 
                ? 'from-blue-50 to-cyan-50' 
                : 'from-orange-50 to-amber-50'
            } border-b`}>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {results.betterOption === 'lowinterest' ? (
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                )}
                <span className="hidden sm:inline">
                  {results.betterOption === 'lowinterest' 
                    ? 'The Low Interest Rate Offer is Better!' 
                    : 'The Cash Back Offer is Better!'}
                </span>
                <span className="sm:hidden">
                  {results.betterOption === 'lowinterest' ? 'Low Interest Wins!' : 'Cash Back Wins!'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className={`p-4 sm:p-6 rounded-lg ${
                results.betterOption === 'lowinterest' 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {results.betterOption === 'lowinterest' ? (
                    <>
                      The low interest rate will save you{' '}
                      <strong className="text-blue-700">
                        {formatCurrency(
                          results.cashBackOffer.totalInterest - results.lowInterestOffer.totalInterest
                        )}
                      </strong>{' '}
                      in interest, which is {
                        results.cashBackOffer.totalInterest - results.lowInterestOffer.totalInterest > inputs.cashBackAmount
                          ? 'larger'
                          : 'comparable to'
                      } the cash back of{' '}
                      <strong className="text-orange-700">{formatCurrency(inputs.cashBackAmount)}</strong>.
                      <br />
                      <span className="text-xs sm:text-sm text-gray-600 mt-2 block">
                        Total savings with low interest: {formatCurrency(results.savingsAmount)}
                      </span>
                    </>
                  ) : (
                    <>
                      The cash back offer of{' '}
                      <strong className="text-orange-700">{formatCurrency(inputs.cashBackAmount)}</strong>{' '}
                      plus the interest difference results in greater savings than the low interest rate offer.
                      <br />
                      <span className="text-xs sm:text-sm text-gray-600 mt-2 block">
                        Total savings with cash back: {formatCurrency(results.savingsAmount)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Back Offer Results */}
            <Card className="shadow-lg border-l-4 border-l-orange-500">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <span className="hidden sm:inline">With Cash Back Offer</span>
                  <span className="sm:hidden">Cash Back Offer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Total Loan Amount</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.cashBackOffer.totalLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Sales Tax</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.cashBackOffer.salesTaxAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Upfront Payment</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.cashBackOffer.upfrontPayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b bg-orange-50">
                  <span className="text-xs sm:text-sm font-medium text-orange-900">Monthly Payment</span>
                  <span className="text-base sm:text-lg font-bold text-orange-700">
                    {formatCurrency(results.cashBackOffer.monthlyPayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Total of {inputs.loanTermMonths} Loan Payments
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.cashBackOffer.totalLoanPayments)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Total Loan Interest</span>
                  <span className="text-sm sm:text-base font-semibold text-red-600">
                    {formatCurrency(results.cashBackOffer.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-orange-100 to-amber-100 rounded-lg px-3 mt-2">
                  <span className="text-sm sm:text-base font-bold text-orange-900">
                    Total Cost (price, interest, tax, fees)
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-orange-700">
                    {formatCurrency(results.cashBackOffer.totalCost)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Low Interest Offer Results */}
            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Percent className="h-5 w-5 text-blue-600" />
                  <span className="hidden sm:inline">With Low Interest Rate Offer</span>
                  <span className="sm:hidden">Low Interest Offer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Total Loan Amount</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.lowInterestOffer.totalLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Sales Tax</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.lowInterestOffer.salesTaxAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Upfront Payment</span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.lowInterestOffer.upfrontPayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b bg-blue-50">
                  <span className="text-xs sm:text-sm font-medium text-blue-900">Monthly Payment</span>
                  <span className="text-base sm:text-lg font-bold text-blue-700">
                    {formatCurrency(results.lowInterestOffer.monthlyPayment)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Total of {inputs.loanTermMonths} Loan Payments
                  </span>
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {formatCurrency(results.lowInterestOffer.totalLoanPayments)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-xs sm:text-sm text-gray-600">Total Loan Interest</span>
                  <span className="text-sm sm:text-base font-semibold text-green-600">
                    {formatCurrency(results.lowInterestOffer.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg px-3 mt-2">
                  <span className="text-sm sm:text-base font-bold text-blue-900">
                    Total Cost (price, interest, tax, fees)
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-blue-700">
                    {formatCurrency(results.lowInterestOffer.totalCost)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visual Comparison Charts */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                <span className="hidden sm:inline">Visual Comparison</span>
                <span className="sm:hidden">Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 11 }} 
                        angle={-15}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '10px' }}
                        iconSize={12}
                      />
                      <Bar dataKey="cashBack" fill="#f59e0b" name="Cash Back Offer" />
                      <Bar dataKey="lowInterest" fill="#3b82f6" name="Low Interest Offer" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ 
                          paddingTop: '10px',
                          paddingLeft: '20px', 
                          paddingRight: '20px' 
                        }}
                        iconSize={12}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Cash Back Savings</p>
                  <p className="text-sm sm:text-base font-bold text-orange-700">
                    {formatCurrency(inputs.cashBackAmount)}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Interest Difference</p>
                  <p className="text-sm sm:text-base font-bold text-blue-700">
                    {formatCurrency(
                      results.cashBackOffer.totalInterest - results.lowInterestOffer.totalInterest
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Total Savings</p>
                  <p className="text-sm sm:text-base font-bold text-green-700">
                    {formatCurrency(results.savingsAmount)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <p className="text-xs text-gray-600 mb-1">Better Option</p>
                  <p className="text-sm sm:text-base font-bold text-purple-700">
                    {results.betterOption === 'lowinterest' ? 'Low Interest' : 'Cash Back'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content - Step 2 */}
      <div className="space-y-6">
        {/* Cash Rebate Explanation */}
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-orange-600" />
              Understanding Cash Rebates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>vehicle cash rebate</strong> is an additional deduction on the purchase price of a car, functioning 
              as an immediate discount that reduces the amount you need to finance. The amounts generally range between a 
              few hundred to a few thousand dollars. In some cases, the rebate is large enough to cover the entire down 
              payment, making it easier for buyers to afford their dream vehicle without a substantial upfront cash investment.
            </p>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border border-orange-200">
              <h4 className="font-bold text-orange-900 mb-4">Types of Cash Rebates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-2">General Rebates</h5>
                  <p className="text-sm text-gray-700">
                    Available to any potential buyer who purchases a qualifying vehicle. These are the most common type 
                    of rebate and are typically advertised prominently by manufacturers.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-2">Special Group Rebates</h5>
                  <p className="text-sm text-gray-700">
                    <strong>Military rebates:</strong> For active duty or veterans<br />
                    <strong>Student rebates:</strong> For current college students<br />
                    <strong>First-time buyer rebates:</strong> For new car buyers
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-2">Loyalty Rebates</h5>
                  <p className="text-sm text-gray-700">
                    Offered to returning customers trading in a same-make vehicle from previous years. Manufacturers 
                    reward brand loyalty with additional discounts.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-100">
                  <h5 className="font-semibold text-orange-900 mb-2">Conquest Incentives</h5>
                  <p className="text-sm text-gray-700">
                    Designed to attract buyers switching from a competitor's model. These incentives help manufacturers 
                    steal market share from rivals.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Rebate Distribution Methods
              </h5>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Instant Rebate (Preferred)</p>
                  <p className="text-sm text-gray-700">
                    An <strong>immediate deduction</strong> off the negotiated price of the car. This is the most desirable 
                    form because the rebate is applied instantly, reducing your loan amount and monthly payments right away. 
                    You see the benefit immediately at the point of purchase.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Mail-in Rebate</p>
                  <p className="text-sm text-gray-700">
                    Some rebates arrive as a <strong>check or prepaid credit card</strong> from the manufacturer four to 
                    eight weeks after purchase. While less convenient than instant rebates, you'll still receive the full 
                    rebate amount—just with a delay. Plan accordingly if you're counting on this money for other expenses.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Important: Tax Treatment of Rebates
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                Several states in the U.S. view cash rebates as <strong>payments from auto manufacturers</strong>, not as 
                reductions in purchase price. This has significant tax implications:
              </p>
              <div className="bg-white p-4 rounded-lg border border-amber-100 mb-3">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Example:</strong> The purchase of a vehicle at $30,000 with a cash rebate of $2,000 will have 
                  sales tax calculated based on <span className="font-bold text-red-600">$30,000</span>, not $28,000.
                </p>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                <strong>States that DO NOT tax cash rebates (Good News!):</strong>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs text-gray-700">
                <div>✓ Alaska</div>
                <div>✓ Arizona</div>
                <div>✓ Delaware</div>
                <div>✓ Iowa</div>
                <div>✓ Kansas</div>
                <div>✓ Kentucky</div>
                <div>✓ Louisiana</div>
                <div>✓ Massachusetts</div>
                <div>✓ Minnesota</div>
                <div>✓ Missouri</div>
                <div>✓ Montana</div>
                <div>✓ Nebraska</div>
                <div>✓ New Hampshire</div>
                <div>✓ Oklahoma</div>
                <div>✓ Oregon</div>
                <div>✓ Pennsylvania</div>
                <div>✓ Rhode Island</div>
                <div>✓ Texas</div>
                <div>✓ Utah</div>
                <div>✓ Vermont</div>
                <div>✓ Wyoming</div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
              <h5 className="font-semibold text-purple-900 mb-2">Who Benefits Most from Cash Rebates?</h5>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Cash buyers benefit exclusively from rebates.</strong> Buyers who plan on paying cash entirely 
                upfront will only benefit from the cash rebate option. Because there is no financing involved in the 
                purchase, it doesn't matter whether the interest rate is 0% or 10%—the low interest rate offer provides 
                no advantage without a loan.
              </p>
              <p className="text-sm text-gray-700">
                Additionally, some dealers may require the financing of the auto loan to be done through a 
                <strong> captive lender</strong> (a financing company owned by the manufacturer) in order to qualify 
                for certain rebates.
              </p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Important Note:</strong> Almost all vehicle cash rebates originate from <strong>car manufacturers</strong> 
                rather than car dealers. The manufacturer's goal is to incentivize potential buyers to purchase cars—usually 
                to clear out old inventory or jump-start sales for vehicles that aren't selling well. Rebates should not be 
                confused with a <em>dealer holdback</em>, which is a portion of a vehicle's sales price (usually 2-3% of MSRP) 
                that a dealer is allowed to "hold back" from manufacturers on a quarterly basis.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Low-Interest Financing */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Percent className="h-6 w-6 text-blue-600" />
              Low-Interest Financing Explained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              When car buyers receive more favorable interest rates than usual on their car purchases (direct from the 
              dealer, not as a preapproval from an external source such as a bank), this is called <strong>low-interest 
              financing</strong>. A car loan at a lower rate will require the car buyer to pay less in interest during 
              the life of the loan, effectively reducing the total cost of ownership.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-4">How Low-Interest Financing Works</h4>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Interest Savings Over Time</p>
                  <p className="text-sm text-gray-700 mb-3">
                    Similar to a cash rebate, low-interest financing reduces the total cost to own the car in the end—just 
                    by a different method. Instead of an upfront discount, you save money through reduced interest payments 
                    over the life of the loan.
                  </p>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-700">
                      <strong>Example:</strong> On a $40,000 loan over 60 months, reducing the interest rate from 5% to 2% 
                      saves approximately $3,000+ in interest—potentially more than a typical cash rebate.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Interest Rate vs. Rebate Amount</p>
                  <p className="text-sm text-gray-700">
                    The lower a given rate, the more likely it is that it will reduce the cost of a car purchase more than 
                    a cash rebate. As loan amounts increase and loan terms lengthen, the advantage of low-interest financing 
                    becomes more pronounced. Use our calculator to determine which option saves you more based on your 
                    specific situation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Who Qualifies for Low-Interest Financing?
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                While cash rebates tend to be more widely available to everyone, <strong>low-interest financing is 
                generally reserved for a select few</strong>. Car ads often refer to these buyers as "well-qualified buyers."
              </p>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Credit Score Requirements</p>
                  <p className="text-sm text-gray-700">
                    Buyers must typically have <strong>excellent credit scores</strong> (usually 720+ FICO) to qualify 
                    for the lowest advertised rates. Buyers with negative marks in their credit history, such as missed 
                    or late payments, may not qualify for low-interest financing at all.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Down Payment Requirements</p>
                  <p className="text-sm text-gray-700">
                    In some cases, buyers must make <strong>larger down payments</strong> (often 10-20% or more) to 
                    qualify for promotional rates. This reduces the lender's risk and demonstrates the buyer's financial 
                    commitment.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Income Verification</p>
                  <p className="text-sm text-gray-700">
                    Lenders typically require proof of stable income and favorable debt-to-income ratios. Your monthly 
                    car payment shouldn't exceed 15-20% of your gross monthly income to qualify for the best rates.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
              <h5 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Limited Introductory Periods
              </h5>
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> In some cases, the low rate only applies to a <strong>brief introductory 
                period</strong> (such as for the first 12 months) as opposed to the entirety of the loan. After the 
                introductory period expires, the rate may jump significantly higher. <span className="font-bold">
                Our calculator assumes the low rate applies to the entire loan term and will not work accurately for 
                loans where the low financing only applies to a limited period.</span> Always read the fine print and 
                ask dealers to clarify the terms.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                The Zero Percent Financing Trap
              </h5>
              <p className="text-sm text-gray-700 mb-2">
                While 0% financing sounds incredible, it often comes with catches:
              </p>
              <ul className="space-y-1 text-sm text-gray-700 ml-4">
                <li>• May require forfeiting other discounts or rebates</li>
                <li>• Usually limited to the shortest loan terms (36-48 months)</li>
                <li>• Only available on specific models (often slow-selling inventory)</li>
                <li>• Requires top-tier credit (typically 750+ FICO score)</li>
                <li>• May have higher vehicle prices to compensate for zero interest</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Which One to Choose */}
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-6 w-6 text-purple-600" />
              Which Option Should You Choose?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Both options reduce the total cost of owning a car in the end, just by different methods. Generally, it 
              comes down to which amount is higher: <strong>the rebate amount or the total interest saved from the low 
              introductory rate</strong>. The calculator above helps you determine which option will result in higher 
              savings based on your specific circumstances.
            </p>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-4">Decision Framework</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h5 className="font-semibold text-purple-900">Choose Cash Back If:</h5>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>You're paying cash entirely (no financing needed)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>Your credit score doesn't qualify for low rates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>The rebate amount exceeds interest savings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>You have a short loan term (36 months or less)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>You need immediate cash for down payment/fees</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h5 className="font-semibold text-purple-900">Choose Low Interest If:</h5>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>You have excellent credit (720+ FICO score)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>You're financing a large loan amount ($30K+)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>You have a longer loan term (60-72 months)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Interest savings exceed the cash rebate amount</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>The low rate applies to the entire loan term</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3">Example Comparison Scenarios</h5>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Scenario 1: Cash Back Wins</p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Vehicle:</strong> $25,000 | <strong>Loan Term:</strong> 36 months | 
                    <strong>Cash Back:</strong> $3,000 | <strong>Rates:</strong> 4% vs 2%
                  </p>
                  <p className="text-xs text-gray-600">
                    With a short loan term and smaller loan amount, the interest difference is only ~$600, making the 
                    $3,000 cash back the clear winner.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Scenario 2: Low Interest Wins</p>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Vehicle:</strong> $50,000 | <strong>Loan Term:</strong> 72 months | 
                    <strong>Cash Back:</strong> $1,000 | <strong>Rates:</strong> 6% vs 1.9%
                  </p>
                  <p className="text-xs text-gray-600">
                    With a large loan and extended term, the interest savings exceed $5,000, making the low interest 
                    rate offer significantly better than the modest $1,000 rebate.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Considerations */}
        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Important Considerations & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-5 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-900 mb-3">Shop Around for Better Rates</h4>
              <p className="text-sm text-gray-700 mb-3">
                Even when dealers offer their lowest interest rate financing, there is <strong>no guarantee that it is 
                the best possible rate available</strong> to car buyers, especially if their credit scores are on the 
                lower end.
              </p>
              <div className="bg-white p-4 rounded-lg border border-red-100">
                <p className="font-semibold text-red-900 mb-2">Get Pre-Approved First</p>
                <p className="text-sm text-gray-700 mb-2">
                  It can be helpful to shop around at external sources such as:
                </p>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  <li>• <strong>Banks:</strong> Your existing bank may offer competitive auto loan rates</li>
                  <li>• <strong>Credit Unions:</strong> Often provide lower rates than traditional banks</li>
                  <li>• <strong>Online Auto Loan Companies:</strong> Digital lenders with streamlined processes</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  <strong>Pro Tip:</strong> Getting pre-approved before going to the dealer gives you a rate you can 
                  compare to their low-interest financing option, strengthening your negotiating position.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Beware of Extended Loan Terms
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                The average length of car loans is the longest they've ever been; it hasn't been uncommon to see loan 
                terms offered in the range of <strong>84 or even 90 months</strong>. This trend exists for several reasons:
              </p>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Reason 1: Affordability Illusion</p>
                  <p className="text-sm text-gray-700">
                    Extended terms make relatively expensive cars appear more affordable by spreading out payments over 
                    more months. While monthly payments look smaller, you'll pay significantly more in total interest.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Reason 2: Frequent Upgrade Incentive</p>
                  <p className="text-sm text-gray-700">
                    Manufacturers want consumers to purchase new cars more often. Longer terms keep monthly payments 
                    manageable, theoretically allowing buyers to afford newer models sooner.
                  </p>
                </div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg border border-red-200 mt-3">
                <p className="font-semibold text-red-900 mb-2">⚠️ Underwater Loan Risk</p>
                <p className="text-sm text-gray-700">
                  Extended loan terms can create a scenario where you owe more on the loan than the car is worth if the 
                  vehicle depreciates at a faster rate. This is called an <strong>underwater or upside-down loan</strong>. 
                  While 0% financing is generally coupled with shorter terms, longer terms with low rates can still lead 
                  to this dangerous situation, making it difficult to trade in or sell the vehicle.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 mt-4">
              <h5 className="font-semibold text-purple-900 mb-3">Rebates Are Just One Piece of the Puzzle</h5>
              <p className="text-sm text-gray-700 mb-3">
                Keep in mind that no matter how favorable a rebate or interest rate may seem, <strong>it is only one 
                part of the equation</strong> when trying to find the best deal possible on a car purchase.
              </p>
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>
                      <strong>Final price is still negotiable:</strong> Just because a salesman concludes by offering 
                      a rebate doesn't mean all other discounts are off the table
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>
                      <strong>Rebates come from manufacturers:</strong> Not from dealers, so negotiate the vehicle 
                      price first, then apply the rebate
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>
                      <strong>Consider your personal situation:</strong> If you have immediate medical expenses or 
                      other urgent needs, cash back might be better even if the numbers favor low interest
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-red-50 p-5 rounded-lg border border-red-200 mt-4">
              <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Watch Out for Bait-and-Switch Tactics
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                There is a strategy sometimes employed by salesmen called <strong>bait-and-switch</strong>. Initially, 
                customers are baited through advertisements of products at low prices or rates, only for them to learn 
                that the actual deal is not all that was initially promised, or is gone.
              </p>
              <div className="bg-white p-4 rounded-lg border border-red-100 mb-3">
                <p className="font-semibold text-red-900 mb-2">Common Example</p>
                <p className="text-sm text-gray-700">
                  A TV commercial may advertise 0% financing at a local car dealer, but when potential customers visit 
                  in person, they are apologetically informed that they "don't qualify for 0%." The customer may be so 
                  keen on the car at this point that they settle for a higher rate anyway, and the dealer's bait-and-switch 
                  trick has worked as intended.
                </p>
              </div>
              <p className="text-sm text-gray-700">
                Though it is <strong>illegal in most countries</strong> as a form of false advertisement, it is still 
                practiced. Always get financing terms in writing before committing, and don't be afraid to walk away if 
                the advertised deal isn't available.
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4">
              <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Beware of Inflated "Discounts"
              </h5>
              <p className="text-sm text-gray-700 mb-2">
                Not only for new cars but for anything being sold, a big discount can sometimes be precipitated by a 
                <strong> hike in the price</strong> of a good, generally rendering it only marginally discounted.
              </p>
              <p className="text-sm text-gray-700">
                For a large purchase like a new car, seeing thousands deducted from the final purchase price just might 
                push hesitant buyers over the fence. Car buyers should be wary that the rebates they receive may not 
                actually be once-in-a-lifetime deals. Although buyers who opt for rebates do end up getting discounts, 
                <strong> they are generally less than what is advertised or implied</strong>. Research the fair market 
                value of the vehicle using resources like Kelley Blue Book or Edmunds before negotiating.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-green-600" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900">✓ Cash Rebates</p>
                  <p className="text-xs text-gray-700">Immediate discounts; best for cash buyers or short terms</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">✓ Low Interest</p>
                  <p className="text-xs text-gray-700">Saves money over time; best for large loans and long terms</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">✓ Use Calculator</p>
                  <p className="text-xs text-gray-700">Compare both options with your specific numbers</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-900">✓ Shop Around</p>
                  <p className="text-xs text-gray-700">Get pre-approved from banks/credit unions first</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900">✓ Check Tax Laws</p>
                  <p className="text-xs text-gray-700">21 states don't tax rebates—verify your state</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-semibold text-red-900">✗ Avoid Long Terms</p>
                  <p className="text-xs text-gray-700">84-90 month loans risk underwater scenarios</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900">✓ Negotiate Separately</p>
                  <p className="text-xs text-gray-700">Price first, then financing—don't bundle negotiations</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <p className="text-sm font-semibold text-pink-900">✗ Watch for Bait-and-Switch</p>
                  <p className="text-xs text-gray-700">Get all financing terms in writing before committing</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 mt-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Final Advice:</strong> The best car deal combines a fair purchase price, favorable financing, 
                and realistic loan terms. Don't let excitement about a rebate or low rate cloud your judgment about the 
                overall value of the deal. Use this calculator to make an informed decision, but also consider your credit 
                score, financial situation, and long-term ownership plans. When in doubt, take a day to think it over—good 
                deals will still be there tomorrow, and rushing into a car purchase is one of the most common financial mistakes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashBackOrLowInterestCalculatorComponent;
