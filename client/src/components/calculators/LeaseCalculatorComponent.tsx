import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Calculator, PieChart, TrendingUp, DollarSign, Calendar, Percent, FileText, HelpCircle, BarChart3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeaseInputs {
  assetValue: number;
  residualValue: number;
  residualPercent: number;
  useResidualPercent: boolean;
  leaseTermYears: number;
  leaseTermMonths: number;
  interestRate: number;
  monthlyPayment: number;
  salesTax: number;
  acquisitionFee: number;
  securityDeposit: number;
  downPayment: number;
}

interface LeaseResults {
  monthlyPayment: number;
  totalMonthlyPayments: number;
  totalInterest: number;
  totalDepreciation: number;
  totalCost: number;
  effectiveInterestRate: number;
  principalPercentage: number;
  interestPercentage: number;
  depreciationFee: number;
  financeFee: number;
  upfrontCosts: number;
  residualValue: number;
  schedule: Array<{
    month: number;
    year: number;
    depreciation: number;
    finance: number;
    payment: number;
    cumulativeDepreciation: number;
    cumulativeFinance: number;
    remainingValue: number;
  }>;
}

const LeaseCalculatorComponent = () => {
  const [activeTab, setActiveTab] = useState<'fixedRate' | 'fixedPay'>('fixedRate');
  
  const [inputs, setInputs] = useState<LeaseInputs>({
    assetValue: 20000,
    residualValue: 8000,
    residualPercent: 40,
    useResidualPercent: false,
    leaseTermYears: 3,
    leaseTermMonths: 0,
    interestRate: 6,
    monthlyPayment: 405,
    salesTax: 7.5,
    acquisitionFee: 595,
    securityDeposit: 0,
    downPayment: 0
  });

  const [results, setResults] = useState<LeaseResults>({
    monthlyPayment: 0,
    totalMonthlyPayments: 0,
    totalInterest: 0,
    totalDepreciation: 0,
    totalCost: 0,
    effectiveInterestRate: 0,
    principalPercentage: 0,
    interestPercentage: 0,
    depreciationFee: 0,
    financeFee: 0,
    upfrontCosts: 0,
    residualValue: 0,
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

  // Calculate lease with fixed interest rate
  const calculateFixedRateLease = (): LeaseResults => {
    const { assetValue, residualValue, residualPercent, useResidualPercent, 
            leaseTermYears, leaseTermMonths, interestRate, salesTax, 
            acquisitionFee, securityDeposit, downPayment } = inputs;
    
    if (assetValue <= 0 || leaseTermYears < 0 || leaseTermMonths < 0) {
      return getEmptyResults();
    }

    const totalMonths = (leaseTermYears * 12) + leaseTermMonths;
    if (totalMonths <= 0) {
      return getEmptyResults();
    }

    // Calculate actual residual value
    const actualResidualValue = useResidualPercent 
      ? (assetValue * residualPercent / 100) 
      : residualValue;

    if (actualResidualValue >= assetValue) {
      return getEmptyResults();
    }

    // Calculate net capitalized cost
    // Add acquisition fee and security deposit (both are rolled into lease), subtract down payment
    const netCapitalizedCost = assetValue + acquisitionFee + securityDeposit - downPayment;

    // Calculate depreciation (difference between net capitalized cost and residual)
    const totalDepreciation = netCapitalizedCost - actualResidualValue;
    const depreciationFee = totalDepreciation / totalMonths;

    // Calculate finance fee (money factor approach)
    // Finance fee is based on average of net cap cost and residual value
    const monthlyRate = interestRate / 100 / 12;
    const financeFee = (netCapitalizedCost + actualResidualValue) * monthlyRate;

    // Base monthly payment (before tax)
    const baseMonthlyPayment = depreciationFee + financeFee;

    // Apply sales tax to monthly payment
    const taxAmount = baseMonthlyPayment * (salesTax / 100);
    const monthlyPayment = baseMonthlyPayment + taxAmount;

    // Calculate totals
    const totalMonthlyPayments = monthlyPayment * totalMonths;
    const totalInterest = financeFee * totalMonths;
    // Upfront cost is only the down payment (acquisition fee and security deposit are financed)
    const upfrontCosts = downPayment;
    const totalCost = totalMonthlyPayments + upfrontCosts;

    // Calculate percentages for pie chart
    const principalPercentage = totalDepreciation > 0 
      ? (totalDepreciation / (totalDepreciation + totalInterest)) * 100 
      : 0;
    const interestPercentage = totalDepreciation > 0 
      ? (totalInterest / (totalDepreciation + totalInterest)) * 100 
      : 0;

    // Generate payment schedule
    const schedule = generateSchedule(
      totalMonths, 
      depreciationFee, 
      financeFee, 
      taxAmount, 
      netCapitalizedCost, 
      actualResidualValue,
      showMonthlySchedule
    );

    return {
      monthlyPayment,
      totalMonthlyPayments,
      totalInterest,
      totalDepreciation,
      totalCost,
      effectiveInterestRate: interestRate,
      principalPercentage,
      interestPercentage,
      depreciationFee,
      financeFee,
      upfrontCosts,
      residualValue: actualResidualValue,
      schedule
    };
  };

  // Calculate effective interest rate from fixed monthly payment
  const calculateFixedPayLease = (): LeaseResults => {
    const { assetValue, residualValue, residualPercent, useResidualPercent, 
            leaseTermYears, leaseTermMonths, monthlyPayment, salesTax,
            acquisitionFee, securityDeposit, downPayment } = inputs;
    
    if (assetValue <= 0 || leaseTermYears < 0 || leaseTermMonths < 0 || monthlyPayment <= 0) {
      return getEmptyResults();
    }

    const totalMonths = (leaseTermYears * 12) + leaseTermMonths;
    if (totalMonths <= 0) {
      return getEmptyResults();
    }

    // Calculate actual residual value
    const actualResidualValue = useResidualPercent 
      ? (assetValue * residualPercent / 100) 
      : residualValue;

    if (actualResidualValue >= assetValue) {
      return getEmptyResults();
    }

    // Calculate net capitalized cost
    // Add acquisition fee and security deposit (both are rolled into lease), subtract down payment
    const netCapitalizedCost = assetValue + acquisitionFee + securityDeposit - downPayment;

    // Remove sales tax from monthly payment to get base payment
    const baseMonthlyPayment = monthlyPayment / (1 + salesTax / 100);

    // Calculate depreciation
    const totalDepreciation = netCapitalizedCost - actualResidualValue;
    const depreciationFee = totalDepreciation / totalMonths;

    // Calculate finance fee from base payment
    const financeFee = baseMonthlyPayment - depreciationFee;

    // Calculate effective interest rate using the money factor formula
    // financeFee = (netCapitalizedCost + residualValue) * monthlyRate
    // monthlyRate = financeFee / (netCapitalizedCost + residualValue)
    const monthlyRate = financeFee / (netCapitalizedCost + actualResidualValue);
    const effectiveInterestRate = monthlyRate * 12 * 100;

    // Calculate totals
    const totalMonthlyPayments = monthlyPayment * totalMonths;
    const totalInterest = financeFee * totalMonths;
    // Upfront cost is only the down payment (acquisition fee and security deposit are financed)
    const upfrontCosts = downPayment;
    const totalCost = totalMonthlyPayments + upfrontCosts;

    // Calculate percentages for pie chart
    const principalPercentage = totalDepreciation > 0 
      ? (totalDepreciation / (totalDepreciation + totalInterest)) * 100 
      : 0;
    const interestPercentage = totalDepreciation > 0 
      ? (totalInterest / (totalDepreciation + totalInterest)) * 100 
      : 0;

    // Generate payment schedule
    const taxAmount = monthlyPayment - baseMonthlyPayment;
    const schedule = generateSchedule(
      totalMonths, 
      depreciationFee, 
      financeFee, 
      taxAmount, 
      netCapitalizedCost, 
      actualResidualValue,
      showMonthlySchedule
    );

    return {
      monthlyPayment,
      totalMonthlyPayments,
      totalInterest,
      totalDepreciation,
      totalCost,
      effectiveInterestRate: Math.max(0, effectiveInterestRate),
      principalPercentage,
      interestPercentage,
      depreciationFee,
      financeFee,
      upfrontCosts,
      residualValue: actualResidualValue,
      schedule
    };
  };

  const generateSchedule = (
    totalMonths: number,
    depreciationFee: number,
    financeFee: number,
    taxAmount: number,
    assetValue: number,
    residualValue: number,
    isMonthly: boolean
  ) => {
    const schedule = [];
    let cumulativeDepreciation = 0;
    let cumulativeFinance = 0;

    if (isMonthly) {
      // Monthly schedule
      for (let month = 1; month <= totalMonths; month++) {
        cumulativeDepreciation += depreciationFee;
        cumulativeFinance += financeFee;
        const remainingValue = assetValue - cumulativeDepreciation;

        schedule.push({
          month: month,
          year: Math.ceil(month / 12),
          depreciation: depreciationFee,
          finance: financeFee,
          payment: depreciationFee + financeFee + taxAmount,
          cumulativeDepreciation: cumulativeDepreciation,
          cumulativeFinance: cumulativeFinance,
          remainingValue: Math.max(remainingValue, residualValue)
        });
      }
    } else {
      // Annual schedule
      const years = Math.ceil(totalMonths / 12);
      for (let year = 1; year <= years; year++) {
        const monthsInYear = year === years ? (totalMonths % 12 || 12) : 12;
        const yearDepreciation = depreciationFee * monthsInYear;
        const yearFinance = financeFee * monthsInYear;
        
        cumulativeDepreciation += yearDepreciation;
        cumulativeFinance += yearFinance;
        const remainingValue = assetValue - cumulativeDepreciation;

        schedule.push({
          month: year * 12,
          year: year,
          depreciation: yearDepreciation,
          finance: yearFinance,
          payment: (depreciationFee + financeFee + taxAmount) * monthsInYear,
          cumulativeDepreciation: cumulativeDepreciation,
          cumulativeFinance: cumulativeFinance,
          remainingValue: Math.max(remainingValue, residualValue)
        });
      }
    }

    return schedule;
  };

  const getEmptyResults = (): LeaseResults => ({
    monthlyPayment: 0,
    totalMonthlyPayments: 0,
    totalInterest: 0,
    totalDepreciation: 0,
    totalCost: 0,
    effectiveInterestRate: 0,
    principalPercentage: 0,
    interestPercentage: 0,
    depreciationFee: 0,
    financeFee: 0,
    upfrontCosts: 0,
    residualValue: 0,
    schedule: []
  });

  useEffect(() => {
    const newResults = activeTab === 'fixedRate' 
      ? calculateFixedRateLease() 
      : calculateFixedPayLease();
    setResults(newResults);
  }, [inputs, showMonthlySchedule, activeTab]);

  const handleInputChange = (field: keyof LeaseInputs, value: string | number | boolean) => {
    setInputs(prev => {
      const updated = {
        ...prev,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      };

      // Auto-calculate residual value when using percentage
      if (field === 'useResidualPercent' && value === true) {
        updated.residualValue = (updated.assetValue * updated.residualPercent) / 100;
      } else if (field === 'residualPercent' && updated.useResidualPercent) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : (typeof value === 'number' ? value : 0);
        updated.residualValue = (updated.assetValue * numValue) / 100;
      } else if (field === 'assetValue' && updated.useResidualPercent) {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : (typeof value === 'number' ? value : 0);
        updated.residualValue = (numValue * updated.residualPercent) / 100;
      }

      // Auto-calculate residual percent when using dollar amount
      if (field === 'residualValue' && !updated.useResidualPercent) {
        const resValue = typeof value === 'string' ? parseFloat(value) || 0 : (typeof value === 'number' ? value : 0);
        updated.residualPercent = updated.assetValue > 0 ? (resValue / updated.assetValue) * 100 : 0;
      } else if (field === 'assetValue' && !updated.useResidualPercent) {
        const assetVal = typeof value === 'string' ? parseFloat(value) || 0 : (typeof value === 'number' ? value : 0);
        updated.residualPercent = assetVal > 0 ? (updated.residualValue / assetVal) * 100 : 0;
      }

      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-indigo-600" />
            Lease Calculator
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Calculate lease payments with fixed interest rates or determine effective rates from known payments. 
            Includes comprehensive analysis with depreciation schedules and total cost breakdowns.
          </p>
        </div>

        {/* Tabs for Fixed Rate vs Fixed Payment */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fixedRate' | 'fixedPay')} className="mb-6 sm:mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto mb-6 h-auto p-1">
            <TabsTrigger value="fixedRate" className="text-sm sm:text-base py-3 px-4 data-[state=active]:bg-white">
              <Percent className="h-4 w-4 mr-2" />
              <span>Fixed Rate</span>
            </TabsTrigger>
            <TabsTrigger value="fixedPay" className="text-sm sm:text-base py-3 px-4 data-[state=active]:bg-white">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>Fixed Payment</span>
            </TabsTrigger>
          </TabsList>

          {/* Fixed Rate Tab */}
          <TabsContent value="fixedRate">
            <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">Lease Details</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Enter the asset value, residual value, lease term, and interest rate to calculate monthly payment
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="assetValue" className="text-sm font-medium text-gray-700">
                      Asset Value
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="assetValue"
                        type="number"
                        value={inputs.assetValue}
                        onChange={(e) => handleInputChange('assetValue', e.target.value)}
                        className="pl-10"
                        placeholder="20000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Residual Value
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">The estimated value of the asset at the end of the lease term</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="number"
                          value={inputs.residualValue}
                          onChange={(e) => handleInputChange('residualValue', e.target.value)}
                          className="pl-10"
                          placeholder="8000"
                          disabled={inputs.useResidualPercent}
                        />
                      </div>
                      <Button
                        type="button"
                        variant={inputs.useResidualPercent ? "default" : "outline"}
                        onClick={() => handleInputChange('useResidualPercent', !inputs.useResidualPercent)}
                        className="px-3"
                      >
                        %
                      </Button>
                    </div>
                    {inputs.useResidualPercent && (
                      <div className="relative">
                        <Input
                          type="number"
                          value={inputs.residualPercent}
                          onChange={(e) => handleInputChange('residualPercent', e.target.value)}
                          className="pr-8"
                          placeholder="40"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interestRate" className="text-sm font-medium text-gray-700">
                      Interest Rate (APR)
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
                        placeholder="6.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseTermYears" className="text-sm font-medium text-gray-700">
                      Lease Term (Years)
                    </Label>
                    <Input
                      id="leaseTermYears"
                      type="number"
                      value={inputs.leaseTermYears}
                      onChange={(e) => handleInputChange('leaseTermYears', e.target.value)}
                      placeholder="3"
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseTermMonths" className="text-sm font-medium text-gray-700">
                      Additional Months
                    </Label>
                    <Input
                      id="leaseTermMonths"
                      type="number"
                      value={inputs.leaseTermMonths}
                      onChange={(e) => handleInputChange('leaseTermMonths', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesTax" className="text-sm font-medium text-gray-700">
                      Sales Tax (%)
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="salesTax"
                        type="number"
                        step="0.1"
                        value={inputs.salesTax}
                        onChange={(e) => handleInputChange('salesTax', e.target.value)}
                        className="pl-10"
                        placeholder="7.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acquisitionFee" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Acquisition Fee
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">One-time fee charged at lease signing</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="acquisitionFee"
                        type="number"
                        value={inputs.acquisitionFee}
                        onChange={(e) => handleInputChange('acquisitionFee', e.target.value)}
                        className="pl-10"
                        placeholder="595"
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
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="securityDeposit" className="text-sm font-medium text-gray-700">
                      Security Deposit
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="securityDeposit"
                        type="number"
                        value={inputs.securityDeposit}
                        onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixed Payment Tab */}
          <TabsContent value="fixedPay">
            <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">Lease Details</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Enter the asset value, residual value, lease term, and monthly payment to calculate effective interest rate
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="assetValueFixed" className="text-sm font-medium text-gray-700">
                      Asset Value
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="assetValueFixed"
                        type="number"
                        value={inputs.assetValue}
                        onChange={(e) => handleInputChange('assetValue', e.target.value)}
                        className="pl-10"
                        placeholder="20000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      Residual Value
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">The estimated value of the asset at the end of the lease term</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="number"
                          value={inputs.residualValue}
                          onChange={(e) => handleInputChange('residualValue', e.target.value)}
                          className="pl-10"
                          placeholder="8000"
                          disabled={inputs.useResidualPercent}
                        />
                      </div>
                      <Button
                        type="button"
                        variant={inputs.useResidualPercent ? "default" : "outline"}
                        onClick={() => handleInputChange('useResidualPercent', !inputs.useResidualPercent)}
                        className="px-3"
                      >
                        %
                      </Button>
                    </div>
                    {inputs.useResidualPercent && (
                      <div className="relative">
                        <Input
                          type="number"
                          value={inputs.residualPercent}
                          onChange={(e) => handleInputChange('residualPercent', e.target.value)}
                          className="pr-8"
                          placeholder="40"
                          min="0"
                          max="100"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyPaymentFixed" className="text-sm font-medium text-gray-700">
                      Monthly Payment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="monthlyPaymentFixed"
                        type="number"
                        step="0.01"
                        value={inputs.monthlyPayment}
                        onChange={(e) => handleInputChange('monthlyPayment', e.target.value)}
                        className="pl-10"
                        placeholder="405.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseTermYearsFixed" className="text-sm font-medium text-gray-700">
                      Lease Term (Years)
                    </Label>
                    <Input
                      id="leaseTermYearsFixed"
                      type="number"
                      value={inputs.leaseTermYears}
                      onChange={(e) => handleInputChange('leaseTermYears', e.target.value)}
                      placeholder="3"
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseTermMonthsFixed" className="text-sm font-medium text-gray-700">
                      Additional Months
                    </Label>
                    <Input
                      id="leaseTermMonthsFixed"
                      type="number"
                      value={inputs.leaseTermMonths}
                      onChange={(e) => handleInputChange('leaseTermMonths', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salesTaxFixed" className="text-sm font-medium text-gray-700">
                      Sales Tax (%)
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="salesTaxFixed"
                        type="number"
                        step="0.1"
                        value={inputs.salesTax}
                        onChange={(e) => handleInputChange('salesTax', e.target.value)}
                        className="pl-10"
                        placeholder="7.5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acquisitionFeeFixed" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      Acquisition Fee
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">One-time fee charged at lease signing</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="acquisitionFeeFixed"
                        type="number"
                        value={inputs.acquisitionFee}
                        onChange={(e) => handleInputChange('acquisitionFee', e.target.value)}
                        className="pl-10"
                        placeholder="595"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downPaymentFixed" className="text-sm font-medium text-gray-700">
                      Down Payment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="downPaymentFixed"
                        type="number"
                        value={inputs.downPayment}
                        onChange={(e) => handleInputChange('downPayment', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="securityDepositFixed" className="text-sm font-medium text-gray-700">
                      Security Deposit
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="securityDepositFixed"
                        type="number"
                        value={inputs.securityDeposit}
                        onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Lease Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            
            {/* Main Result */}
            {activeTab === 'fixedRate' ? (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 rounded-xl shadow-lg mb-6">
                <div className="text-center">
                  <h3 className="text-white text-base sm:text-lg mb-2 font-medium">Monthly Payment</h3>
                  <p className="text-white text-4xl sm:text-5xl font-bold">
                    {formatCurrency(results.monthlyPayment)}
                  </p>
                  <p className="text-purple-100 text-sm mt-2">
                    for {inputs.leaseTermYears * 12 + inputs.leaseTermMonths} months
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 sm:p-8 rounded-xl shadow-lg mb-6">
                <div className="text-center">
                  <h3 className="text-white text-base sm:text-lg mb-2 font-medium">Effective Interest Rate</h3>
                  <p className="text-white text-4xl sm:text-5xl font-bold">
                    {formatPercent(results.effectiveInterestRate)}
                  </p>
                  <p className="text-purple-100 text-sm mt-2">
                    APR calculated from monthly payment
                  </p>
                </div>
              </div>
            )}

            {/* Lease Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6">
              
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-800">Total Monthly Payments</h3>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{formatCurrency(results.totalMonthlyPayments)}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Over lease term
                </p>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-green-800">Total Depreciation</h3>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(results.totalDepreciation)}</p>
                <p className="text-xs text-green-700 mt-1">
                  Asset value reduction
                </p>
              </div>

              <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-red-800">Total Interest</h3>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-red-900">{formatCurrency(results.totalInterest)}</p>
                <p className="text-xs text-red-700 mt-1">
                  Finance charges
                </p>
              </div>

              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-purple-800">Residual Value</h3>
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">{formatCurrency(results.residualValue)}</p>
                <p className="text-xs text-purple-700 mt-1">
                  {formatPercent((results.residualValue / inputs.assetValue) * 100)} of asset value
                </p>
              </div>

              <div className="bg-orange-50 p-4 sm:p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-orange-800">Upfront Costs</h3>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-orange-900">{formatCurrency(results.upfrontCosts)}</p>
                <p className="text-xs text-orange-700 mt-1">
                  Due at signing
                </p>
              </div>

              <div className="bg-indigo-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-indigo-800">Total Lease Cost</h3>
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-indigo-900">{formatCurrency(results.totalCost)}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  All costs included
                </p>
              </div>
            </div>

            {/* Interactive Graphs */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              
              {/* Depreciation vs Interest Pie Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Payment Breakdown</h3>
                <div className="relative h-64 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    {results.totalDepreciation > 0 && (
                      <>
                        {/* Depreciation slice */}
                        <path
                          d={`M 100 100 L 100 20 A 80 80 0 ${results.principalPercentage > 50 ? 1 : 0} 1 ${
                            100 + 80 * Math.sin((results.principalPercentage / 100) * 2 * Math.PI)
                          } ${
                            100 - 80 * Math.cos((results.principalPercentage / 100) * 2 * Math.PI)
                          } Z`}
                          fill="#10B981"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                        >
                          <title>Depreciation: {formatPercent(results.principalPercentage)}</title>
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
                          {formatCurrency(results.totalMonthlyPayments).replace('$', '$').slice(0, 8)}
                        </text>
                      </>
                    )}
                  </svg>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700">Depreciation ({formatPercent(results.principalPercentage)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700">Interest ({formatPercent(results.interestPercentage)})</span>
                  </div>
                </div>
              </div>

              {/* Asset Value Depreciation Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Asset Value Over Time</h3>
                <div className="relative h-64">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    {/* Grid lines */}
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
                          {formatCurrency(inputs.assetValue * (100 - percent) / 100).slice(0, 5)}
                        </text>
                      </g>
                    ))}

                    {/* Draw line chart */}
                    {results.schedule.length > 0 && (
                      <>
                        <polyline
                          points={results.schedule
                            .filter((_, i) => !showMonthlySchedule || i % Math.ceil(results.schedule.length / 10) === 0)
                            .slice(0, 12)
                            .map((item, index, arr) => {
                              const x = 40 + (340 * index) / Math.max(arr.length - 1, 1);
                              const y = 20 + (160 * (1 - item.remainingValue / inputs.assetValue));
                              return `${x},${y}`;
                            })
                            .join(' ')}
                          fill="none"
                          stroke="#6366F1"
                          strokeWidth="3"
                        />
                        
                        {/* Points */}
                        {results.schedule
                          .filter((_, i) => !showMonthlySchedule || i % Math.ceil(results.schedule.length / 10) === 0)
                          .slice(0, 12)
                          .map((item, index, arr) => {
                            const x = 40 + (340 * index) / Math.max(arr.length - 1, 1);
                            const y = 20 + (160 * (1 - item.remainingValue / inputs.assetValue));
                            return (
                              <circle
                                key={index}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#6366F1"
                                className="cursor-pointer"
                              >
                                <title>{formatCurrency(item.remainingValue)}</title>
                              </circle>
                            );
                          })}
                      </>
                    )}

                    {/* X-axis labels */}
                    {results.schedule.length > 0 && results.schedule
                      .filter((_, i) => !showMonthlySchedule || i % Math.ceil(results.schedule.length / 10) === 0)
                      .slice(0, 12)
                      .map((item, index, arr) => {
                        const x = 40 + (340 * index) / Math.max(arr.length - 1, 1);
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
                  </svg>
                </div>
              </div>
            </div>

            {/* Payment Schedule Table */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Payment Schedule</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMonthlySchedule(!showMonthlySchedule)}
                  className="text-xs sm:text-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {showMonthlySchedule ? 'Show Annual' : 'Show Monthly'}
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-700">
                        {showMonthlySchedule ? 'Month' : 'Year'}
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700">Depreciation</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700">Finance</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700">Payment</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-700">Asset Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.schedule.slice(0, showMonthlySchedule ? 12 : results.schedule.length).map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-left font-medium text-gray-900">
                          {showMonthlySchedule ? item.month : item.year}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700">
                          {formatCurrency(item.depreciation)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700">
                          {formatCurrency(item.finance)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(item.payment)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-gray-700">
                          {formatCurrency(item.remainingValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {showMonthlySchedule && results.schedule.length > 12 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing first 12 months of {results.schedule.length} total months
                  </p>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Educational Content */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">
              Understanding Leases: A Comprehensive Guide
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Everything you need to know about leasing assets, from fundamentals to advanced strategies
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">What is a Lease?</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                A lease is a contractual agreement between two parties: the <strong>lessor</strong> (legal owner of an asset) 
                and the <strong>lessee</strong> (person or entity seeking to use the asset). Under this arrangement, the lessee 
                obtains the right to use specific assets for a predetermined period in exchange for regular rental payments. 
                Leases are legally binding contracts designed to protect the interests of both parties through clearly defined 
                terms, conditions, and obligations.
              </p>

              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                While commonly associated with real estate (apartments, offices) and vehicles (cars, trucks), leasing extends 
                to virtually any asset that can be owned and transferred. Modern leasing encompasses equipment, machinery, 
                technology infrastructure, aircraft, storage facilities, conveyor systems, lighting fixtures, furniture, 
                software licenses, server hardware, cleaning equipment, and countless other business and personal assets.
              </p>

              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">Rent vs. Lease: Key Distinction</h4>
                <p className="text-blue-800 text-xs sm:text-sm leading-relaxed mb-3">
                  Though frequently used interchangeably in casual conversation, "rent" and "lease" have distinct legal meanings:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="font-semibold text-blue-900 text-sm mb-1">Lease</p>
                    <p className="text-blue-700 text-xs">Refers to the contractual agreement itself—the formal document outlining 
                    terms, conditions, responsibilities, and duration of the arrangement.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="font-semibold text-blue-900 text-sm mb-1">Rent</p>
                    <p className="text-blue-700 text-xs">Refers to the periodic payment made by the lessee to the lessor for 
                    the ongoing use of the asset during the lease term.</p>
                  </div>
                </div>
                <p className="text-blue-700 text-xs mt-3 italic">
                  Important: In neither case does the lessee gain ownership equity in the asset being leased or rented.
                </p>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Understanding Residual Value</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                <strong>Residual value</strong> (also called salvage value or end-of-lease value) represents the estimated worth 
                of an asset at the conclusion of its lease term. This figure is critical in lease calculations because it directly 
                impacts monthly payments—the difference between the asset's initial value and its residual value determines the 
                depreciation amount you'll pay for over the lease period.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="border-l-4 border-green-300 pl-3 sm:pl-4">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Automotive Example</p>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                      A luxury sedan valued at $50,000 leased for 3 years might have a residual value of $28,000 (56% retention). 
                      This means you're essentially paying for $22,000 of depreciation over 36 months ($611/month in depreciation 
                      alone), plus finance charges. Vehicles with higher residual values result in lower monthly payments, making 
                      brands known for strong resale values (Toyota, Honda, Lexus) typically more affordable to lease.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-300 pl-3 sm:pl-4">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Equipment Leasing</p>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                      Heavy machinery, medical equipment, or technology assets often depreciate rapidly. A $100,000 CT scanner 
                      leased for 5 years might retain only $25,000 (25%) in residual value due to technological advancement and 
                      wear. Construction equipment faces similar depreciation patterns, with factors like operating hours, 
                      maintenance history, and market demand significantly affecting end-of-lease value.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="border-l-4 border-purple-300 pl-3 sm:pl-4">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Real Estate Exception</p>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                      Commercial real estate leases represent a unique case where residual value often <em>exceeds</em> the 
                      initial value due to property appreciation. A retail space leased for 10 years at $500,000 initial value 
                      might be worth $650,000 at lease end due to market appreciation, development, or improvements. This is why 
                      commercial property leases often include purchase options or right-of-first-refusal clauses.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-300 pl-3 sm:pl-4">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">Factors Affecting Residual Value</p>
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                      • <strong>Asset Type:</strong> Vehicles depreciate 15-20% annually; real estate often appreciates<br/>
                      • <strong>Lease Duration:</strong> Longer terms typically mean lower residual percentages<br/>
                      • <strong>Usage & Condition:</strong> Mileage limits, maintenance records, wear and tear<br/>
                      • <strong>Market Trends:</strong> Technology obsolescence, economic conditions, demand fluctuations<br/>
                      • <strong>Brand Reputation:</strong> Quality and reliability affect long-term value retention
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <h4 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3">
                  Residual Value in Lease Calculations
                </h4>
                <p className="text-purple-800 text-xs sm:text-sm leading-relaxed mb-3">
                  Your monthly lease payment consists of two primary components that are directly influenced by residual value:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 text-sm mb-1">Depreciation Fee</p>
                    <p className="text-purple-700 text-xs mb-2">
                      (Asset Value - Residual Value) ÷ Lease Months
                    </p>
                    <p className="text-purple-600 text-xs">
                      Example: ($30,000 - $15,000) ÷ 36 = $416.67/month
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-semibold text-purple-900 text-sm mb-1">Finance Fee (Rent Charge)</p>
                    <p className="text-purple-700 text-xs mb-2">
                      (Asset Value + Residual Value) × Money Factor
                    </p>
                    <p className="text-purple-600 text-xs">
                      Example: ($30,000 + $15,000) × 0.0025 = $112.50/month
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Leasing a Vehicle: Cars, Trucks, and More</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Auto leasing has become increasingly popular, allowing drivers to enjoy new vehicles with the latest technology, 
                safety features, and warranty coverage without the long-term commitment and depreciation risks of ownership. 
                Leases typically run 24-36 months, keeping you in a newer vehicle while under manufacturer warranty, eliminating 
                concerns about major repair costs and providing predictable monthly expenses.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Advantages of Auto Leasing
                    </h4>
                    <ul className="text-green-700 text-xs sm:text-sm space-y-1 leading-relaxed">
                      <li>• <strong>Lower Monthly Payments:</strong> Typically 30-60% less than financing purchase</li>
                      <li>• <strong>Warranty Coverage:</strong> Most repairs covered under manufacturer warranty</li>
                      <li>• <strong>Latest Technology:</strong> Upgrade every 2-3 years to newest features</li>
                      <li>• <strong>No Resale Hassle:</strong> Simply return vehicle at lease end</li>
                      <li>• <strong>Gap Insurance:</strong> Often included, protecting against total loss scenarios</li>
                      <li>• <strong>Tax Benefits:</strong> Business use may allow lease payment deductions</li>
                      <li>• <strong>Predictable Costs:</strong> Fixed payments with minimal surprise expenses</li>
                    </ul>
                  </div>

                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">The Money Factor Explained</h4>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Unique to auto leasing, the <strong>money factor</strong> (also called lease factor or lease fee) is an 
                      alternative way to express interest rates on lease agreements. Instead of APR, it's presented as a small 
                      decimal number.
                    </p>
                    <div className="bg-white p-2 rounded border border-blue-200 mb-2">
                      <p className="text-blue-900 text-xs font-mono">
                        Money Factor × 2,400 = APR
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        Example: 0.00250 × 2,400 = 6% APR
                      </p>
                    </div>
                    <p className="text-blue-600 text-xs italic">
                      Dealers may quote money factors to make rates seem smaller. Always convert to APR for accurate comparison 
                      with financing options.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">
                      Critical Lease Considerations
                    </h4>
                    <ul className="text-red-700 text-xs sm:text-sm space-y-1 leading-relaxed">
                      <li>• <strong>Mileage Limits:</strong> Typically 10,000-15,000 miles/year; overage fees $0.15-$0.30/mile</li>
                      <li>• <strong>Wear and Tear:</strong> Excessive damage charges at lease end can total $1,000-$3,000+</li>
                      <li>• <strong>Early Termination:</strong> Penalties can equal remaining payments; very costly</li>
                      <li>• <strong>No Equity Building:</strong> Payments don't build ownership value</li>
                      <li>• <strong>Capitalized Cost:</strong> Negotiate this (vehicle price) just like a purchase</li>
                      <li>• <strong>Acquisition Fees:</strong> $395-$995 upfront, often non-negotiable</li>
                      <li>• <strong>Disposition Fee:</strong> $300-$500 charged when returning vehicle</li>
                    </ul>
                  </div>

                  <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">Lease vs. Rent Comparison</h4>
                    <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed mb-2">
                      While both involve using vehicles you don't own, car leasing and renting serve different purposes:
                    </p>
                    <div className="space-y-2">
                      <div className="bg-white p-2 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-900 text-xs">Leasing (Long-term)</p>
                        <p className="text-yellow-700 text-xs">24-48 months • Through dealerships • Lower daily cost • 
                        Your responsibility for maintenance and insurance</p>
                      </div>
                      <div className="bg-white p-2 rounded border border-yellow-200">
                        <p className="font-semibold text-yellow-900 text-xs">Renting (Short-term)</p>
                        <p className="text-yellow-700 text-xs">Days to weeks • Through rental agencies • Higher daily cost • 
                        Maintenance and insurance included</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
                <h4 className="text-base sm:text-lg font-semibold text-indigo-900 mb-2 sm:mb-3">
                  Smart Auto Lease Negotiation Tips
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-indigo-800 text-xs sm:text-sm mb-2"><strong>1. Negotiate the Capitalized Cost</strong></p>
                    <p className="text-indigo-700 text-xs">
                      The vehicle price (cap cost) is negotiable just like a purchase. A $2,000 reduction on a 36-month lease 
                      saves $55/month plus reduces finance charges.
                    </p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs sm:text-sm mb-2"><strong>2. Shop Money Factor Rates</strong></p>
                    <p className="text-indigo-700 text-xs">
                      Different lenders offer different rates. A 0.0020 money factor vs 0.0030 on a $30,000 lease saves $12/month 
                      ($432 total over 36 months).
                    </p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs sm:text-sm mb-2"><strong>3. Understand the Residual Value</strong></p>
                    <p className="text-indigo-700 text-xs">
                      While typically non-negotiable (set by manufacturer), choosing models with higher residual percentages 
                      reduces depreciation costs and monthly payments.
                    </p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs sm:text-sm mb-2"><strong>4. Consider Multiple Security Deposits</strong></p>
                    <p className="text-indigo-700 text-xs">
                      Some lessors allow up to 9 security deposits (refundable) to reduce money factor by 0.0001-0.0002 each, 
                      potentially lowering payments $10-30/month.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Business Equipment Leasing</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Some of the world's largest corporations hold lease portfolios worth billions of dollars, covering everything 
                from manufacturing equipment to technology infrastructure. Business leasing offers significant strategic and 
                financial advantages, particularly for companies looking to preserve capital, maintain cash flow flexibility, 
                and access equipment that might otherwise require substantial upfront investment.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Capital Lease (Finance Lease)</h4>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="border-l-4 border-blue-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Accounting Treatment</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Treated as a purchase for accounting purposes. The asset appears on the company's balance sheet as both 
                        an asset and a liability. The company can claim depreciation on the asset value and deduct interest 
                        expenses, similar to a financed purchase. Under ASC 842 (FASB), virtually all leases must now be 
                        capitalized on balance sheets.
                      </p>
                    </div>

                    <div className="border-l-4 border-green-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Qualification Criteria (FASB)</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        A lease qualifies as a capital lease if it meets <strong>any one</strong> of these conditions:
                      </p>
                      <ul className="text-gray-700 text-xs sm:text-sm mt-2 space-y-1">
                        <li>• Ownership transfers to lessee at lease end</li>
                        <li>• Lease contains a bargain purchase option</li>
                        <li>• Lease term ≥ 75% of asset's useful economic life</li>
                        <li>• Present value of payments ≥ 90% of asset's fair market value</li>
                        <li>• Asset is specialized with no alternative use to lessor</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Typical Use Cases</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        • Long-term equipment needs (manufacturing machinery, production lines)<br/>
                        • Specialized equipment unlikely to become obsolete (industrial tools)<br/>
                        • Real estate and building improvements with long useful lives<br/>
                        • Major technology infrastructure (data centers, telecommunications)<br/>
                        • Transportation fleets where ownership at term end is beneficial
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Operating Lease (Service Lease)</h4>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="border-l-4 border-orange-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Accounting Treatment</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Historically treated as rental expense (off-balance-sheet financing), though ASC 842 now requires balance 
                        sheet recognition. Lease payments are recorded as operating expenses, reducing taxable income. The lessor 
                        retains ownership and all ownership risks. Companies prefer this for flexibility and the ability to upgrade 
                        equipment regularly without long-term commitment.
                      </p>
                    </div>

                    <div className="border-l-4 border-red-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Key Characteristics</p>
                      <ul className="text-gray-700 text-xs sm:text-sm space-y-1 leading-relaxed">
                        <li>• Shorter lease terms relative to asset's useful life</li>
                        <li>• Lessor responsible for maintenance in many cases</li>
                        <li>• No purchase option or bargain purchase option at end</li>
                        <li>• Asset doesn't transfer to lessee</li>
                        <li>• Lower initial costs and greater flexibility</li>
                        <li>• Entire lease payment typically tax-deductible as business expense</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-teal-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Typical Use Cases</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        • Technology that quickly becomes obsolete (computers, software, printers)<br/>
                        • Office equipment with regular upgrade cycles (copiers, phone systems)<br/>
                        • Short-term or seasonal equipment needs<br/>
                        • Testing new equipment before committing to purchase<br/>
                        • Vehicles and transportation with high turnover<br/>
                        • Medical equipment requiring frequent technology updates
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 sm:p-6 rounded-lg border-l-4 border-green-500">
                <h4 className="text-base sm:text-lg font-bold text-green-900 mb-2 sm:mb-3">
                  Business Leasing Tax Advantages
                </h4>
                <p className="text-sm sm:text-base text-green-800 leading-relaxed mb-3">
                  Business equipment leasing provides significant tax benefits that can substantially reduce effective costs:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 text-sm mb-1">Operating Lease Deductions</p>
                    <p className="text-green-700 text-xs">
                      100% of lease payments deductible as business expense in the year paid. For a company in the 30% tax 
                      bracket, a $1,000 monthly payment costs effectively $700 after tax savings ($3,600 annual tax benefit).
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-semibold text-green-900 text-sm mb-1">Capital Lease Benefits</p>
                    <p className="text-green-700 text-xs">
                      Depreciation deductions on asset value plus interest expense deductions. Section 179 may allow immediate 
                      expensing up to $1,220,000 (2024) of equipment costs, providing substantial first-year tax relief.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Commercial Real Estate Leasing</h3>
              
              <p className="text-gray-700 text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">
                Commercial real estate leases are significantly more complex than residential leases, with terms ranging from 
                3-10 years (or longer) and numerous negotiable provisions regarding expenses, improvements, and responsibilities. 
                The structure you choose fundamentally affects your monthly costs, long-term financial obligations, and operational 
                flexibility. Understanding these lease types is crucial whether you're leasing office space, retail locations, 
                industrial facilities, or mixed-use properties.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Gross Lease (Full Service Lease)</h4>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Structure & Characteristics</h5>
                      <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-2">
                        Tenant pays a single, all-inclusive rental fee while the landlord covers most or all operating expenses 
                        including property taxes, insurance, maintenance (interior and exterior), utilities, janitorial services, 
                        and common area upkeep. This creates predictable monthly costs for tenants with minimal surprise expenses.
                      </p>
                      <p className="text-blue-600 text-xs italic">
                        Most common in: Office buildings, medical facilities, government leases, and multi-tenant commercial properties
                      </p>
                    </div>

                    <div className="border-l-4 border-green-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Tenant Advantages</p>
                      <ul className="text-gray-700 text-xs sm:text-sm space-y-1 leading-relaxed">
                        <li>• Simplified budgeting with predictable, fixed monthly costs</li>
                        <li>• No responsibility for property maintenance or repairs</li>
                        <li>• Landlord handles all vendor relationships and service contracts</li>
                        <li>• Protection from unexpected expense increases</li>
                        <li>• Ideal for businesses wanting minimal property management involvement</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">Potential Disadvantages</p>
                      <ul className="text-gray-700 text-xs sm:text-sm space-y-1 leading-relaxed">
                        <li>• Higher base rent to compensate landlord for expense risk</li>
                        <li>• Landlords may overestimate operating costs, inflating rent</li>
                        <li>• Less control over service quality and vendor selection</li>
                        <li>• Rent increases at renewal may be substantial</li>
                        <li>• Hidden costs can diminish apparent savings over time</li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="font-semibold text-blue-900 text-xs mb-1">Example Calculation</p>
                      <p className="text-blue-700 text-xs">
                        5,000 sq ft office @ $30/sq ft gross = $12,500/month total cost (all expenses included). Landlord 
                        estimates $8/sq ft for operating expenses, keeping $22/sq ft as net effective rent.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Net Lease Structures</h4>
                  
                  <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">
                    Net leases shift various operating expenses from landlord to tenant, reducing base rent but increasing 
                    tenant financial responsibility and expense variability. The "nets" refer to expense categories beyond 
                    base rent that tenants must pay.
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h5 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">Single Net Lease (N Lease)</h5>
                      <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed mb-2">
                        Tenant pays base rent plus their proportionate share of property taxes. Landlord covers insurance, 
                        maintenance, and structural repairs. The least common net lease type, primarily found in single-tenant 
                        retail or industrial properties.
                      </p>
                      <p className="text-yellow-600 text-xs">
                        Example: $20/sq ft base rent + $3/sq ft property taxes = $23/sq ft total annual cost
                      </p>
                    </div>

                    <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h5 className="font-semibold text-orange-800 mb-1 sm:mb-2 text-sm sm:text-base">Double Net Lease (NN Lease)</h5>
                      <p className="text-orange-700 text-xs sm:text-sm leading-relaxed mb-2">
                        Tenant pays base rent, property taxes, and insurance premiums. Landlord remains responsible for structural 
                        maintenance and common area maintenance (CAM). More common than single net but less than triple net, 
                        typically used in multi-tenant retail centers and office buildings.
                      </p>
                      <p className="text-orange-600 text-xs">
                        Example: $18/sq ft rent + $3/sq ft taxes + $1/sq ft insurance = $22/sq ft total
                      </p>
                    </div>

                    <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                      <h5 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">Triple Net Lease (NNN Lease)</h5>
                      <p className="text-red-700 text-xs sm:text-sm leading-relaxed mb-2">
                        The most landlord-friendly structure. Tenant pays everything: base rent, property taxes, insurance, and 
                        all maintenance costs including CAM, structural repairs, roof replacement, parking lot maintenance, 
                        landscaping, and utilities. Extremely common in commercial retail (Walgreens, CVS, McDonald's) and 
                        industrial properties.
                      </p>
                      <div className="bg-white p-2 rounded border border-red-200 mt-2">
                        <p className="text-red-900 text-xs font-semibold mb-1">Absolute/Bondable NNN Lease</p>
                        <p className="text-red-700 text-xs">
                          Most extreme form: tenant responsible for ALL costs including structural damage, roof replacement, 
                          foundation issues—even force majeure events. Cannot terminate early regardless of circumstances. 
                          Common with credit-worthy national tenants (investment-grade corporations) on 15-25 year terms.
                        </p>
                      </div>
                      <p className="text-red-600 text-xs mt-2">
                        Example: $15/sq ft rent + $3/sq ft taxes + $1/sq ft insurance + $4/sq ft CAM = $23/sq ft total
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-300 pl-3 sm:pl-4">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">NNN Lease Expense Breakdown</p>
                      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                        Tenants typically receive annual reconciliation statements detailing actual expenses vs. estimates. 
                        CAM charges may include: snow removal, landscaping, parking lot striping, exterior lighting, security, 
                        property management fees (5-10% of collections), legal fees, pest control, and reserve funds for major 
                        capital expenditures.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-semibold mb-3 text-gray-800">Modified Gross & Modified Net Leases</h4>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 leading-relaxed">
                  Modified leases represent negotiated middle-ground arrangements between gross and net structures, with expense 
                  responsibilities split based on tenant and landlord preferences. These highly flexible arrangements are 
                  customized to each deal and property type.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h5 className="font-semibold text-indigo-800 mb-1 sm:mb-2 text-sm sm:text-base">Modified Gross Lease</h5>
                    <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Similar to full-service gross lease but with certain expenses excluded from base rent. Common structure: 
                      landlord pays property taxes, insurance, and common area expenses, while tenant pays their own utilities, 
                      janitorial services, and interior maintenance. Popular in multi-tenant office buildings.
                    </p>
                    <p className="text-indigo-600 text-xs">
                      Example: $28/sq ft modified gross (tenant pays utilities separately @ $2/sq ft) = $30/sq ft effective
                    </p>
                  </div>

                  <div className="p-3 sm:p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h5 className="font-semibold text-teal-800 mb-1 sm:mb-2 text-sm sm:text-base">Modified Net Lease</h5>
                    <p className="text-teal-700 text-xs sm:text-sm leading-relaxed mb-2">
                      Tenant pays base rent plus some (but not all) net expenses. Typical arrangement: tenant covers taxes and 
                      insurance while landlord handles structural repairs and major systems (HVAC, roof). Allows negotiation of 
                      CAM expense caps or exclusions for major capital improvements.
                    </p>
                    <p className="text-teal-600 text-xs">
                      Note: "Modified" terms vary significantly—always review the lease carefully to understand exact responsibilities.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-lg border-l-4 border-orange-500">
                <h4 className="text-base sm:text-lg font-bold text-orange-900 mb-2 sm:mb-3">
                  Commercial Lease Negotiation Essentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">CAM Expense Caps</p>
                      <p className="text-orange-700 text-xs">Negotiate annual CAM increase caps (e.g., 3-5% maximum) to prevent 
                      runaway costs. Exclude major capital improvements from CAM charges when possible.</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">Audit Rights</p>
                      <p className="text-orange-700 text-xs">Secure the right to audit landlord's books annually. Studies show 
                      30-40% of CAM charges contain errors, often in landlord's favor.</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">Tenant Improvement Allowance</p>
                      <p className="text-orange-700 text-xs">Negotiate $20-$60/sq ft for build-out costs. Alternatively, request 
                      rent abatement for the first 3-6 months to offset construction expenses.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">Exclusivity Clauses</p>
                      <p className="text-orange-700 text-xs">Retail tenants should negotiate exclusivity preventing competing 
                      businesses in the same center (especially important for restaurants and specialty retail).</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">Co-Tenancy Provisions</p>
                      <p className="text-orange-700 text-xs">Include rent reduction or termination rights if anchor tenants leave 
                      or center occupancy falls below specified levels (typically 70-80%).</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-orange-200">
                      <p className="text-orange-900 text-xs font-semibold">Assignment & Sublease Rights</p>
                      <p className="text-orange-700 text-xs">Maintain flexibility to assign lease or sublease space. Critical for 
                      growing businesses or those that may need to relocate or downsize.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                How to Use This Lease Calculator Effectively
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Fixed Rate Mode</h4>
                  <p className="text-gray-700 text-xs sm:text-sm mb-2 leading-relaxed">
                    Use this when you know the interest rate and want to calculate your monthly payment:
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Enter the asset value (vehicle price, equipment cost, etc.)</li>
                    <li>• Set residual value as dollar amount or percentage</li>
                    <li>• Input your quoted interest rate (APR)</li>
                    <li>• Specify lease term in years and additional months</li>
                    <li>• Add acquisition fee, security deposit, down payment</li>
                    <li>• Include your local sales tax rate</li>
                    <li>• Calculator instantly shows your monthly payment</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Fixed Payment Mode</h4>
                  <p className="text-gray-700 text-xs sm:text-sm mb-2 leading-relaxed">
                    Use this when you know the monthly payment and want to find the effective interest rate:
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-gray-700">
                    <li>• Enter the asset value and residual value</li>
                    <li>• Input the quoted monthly payment amount</li>
                    <li>• Specify lease term and sales tax rate</li>
                    <li>• Add any down payment or deposits</li>
                    <li>• Calculator reverse-engineers the effective APR</li>
                    <li>• Compare this rate against other financing options</li>
                    <li>• Useful for evaluating lease offers and negotiations</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">Understanding Your Results</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-indigo-800 text-xs mb-1"><strong>Total Depreciation:</strong></p>
                    <p className="text-indigo-700 text-xs">The difference between asset value and residual value—what you're 
                    actually paying for over the lease term.</p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs mb-1"><strong>Total Interest:</strong></p>
                    <p className="text-indigo-700 text-xs">Finance charges on the lease. Compare this to loan interest to 
                    evaluate lease vs. buy decisions.</p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs mb-1"><strong>Payment Breakdown Chart:</strong></p>
                    <p className="text-indigo-700 text-xs">Shows the proportion of depreciation vs. interest in your total 
                    cost—useful for understanding lease structure.</p>
                  </div>
                  <div>
                    <p className="text-indigo-800 text-xs mb-1"><strong>Payment Schedule:</strong></p>
                    <p className="text-indigo-700 text-xs">Toggle between monthly and annual views to see how the asset 
                    depreciates and costs accumulate over time.</p>
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default LeaseCalculatorComponent;
