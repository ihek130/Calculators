import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, DollarSign, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';

const RentCalculatorComponent = () => {
  // Input states
  const [annualIncome, setAnnualIncome] = useState<string>('80000');
  const [incomeFrequency, setIncomeFrequency] = useState<string>('year');
  const [monthlyDebt, setMonthlyDebt] = useState<string>('0');
  const [rentRatio, setRentRatio] = useState<string>('30');

  // Results states
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [maxAffordableRent, setMaxAffordableRent] = useState<number>(0);
  const [remainingIncome, setRemainingIncome] = useState<number>(0);
  const [frontEndRatio, setFrontEndRatio] = useState<number>(0);
  const [backEndRatio, setBackEndRatio] = useState<number>(0);

  // Calculate affordable rent
  useEffect(() => {
    const income = parseFloat(annualIncome) || 0;
    const debt = parseFloat(monthlyDebt) || 0;
    const ratio = parseFloat(rentRatio) || 30;

    if (income <= 0) {
      resetResults();
      return;
    }

    // Convert income to monthly
    let monthly = 0;
    switch (incomeFrequency) {
      case 'year':
        monthly = income / 12;
        break;
      case 'month':
        monthly = income;
        break;
      case 'week':
        monthly = (income * 52) / 12;
        break;
      case 'biweek':
        monthly = (income * 26) / 12;
        break;
      default:
        monthly = income / 12;
    }

    // Calculate max affordable rent based on ratio
    const maxRent = (monthly * ratio) / 100;
    const remaining = monthly - maxRent - debt;
    const frontEnd = (maxRent / monthly) * 100;
    const backEnd = ((maxRent + debt) / monthly) * 100;

    setMonthlyIncome(monthly);
    setMaxAffordableRent(maxRent);
    setRemainingIncome(remaining);
    setFrontEndRatio(frontEnd);
    setBackEndRatio(backEnd);
  }, [annualIncome, incomeFrequency, monthlyDebt, rentRatio]);

  const resetResults = () => {
    setMonthlyIncome(0);
    setMaxAffordableRent(0);
    setRemainingIncome(0);
    setFrontEndRatio(0);
    setBackEndRatio(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1);
  };

  // Get affordability status
  const getAffordabilityStatus = () => {
    if (frontEndRatio <= 25) return { color: 'green', text: 'Very Affordable', icon: CheckCircle };
    if (frontEndRatio <= 30) return { color: 'blue', text: 'Affordable', icon: CheckCircle };
    if (frontEndRatio <= 35) return { color: 'yellow', text: 'Moderate', icon: Info };
    if (frontEndRatio <= 40) return { color: 'orange', text: 'Stretching', icon: AlertCircle };
    return { color: 'red', text: 'Too High', icon: AlertCircle };
  };

  const status = getAffordabilityStatus();
  const StatusIcon = status.icon;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Home className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">How Much Rent Can I Afford?</h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
          Use the rent calculator below to estimate the affordable monthly rental spending amount based on income and debt level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Income Input */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900 text-base sm:text-lg">
                <DollarSign className="w-5 h-5" />
                Your Income
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="annualIncome" className="text-sm font-semibold text-gray-700">
                  Pre-Tax Income
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="annualIncome"
                    type="number"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
                    className="pl-10"
                    placeholder="80000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="incomeFrequency" className="text-sm font-semibold text-gray-700">
                  Pay Frequency
                </Label>
                <Select value={incomeFrequency} onValueChange={setIncomeFrequency}>
                  <SelectTrigger id="incomeFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Per Year</SelectItem>
                    <SelectItem value="month">Per Month</SelectItem>
                    <SelectItem value="biweek">Bi-Weekly</SelectItem>
                    <SelectItem value="week">Per Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-700">
                  <strong>Monthly Income:</strong> {formatCurrency(monthlyIncome)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Debt Input */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900 text-base sm:text-lg">
                <TrendingUp className="w-5 h-5" />
                Monthly Debt
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="monthlyDebt" className="text-sm font-semibold text-gray-700">
                  Monthly Debt Payback
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="monthlyDebt"
                    type="number"
                    value={monthlyDebt}
                    onChange={(e) => setMonthlyDebt(e.target.value)}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-600">Car/student loan, credit cards, etc.</p>
              </div>
            </CardContent>
          </Card>

          {/* Rent Ratio */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900 text-base sm:text-lg">
                <Info className="w-5 h-5" />
                Rent Ratio
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Percentage of income for rent</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rentRatio" className="text-sm font-semibold text-gray-700">
                  Income % for Rent
                </Label>
                <Select value={rentRatio} onValueChange={setRentRatio}>
                  <SelectTrigger id="rentRatio">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="20">20% (Very Conservative)</SelectItem>
                    <SelectItem value="25">25% (Conservative)</SelectItem>
                    <SelectItem value="28">28% (Recommended)</SelectItem>
                    <SelectItem value="30">30% (Standard Rule)</SelectItem>
                    <SelectItem value="33">33% (Moderate)</SelectItem>
                    <SelectItem value="35">35% (Aggressive)</SelectItem>
                    <SelectItem value="40">40% (Maximum)</SelectItem>
                    <SelectItem value="50">50% (Rent Burdened)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  The 30% rule is most common, but 28% is more comfortable
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Maximum Affordable Rent */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="text-orange-900 text-base sm:text-lg">Maximum Affordable Rent</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center p-4 sm:p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                <p className="text-sm sm:text-lg text-gray-600 mb-2">You can afford up to:</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-600 mb-4 sm:mb-6 break-words">
                  {formatCurrency(maxAffordableRent)}
                  <span className="text-lg sm:text-xl text-gray-600 ml-2">/month</span>
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  status.color === 'green' ? 'bg-green-100 text-green-800' :
                  status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <StatusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-bold text-sm sm:text-base">{status.text}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          <Card className="border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
              <CardTitle className="text-cyan-900 text-base sm:text-lg">Monthly Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Gross Monthly Income</span>
                  <span className="text-lg sm:text-xl font-bold text-blue-600">{formatCurrency(monthlyIncome)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Maximum Rent</span>
                    <span className="text-xs text-gray-600">{formatPercent(frontEndRatio)}% of income</span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-orange-600">-{formatCurrency(maxAffordableRent)}</span>
                </div>
                {parseFloat(monthlyDebt) > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col">
                      <span className="text-sm sm:text-base text-gray-700 font-medium">Monthly Debt Payments</span>
                      <span className="text-xs text-gray-600">Other obligations</span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-gray-700">-{formatCurrency(parseFloat(monthlyDebt))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-400 mt-4">
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-lg font-bold text-gray-900">Remaining for Other Expenses</span>
                    <span className="text-xs text-gray-600">Food, utilities, savings, etc.</span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(remainingIncome)}</span>
                </div>
              </div>

              {remainingIncome < 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border-2 border-red-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-bold mb-1">⚠️ Budget Deficit Alert</p>
                    <p>Your rent and debt exceed your income by {formatCurrency(Math.abs(remainingIncome))}. Consider reducing your rent budget or increasing income.</p>
                  </div>
                </div>
              )}

              {remainingIncome > 0 && remainingIncome < monthlyIncome * 0.2 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300 flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">⚠️ Tight Budget Warning</p>
                    <p>You have less than 20% of income remaining after rent and debt. This leaves little room for savings, emergencies, or lifestyle expenses.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debt-to-Income Ratios */}
          <Card className="border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
              <CardTitle className="text-indigo-900 text-base sm:text-lg">Debt-to-Income Ratios</CardTitle>
              <CardDescription className="text-xs sm:text-sm">How lenders evaluate your finances</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Front-End Ratio (Rent Only)</span>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">{formatPercent(frontEndRatio)}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">Rent ÷ Gross monthly income</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        frontEndRatio <= 28 ? 'bg-green-500' : 
                        frontEndRatio <= 35 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(frontEndRatio, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {frontEndRatio <= 28 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs sm:text-sm text-green-700 font-medium">Recommended range (≤28%)</span>
                      </>
                    ) : frontEndRatio <= 35 ? (
                      <>
                        <Info className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs sm:text-sm text-yellow-700 font-medium">Moderate (28-35%)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs sm:text-sm text-red-700 font-medium">Above recommended (&gt;35%)</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <span className="text-sm sm:text-base text-gray-700 font-medium">Back-End Ratio (Rent + All Debt)</span>
                    <span className="text-xl sm:text-2xl font-bold text-indigo-600">{formatPercent(backEndRatio)}%</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">(Rent + Debt) ÷ Gross monthly income</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        backEndRatio <= 36 ? 'bg-green-500' : 
                        backEndRatio <= 43 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(backEndRatio, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {backEndRatio <= 36 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs sm:text-sm text-green-700 font-medium">Recommended range (≤36%)</span>
                      </>
                    ) : backEndRatio <= 43 ? (
                      <>
                        <Info className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs sm:text-sm text-yellow-700 font-medium">Moderate (36-43%)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs sm:text-sm text-red-700 font-medium">Above recommended (&gt;43%)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="text-green-900 text-base sm:text-lg">💡 Quick Affordability Tips</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-bold text-sm text-blue-900 mb-1">The 30% Rule</p>
                  <p className="text-xs text-gray-700">Spend no more than 30% of gross income on rent</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">The 50/30/20 Budget</p>
                  <p className="text-xs text-gray-700">50% needs (rent+utilities), 30% wants, 20% savings</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="font-bold text-sm text-purple-900 mb-1">Include All Costs</p>
                  <p className="text-xs text-gray-700">Budget for utilities, internet, parking, renters insurance</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <p className="font-bold text-sm text-orange-900 mb-1">Emergency Fund</p>
                  <p className="text-xs text-gray-700">Keep 3-6 months rent saved for emergencies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Complete Guide to Renting
        </h2>

        {/* What is Rent */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Home className="w-5 h-5" />
              What is Rent?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              For this calculator, <strong>rent</strong> is the act of paying a landlord for the use of a residential property. Used as a noun, it can also refer to the actual payment for the temporary use of a residential property. There can be other definitions of rent, such as economic rent, but they are used in other contexts for other purposes.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <h4 className="font-bold text-blue-900 mb-2">Rent vs. Lease: Understanding the Difference</h4>
              <p className="text-sm text-gray-700 mb-3">
                Although the terms "rent" and "lease" are often used interchangeably, their actual definitions differ:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-bold text-sm text-blue-900 mb-2">Rent (Action)</p>
                  <p className="text-xs text-gray-700">The act of paying for temporary use of property. Can be month-to-month or under a lease agreement. More flexible, easier to terminate.</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-bold text-sm text-blue-900 mb-2">Lease (Contract)</p>
                  <p className="text-xs text-gray-700">A legal contract that formally defines payment amount, duration (typically 6-12 months), and all rules both parties agree to follow. Binding commitment.</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-purple-900 mb-2">Key Components of a Lease Agreement</h4>
              <div className="grid md:grid-cols-2 gap-2 text-xs text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Rent amount:</strong> Monthly payment and due date</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Lease term:</strong> Start and end dates (typically 12 months)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Security deposit:</strong> Refundable deposit (usually 1-2 months rent)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Utilities:</strong> Who pays for what (water, electric, gas, internet)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Maintenance:</strong> Landlord vs. tenant responsibilities</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Pet policy:</strong> Allowed pets, deposits, monthly fees</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Renewal terms:</strong> How rent can increase at renewal</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Termination:</strong> Early termination penalties and notice period</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Renting Process */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="w-5 h-5" />
              The Renting Process: Step-by-Step
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              It can be easy or terribly difficult to find a place to rent depending on many factors, one of which is location. Rural areas tend to be easier; many times, it's as simple as driving around searching for "For Rent" signs or an apartment complex. On the other hand, in or near some major metropolitan areas, rentals can be scarce due to factors like population density or local policy.
            </p>
            
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-900 mb-2">Step 1: Search & View Properties</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Rural/Suburban Markets:</strong></p>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Drive around looking for "For Rent" signs</li>
                    <li>• Visit apartment complexes and leasing offices directly</li>
                    <li>• Check local classifieds and community bulletin boards</li>
                    <li>• Timeline: Can find and move in within 1-2 weeks</li>
                  </ul>
                  <p className="mt-2"><strong>Urban/Competitive Markets:</strong></p>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Scan listing sites daily (Zillow, Apartments.com, Craigslist, Facebook Marketplace)</li>
                    <li>• Use real estate agents or rental brokers (fee: 1 month's rent, paid by tenant or landlord)</li>
                    <li>• Race to view units within hours of listing (popular units get 10+ applications)</li>
                    <li>• Submit applications immediately at viewings with all documents ready</li>
                    <li>• Timeline: Can take 1-3 months of active searching</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-900 mb-2">Step 2: Submit Rental Application</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>Once you've found the right property, you'll need to submit a comprehensive rental application. Be prepared with:</p>
                  <div className="grid md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-bold text-xs text-green-900 mb-2">Personal Information</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Full legal name and date of birth</li>
                        <li>• Current address and rental history (3+ years)</li>
                        <li>• Driver's license or government ID</li>
                        <li>• Social Security Number (for credit check)</li>
                        <li>• Emergency contact information</li>
                        <li>• Personal references (non-family)</li>
                        <li>• Pet information (type, weight, breed)</li>
                      </ul>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="font-bold text-xs text-green-900 mb-2">Financial Documentation</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Proof of income (2-3 recent pay stubs)</li>
                        <li>• Employment verification letter</li>
                        <li>• Bank statements (2-3 months)</li>
                        <li>• Credit report authorization</li>
                        <li>• Previous landlord references</li>
                        <li>• Tax returns (if self-employed)</li>
                        <li>• Application fee ($25-$100, non-refundable)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-purple-900 mb-2">Step 3: Background & Credit Checks</h4>
                <div className="text-sm text-gray-700">
                  <p className="mb-2">The landlord will verify your information through multiple checks:</p>
                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <strong className="text-purple-900">Credit Report:</strong> Minimum score typically 620-650 for conventional rentals, 580-600 for more flexible landlords. Shows payment history, debts, and financial responsibility.
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <strong className="text-purple-900">Income Verification:</strong> Most landlords require income to be 2.5-3x monthly rent. Example: $2,000 rent requires $5,000-$6,000 monthly income ($60,000-$72,000 annually).
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <strong className="text-purple-900">Criminal Background:</strong> Checks for felonies, evictions, sex offender registry. Some landlords are flexible depending on offense age and nature.
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <strong className="text-purple-900">Eviction History:</strong> Any past evictions are major red flags. Can disqualify you for 3-7 years depending on landlord policy.
                    </div>
                    <div className="bg-white p-2 rounded border border-purple-200">
                      <strong className="text-purple-900">Previous Landlord:</strong> Contacts your previous landlords to verify rental history, on-time payments, and property condition at move-out.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-orange-900 mb-2">Step 4: Negotiate & Sign Lease</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>Once approved, you'll negotiate final terms and sign the lease:</p>
                  <div className="bg-white p-3 rounded border border-orange-200 mt-2">
                    <p className="font-bold text-xs text-orange-900 mb-2">Negotiable Items (Everything is negotiable!):</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ <strong>Monthly rent:</strong> Especially in slow markets or if unit has been vacant long</li>
                      <li>✓ <strong>Lease length:</strong> Shorter (6 months) or longer (18-24 months) for stability</li>
                      <li>✓ <strong>Security deposit:</strong> Can sometimes be split into payments or reduced</li>
                      <li>✓ <strong>Pet fees:</strong> Negotiate lower pet deposit or waive monthly pet rent</li>
                      <li>✓ <strong>Parking:</strong> Request additional parking spots or covered parking</li>
                      <li>✓ <strong>Move-in specials:</strong> First month free, reduced deposit, waived fees</li>
                      <li>✓ <strong>Improvements:</strong> New paint, carpet cleaning, appliance upgrades before move-in</li>
                      <li>✓ <strong>Utilities included:</strong> Ask landlord to cover water, trash, or internet</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-300 mt-2">
                    <p className="text-xs text-gray-700">
                      <strong>💡 Pro Tip:</strong> Always negotiate! Landlords expect it. The worst they can say is no. In competitive markets with multiple applicants, offering to pay 3-6 months upfront or sign a longer lease can give you an edge over other renters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">Step 5: Pay Move-In Costs & Move In</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>Before getting the keys, you'll need to pay upfront costs:</p>
                  <div className="bg-white p-3 rounded border border-red-200 mt-2">
                    <p className="font-bold text-xs text-red-900 mb-2">Typical Move-In Costs:</p>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>First Month's Rent</span>
                        <span className="font-bold">$1,500 - $3,000+</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Security Deposit (1-2 months rent)</span>
                        <span className="font-bold">$1,500 - $6,000</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Last Month's Rent (some states)</span>
                        <span className="font-bold">$1,500 - $3,000</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Pet Deposit (if applicable)</span>
                        <span className="font-bold">$200 - $500</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Parking Fee (if applicable)</span>
                        <span className="font-bold">$50 - $300</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Renters Insurance (annual)</span>
                        <span className="font-bold">$150 - $300</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Utilities Setup Deposits</span>
                        <span className="font-bold">$100 - $300</span>
                      </div>
                      <div className="flex justify-between p-2 bg-red-100 rounded font-bold">
                        <span>TOTAL UPFRONT</span>
                        <span className="text-red-700">$5,000 - $13,000+</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-100 p-3 rounded border border-red-300 mt-2">
                    <p className="text-xs text-gray-700">
                      <strong>⚠️ Important:</strong> Save 3-4x your monthly rent before apartment hunting to cover move-in costs, moving expenses, and initial furniture/household items. A $2,000/month apartment requires $6,000-$8,000 in cash to move in comfortably.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rent vs Buy */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Home className="w-5 h-5" />
              Rent vs. Buy: Making the Right Decision
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              It is uncommon for people to become a homeowner without renting first. Sooner or later, renters may reach a point where they are faced with the decision of continuing to rent or choosing to buy instead. This is one of the biggest financial decisions you'll make.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-3">✅ Benefits of Renting</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Flexibility:</strong> Easy to relocate for jobs, relationships, or lifestyle changes (just wait for lease end or pay 1-2 months penalty)</li>
                  <li><strong>No maintenance costs:</strong> Landlord pays for roof repairs, appliance replacements, plumbing issues, HVAC repairs</li>
                  <li><strong>Lower upfront costs:</strong> $5k-$10k to move in vs. $30k-$100k+ down payment to buy</li>
                  <li><strong>Predictable expenses:</strong> Fixed monthly payment, no surprise $15k roof replacement bills</li>
                  <li><strong>Amenities included:</strong> Pool, gym, security, landscaping often included in rent</li>
                  <li><strong>No property tax:</strong> Don't pay $3k-$10k+ annually in property taxes</li>
                  <li><strong>Test neighborhoods:</strong> Live in different areas before committing to buy</li>
                  <li><strong>No market risk:</strong> If home values crash, you just move. No negative equity.</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-3">✅ Benefits of Buying</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Build equity:</strong> Monthly payments build ownership instead of "throwing money away"</li>
                  <li><strong>Appreciation:</strong> Home values typically increase 3-5% annually (historically)</li>
                  <li><strong>Fixed payment:</strong> 30-year mortgage locks in payment. Rent increases 3-5% annually.</li>
                  <li><strong>Tax benefits:</strong> Deduct mortgage interest and property taxes (if itemizing)</li>
                  <li><strong>Complete control:</strong> Renovate, paint, landscape however you want. It's yours!</li>
                  <li><strong>Forced savings:</strong> Mortgage payment builds wealth through principal paydown</li>
                  <li><strong>Generational wealth:</strong> Pass property to children or heirs</li>
                  <li><strong>Rental income:</strong> Rent out rooms or entire property later for income</li>
                </ul>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-400">
              <h4 className="font-bold text-orange-900 mb-3">📊 The 5-Year Rule: When Does Buying Make Sense?</h4>
              <p className="text-sm text-gray-700 mb-3">
                Financial experts recommend the <strong>5-Year Rule</strong>: Only buy if you plan to stay in the home for at least 5 years. Here's why:
              </p>
              <div className="bg-white p-3 rounded border border-orange-200">
                <p className="font-bold text-xs text-orange-900 mb-2">Cost of Buying & Selling:</p>
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Closing costs (buying):</span>
                    <span className="font-bold">2-5% of home price ($8k on $400k home)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Real estate commission (selling):</span>
                    <span className="font-bold">5-6% of sale price ($24k on $400k home)</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Moving costs:</span>
                    <span className="font-bold">$2,000 - $8,000</span>
                  </div>
                  <div className="flex justify-between p-2 bg-orange-100 rounded font-bold">
                    <span>Total transaction costs:</span>
                    <span className="text-orange-700">$34,000+ on $400k home</span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-3 p-2 bg-orange-100 rounded">
                  <strong>The math:</strong> You need ~5 years of appreciation (3-5% annually) plus principal paydown to break even on transaction costs. Sell sooner = lose money vs. renting.
                </p>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
              <h4 className="font-bold text-cyan-900 mb-2">🧮 Rent vs. Buy Example (Same Monthly Payment)</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-cyan-200">
                  <p className="font-bold text-sm text-cyan-900 mb-2">Renting: $2,500/month</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>• Rent: $2,500</p>
                    <p>• Renters insurance: $20</p>
                    <p>• Utilities: Included</p>
                    <p className="font-bold pt-2 border-t">Total: $2,520/month</p>
                    <p className="mt-2 text-red-700">After 5 years: $0 equity</p>
                    <p className="text-red-700">Total spent: $151,200</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border border-cyan-200">
                  <p className="font-bold text-sm text-cyan-900 mb-2">Buying: $450k home, 20% down</p>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p>• Mortgage (6.5%): $2,270</p>
                    <p>• Property tax: $560</p>
                    <p>• Insurance: $125</p>
                    <p>• Maintenance: $375</p>
                    <p className="font-bold pt-2 border-t">Total: $3,330/month</p>
                    <p className="mt-2 text-green-700">After 5 years: $70k+ equity</p>
                    <p className="text-green-700">Home worth: ~$520k (3% appreciation)</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-700 mt-3 p-2 bg-cyan-100 rounded">
                <strong>But wait!</strong> The buyer pays $810 more per month ($48,600 over 5 years) but gains $70k equity + $70k appreciation = $140k wealth. Buying wins by ~$90k if you stay 5+ years and can afford the higher payment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Important Considerations */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Important Considerations When Renting
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              One of the most important factors regarding rent is the actual rent amount and whether or not it is affordable. Affordable is a relative term and carries a different meaning for different people. Some people think a front-end debt-to-income ratio of 25% is considered affordable, while others might think 33% of income is affordable. Other considerations regarding rent generally include:
            </p>
            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2">💰 Other Costs Beyond Rent</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Aside from recurring rent payments, there are other costs associated with renting that many first-time renters forget to budget for:
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="font-bold text-xs text-red-900 mb-2">Upfront Costs (One-Time)</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• <strong>Security deposit:</strong> 1-2 months rent ($1,500-$6,000)</li>
                      <li>• <strong>Application fee:</strong> $25-$100 per person</li>
                      <li>• <strong>Renters insurance:</strong> $150-$300 annually (required by most landlords)</li>
                      <li>• <strong>Pet deposit:</strong> $200-$500 per pet (sometimes non-refundable)</li>
                      <li>• <strong>Parking deposit:</strong> $50-$200</li>
                      <li>• <strong>Utility deposits:</strong> $100-$300 (electric, gas, internet setup)</li>
                      <li>• <strong>Moving costs:</strong> $500-$3,000 (truck rental, movers, supplies)</li>
                      <li>• <strong>Furniture:</strong> $2,000-$10,000+ if moving from family home</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="font-bold text-xs text-red-900 mb-2">Recurring Monthly Costs</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• <strong>Internet/cable:</strong> $50-$150/month</li>
                      <li>• <strong>Electricity:</strong> $80-$200/month (varies by usage & climate)</li>
                      <li>• <strong>Gas/heating:</strong> $30-$150/month (winter higher)</li>
                      <li>• <strong>Water/sewer:</strong> $40-$100/month (sometimes included in rent)</li>
                      <li>• <strong>Trash pickup:</strong> $10-$30/month (often included)</li>
                      <li>• <strong>Pet rent:</strong> $25-$75 per pet monthly</li>
                      <li>• <strong>Parking:</strong> $50-$300/month (urban areas)</li>
                      <li>• <strong>Storage unit:</strong> $50-$200/month (if needed)</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-red-100 p-3 rounded mt-3">
                  <p className="text-xs text-gray-700">
                    <strong>Real example:</strong> $1,800 rent + $400 utilities + $50 pet rent + $100 parking = <strong>$2,350 total monthly housing cost</strong> (30% more than base rent alone). Always factor these in when calculating affordability!
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">📍 Location, Location, Location</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Generally, people like to live close to where they work and to their family and friends. Renters should also consider the location of their rented property in relation to places they frequent and their interests.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="font-bold text-xs text-blue-900 mb-2">Practical Considerations:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ Commute time to work (aim for under 30 minutes)</li>
                      <li>✓ Proximity to family and friends</li>
                      <li>✓ Access to grocery stores, pharmacies, banks</li>
                      <li>✓ Public transportation availability and quality</li>
                      <li>✓ Parking availability and costs</li>
                      <li>✓ Walkability score (restaurants, coffee shops, parks)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-blue-900 mb-2">Quality of Life Factors:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ School district quality (if you have or plan to have kids)</li>
                      <li>✓ Crime rates and safety (check local police data)</li>
                      <li>✓ Noise levels (highways, train tracks, airports, nightlife)</li>
                      <li>✓ Green space and outdoor recreation nearby</li>
                      <li>✓ Cultural amenities (museums, theaters, entertainment)</li>
                      <li>✓ Healthcare facilities and hospitals</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">🏠 Quality & Condition</h4>
                <p className="text-sm text-gray-700 mb-3">
                  The quality of the rented property should be thoroughly evaluated before signing a lease. Don't rush this step!
                </p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-bold text-green-900 mb-1">Property Age & Renovation:</p>
                    <p>Research when the property was built and last renovated. Newer properties (built after 2000) or recently renovated units tend to have fewer maintenance issues, better insulation, and modern amenities. Older buildings may have character but watch for outdated electrical, plumbing, or HVAC systems.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-bold text-green-900 mb-1">Inspection Checklist During Viewing:</p>
                    <ul className="ml-4 space-y-1 mt-2">
                      <li>• Test all appliances (stove, fridge, dishwasher, washer/dryer)</li>
                      <li>• Flush toilets, run faucets, check water pressure</li>
                      <li>• Turn on heating and A/C to ensure they work</li>
                      <li>• Check for mold, water damage, or pest issues</li>
                      <li>• Open all windows and doors to test operation</li>
                      <li>• Look for adequate electrical outlets in each room</li>
                      <li>• Check cell phone signal strength in all rooms</li>
                      <li>• Measure rooms if bringing your own furniture</li>
                      <li>• Inspect closets and storage space</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="font-bold text-green-900 mb-1">Amenities:</p>
                    <p>Certain rental properties may come with amenities such as a pool, gym, doorman, concierge, laundry facility, parking garage, or bike storage. These add value but also increase rent. Decide which amenities you'll actually use vs. just paying for.</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">📏 Size Requirements</h4>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2">Space Considerations:</p>
                    <ul className="space-y-1">
                      <li>• <strong>Bedrooms:</strong> Current need + guest room? Home office?</li>
                      <li>• <strong>Bathrooms:</strong> 1 per 2 people minimum for comfort</li>
                      <li>• <strong>Square footage:</strong> 500-800 sq ft per person recommended</li>
                      <li>• <strong>Kitchen size:</strong> Can you cook comfortably? Counter space?</li>
                      <li>• <strong>Living area:</strong> Enough space for furniture and entertaining?</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2">Storage Needs:</p>
                    <ul className="space-y-1">
                      <li>• <strong>Closets:</strong> Adequate for clothes, shoes, seasonal items?</li>
                      <li>• <strong>Kitchen cabinets:</strong> Enough for dishes, pantry items?</li>
                      <li>• <strong>Garage/parking:</strong> Covered? Space for bikes/tools?</li>
                      <li>• <strong>Extra storage:</strong> Basement, attic, or storage unit needed?</li>
                      <li>• <strong>Pet space:</strong> Fenced yard? Nearby dog parks?</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-yellow-900 mb-2">👤 The Landlord Factor</h4>
                <p className="text-sm text-gray-700 mb-3">
                  A landlord can make or break your renting experience. Because a rental property is still owned by a landlord, it is possible for them to place restrictions on the tenant and their responsiveness to issues varies greatly.
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-yellow-900 mb-2">Green Flags (Good Landlords):</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ Responds to inquiries within 24 hours</li>
                      <li>✓ Has clear, written policies and lease terms</li>
                      <li>✓ Well-maintained common areas and exterior</li>
                      <li>✓ Positive reviews from current/past tenants</li>
                      <li>✓ Professional during showings and application</li>
                      <li>✓ Provides detailed move-in inspection checklist</li>
                      <li>✓ Has emergency maintenance contact number</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-red-900 mb-2">Red Flags (Bad Landlords):</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✗ Slow to respond or hard to reach</li>
                      <li>✗ Vague or verbal-only lease terms</li>
                      <li>✗ Poorly maintained property or deferred repairs</li>
                      <li>✗ Negative tenant reviews or complaints</li>
                      <li>✗ Pressures you to sign immediately without time to review</li>
                      <li>✗ Unwilling to make repairs or improvements</li>
                      <li>✗ Unclear about security deposit return process</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-yellow-100 p-3 rounded mt-3">
                  <p className="text-xs text-gray-700">
                    <strong>Research your landlord:</strong> Google their name, search for reviews, check court records for lawsuits, and ask current tenants about their experience. A bad landlord can turn a great apartment into a nightmare.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ways to Reduce Rent */}
        <Card className="border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <DollarSign className="w-5 h-5" />
              Ways to Reduce the Amount Spent on Rent
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Many renters in the U.S. struggle to afford their monthly rent. According to recent data, over 20 million renters spend more than 30% of their income on rent, with 11 million spending over 50% (considered "severely rent-burdened"). It is possible to decrease the cost of rent in many ways:
            </p>
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-green-900 mb-2">1. Live with Family or Friends Temporarily</h4>
                <p className="text-sm text-gray-700">
                  Consider living with parents, family, or a friend in the meantime if possible. This can save $1,000-$2,500/month while you build savings, pay off debt, or save for a down payment. It would be a kind act to pay them back in the future, during more financially stable times. Even contributing $300-$500/month for expenses shows appreciation while still saving significantly.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-900 mb-2">2. Shop Smart & Negotiate</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>When shopping for an apartment, do diligent research, take ample time to decide on a place, and walk away from bad deals.</p>
                  <ul className="text-xs ml-4 space-y-1 mt-2">
                    <li>• Compare at least 5-10 properties before deciding</li>
                    <li>• Always negotiate the rent and terms of the lease. The worst case is they say no.</li>
                    <li>• Look for move-in specials: first month free, reduced deposit, waived fees</li>
                    <li>• Offer to sign a longer lease (18-24 months) for lower monthly rent</li>
                    <li>• Ask about referral bonuses if you bring another tenant</li>
                    <li>• Negotiate improvements: fresh paint, new carpet, appliance upgrades</li>
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-bold text-purple-900 mb-2">3. Consider Lower-Cost Areas</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Consider living in a lower rent area. Location dramatically impacts rent prices:
                </p>
                <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2">Geographic Strategies:</p>
                    <ul className="space-y-1">
                      <li>• Move to suburbs vs. downtown (save 30-50%)</li>
                      <li>• Live one neighborhood over from trendy areas</li>
                      <li>• Choose cities with lower cost of living</li>
                      <li>• Consider up-and-coming neighborhoods</li>
                      <li>• Live further from train/metro stops</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="font-bold text-purple-900 mb-2">Real Examples:</p>
                    <ul className="space-y-1">
                      <li>• NYC Manhattan: $3,800/1BR → Brooklyn: $2,500</li>
                      <li>• SF Downtown: $3,200/1BR → Oakland: $2,000</li>
                      <li>• LA Westside: $2,800/1BR → Valley: $1,900</li>
                      <li>• Just 5-10 miles can save $500-$1,500/month</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-orange-900 mb-2">4. Get Roommates</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Live with roommates. On average, shared two-bedroom apartments are roughly <strong>30% cheaper</strong> than one-bedroom apartments per person. There are websites like Roommates.com, SpareRoom, and Facebook groups that can help match up potential roommates.
                </p>
                <div className="bg-white p-3 rounded border border-orange-200 text-xs text-gray-700">
                  <p className="font-bold text-orange-900 mb-2">Cost Comparison Example:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>1-bedroom apartment (living alone):</span>
                      <span className="font-bold">$2,000/month</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span>2-bedroom apartment (total):</span>
                      <span className="font-bold">$2,800/month</span>
                    </div>
                    <div className="flex justify-between p-2 bg-orange-100 rounded">
                      <span>Your share with 1 roommate:</span>
                      <span className="font-bold text-orange-700">$1,400/month (save $600!)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded mt-2">
                      <span>3-bedroom with 2 roommates:</span>
                      <span className="font-bold text-green-700">$1,200/month (save $800!)</span>
                    </div>
                  </div>
                  <p className="mt-3 p-2 bg-orange-100 rounded">
                    <strong>Annual savings:</strong> $600/month = $7,200/year. In 3 years, you save $21,600 – enough for a down payment on a home!
                  </p>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  <strong>Best roommate prospects:</strong> Friends, family, coworkers, or people found through mutual friends who are respectful, responsible, clean, and who share common interests.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">5. Provide Services in Exchange for Lower Rent</h4>
                <p className="text-sm text-gray-700 mb-2">
                  Negotiate with landlords. Some allow maintenance work, property management tasks, or other services in exchange for lower monthly rents.
                </p>
                <div className="text-xs text-gray-700 space-y-1">
                  <p>• <strong>Property management:</strong> Show units, collect rent from other tenants (save $200-$500/month)</p>
                  <p>• <strong>Maintenance:</strong> Landscaping, snow removal, minor repairs (save $100-$300/month)</p>
                  <p>• <strong>On-site work:</strong> Resident manager position (save $500-$1,000/month)</p>
                  <p>• <strong>Apartment marketing:</strong> Manage social media, listings, photos (save $100-$200/month)</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-bold text-yellow-900 mb-2">6. Alternative Housing Options</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-yellow-900 mb-2">Mobile Home/Trailer:</p>
                    <p className="text-xs">Live in a mobile home or vehicle. While mobile homes might be costly upfront relative to monthly rent ($20k-$80k), you may save more down the road. Lot rent averages $500-$800/month vs. $1,500+ for apartments.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-yellow-900 mb-2">Shared Living Spaces:</p>
                    <p className="text-xs">Consider co-living spaces (PodShare, Common, Outpost Club) where you rent a pod/bed in a shared space for $800-$1,500/month. Includes utilities, WiFi, and community events.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-yellow-900 mb-2">House Hacking:</p>
                    <p className="text-xs">Rent a larger place and sublet rooms to cover your portion. Example: Rent 3BR for $3,000, sublet 2 rooms for $1,200 each, live for $600/month.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="font-bold text-xs text-yellow-900 mb-2">Student Housing:</p>
                    <p className="text-xs">If eligible, university housing is often 20-40% cheaper than market rate and includes utilities. Some universities allow graduate students and staff to rent.</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h4 className="font-bold text-indigo-900 mb-2">7. Government Assistance Programs</h4>
                <p className="text-sm text-gray-700 mb-3">
                  The U.S. Department of Housing & Urban Development (HUD) rental assistance programs exist for people who are in dire need of housing. They are very selective, and applicants who qualify are rare.
                </p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="bg-white p-3 rounded border border-indigo-200">
                    <p className="font-bold text-indigo-900 mb-1">Public Housing:</p>
                    <p>Typically, only families, people with disabilities, or the elderly are given subsidized public housing. Rent is usually 30% of income after accounting for necessary expenses. The waiting lists can take 1-5 years, and even then, tenants may have to relocate to where units are available.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-indigo-200">
                    <p className="font-bold text-indigo-900 mb-1">Section 8 Housing Choice Voucher:</p>
                    <p>Subsidizes private landlords on behalf of low-income households. Has even more stringent income and eligibility restrictions than public housing (typically must earn less than 50% of area median income). Waiting lists are longer (2-7 years) because approval is required from both housing agencies and landlords. Many landlords don't accept Section 8.</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-indigo-200">
                    <p className="font-bold text-indigo-900 mb-1">Local Community Resources:</p>
                    <p>As a last-ditch resort, seek help from local communities. Good places to start are welfare programs located in the inner city that provide various aid to the underprivileged. They can point people in the right direction for local housing assistance, emergency shelter programs, or rent relief funds.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practical Renting Pointers */}
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <CheckCircle className="w-5 h-5" />
              Practical Renting Pointers: Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-sm text-blue-900 mb-2">📝 Get Everything in Writing</h4>
                <p className="text-xs text-gray-700">
                  Get everything in writing, such as promises made by landlords or renter responsibilities. They can become crucial during legal disputes over grey areas. Verbal agreements are unenforceable.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-sm text-green-900 mb-2">📸 Document Move-In Condition</h4>
                <p className="text-xs text-gray-700">
                  When moving in, inspect the property thoroughly, create a lease inventory and condition list, and have the landlord sign it. Take photos/videos of everything that best convey the condition in case landlords try to charge for pre-existing damages.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-sm text-purple-900 mb-2">🧹 Keep Property Clean</h4>
                <p className="text-xs text-gray-700">
                  Keep the rental property clean and in good condition. At lease end, any repairs required to return the property to its pre-lease conditions that are not considered normal wear and tear will generally be charged to the renter.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-sm text-orange-900 mb-2">🛡️ Buy Renters Insurance</h4>
                <p className="text-xs text-gray-700">
                  Consider purchasing tenant insurance ($15-$30/month). In the case of a fire or theft, personal assets fall under the responsibility of the renter. Landlord insurance only covers the building, not your belongings.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-sm text-red-900 mb-2">🔒 Fixed Leases = Fixed Rent</h4>
                <p className="text-xs text-gray-700">
                  For fixed leases, landlords cannot raise rent prices on existing renters during the life of the lease. This protects you from mid-lease increases. Month-to-month tenants can see increases with proper notice (usually 30-60 days).
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-sm text-yellow-900 mb-2">📱 Check Cell Reception</h4>
                <p className="text-xs text-gray-700">
                  Check for cell reception inside the unit before renting. Walk through every room with your phone. Some buildings have thick walls or poor signal. No WiFi calling may leave you unreachable.
                </p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
                <h4 className="font-bold text-sm text-cyan-900 mb-2">🍕 Pizza Delivery Test</h4>
                <p className="text-xs text-gray-700">
                  Call a nearby pizza place that delivers. If they don't deliver to a certain address after a certain time, it can be an indicator of the crime rate and safety of the neighborhood at night.
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-300">
                <h4 className="font-bold text-sm text-indigo-900 mb-2">💡 Call Utility Companies</h4>
                <p className="text-xs text-gray-700">
                  Call utility services before signing. They can provide information on what the average monthly bill might look like for that specific unit. Helps you budget accurately.
                </p>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg border border-pink-300">
                <h4 className="font-bold text-sm text-pink-900 mb-2">🚂 Check Train Noise</h4>
                <p className="text-xs text-gray-700">
                  If there are train tracks nearby, visit at different times to ensure that the sound of passing trains isn't enough of a disturbance to lead to sleepless nights. Same for airports and highways.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-sm text-green-900 mb-2">😊 Be Nice to Landlords</h4>
                <p className="text-xs text-gray-700">
                  Be nice to landlords. The relationship contains a lot of grey areas, and it can work in your favor to appeal to them by always making timely payments or treating their property with respect. They might not raise rent or be more flexible.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-sm text-blue-900 mb-2">🤝 Be Nice to Neighbors</h4>
                <p className="text-xs text-gray-700">
                  Be nice to neighbors, as they are likely to be more accommodating in return. They're also valuable sources of information about the building, area, and landlord before you move in.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-sm text-purple-900 mb-2">🕐 Visit at Different Times</h4>
                <p className="text-xs text-gray-700">
                  Visit the neighborhood and building at different times (morning, evening, weekend) before signing. You'll discover noise levels, parking availability, and neighborhood character that aren't apparent during a single showing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RentCalculatorComponent;
