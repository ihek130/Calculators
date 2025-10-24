import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Calendar,
  TrendingDown,
  TrendingUp,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrentLoanInputs {
  knowRemainingBalance: boolean;
  remainingBalance: number;
  originalAmount: number;
  originalTerm: number;
  monthsPaid: number;
  monthlyPayment: number;
  interestRate: number;
}

interface NewLoanInputs {
  newLoanTerm: number;
  interestRate: number;
  points: number;
  costsAndFees: number;
  cashOutAmount: number;
}

interface LoanResults {
  currentLoan: {
    remainingBalance: number;
    monthlyPayment: number;
    remainingMonths: number;
    totalRemainingPayments: number;
    totalInterestRemaining: number;
  };
  newLoan: {
    loanAmount: number;
    monthlyPayment: number;
    totalMonths: number;
    totalPayments: number;
    totalInterest: number;
    upfrontCosts: number;
  };
  comparison: {
    monthlySavings: number;
    totalSavings: number;
    breakEvenMonths: number;
    isWorthwhile: boolean;
  };
}

interface ScheduleItem {
  month: number;
  currentBalance: number;
  currentPayment: number;
  currentPrincipal: number;
  currentInterest: number;
  newBalance: number;
  newPayment: number;
  newPrincipal: number;
  newInterest: number;
  cumulativeSavings: number;
}

const RefinanceCalculatorComponent: React.FC = () => {
  const [currentLoan, setCurrentLoan] = useState<CurrentLoanInputs>({
    knowRemainingBalance: false,
    remainingBalance: 250000,
    originalAmount: 300000,
    originalTerm: 30,
    monthsPaid: 60,
    monthlyPayment: 1800,
    interestRate: 7
  });

  const [newLoan, setNewLoan] = useState<NewLoanInputs>({
    newLoanTerm: 20,
    interestRate: 6,
    points: 2,
    costsAndFees: 1500,
    cashOutAmount: 0
  });

  const [results, setResults] = useState<LoanResults | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showAnnual, setShowAnnual] = useState(false);

  // Calculate remaining balance if not known directly
  const calculateRemainingBalance = (): number => {
    if (currentLoan.knowRemainingBalance) {
      return currentLoan.remainingBalance;
    }

    // Calculate from original loan parameters
    const P = currentLoan.originalAmount;
    const r = currentLoan.interestRate / 100 / 12;
    const n = currentLoan.originalTerm * 12;
    const p = currentLoan.monthsPaid;

    if (r === 0) {
      return P - (P / n) * p;
    }

    // Remaining balance formula
    const balance = P * (Math.pow(1 + r, n) - Math.pow(1 + r, p)) / (Math.pow(1 + r, n) - 1);
    return balance;
  };

  // Calculate monthly payment from remaining balance
  const calculateCurrentMonthlyPayment = (balance: number): number => {
    if (currentLoan.knowRemainingBalance) {
      return currentLoan.monthlyPayment;
    }

    const P = currentLoan.originalAmount;
    const r = currentLoan.interestRate / 100 / 12;
    const n = currentLoan.originalTerm * 12;

    if (r === 0) {
      return P / n;
    }

    // Monthly payment formula
    const payment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return payment;
  };

  // Calculate remaining months from current loan
  const calculateRemainingMonths = (balance: number, payment: number): number => {
    if (!currentLoan.knowRemainingBalance) {
      return currentLoan.originalTerm * 12 - currentLoan.monthsPaid;
    }

    // Validation: prevent division by zero and invalid scenarios
    if (balance <= 0 || payment <= 0) {
      return 0;
    }

    const r = currentLoan.interestRate / 100 / 12;
    
    if (r === 0) {
      return balance / payment;
    }

    // Remaining months formula with safety checks
    const ratio = (balance * r) / payment;
    
    // If ratio >= 1, the payment is too small to ever pay off the loan
    if (ratio >= 1) {
      return Infinity;
    }
    
    const months = -Math.log(1 - ratio) / Math.log(1 + r);
    
    // Check for invalid results
    if (!isFinite(months) || isNaN(months) || months < 0) {
      return 0;
    }
    
    return months;
  };

  // Calculate new loan monthly payment
  const calculateNewMonthlyPayment = (principal: number): number => {
    const r = newLoan.interestRate / 100 / 12;
    const n = newLoan.newLoanTerm * 12;

    if (r === 0) {
      return principal / n;
    }

    // Monthly payment formula
    const payment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return payment;
  };

  // Main calculation function
  const calculateRefinance = () => {
    // Input Validation
    const currentBalance = calculateRemainingBalance();
    
    // Don't calculate if invalid inputs
    if (currentBalance <= 0) {
      setResults(null);
      return;
    }
    
    const currentPayment = currentLoan.knowRemainingBalance 
      ? currentLoan.monthlyPayment 
      : calculateCurrentMonthlyPayment(currentBalance);
    
    if (currentPayment <= 0) {
      setResults(null);
      return;
    }
    
    // Current Loan Calculations
    const remainingMonths = calculateRemainingMonths(currentBalance, currentPayment);
    
    // Check for invalid remaining months
    if (!isFinite(remainingMonths) || isNaN(remainingMonths) || remainingMonths <= 0) {
      setResults(null);
      return;
    }
    
    const totalRemainingPayments = currentPayment * remainingMonths;
    const totalInterestRemaining = totalRemainingPayments - currentBalance;

    // New Loan Calculations
    const pointsCost = (currentBalance + newLoan.cashOutAmount) * (newLoan.points / 100);
    const upfrontCosts = pointsCost + newLoan.costsAndFees;
    const newLoanAmount = currentBalance + newLoan.cashOutAmount;
    
    if (newLoanAmount <= 0 || newLoan.newLoanTerm <= 0) {
      setResults(null);
      return;
    }
    
    const newMonthlyPayment = calculateNewMonthlyPayment(newLoanAmount);
    const newTotalMonths = newLoan.newLoanTerm * 12;
    const newTotalPayments = newMonthlyPayment * newTotalMonths;
    const newTotalInterest = newTotalPayments - newLoanAmount;

    // Comparison Calculations
    const monthlySavings = currentPayment - newMonthlyPayment;
    
    // Total savings accounts for upfront costs
    const totalCurrentCost = totalRemainingPayments;
    const totalNewCost = newTotalPayments + upfrontCosts;
    const totalSavings = totalCurrentCost - totalNewCost;

    // Break-even calculation with safety checks
    let breakEvenMonths: number;
    if (monthlySavings <= 0) {
      breakEvenMonths = Infinity; // Will never break even if not saving monthly
    } else if (upfrontCosts === 0) {
      breakEvenMonths = 0; // Immediate break-even if no upfront costs
    } else {
      breakEvenMonths = upfrontCosts / monthlySavings;
    }
    
    // Is refinancing worthwhile? (COMPREHENSIVE ANALYSIS)
    // Refinancing is recommended IF:
    // PRIMARY: Total savings is positive (you save money overall) - this is the most important factor
    // OR if monthly payment is lower AND break-even is reasonable
    const isWorthwhile = totalSavings > 0 || 
                         (monthlySavings > 0 && 
                          isFinite(breakEvenMonths) && 
                          breakEvenMonths < newTotalMonths && 
                          breakEvenMonths < 60);

    const calculatedResults: LoanResults = {
      currentLoan: {
        remainingBalance: currentBalance,
        monthlyPayment: currentPayment,
        remainingMonths: remainingMonths,
        totalRemainingPayments: totalRemainingPayments,
        totalInterestRemaining: totalInterestRemaining
      },
      newLoan: {
        loanAmount: newLoanAmount,
        monthlyPayment: newMonthlyPayment,
        totalMonths: newTotalMonths,
        totalPayments: newTotalPayments,
        totalInterest: newTotalInterest,
        upfrontCosts: upfrontCosts
      },
      comparison: {
        monthlySavings: monthlySavings,
        totalSavings: totalSavings,
        breakEvenMonths: breakEvenMonths,
        isWorthwhile: isWorthwhile
      }
    };

    setResults(calculatedResults);
    generateSchedule(calculatedResults);
  };

  // Generate amortization schedule for comparison
  const generateSchedule = (results: LoanResults) => {
    const scheduleData: ScheduleItem[] = [];
    
    let currentBalance = results.currentLoan.remainingBalance;
    let newBalance = results.newLoan.loanAmount;
    
    const currentRate = currentLoan.interestRate / 100 / 12;
    const newRate = newLoan.interestRate / 100 / 12;
    
    const maxMonths = Math.max(results.currentLoan.remainingMonths, results.newLoan.totalMonths);
    let cumulativeSavings = -results.newLoan.upfrontCosts; // Start with negative upfront costs

    for (let month = 1; month <= maxMonths; month++) {
      // Current loan calculations
      let currentInterest = 0;
      let currentPrincipal = 0;
      let currentPayment = 0;

      if (month <= results.currentLoan.remainingMonths && currentBalance > 0) {
        currentInterest = currentBalance * currentRate;
        currentPayment = results.currentLoan.monthlyPayment;
        currentPrincipal = currentPayment - currentInterest;
        currentBalance = Math.max(0, currentBalance - currentPrincipal);
      }

      // New loan calculations
      let newInterest = 0;
      let newPrincipal = 0;
      let newPayment = 0;

      if (month <= results.newLoan.totalMonths && newBalance > 0) {
        newInterest = newBalance * newRate;
        newPayment = results.newLoan.monthlyPayment;
        newPrincipal = newPayment - newInterest;
        newBalance = Math.max(0, newBalance - newPrincipal);
      }

      // Calculate cumulative savings
      cumulativeSavings += (currentPayment - newPayment);

      scheduleData.push({
        month,
        currentBalance,
        currentPayment,
        currentPrincipal,
        currentInterest,
        newBalance,
        newPayment,
        newPrincipal,
        newInterest,
        cumulativeSavings
      });
    }

    setSchedule(scheduleData);
  };

  // Auto-calculate on input changes
  useEffect(() => {
    calculateRefinance();
  }, [currentLoan, newLoan]);

  const handleCurrentLoanChange = (field: keyof CurrentLoanInputs, value: string | number | boolean) => {
    setCurrentLoan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewLoanChange = (field: keyof NewLoanInputs, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    setNewLoan(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return `${numValue.toFixed(2)}%`;
  };

  // Prepare annual schedule
  const getDisplaySchedule = () => {
    if (!showAnnual) return schedule;
    
    const annualSchedule: ScheduleItem[] = [];
    for (let i = 11; i < schedule.length; i += 12) {
      const yearData = schedule[i];
      const yearNumber = Math.floor(i / 12) + 1;
      
      // Sum up the year's payments
      const startIdx = (yearNumber - 1) * 12;
      const endIdx = Math.min(startIdx + 12, schedule.length);
      const yearSlice = schedule.slice(startIdx, endIdx);
      
      const totalCurrentPayment = yearSlice.reduce((sum, m) => sum + m.currentPayment, 0);
      const totalCurrentPrincipal = yearSlice.reduce((sum, m) => sum + m.currentPrincipal, 0);
      const totalCurrentInterest = yearSlice.reduce((sum, m) => sum + m.currentInterest, 0);
      const totalNewPayment = yearSlice.reduce((sum, m) => sum + m.newPayment, 0);
      const totalNewPrincipal = yearSlice.reduce((sum, m) => sum + m.newPrincipal, 0);
      const totalNewInterest = yearSlice.reduce((sum, m) => sum + m.newInterest, 0);

      annualSchedule.push({
        month: yearNumber,
        currentBalance: yearData.currentBalance,
        currentPayment: totalCurrentPayment,
        currentPrincipal: totalCurrentPrincipal,
        currentInterest: totalCurrentInterest,
        newBalance: yearData.newBalance,
        newPayment: totalNewPayment,
        newPrincipal: totalNewPrincipal,
        newInterest: totalNewInterest,
        cumulativeSavings: yearData.cumulativeSavings
      });
    }
    
    return annualSchedule;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
          <Calculator className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-indigo-600" />
          Refinance Calculator
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
          Compare your current loan with refinancing options to see if you can save money with a new loan
        </p>
      </div>

      {/* Main Calculator Card */}
      <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
        <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">
            Loan Comparison Calculator
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your current loan details and new loan terms to compare options
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Current Loan Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Current Loan</h3>
              </div>

              {/* Balance Input Method Toggle */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-sm font-medium text-gray-700">How do you want to enter your loan?</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleCurrentLoanChange('knowRemainingBalance', true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      currentLoan.knowRemainingBalance
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    <CheckCircle2 className={`h-4 w-4 inline mr-2 ${currentLoan.knowRemainingBalance ? 'text-indigo-600' : 'text-gray-400'}`} />
                    I know my remaining balance
                  </button>
                  <button
                    onClick={() => handleCurrentLoanChange('knowRemainingBalance', false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      !currentLoan.knowRemainingBalance
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    <Calculator className={`h-4 w-4 inline mr-2 ${!currentLoan.knowRemainingBalance ? 'text-indigo-600' : 'text-gray-400'}`} />
                    Calculate from original loan
                  </button>
                </div>
              </div>

              {currentLoan.knowRemainingBalance ? (
                <>
                  {/* Remaining Balance Known */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="remaining-balance" className="text-sm font-medium text-gray-700">
                        Remaining Balance
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Current outstanding balance on your loan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="remaining-balance"
                        type="number"
                        value={currentLoan.remainingBalance}
                        onChange={(e) => handleCurrentLoanChange('remainingBalance', e.target.value)}
                        className="pl-10 text-base"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly-payment" className="text-sm font-medium text-gray-700">
                      Monthly Payment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="monthly-payment"
                        type="number"
                        value={currentLoan.monthlyPayment}
                        onChange={(e) => handleCurrentLoanChange('monthlyPayment', e.target.value)}
                        className="pl-10 text-base"
                        min="0"
                        step="10"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Calculate from Original Loan */}
                  <div className="space-y-2">
                    <Label htmlFor="original-amount" className="text-sm font-medium text-gray-700">
                      Original Loan Amount
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="original-amount"
                        type="number"
                        value={currentLoan.originalAmount}
                        onChange={(e) => handleCurrentLoanChange('originalAmount', e.target.value)}
                        className="pl-10 text-base"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="original-term" className="text-sm font-medium text-gray-700">
                      Original Loan Term (Years)
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="original-term"
                        type="number"
                        value={currentLoan.originalTerm}
                        onChange={(e) => handleCurrentLoanChange('originalTerm', e.target.value)}
                        className="pl-10 text-base"
                        min="1"
                        max="50"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="months-paid" className="text-sm font-medium text-gray-700">
                      Months Already Paid
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="months-paid"
                        type="number"
                        value={currentLoan.monthsPaid}
                        onChange={(e) => handleCurrentLoanChange('monthsPaid', e.target.value)}
                        className="pl-10 text-base"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-interest" className="text-sm font-medium text-gray-700">
                  Interest Rate (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="current-interest"
                    type="number"
                    value={currentLoan.interestRate}
                    onChange={(e) => handleCurrentLoanChange('interestRate', e.target.value)}
                    className="pl-10 text-base"
                    min="0"
                    max="30"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* New Loan Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">New Loan</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-term" className="text-sm font-medium text-gray-700">
                  New Loan Term (Years)
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-term"
                    type="number"
                    value={newLoan.newLoanTerm}
                    onChange={(e) => handleNewLoanChange('newLoanTerm', e.target.value)}
                    className="pl-10 text-base"
                    min="1"
                    max="50"
                    step="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-interest" className="text-sm font-medium text-gray-700">
                  Interest Rate (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-interest"
                    type="number"
                    value={newLoan.interestRate}
                    onChange={(e) => handleNewLoanChange('interestRate', e.target.value)}
                    className="pl-10 text-base"
                    min="0"
                    max="30"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="points" className="text-sm font-medium text-gray-700">
                    Points (%)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Upfront fee paid to lender as % of loan amount. 1 point = 1% of loan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="points"
                    type="number"
                    value={newLoan.points}
                    onChange={(e) => handleNewLoanChange('points', e.target.value)}
                    className="pl-10 text-base"
                    min="0"
                    max="10"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="costs-fees" className="text-sm font-medium text-gray-700">
                    Costs and Fees ($)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Application, appraisal, title search, and other closing costs</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="costs-fees"
                    type="number"
                    value={newLoan.costsAndFees}
                    onChange={(e) => handleNewLoanChange('costsAndFees', e.target.value)}
                    className="pl-10 text-base"
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cash-out" className="text-sm font-medium text-gray-700">
                    Cash Out Amount ($)
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-xs">Additional cash you want to receive from refinancing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="cash-out"
                    type="number"
                    value={newLoan.cashOutAmount}
                    onChange={(e) => handleNewLoanChange('cashOutAmount', e.target.value)}
                    className="pl-10 text-base"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Validation Warning */}
      {!results && (
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0 border-2 border-yellow-300">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              Invalid Input
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Please enter valid loan information to see refinancing analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Please ensure:</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Remaining balance is greater than $0</li>
                <li>Monthly payment is greater than $0</li>
                <li>Interest rate is valid</li>
                <li>Loan terms are realistic</li>
                <li>Monthly payment can actually pay off the loan</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {results && (
        <>
          {/* Comparison Summary Card */}
          <Card className={`mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0 border-2 ${
            results.comparison.isWorthwhile ? 'border-green-300' : 'border-orange-300'
          }`}>
            <CardHeader className={`p-4 sm:p-6 ${
              results.comparison.isWorthwhile 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                : 'bg-gradient-to-r from-orange-50 to-yellow-50'
            }`}>
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                {results.comparison.isWorthwhile ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    Refinancing Recommended
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-6 w-6 text-orange-600" />
                    Refinancing May Not Be Beneficial
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {results.comparison.isWorthwhile 
                  ? 'Based on your inputs, refinancing could save you money'
                  : 'Current loan terms may be better than refinancing options'}
              </CardDescription>
              
              {/* Recommendation Logic Explanation */}
              <div className="mt-3 p-3 bg-white/60 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed">
                  <strong>Analysis:</strong> This recommendation considers total savings (
                  {results.comparison.totalSavings > 0 ? '✓ positive' : '✗ negative'}), 
                  break-even point ({results.comparison.breakEvenMonths === Infinity ? '∞' : results.comparison.breakEvenMonths.toFixed(1)} months 
                  {results.comparison.breakEvenMonths < 60 && results.comparison.breakEvenMonths !== Infinity ? ' ✓ reasonable' : ' ✗ too long'}), 
                  and whether you'll recover upfront costs within the loan term 
                  ({results.comparison.breakEvenMonths < results.newLoan.totalMonths ? '✓ yes' : '✗ no'}).
                  
                  {/* Show specific warnings based on actual issues */}
                  {!results.comparison.isWorthwhile && (() => {
                    const reasons = [];
                    
                    // Convert to numbers for comparison
                    const currentRate = typeof currentLoan.interestRate === 'string' ? parseFloat(currentLoan.interestRate) : currentLoan.interestRate;
                    const newRate = typeof newLoan.interestRate === 'string' ? parseFloat(newLoan.interestRate) : newLoan.interestRate;
                    
                    // Check if higher interest rate is the issue
                    if (newRate > currentRate) {
                      reasons.push(`higher interest rate (${formatPercent(newRate)} vs ${formatPercent(currentRate)})`);
                    }
                    
                    // Check if extended term with negative savings
                    if (results.newLoan.totalMonths > results.currentLoan.remainingMonths && results.comparison.totalSavings < 0) {
                      reasons.push(`extended loan term (${(results.newLoan.totalMonths/12).toFixed(1)} years vs ${(results.currentLoan.remainingMonths/12).toFixed(1)} years remaining)`);
                    }
                    
                    // Check if high upfront costs
                    if (results.newLoan.upfrontCosts > results.currentLoan.remainingBalance * 0.05) {
                      reasons.push(`high upfront costs (${formatCurrency(results.newLoan.upfrontCosts)})`);
                    }
                    
                    // Check if break-even is too long
                    if (results.comparison.breakEvenMonths >= 60 && results.comparison.breakEvenMonths !== Infinity) {
                      reasons.push(`break-even takes too long (${results.comparison.breakEvenMonths.toFixed(1)} months)`);
                    }
                    
                    // Check if you won't recover costs in time
                    if (results.comparison.breakEvenMonths >= results.newLoan.totalMonths) {
                      reasons.push(`won't recover costs before loan ends`);
                    }
                    
                    // Check if negative monthly savings (higher payment)
                    if (results.comparison.monthlySavings < 0) {
                      reasons.push(`higher monthly payment (${formatCurrency(Math.abs(results.comparison.monthlySavings))} more/month)`);
                    }
                    
                    if (reasons.length > 0) {
                      return (
                        <span className="block mt-2 text-red-700 font-medium text-xs">
                          ⚠️ Not recommended due to: {reasons.join(', ')}.
                        </span>
                      );
                    }
                    
                    return null;
                  })()}
                  
                  {!results.comparison.isWorthwhile && results.comparison.totalSavings > 0 && results.comparison.breakEvenMonths < 60 && (
                    <span className="block mt-2 text-orange-700 font-medium text-xs">
                      ℹ️ While you save ${Math.abs(results.comparison.totalSavings).toFixed(2)} overall, other factors make this marginal.
                    </span>
                  )}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-blue-600" />
                    <p className="text-xs text-gray-600 font-medium">Monthly Savings</p>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${
                    results.comparison.monthlySavings > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.comparison.monthlySavings > 0 ? '+' : ''}{formatCurrency(results.comparison.monthlySavings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Per month</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <p className="text-xs text-gray-600 font-medium">Total Savings</p>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold ${
                    results.comparison.totalSavings > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {results.comparison.totalSavings > 0 ? '+' : ''}{formatCurrency(results.comparison.totalSavings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Over loan life</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <p className="text-xs text-gray-600 font-medium">Break-Even Point</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600">
                    {results.comparison.breakEvenMonths === Infinity 
                      ? 'Never' 
                      : results.comparison.breakEvenMonths === 0
                      ? 'Immediate'
                      : `${results.comparison.breakEvenMonths.toFixed(1)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {results.comparison.breakEvenMonths === Infinity 
                      ? 'Won\'t recover costs' 
                      : results.comparison.breakEvenMonths === 0
                      ? 'No upfront costs'
                      : 'Months to recover costs'}
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <p className="text-xs text-gray-600 font-medium">Upfront Costs</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {formatCurrency(results.newLoan.upfrontCosts)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Due at closing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison */}
          <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">
                Side-by-Side Comparison
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Detailed breakdown of current loan vs refinanced loan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                
                {/* Current Loan Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 rounded-lg">
                    <FileText className="h-5 w-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-800">Current Loan</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Remaining Balance</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(results.currentLoan.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Monthly Payment</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(results.currentLoan.monthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Interest Rate</span>
                      <span className="font-semibold text-gray-800">{formatPercent(currentLoan.interestRate)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Remaining Months</span>
                      <span className="font-semibold text-gray-800">{Math.round(results.currentLoan.remainingMonths)} months</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded">
                      <span className="text-sm font-medium text-gray-700">Total Remaining Payments</span>
                      <span className="font-bold text-red-700">{formatCurrency(results.currentLoan.totalRemainingPayments)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded">
                      <span className="text-sm font-medium text-gray-700">Total Interest Remaining</span>
                      <span className="font-bold text-red-700">{formatCurrency(results.currentLoan.totalInterestRemaining)}</span>
                    </div>
                  </div>
                </div>

                {/* New Loan Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">Refinanced Loan</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">New Loan Amount</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(results.newLoan.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Monthly Payment</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(results.newLoan.monthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Interest Rate</span>
                      <span className="font-semibold text-gray-800">{formatPercent(newLoan.interestRate)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Loan Term</span>
                      <span className="font-semibold text-gray-800">{results.newLoan.totalMonths} months</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded">
                      <span className="text-sm font-medium text-gray-700">Total Payments</span>
                      <span className="font-bold text-green-700">{formatCurrency(results.newLoan.totalPayments)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded">
                      <span className="text-sm font-medium text-gray-700">Total Interest</span>
                      <span className="font-bold text-green-700">{formatCurrency(results.newLoan.totalInterest)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Arrow */}
              <div className="flex justify-center my-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border-2 border-indigo-300">
                  <ArrowRight className="h-6 w-6 text-indigo-600" />
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium">Net Benefit</p>
                    <p className={`text-2xl font-bold ${
                      results.comparison.totalSavings > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {results.comparison.totalSavings > 0 ? '+' : ''}{formatCurrency(results.comparison.totalSavings)}
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">
                Cost Comparison Chart
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Visual comparison of total costs: current loan vs refinanced loan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              {/* Mobile View - Vertical Stack */}
              <div className="block md:hidden">
                <div className="space-y-6">
                  {/* Current Loan */}
                  <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                    <h3 className="text-center font-bold text-gray-800 mb-4 text-lg">Current Loan</h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                        <p className="text-xs opacity-90 mb-1">Principal</p>
                        <p className="text-xl font-bold">{formatCurrency(results.currentLoan.remainingBalance)}</p>
                      </div>
                      <div className="bg-red-200 rounded-lg p-4">
                        <p className="text-xs text-gray-700 mb-1">Interest</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(results.currentLoan.totalInterestRemaining)}</p>
                      </div>
                      <div className="border-t-2 border-red-300 pt-3">
                        <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(results.currentLoan.totalRemainingPayments)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="bg-indigo-100 rounded-full p-3">
                      <ArrowRight className="h-8 w-8 text-indigo-600 transform rotate-90" />
                    </div>
                  </div>

                  {/* Refinanced Loan */}
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                    <h3 className="text-center font-bold text-gray-800 mb-4 text-lg">Refinanced Loan</h3>
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                        <p className="text-xs opacity-90 mb-1">Principal</p>
                        <p className="text-xl font-bold">{formatCurrency(results.newLoan.loanAmount)}</p>
                      </div>
                      <div className="bg-green-200 rounded-lg p-4">
                        <p className="text-xs text-gray-700 mb-1">Interest</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(results.newLoan.totalInterest)}</p>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-4">
                        <p className="text-xs text-gray-700 mb-1">Upfront Costs</p>
                        <p className="text-lg font-bold text-gray-800">{formatCurrency(results.newLoan.upfrontCosts)}</p>
                      </div>
                      <div className="border-t-2 border-green-300 pt-3">
                        <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(results.newLoan.totalPayments + results.newLoan.upfrontCosts)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Savings Summary */}
                  <div className={`rounded-lg p-6 border-2 ${
                    results.comparison.totalSavings > 0 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <p className={`text-center text-sm font-medium mb-2 ${
                      results.comparison.totalSavings > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {results.comparison.totalSavings > 0 ? 'Total Savings' : 'Additional Cost'}
                    </p>
                    <p className={`text-center text-3xl font-bold ${
                      results.comparison.totalSavings > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {results.comparison.totalSavings > 0 ? '+' : ''}{formatCurrency(Math.abs(results.comparison.totalSavings))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop View - Side by Side */}
              <div className="hidden md:block">
                <div className="w-full" style={{ minHeight: '500px' }}>
                  <svg viewBox="0 0 900 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="1"/>
                      </linearGradient>
                      <linearGradient id="newGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#059669" stopOpacity="1"/>
                      </linearGradient>
                    </defs>

                    {/* Current Loan */}
                    <g>
                      <text x="180" y="40" textAnchor="middle" className="fill-gray-800 font-bold" fontSize="20">
                        Current Loan
                      </text>
                      
                      {/* Principal Bar */}
                      <rect x="60" y="80" width="240" height="100" fill="url(#currentGradient)" rx="8"/>
                      <text x="180" y="125" textAnchor="middle" className="fill-white font-semibold" fontSize="16">Principal</text>
                      <text x="180" y="150" textAnchor="middle" className="fill-white font-bold" fontSize="18">
                        {formatCurrency(results.currentLoan.remainingBalance)}
                      </text>

                      {/* Interest Bar */}
                      <rect x="60" y="200" width="240" height="70" fill="#fca5a5" rx="8"/>
                      <text x="180" y="230" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="16">Interest</text>
                      <text x="180" y="255" textAnchor="middle" className="fill-gray-800 font-bold" fontSize="18">
                        {formatCurrency(results.currentLoan.totalInterestRemaining)}
                      </text>

                      {/* Total */}
                      <text x="180" y="305" textAnchor="middle" className="fill-gray-900 font-bold" fontSize="20">
                        Total: {formatCurrency(results.currentLoan.totalRemainingPayments)}
                      </text>
                    </g>

                    {/* Arrow */}
                    <g>
                      <line x1="320" y1="180" x2="380" y2="180" stroke="#6366f1" strokeWidth="4"/>
                      <polygon points="380,180 370,175 370,185" fill="#6366f1"/>
                      <text x="350" y="165" textAnchor="middle" className="fill-indigo-600 font-bold" fontSize="16">
                        Refinance
                      </text>
                    </g>

                    {/* New Loan */}
                    <g>
                      <text x="630" y="40" textAnchor="middle" className="fill-gray-800 font-bold" fontSize="20">
                        Refinanced Loan
                      </text>
                      
                      {/* Principal Bar */}
                      <rect x="510" y="80" width="240" height="100" fill="url(#newGradient)" rx="8"/>
                      <text x="630" y="125" textAnchor="middle" className="fill-white font-semibold" fontSize="16">Principal</text>
                      <text x="630" y="150" textAnchor="middle" className="fill-white font-bold" fontSize="18">
                        {formatCurrency(results.newLoan.loanAmount)}
                      </text>

                      {/* Interest Bar */}
                      <rect x="510" y="200" width="240" height="70" fill="#86efac" rx="8"/>
                      <text x="630" y="230" textAnchor="middle" className="fill-gray-800 font-semibold" fontSize="16">Interest</text>
                      <text x="630" y="255" textAnchor="middle" className="fill-gray-800 font-bold" fontSize="18">
                        {formatCurrency(results.newLoan.totalInterest)}
                      </text>

                      {/* Upfront Costs Bar */}
                      <rect x="510" y="290" width="240" height="50" fill="#fbbf24" rx="8"/>
                      <text x="630" y="320" textAnchor="middle" className="fill-gray-900 font-bold" fontSize="16">
                        Upfront: {formatCurrency(results.newLoan.upfrontCosts)}
                      </text>

                      {/* Total */}
                      <text x="630" y="370" textAnchor="middle" className="fill-gray-900 font-bold" fontSize="20">
                        Total: {formatCurrency(results.newLoan.totalPayments + results.newLoan.upfrontCosts)}
                      </text>
                    </g>

                    {/* Savings Box */}
                    <rect
                      x="275"
                      y="400"
                      width="350"
                      height="80"
                      fill={results.comparison.totalSavings > 0 ? '#d1fae5' : '#fee2e2'}
                      stroke={results.comparison.totalSavings > 0 ? '#10b981' : '#ef4444'}
                      strokeWidth="3"
                      rx="12"
                    />
                    <text x="450" y="430" textAnchor="middle" className={`font-semibold ${
                      results.comparison.totalSavings > 0 ? 'fill-green-700' : 'fill-red-700'
                    }`} fontSize="18">
                      {results.comparison.totalSavings > 0 ? 'Total Savings' : 'Additional Cost'}
                    </text>
                    <text x="450" y="465" textAnchor="middle" className={`font-bold ${
                      results.comparison.totalSavings > 0 ? 'fill-green-600' : 'fill-red-600'
                    }`} fontSize="28">
                      {results.comparison.totalSavings > 0 ? '+' : ''}{formatCurrency(Math.abs(results.comparison.totalSavings))}
                    </text>
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule */}
          <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
            <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">
                    Payment Comparison Schedule
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Month-by-month comparison of current vs refinanced loan
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={!showAnnual ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAnnual(false)}
                    className="text-xs sm:text-sm"
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={showAnnual ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowAnnual(true)}
                    className="text-xs sm:text-sm"
                  >
                    Annual
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-100 to-purple-100 border-b-2 border-indigo-300">
                      <th className="p-2 sm:p-3 text-left font-semibold text-gray-700">
                        {showAnnual ? 'Year' : 'Month'}
                      </th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-red-700" colSpan={2}>Current Loan</th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-green-700" colSpan={2}>Refinanced Loan</th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-indigo-700">Cumulative Savings</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-300 text-xs">
                      <th className="p-2 text-left text-gray-600"></th>
                      <th className="p-2 text-right text-gray-600">Payment</th>
                      <th className="p-2 text-right text-gray-600">Balance</th>
                      <th className="p-2 text-right text-gray-600">Payment</th>
                      <th className="p-2 text-right text-gray-600">Balance</th>
                      <th className="p-2 text-right text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDisplaySchedule().slice(0, 120).map((item, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-gray-200 hover:bg-indigo-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        <td className="p-2 sm:p-3 font-medium text-gray-700">
                          {showAnnual ? `Year ${item.month}` : `Month ${item.month}`}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-gray-700">
                          {item.currentPayment > 0 ? formatCurrency(item.currentPayment) : '-'}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-red-600 font-medium">
                          {item.currentBalance > 0 ? formatCurrency(item.currentBalance) : '-'}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-gray-700">
                          {item.newPayment > 0 ? formatCurrency(item.newPayment) : '-'}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-green-600 font-medium">
                          {item.newBalance > 0 ? formatCurrency(item.newBalance) : '-'}
                        </td>
                        <td className={`p-2 sm:p-3 text-right font-semibold ${
                          item.cumulativeSavings > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.cumulativeSavings > 0 ? '+' : ''}{formatCurrency(item.cumulativeSavings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content */}
      <div className="space-y-6 sm:space-y-8">
        {/* What is Refinancing */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              What is Loan Refinancing?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              <strong>Loan refinancing</strong> is the process of replacing your existing loan with a new one, typically with different terms. When you refinance, you take out a new loan to pay off your current loan, potentially securing a lower interest rate, changing your loan term, or accessing equity in your home or vehicle.
            </p>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Think of refinancing as a financial reset button. Whether you have a mortgage, auto loan, student loan, or personal loan, refinancing allows you to renegotiate the terms based on your current financial situation and market conditions. This financial strategy has helped millions of borrowers save money, reduce financial stress, and achieve their long-term financial goals more efficiently.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-800 mb-2">How It Works:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm sm:text-base">
                <li>You apply for a new loan with better terms</li>
                <li>The new lender pays off your existing loan</li>
                <li>You start making payments on the new loan</li>
                <li>You may pay closing costs or fees for the new loan</li>
              </ol>
            </div>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              The goal is usually to save money over time, lower monthly payments, pay off debt faster, or access cash for other needs. However, refinancing isn't always beneficial—it's crucial to calculate the total cost and break-even point before making a decision. Understanding when refinancing makes sense can mean the difference between thousands of dollars saved or wasted in fees and interest charges.
            </p>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 mt-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                Did You Know?
              </h4>
              <p className="text-gray-700 text-sm">
                According to financial experts, refinancing can save homeowners an average of $150-$300 per month. Over a 30-year mortgage, this can translate to savings of $54,000 to $108,000. However, timing is everything—refinancing at the wrong time or without understanding the full cost implications can actually cost you more money in the long run.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reasons to Refinance */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              Top Reasons to Refinance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">💰</span> Lower Interest Rate
                </h4>
                <p className="text-gray-700 text-sm">
                  If market rates have dropped or your credit score has improved, refinancing can secure a lower rate, reducing total interest paid over the loan's life.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">📉</span> Lower Monthly Payment
                </h4>
                <p className="text-gray-700 text-sm">
                  Extending your loan term or securing a lower interest rate can reduce your monthly payment, freeing up cash for other expenses or investments.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-purple-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">⚡</span> Pay Off Faster
                </h4>
                <p className="text-gray-700 text-sm">
                  Shortening your loan term means you'll pay off debt sooner and save significantly on interest, though monthly payments may increase.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-orange-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🏠</span> Cash-Out Refinancing
                </h4>
                <p className="text-gray-700 text-sm">
                  Access your home equity by borrowing more than you owe and taking the difference in cash for renovations, debt consolidation, or other needs.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-indigo-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🔄</span> Switch Loan Type
                </h4>
                <p className="text-gray-700 text-sm">
                  Convert from an adjustable-rate mortgage (ARM) to a fixed-rate loan for payment stability, or vice versa if rates are favorable.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-red-200 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🚫</span> Eliminate PMI
                </h4>
                <p className="text-gray-700 text-sm">
                  If your home equity has increased above 20%, refinancing can help you eliminate private mortgage insurance (PMI) payments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mortgage Refinancing Types */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              Mortgage Refinancing Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Cash-Out Refinance */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-bold text-lg text-gray-800 mb-2">💵 Cash-Out Refinance</h4>
              <p className="text-gray-700 text-sm sm:text-base mb-3">
                A cash-out refinance replaces your existing mortgage with a larger loan, allowing you to borrow against your home equity. The difference between the new loan and your old mortgage is paid to you in cash.
              </p>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2"><strong>Best for:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Home improvements that increase property value</li>
                  <li>Consolidating high-interest debt (credit cards, personal loans)</li>
                  <li>Major expenses like education or medical bills</li>
                  <li>Investment opportunities</li>
                </ul>
              </div>
            </div>

            {/* Rate-and-Term Refinance */}
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-bold text-lg text-gray-800 mb-2">📊 Rate-and-Term Refinance</h4>
              <p className="text-gray-700 text-sm sm:text-base mb-3">
                This type changes your interest rate, loan term, or both, without changing the principal balance. You're simply swapping your current mortgage for one with better terms.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2"><strong>Best for:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Lowering interest rate to save on total interest</li>
                  <li>Shortening loan term to pay off mortgage faster</li>
                  <li>Lengthening loan term to reduce monthly payments</li>
                  <li>Switching from ARM to fixed-rate (or vice versa)</li>
                </ul>
              </div>
            </div>

            {/* FHA Refinance */}
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-bold text-lg text-gray-800 mb-2">🏛️ FHA Streamline Refinance</h4>
              <p className="text-gray-700 text-sm sm:text-base mb-3">
                Available for existing FHA loan holders, this program offers a simplified refinancing process with reduced documentation and no appraisal required in many cases.
              </p>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2"><strong>Benefits:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Minimal documentation required</li>
                  <li>No appraisal needed in most cases</li>
                  <li>Lower closing costs</li>
                  <li>Must result in lower monthly payment</li>
                </ul>
              </div>
            </div>

            {/* ARM to Fixed */}
            <div className="border-l-4 border-orange-500 pl-4 py-2">
              <h4 className="font-bold text-lg text-gray-800 mb-2">🔒 ARM to Fixed-Rate Refinance</h4>
              <p className="text-gray-700 text-sm sm:text-base mb-3">
                Convert your adjustable-rate mortgage (ARM) to a fixed-rate loan to protect against future rate increases and lock in predictable monthly payments.
              </p>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700 mb-2"><strong>Consider when:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Interest rates are rising or expected to rise</li>
                  <li>Your ARM adjustment period is ending</li>
                  <li>You want payment predictability and stability</li>
                  <li>You plan to stay in the home long-term</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refinancing Costs */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              Understanding Refinancing Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              Refinancing isn't free. You'll typically pay <strong>2% to 5% of the loan amount</strong> in closing costs. Understanding these costs is crucial for calculating whether refinancing makes financial sense.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-orange-100">
                    <th className="border border-orange-300 px-4 py-2 text-left font-semibold text-gray-800">Cost Type</th>
                    <th className="border border-orange-300 px-4 py-2 text-left font-semibold text-gray-800">Typical Amount</th>
                    <th className="border border-orange-300 px-4 py-2 text-left font-semibold text-gray-800">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Application Fee</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">$75 - $300</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Fee to process your refinance application</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Origination Fee</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">0.5% - 1.5%</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Lender's fee for processing the loan</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Appraisal Fee</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">$300 - $700</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Professional assessment of property value</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Title Search & Insurance</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">$400 - $1,000</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Ensures clear property ownership</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Credit Report Fee</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">$25 - $50</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Pull your credit history</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Points (Optional)</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">1% per point</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Pay upfront to reduce interest rate</td>
                  </tr>
                  <tr className="hover:bg-orange-50">
                    <td className="border border-orange-200 px-4 py-2 font-medium text-gray-800">Attorney Fees</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-700">$500 - $1,500</td>
                    <td className="border border-orange-200 px-4 py-2 text-gray-600 text-sm">Legal review (required in some states)</td>
                  </tr>
                  <tr className="bg-orange-100 font-bold">
                    <td className="border border-orange-300 px-4 py-2 text-gray-900">Total Estimate</td>
                    <td className="border border-orange-300 px-4 py-2 text-gray-900" colSpan={2}>$1,800 - $5,000+ (varies by loan amount)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Break-Even Point
              </h4>
              <p className="text-gray-700 text-sm">
                Calculate how many months it will take to recover your upfront costs through monthly savings. If you plan to move before reaching the break-even point, refinancing may not be worthwhile.
              </p>
              <p className="text-gray-700 text-sm mt-2">
                <strong>Formula:</strong> Break-Even Months = Total Closing Costs ÷ Monthly Savings
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Other Types of Refinancing */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              Other Types of Refinancing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Student Loan Refinancing */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
              <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-2">
                🎓 Student Loan Refinancing
              </h4>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                Combine multiple student loans into one new loan with a potentially lower interest rate. This can simplify payments and reduce total interest, but you'll lose federal loan protections.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-green-700 mb-2">✅ Pros:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Lower interest rates (if you qualify)</li>
                    <li>Single monthly payment</li>
                    <li>Choose your repayment term</li>
                    <li>Can refinance private & federal together</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-red-700 mb-2">❌ Cons:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Lose federal loan forgiveness options</li>
                    <li>No income-driven repayment plans</li>
                    <li>No federal forbearance/deferment</li>
                    <li>Need good credit to qualify</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Auto Loan Refinancing */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
              <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-2">
                🚗 Auto Loan Refinancing
              </h4>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                Replace your current car loan with a new one that has better terms. This is especially beneficial if your credit has improved since you bought the vehicle or if market rates have dropped.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-green-700 mb-2">💰 When to Refinance:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Your credit score has increased by 50+ points</li>
                    <li>Interest rates have dropped significantly</li>
                    <li>You need to lower monthly payments</li>
                    <li>You're not underwater on the loan</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="font-semibold text-orange-700 mb-2">⚠️ Watch Out For:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Extending loan term may cost more overall</li>
                    <li>Some lenders charge prepayment penalties</li>
                    <li>Older cars may not qualify</li>
                    <li>Application and title transfer fees</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Credit Card Refinancing */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
              <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-2">
                💳 Credit Card Refinancing (Balance Transfer)
              </h4>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                Transfer high-interest credit card balances to a new card with a lower rate (often 0% APR for an introductory period). This can save hundreds or thousands in interest while paying off debt.
              </p>
              <div className="bg-white p-4 rounded-lg">
                <p className="font-semibold text-gray-800 mb-2">💡 Best Practices:</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">1.</span>
                    <span>Look for 0% APR introductory offers (typically 12-21 months)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">2.</span>
                    <span>Factor in balance transfer fees (usually 3-5% of transferred amount)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">3.</span>
                    <span>Create a payoff plan to eliminate debt before the intro period ends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">4.</span>
                    <span>Avoid making new purchases on the transfer card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">5.</span>
                    <span>Keep old accounts open to maintain credit utilization ratio</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Personal Loan Refinancing */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-200">
              <h4 className="font-bold text-xl text-gray-800 mb-3 flex items-center gap-2">
                💼 Personal Loan Refinancing
              </h4>
              <p className="text-gray-700 text-sm sm:text-base mb-4">
                Replace your existing personal loan with a new one that offers better interest rates or terms. This is particularly beneficial if your financial situation has improved since taking out the original loan.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                  <p className="font-semibold text-green-700 mb-2 text-sm">Lower Rate</p>
                  <p className="text-xs text-gray-600">Save on interest with a reduced APR based on improved credit</p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-700 mb-2 text-sm">Adjust Term</p>
                  <p className="text-xs text-gray-600">Shorten term to save interest or lengthen to lower payments</p>
                </div>
                <div className="bg-white p-3 rounded-lg border-l-4 border-purple-500">
                  <p className="font-semibold text-purple-700 mb-2 text-sm">Consolidate</p>
                  <p className="text-xs text-gray-600">Combine multiple personal loans into one payment</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Successful Refinancing */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-teal-600" />
              Tips for Successful Refinancing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: "📊",
                  title: "Check Your Credit Score",
                  desc: "A score of 700+ typically qualifies for the best rates. Review your credit report and fix any errors before applying."
                },
                {
                  icon: "🔍",
                  title: "Shop Around",
                  desc: "Compare offers from at least 3-5 lenders. Rates and fees can vary significantly, potentially saving you thousands."
                },
                {
                  icon: "🧮",
                  title: "Calculate Break-Even",
                  desc: "Use this calculator to determine when you'll recover closing costs. Ensure you'll stay in the loan long enough to benefit."
                },
                {
                  icon: "📅",
                  title: "Time It Right",
                  desc: "Refinance when rates are significantly lower (at least 0.5-1% reduction) or when your financial situation improves."
                },
                {
                  icon: "💼",
                  title: "Gather Documentation",
                  desc: "Have pay stubs, tax returns, bank statements, and property documents ready to speed up the application process."
                },
                {
                  icon: "⚖️",
                  title: "Read the Fine Print",
                  desc: "Watch for prepayment penalties on your current loan and hidden fees in your new loan agreement."
                },
                {
                  icon: "🎯",
                  title: "Consider Your Goals",
                  desc: "Are you prioritizing lower monthly payments, paying off debt faster, or accessing cash? Choose terms that align with your objectives."
                },
                {
                  icon: "🏦",
                  title: "Negotiate Fees",
                  desc: "Some closing costs are negotiable. Ask lenders to waive or reduce application fees, origination fees, or points."
                }
              ].map((tip, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border-2 border-teal-100 hover:border-teal-300 hover:shadow-lg transition-all">
                  <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="text-2xl">{tip.icon}</span>
                    {tip.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{tip.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefinanceCalculatorComponent;
