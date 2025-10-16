import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Home, DollarSign, Percent, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const HouseAffordabilityCalculatorComponent = () => {
  // Calculator mode
  const [calculatorMode, setCalculatorMode] = useState<'income' | 'budget'>('income');

  // Income-based inputs
  const [annualIncome, setAnnualIncome] = useState<string>('120000');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [interestRate, setInterestRate] = useState<string>('6.337');
  const [monthlyDebt, setMonthlyDebt] = useState<string>('0');
  const [downPaymentPercent, setDownPaymentPercent] = useState<string>('20');
  const [propertyTaxPercent, setPropertyTaxPercent] = useState<string>('1.5');
  const [hoaPercent, setHoaPercent] = useState<string>('0');
  const [insurancePercent, setInsurancePercent] = useState<string>('0.5');
  const [dtiOption, setDtiOption] = useState<string>('conventional');

  // Budget-based inputs
  const [monthlyBudget, setMonthlyBudget] = useState<string>('3500');
  const [maintenancePercent, setMaintenancePercent] = useState<string>('1.5');

  // Results
  const [maxHomePrice, setMaxHomePrice] = useState<number>(0);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(0);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [monthlyPropertyTax, setMonthlyPropertyTax] = useState<number>(0);
  const [monthlyHOA, setMonthlyHOA] = useState<number>(0);
  const [monthlyInsurance, setMonthlyInsurance] = useState<number>(0);
  const [monthlyPMI, setMonthlyPMI] = useState<number>(0);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState<number>(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState<number>(0);
  const [frontEndRatio, setFrontEndRatio] = useState<number>(0);
  const [backEndRatio, setBackEndRatio] = useState<number>(0);

  // DTI ratio limits
  const getDTILimits = (option: string) => {
    switch (option) {
      case 'conventional':
        return { frontEnd: 28, backEnd: 36 };
      case 'fha':
        return { frontEnd: 31, backEnd: 43 };
      case 'va':
        return { frontEnd: 100, backEnd: 41 }; // VA doesn't use front-end
      case '10':
        return { frontEnd: 10, backEnd: 10 };
      case '15':
        return { frontEnd: 15, backEnd: 15 };
      case '20':
        return { frontEnd: 20, backEnd: 20 };
      case '25':
        return { frontEnd: 25, backEnd: 25 };
      case '30':
        return { frontEnd: 30, backEnd: 30 };
      case '35':
        return { frontEnd: 35, backEnd: 35 };
      case '40':
        return { frontEnd: 40, backEnd: 40 };
      case '45':
        return { frontEnd: 45, backEnd: 45 };
      case '50':
        return { frontEnd: 50, backEnd: 50 };
      default:
        return { frontEnd: 28, backEnd: 36 };
    }
  };

  // Calculate monthly mortgage payment
  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) {
      return principal / numPayments;
    }
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  // Income-based calculation
  useEffect(() => {
    if (calculatorMode !== 'income') return;

    const income = parseFloat(annualIncome) || 0;
    const debt = parseFloat(monthlyDebt) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(loanTerm) || 0;
    const downPct = parseFloat(downPaymentPercent) || 0;
    const propTaxPct = parseFloat(propertyTaxPercent) || 0;
    const hoaPct = parseFloat(hoaPercent) || 0;
    const insPct = parseFloat(insurancePercent) || 0;

    if (income <= 0) {
      resetResults();
      return;
    }

    const monthlyIncome = income / 12;
    const dtiLimits = getDTILimits(dtiOption);

    // Calculate max monthly housing payment based on back-end ratio
    const maxBackEndPayment = (monthlyIncome * dtiLimits.backEnd / 100) - debt;
    
    // Use front-end ratio if it's more restrictive
    const maxFrontEndPayment = monthlyIncome * dtiLimits.frontEnd / 100;
    
    let maxHousingPayment = Math.min(maxBackEndPayment, maxFrontEndPayment);
    
    if (maxHousingPayment <= 0) {
      resetResults();
      return;
    }

    // Iteratively find max home price
    let estimatedHomePrice = 100000;
    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
      const downPayment = estimatedHomePrice * (downPct / 100);
      const loanAmt = estimatedHomePrice - downPayment;
      
      // Calculate monthly costs
      const principalInterest = calculateMonthlyPayment(loanAmt, rate, term);
      const propTax = (estimatedHomePrice * propTaxPct / 100) / 12;
      const hoa = (estimatedHomePrice * hoaPct / 100) / 12;
      const ins = (estimatedHomePrice * insPct / 100) / 12;
      const pmi = downPct < 20 ? (loanAmt * 0.005) / 12 : 0; // 0.5% annual PMI
      
      const totalHousing = principalInterest + propTax + hoa + ins + pmi;
      
      const difference = maxHousingPayment - totalHousing;
      
      if (Math.abs(difference) < 10) {
        // Close enough
        const finalDownPayment = estimatedHomePrice * (downPct / 100);
        const finalLoanAmount = estimatedHomePrice - finalDownPayment;
        
        setMaxHomePrice(estimatedHomePrice);
        setDownPaymentAmount(finalDownPayment);
        setLoanAmount(finalLoanAmount);
        setMonthlyPayment(principalInterest);
        setMonthlyPropertyTax(propTax);
        setMonthlyHOA(hoa);
        setMonthlyInsurance(ins);
        setMonthlyPMI(pmi);
        setTotalMonthlyPayment(totalHousing);
        
        const frontEnd = (totalHousing / monthlyIncome) * 100;
        const backEnd = ((totalHousing + debt) / monthlyIncome) * 100;
        setFrontEndRatio(frontEnd);
        setBackEndRatio(backEnd);
        break;
      }
      
      // Adjust estimate
      estimatedHomePrice += difference * 100;
      
      if (estimatedHomePrice <= 0) {
        resetResults();
        break;
      }
      
      iteration++;
    }
  }, [calculatorMode, annualIncome, monthlyDebt, interestRate, loanTerm, downPaymentPercent, 
      propertyTaxPercent, hoaPercent, insurancePercent, dtiOption]);

  // Budget-based calculation
  useEffect(() => {
    if (calculatorMode !== 'budget') return;

    const budget = parseFloat(monthlyBudget) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(loanTerm) || 0;
    const downPct = parseFloat(downPaymentPercent) || 0;
    const propTaxPct = parseFloat(propertyTaxPercent) || 0;
    const hoaPct = parseFloat(hoaPercent) || 0;
    const insPct = parseFloat(insurancePercent) || 0;
    const maintPct = parseFloat(maintenancePercent) || 0;

    if (budget <= 0) {
      resetResults();
      return;
    }

    // Iteratively find max home price based on budget
    let estimatedHomePrice = 100000;
    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
      const downPayment = estimatedHomePrice * (downPct / 100);
      const loanAmt = estimatedHomePrice - downPayment;
      
      // Calculate monthly costs
      const principalInterest = calculateMonthlyPayment(loanAmt, rate, term);
      const propTax = (estimatedHomePrice * propTaxPct / 100) / 12;
      const hoa = (estimatedHomePrice * hoaPct / 100) / 12;
      const ins = (estimatedHomePrice * insPct / 100) / 12;
      const pmi = downPct < 20 ? (loanAmt * 0.005) / 12 : 0;
      const maint = (estimatedHomePrice * maintPct / 100) / 12;
      
      const totalCost = principalInterest + propTax + hoa + ins + pmi + maint;
      
      const difference = budget - totalCost;
      
      if (Math.abs(difference) < 10) {
        const finalDownPayment = estimatedHomePrice * (downPct / 100);
        const finalLoanAmount = estimatedHomePrice - finalDownPayment;
        
        setMaxHomePrice(estimatedHomePrice);
        setDownPaymentAmount(finalDownPayment);
        setLoanAmount(finalLoanAmount);
        setMonthlyPayment(principalInterest);
        setMonthlyPropertyTax(propTax);
        setMonthlyHOA(hoa);
        setMonthlyInsurance(ins);
        setMonthlyPMI(pmi);
        setMonthlyMaintenance(maint);
        setTotalMonthlyPayment(totalCost);
        setFrontEndRatio(0);
        setBackEndRatio(0);
        break;
      }
      
      estimatedHomePrice += difference * 100;
      
      if (estimatedHomePrice <= 0) {
        resetResults();
        break;
      }
      
      iteration++;
    }
  }, [calculatorMode, monthlyBudget, interestRate, loanTerm, downPaymentPercent,
      propertyTaxPercent, hoaPercent, insurancePercent, maintenancePercent]);

  const resetResults = () => {
    setMaxHomePrice(0);
    setDownPaymentAmount(0);
    setLoanAmount(0);
    setMonthlyPayment(0);
    setMonthlyPropertyTax(0);
    setMonthlyHOA(0);
    setMonthlyInsurance(0);
    setMonthlyPMI(0);
    setMonthlyMaintenance(0);
    setTotalMonthlyPayment(0);
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
    return value.toFixed(2);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Home className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">How Much House Can I Afford?</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Calculate your home affordability based on income and debt ratios or monthly budget. Get accurate estimates for conventional, FHA, and VA loans.
        </p>
      </div>

      {/* Latest Mortgage Rates Banner */}
      <Card className="border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-green-100">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-green-900">Latest Mortgage Rates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-sm text-gray-600 mb-1">30 Years Fixed</p>
              <p className="text-2xl font-bold text-green-700">6.337%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-sm text-gray-600 mb-1">15 Years Fixed</p>
              <p className="text-2xl font-bold text-green-700">5.395%</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-300">
              <p className="text-sm text-gray-600 mb-1">10 Years Fixed</p>
              <p className="text-2xl font-bold text-green-700">5.244%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator Mode Selector */}
      <div className="flex justify-center">
        <Tabs value={calculatorMode} onValueChange={(value) => setCalculatorMode(value as 'income' | 'budget')} className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="income" className="text-xs sm:text-sm px-3 py-3">
              <div className="flex flex-col items-center gap-1">
                <Calculator className="w-5 h-5" />
                <span>Income-Based</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm px-3 py-3">
              <div className="flex flex-col items-center gap-1">
                <DollarSign className="w-5 h-5" />
                <span>Budget-Based</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {calculatorMode === 'income' ? (
            /* Income-Based Inputs */
            <>
              <Card className="border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calculator className="w-5 h-5" />
                    Income & Debt
                  </CardTitle>
                  <CardDescription>Your financial information</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="annualIncome" className="text-sm font-semibold text-gray-700">
                      Annual Household Income
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="annualIncome"
                        type="number"
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        className="pl-10"
                        placeholder="120000"
                      />
                    </div>
                    <p className="text-xs text-gray-600">Salary + other incomes (before tax)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyDebt" className="text-sm font-semibold text-gray-700">
                      Monthly Debt Payments
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
                    <p className="text-xs text-gray-600">Car loans, student loans, credit cards, etc.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dtiOption" className="text-sm font-semibold text-gray-700">
                      Debt-to-Income (DTI) Ratio
                    </Label>
                    <Select value={dtiOption} onValueChange={setDtiOption}>
                      <SelectTrigger id="dtiOption">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="conventional">Conventional Loan (28/36 Rule)</SelectItem>
                        <SelectItem value="fha">FHA Loan (31/43 Rule)</SelectItem>
                        <SelectItem value="va">VA Loan (41% Back-end)</SelectItem>
                        <SelectItem value="10">Conservative (10% DTI)</SelectItem>
                        <SelectItem value="15">Very Safe (15% DTI)</SelectItem>
                        <SelectItem value="20">Safe (20% DTI)</SelectItem>
                        <SelectItem value="25">Moderate (25% DTI)</SelectItem>
                        <SelectItem value="30">Balanced (30% DTI)</SelectItem>
                        <SelectItem value="35">Aggressive (35% DTI)</SelectItem>
                        <SelectItem value="40">Very Aggressive (40% DTI)</SelectItem>
                        <SelectItem value="45">Risky (45% DTI)</SelectItem>
                        <SelectItem value="50">Maximum (50% DTI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Budget-Based Inputs */
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <DollarSign className="w-5 h-5" />
                  Monthly Budget
                </CardTitle>
                <CardDescription>Your fixed housing budget</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyBudget" className="text-sm font-semibold text-gray-700">
                    Budget for House
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="monthlyBudget"
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="pl-10"
                      placeholder="3500"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Per month (all housing costs)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loan Details */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Home className="w-5 h-5" />
                Loan Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="loanTerm" className="text-sm font-semibold text-gray-700">
                  Mortgage Loan Term
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="loanTerm"
                    type="number"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(e.target.value)}
                    className="flex-1"
                    placeholder="30"
                  />
                  <span className="text-sm text-gray-600">years</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm font-semibold text-gray-700">
                  Interest Rate
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="interestRate"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="pr-10"
                    placeholder="6.337"
                    step="0.001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="downPaymentPercent" className="text-sm font-semibold text-gray-700">
                  Down Payment
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="downPaymentPercent"
                    type="number"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(e.target.value)}
                    className="pr-10"
                    placeholder="20"
                    step="0.1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Housing Costs */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Percent className="w-5 h-5" />
                Annual Costs
              </CardTitle>
              <CardDescription>As percentage of home price</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="propertyTaxPercent" className="text-sm font-semibold text-gray-700">
                  Property Tax
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="propertyTaxPercent"
                    type="number"
                    value={propertyTaxPercent}
                    onChange={(e) => setPropertyTaxPercent(e.target.value)}
                    className="pr-10"
                    placeholder="1.5"
                    step="0.1"
                  />
                </div>
                <p className="text-xs text-gray-600">Per year</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hoaPercent" className="text-sm font-semibold text-gray-700">
                  HOA or Co-op Fee
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="hoaPercent"
                    type="number"
                    value={hoaPercent}
                    onChange={(e) => setHoaPercent(e.target.value)}
                    className="pr-10"
                    placeholder="0"
                    step="0.1"
                  />
                </div>
                <p className="text-xs text-gray-600">Per year</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurancePercent" className="text-sm font-semibold text-gray-700">
                  Insurance
                </Label>
                <div className="relative">
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="insurancePercent"
                    type="number"
                    value={insurancePercent}
                    onChange={(e) => setInsurancePercent(e.target.value)}
                    className="pr-10"
                    placeholder="0.5"
                    step="0.1"
                  />
                </div>
                <p className="text-xs text-gray-600">Per year</p>
              </div>

              {calculatorMode === 'budget' && (
                <div className="space-y-2">
                  <Label htmlFor="maintenancePercent" className="text-sm font-semibold text-gray-700">
                    Maintenance Cost
                  </Label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="maintenancePercent"
                      type="number"
                      value={maintenancePercent}
                      onChange={(e) => setMaintenancePercent(e.target.value)}
                      className="pr-10"
                      placeholder="1.5"
                      step="0.1"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Repair, utility, etc. per year</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Maximum Home Price */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="text-orange-900">Maximum Home Price You Can Afford</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300">
                <p className="text-lg text-gray-600 mb-2">You can afford a home up to:</p>
                <p className="text-5xl font-bold text-orange-600 mb-4">
                  {formatCurrency(maxHomePrice)}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white p-4 rounded-lg border border-orange-300">
                    <p className="text-sm text-gray-600 mb-1">Down Payment ({downPaymentPercent}%)</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(downPaymentAmount)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-orange-300">
                    <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(loanAmount)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Payment Breakdown */}
          <Card className="border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
              <CardTitle className="text-cyan-900">Monthly Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-gray-700 font-medium">Principal & Interest</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(monthlyPayment)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Property Tax</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyPropertyTax)}</span>
                </div>
                {monthlyHOA > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700">HOA/Co-op Fee</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyHOA)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-gray-700">Homeowners Insurance</span>
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyInsurance)}</span>
                </div>
                {monthlyPMI > 0 && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                    <div>
                      <span className="text-gray-700">PMI (Private Mortgage Insurance)</span>
                      <p className="text-xs text-gray-600">Required for down payment &lt; 20%</p>
                    </div>
                    <span className="text-lg font-semibold text-yellow-700">{formatCurrency(monthlyPMI)}</span>
                  </div>
                )}
                {calculatorMode === 'budget' && monthlyMaintenance > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700">Maintenance & Utilities</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(monthlyMaintenance)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-400 mt-4">
                  <span className="text-lg font-bold text-gray-900">Total Monthly Payment</span>
                  <span className="text-3xl font-bold text-green-600">{formatCurrency(totalMonthlyPayment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DTI Ratios (Income-based only) */}
          {calculatorMode === 'income' && (
            <Card className="border-indigo-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                <CardTitle className="text-indigo-900">Debt-to-Income Ratios</CardTitle>
                <CardDescription>Your qualification metrics</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Front-End Ratio</span>
                      <span className="text-2xl font-bold text-indigo-600">{formatPercent(frontEndRatio)}%</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Housing costs ÷ Gross monthly income</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          frontEndRatio <= getDTILimits(dtiOption).frontEnd ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(frontEndRatio, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {frontEndRatio <= getDTILimits(dtiOption).frontEnd ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Within limit ({getDTILimits(dtiOption).frontEnd}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Exceeds limit ({getDTILimits(dtiOption).frontEnd}%)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700 font-medium">Back-End Ratio</span>
                      <span className="text-2xl font-bold text-indigo-600">{formatPercent(backEndRatio)}%</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Housing costs + All debt ÷ Gross monthly income</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          backEndRatio <= getDTILimits(dtiOption).backEnd ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(backEndRatio, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {backEndRatio <= getDTILimits(dtiOption).backEnd ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Within limit ({getDTILimits(dtiOption).backEnd}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-700 font-medium">Exceeds limit ({getDTILimits(dtiOption).backEnd}%)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Understanding Home Affordability & DTI Ratios
        </h2>

        {/* Understanding DTI Ratios */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Calculator className="w-5 h-5" />
              Understanding Debt-to-Income (DTI) Ratios
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Your <strong>Debt-to-Income (DTI) ratio</strong> is one of the most critical factors lenders use to determine how much house you can afford. It measures the percentage of your gross monthly income that goes toward debt payments. There are two types of DTI ratios:
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">Front-End Ratio (Housing Ratio)</h4>
              <p className="text-gray-700 text-sm">
                Compares your total monthly <strong>housing costs</strong> (mortgage principal & interest, property taxes, homeowners insurance, HOA fees, and PMI) to your gross monthly income. Most conventional loans require this ratio to be <strong>28% or less</strong>.
              </p>
              <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                <p className="font-mono text-sm text-gray-800">
                  Front-End Ratio = (Monthly Housing Costs ÷ Gross Monthly Income) × 100
                </p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">Back-End Ratio (Total Debt Ratio)</h4>
              <p className="text-gray-700 text-sm">
                Compares your <strong>total monthly debt payments</strong> (housing costs plus car loans, student loans, credit cards, and other debts) to your gross monthly income. Most conventional loans require this ratio to be <strong>36% or less</strong>.
              </p>
              <div className="mt-3 p-3 bg-white rounded border border-green-300">
                <p className="font-mono text-sm text-gray-800">
                  Back-End Ratio = (Total Monthly Debt Payments ÷ Gross Monthly Income) × 100
                </p>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <p className="text-sm text-gray-700">
                <strong>Example:</strong> If you earn $10,000/month and have $2,500 in housing costs plus $400 in other debt, your front-end ratio is 25% ($2,500 ÷ $10,000) and back-end ratio is 29% ($2,900 ÷ $10,000). Both ratios are within conventional loan limits!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The 28/36 Rule */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Home className="w-5 h-5" />
              The 28/36 Rule Explained
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The <strong>28/36 Rule</strong> is the gold standard for conventional mortgages, established by government-sponsored enterprises like Fannie Mae and Freddie Mac. This rule states that:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg border-2 border-blue-300">
                <div className="text-4xl font-bold text-blue-600 mb-2">28%</div>
                <h4 className="font-bold text-blue-900 mb-2">Housing Costs Limit</h4>
                <p className="text-sm text-gray-700">
                  No more than 28% of your gross monthly income should go toward housing expenses (mortgage, taxes, insurance, HOA, PMI).
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg border-2 border-green-300">
                <div className="text-4xl font-bold text-green-600 mb-2">36%</div>
                <h4 className="font-bold text-green-900 mb-2">Total Debt Limit</h4>
                <p className="text-sm text-gray-700">
                  No more than 36% of your gross monthly income should go toward all debt payments combined (housing + car loans + student loans + credit cards).
                </p>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
              <h4 className="font-bold text-orange-900 mb-2">Why These Numbers?</h4>
              <p className="text-sm text-gray-700">
                The 28/36 rule was developed through decades of mortgage data analysis. It balances two goals: (1) ensuring borrowers can comfortably afford their homes, and (2) protecting lenders from default risk. Staying within these limits historically reduces foreclosure rates by over 60% compared to higher DTI ratios.
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <p className="text-sm text-gray-700">
                <strong>Real Example:</strong> Annual income of $80,000 = $6,667/month gross. Using the 28/36 rule, maximum housing payment is $1,867 (28% of $6,667) and maximum total debt is $2,400 (36%). If you have $300 in car payments and $200 in student loans, your maximum housing payment would be capped at $1,900 ($2,400 - $500).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loan Types & DTI Requirements */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <TrendingUp className="w-5 h-5" />
              Different Loan Types & Their DTI Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Different mortgage programs have varying DTI requirements based on their risk tolerance and government backing. Here's a comprehensive breakdown:
            </p>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm">CONVENTIONAL</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-1">Conventional Loans (28/36 Rule)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Front-End:</strong> 28% | <strong>Back-End:</strong> 36%
                    </p>
                    <p className="text-sm text-gray-700">
                      Standard mortgages not backed by government agencies. Require the strictest DTI ratios but offer the best rates and terms for qualified borrowers. Down payment typically 5-20%, with PMI required below 20%.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white px-3 py-1 rounded font-bold text-sm">FHA</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-900 mb-1">FHA Loans (31/43 Rule)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Front-End:</strong> 31% | <strong>Back-End:</strong> 43%
                    </p>
                    <p className="text-sm text-gray-700">
                      Federal Housing Administration loans designed for first-time homebuyers and those with lower credit scores (580+). Allow higher DTI ratios and just 3.5% down payment, but require mortgage insurance for the life of the loan (unless 10%+ down and refinance later).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 text-white px-3 py-1 rounded font-bold text-sm">VA</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-purple-900 mb-1">VA Loans (41% Back-End Only)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Front-End:</strong> No limit | <strong>Back-End:</strong> 41%
                    </p>
                    <p className="text-sm text-gray-700">
                      Veterans Affairs loans exclusively for military service members, veterans, and eligible spouses. No down payment required, no PMI, and only back-end DTI matters. Often the best deal for qualified veterans with competitive rates and minimal closing costs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white px-3 py-1 rounded font-bold text-sm">USDA</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-1">USDA Loans (29/41 Rule)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Front-End:</strong> 29% | <strong>Back-End:</strong> 41%
                    </p>
                    <p className="text-sm text-gray-700">
                      US Department of Agriculture loans for rural and suburban homebuyers. No down payment required, but property must be in eligible area and income must be below 115% of area median income. Excellent option for those qualifying by location.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white px-3 py-1 rounded font-bold text-sm">JUMBO</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 mb-1">Jumbo Loans (Varies by Lender)</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Typical Range:</strong> 38-45% back-end, varies by lender
                    </p>
                    <p className="text-sm text-gray-700">
                      High-balance loans exceeding conforming loan limits ($766,550 in most areas for 2024). Requirements vary by lender but typically demand excellent credit (700+), large down payment (20%+), and lower DTI ratios than conforming loans despite higher limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden Costs */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="w-5 h-5" />
              Hidden Costs of Homeownership
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Your monthly mortgage payment is just the beginning. Smart homebuyers plan for these often-overlooked expenses that can add 25-50% to your housing costs:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-orange-900 mb-2">🏛️ Property Taxes</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Average:</strong> 0.5-2.5% of home value annually
                </p>
                <p className="text-sm text-gray-700">
                  Varies dramatically by location. New Jersey (2.13%), Illinois (2.08%), and Texas (1.60%) have the highest rates. Hawaii (0.31%), Alabama (0.37%), and Louisiana (0.51%) have the lowest. A $400,000 home in New Jersey = $8,520/year vs. $1,240/year in Hawaii.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">🏠 Homeowners Insurance</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Average:</strong> $1,200-$2,000/year (0.3-0.5% of home value)
                </p>
                <p className="text-sm text-gray-700">
                  Protects against fire, theft, and natural disasters. Coastal areas and disaster-prone regions pay 2-3x more. Florida homeowners pay $3,600/year average due to hurricane risk, while Vermont averages just $850/year.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-yellow-900 mb-2">🏘️ HOA Fees</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Average:</strong> $200-$400/month (condos higher)
                </p>
                <p className="text-sm text-gray-700">
                  Homeowners Association fees cover shared amenities, landscaping, and building maintenance. Luxury buildings can charge $800-$2,000/month. Always ask what's included and review HOA financial health before buying.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">🔒 PMI (Private Mortgage Insurance)</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Cost:</strong> 0.3-1.5% of loan amount annually
                </p>
                <p className="text-sm text-gray-700">
                  Required when down payment is less than 20%. On a $320,000 loan, that's $133-$400/month extra! Automatically removed at 78% loan-to-value ratio or when you request cancellation at 80% LTV. FHA loans require MIP for life (unless 10%+ down).
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">🔧 Maintenance & Repairs</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Budget:</strong> 1-4% of home value annually
                </p>
                <p className="text-sm text-gray-700">
                  The "1% rule" says budget 1% of home value yearly for maintenance ($4,000 for $400k home). Older homes (50+ years) need 3-4%. Major expenses: roof replacement ($8,000-$20,000 every 20-30 years), HVAC ($5,000-$12,000 every 15-20 years), water heater ($1,200-$3,500 every 10-15 years).
                </p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
                <h4 className="font-bold text-cyan-900 mb-2">⚡ Utilities & Services</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Average:</strong> $200-$400/month
                </p>
                <p className="text-sm text-gray-700">
                  Electricity, gas, water, sewer, trash, internet, and lawn care. Larger homes in extreme climates cost more. Budget $0.50-$1.00 per square foot annually. A 2,000 sq ft home = $1,000-$2,000/year just for utilities.
                </p>
              </div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg border-2 border-red-400">
              <p className="text-sm text-gray-800">
                <strong>Total Impact Example:</strong> $400,000 home with 10% down, 6.5% interest rate. Monthly mortgage: $2,271. Add property tax ($500), insurance ($125), PMI ($133), HOA ($250), maintenance ($333), utilities ($300) = <strong>$3,912/month total housing cost</strong>—72% more than just the mortgage payment!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How to Improve Affordability */}
        <Card className="border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <CheckCircle className="w-5 h-5" />
              How to Improve Your Home Affordability
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              If your dream home is out of reach, these proven strategies can dramatically increase your buying power within 6-24 months:
            </p>
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">1. Increase Your Income</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Ask for a raise:</strong> A $10,000 salary increase = $30,000 more in home buying power (with 28% front-end ratio).</p>
                  <p><strong>Side hustles:</strong> Consistent freelance income for 2+ years can be counted by lenders. $500/month extra = $18,000 more buying power.</p>
                  <p><strong>Include all income:</strong> Don't forget bonuses, commissions, rental income (75% counted), alimony/child support, disability payments, and investment income. Lenders need 2-year history.</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">2. Reduce Your Debt</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Pay off credit cards:</strong> Eliminating $300/month in credit card minimums increases buying power by $90,000+ (36% back-end ratio).</p>
                  <p><strong>Pay off car loans:</strong> A $400 car payment costs you $120,000 in home buying power. Consider driving a paid-off car for 1-2 years before buying.</p>
                  <p><strong>Refinance student loans:</strong> Lower monthly payments (even if extending term) improve DTI immediately.</p>
                  <p><strong>Avoid new debt:</strong> Don't finance furniture, appliances, or take out new credit cards for 6 months before applying.</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">3. Increase Your Down Payment</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Save aggressively:</strong> 20% down eliminates PMI (saves $100-$400/month) and lowers interest rate by 0.25-0.5%.</p>
                  <p><strong>Gift funds:</strong> FHA allows 100% of down payment as gift from family. Conventional allows gifts for 5%+ down payment amounts.</p>
                  <p><strong>Down payment assistance:</strong> Many states offer grants, forgivable loans, or matched savings programs (check your state HFA website).</p>
                  <p><strong>IRA withdrawal:</strong> First-time homebuyers can withdraw $10,000 from IRA penalty-free (still pay taxes).</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-orange-900 mb-2">4. Improve Your Credit Score</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Pay bills on time:</strong> Payment history is 35% of score. Set up autopay for everything.</p>
                  <p><strong>Reduce credit utilization:</strong> Keep credit card balances below 30% of limits (10% is ideal). A 700 to 760 score improves your rate by 0.25-0.5%.</p>
                  <p><strong>Don't close old accounts:</strong> Average account age matters. Keep oldest card active with small monthly charge.</p>
                  <p><strong>Dispute errors:</strong> Check all 3 credit bureaus (Experian, TransUnion, Equifax) and dispute any errors. 25% of reports contain errors.</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-yellow-900 mb-2">5. Consider Different Loan Programs</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>FHA loans:</strong> Accept 43% back-end ratio vs. 36% conventional = 19% more buying power.</p>
                  <p><strong>VA loans:</strong> No down payment and 41% DTI for veterans = massive savings.</p>
                  <p><strong>First-time buyer programs:</strong> Many cities/states offer low down payment (3-5%), reduced rates, and closing cost assistance.</p>
                  <p><strong>Adjustable-rate mortgages (ARM):</strong> Lower initial rate = more buying power if you plan to move within 7-10 years.</p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2">6. Shop in Different Areas</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>Lower property taxes:</strong> Moving from high-tax state to low-tax state can double buying power ($10k vs. $3k annual taxes).</p>
                  <p><strong>Lower cost of living:</strong> Same $100k salary has 2-3x buying power in Midwest vs. coastal cities.</p>
                  <p><strong>Up-and-coming neighborhoods:</strong> Buy near (not in) hot areas. Values appreciate while staying affordable.</p>
                  <p><strong>Smaller homes:</strong> Starter home → trade up in 5-7 years uses equity to afford dream home.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Mistakes */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Common Home Affordability Mistakes to Avoid
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              These critical mistakes have cost homebuyers thousands—or even forced them to sell their dream homes. Learn from others' expensive lessons:
            </p>
            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Maxing Out Your Pre-Approval</h4>
                <p className="text-sm text-gray-700">
                  Just because a lender approves you for $500,000 doesn't mean you should spend it all. Lenders calculate affordability using conservative assumptions, but they don't know your lifestyle, spending habits, or financial goals. <strong>Rule of thumb:</strong> Spend 10-20% less than your max approval to maintain financial flexibility. A $400k home instead of $500k saves $600+/month.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Ignoring the Total Monthly Cost</h4>
                <p className="text-sm text-gray-700">
                  First-time buyers often focus solely on the mortgage payment and get shocked by the true cost. Remember: property taxes, insurance, HOA, utilities, and maintenance can add 40-60% to your base payment. Always calculate the <strong>total monthly housing cost</strong> before committing. Use this calculator's full breakdown to see the real number.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Draining Your Emergency Fund for Down Payment</h4>
                <p className="text-sm text-gray-700">
                  Putting every dollar into down payment leaves you vulnerable. What happens when the roof leaks ($8,000), AC breaks ($6,000), or you lose your job? Keep 3-6 months of expenses in savings <strong>after</strong> closing. It's better to pay PMI for a few years than to be house-poor and one emergency away from foreclosure.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Taking on New Debt Before Closing</h4>
                <p className="text-sm text-gray-700">
                  Buying a new car, financing furniture, or opening credit cards between pre-approval and closing can <strong>kill your loan approval</strong>. Lenders re-check your credit right before closing. That $400 car payment changes your DTI from 35% to 41%, potentially disqualifying you. Wait until after you've closed to make any major purchases.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Forgetting About Lifestyle Changes</h4>
                <p className="text-sm text-gray-700">
                  Planning to have kids? Change careers? Go back to school? Buy a larger home in a great school district only to realize you can't afford daycare ($1,500/month) or to take a lower-paying job you love. Think 5-10 years ahead and build in financial cushion for major life changes.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Skipping Home Inspection to Save Money</h4>
                <p className="text-sm text-gray-700">
                  A $400-$600 inspection seems expensive until you buy a house with a failing foundation ($30,000 repair), knob-and-tube wiring ($12,000 rewire), or active termite infestation ($5,000 treatment + damage). <strong>Never waive inspection</strong>, even in competitive markets. Negotiate other terms instead (appraisal gap coverage, faster closing).
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Underestimating Maintenance Costs</h4>
                <p className="text-sm text-gray-700">
                  "The house is only 5 years old, it won't need repairs!" Wrong. Budget 1-2% of home value annually minimum. That's $333/month on a $400k home. Major systems fail: water heaters (10 years), HVAC (15 years), roofs (20 years). Condo owners: you still pay for these through special assessments when shared systems fail.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-red-900 mb-2">❌ Only Getting One Mortgage Quote</h4>
                <p className="text-sm text-gray-700">
                  Mortgage rates and fees vary significantly between lenders. Getting just one quote is like buying a car without price shopping. Get quotes from 3-5 lenders (traditional banks, credit unions, online lenders, mortgage brokers). A 0.25% rate difference on a $350,000 loan = <strong>$15,000 saved over 30 years</strong>. Worth the few hours of work!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context */}
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <TrendingUp className="w-5 h-5" />
              The History of Home Affordability Standards
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The concept of standardized home affordability metrics has evolved dramatically over the past century, shaped by economic crises, government policy, and changing housing markets.
            </p>
            <div className="space-y-4">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-300">
                <h4 className="font-bold text-indigo-900 mb-2">Pre-1930s: The Wild West of Mortgages</h4>
                <p className="text-sm text-gray-700">
                  Before the Great Depression, mortgages were typically 50% down, 5-year terms with balloon payments, and 6% interest. Most Americans paid cash for homes or rented. Banks had no standard qualification criteria—approval was based on personal relationships and subjective judgment. When the stock market crashed in 1929, balloon payments came due and millions lost their homes, with foreclosure rates hitting 50% in some areas.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">1934: Birth of Modern Mortgages</h4>
                <p className="text-sm text-gray-700">
                  The Federal Housing Administration (FHA) was created to stimulate housing after the Depression. FHA introduced revolutionary concepts: 20-year terms, 20% down payment, and standardized qualification criteria. For the first time, lenders used <strong>income-to-debt ratios</strong> rather than just character references. The initial FHA guideline was simple: housing costs should not exceed 30% of gross monthly income.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">1970s: The 28/36 Rule Emerges</h4>
                <p className="text-sm text-gray-700">
                  As mortgage lending expanded and default data accumulated, Fannie Mae and Freddie Mac (government-sponsored enterprises) refined affordability standards. The <strong>28/36 rule</strong> emerged from statistical analysis of millions of loans: borrowers with housing costs above 28% of income and total debt above 36% had default rates 3-4x higher. This became the gold standard for conventional mortgages and remains dominant today.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-yellow-900 mb-2">1990s-2000s: Loosening Standards</h4>
                <p className="text-sm text-gray-700">
                  During the housing boom, lenders abandoned traditional DTI limits. "Stated income" loans (no verification), "NINA" loans (no income, no assets), and subprime mortgages with 50%+ DTI ratios became common. Banks assumed rising home prices would protect them from losses. By 2006, the average DTI for new mortgages hit 45%, with many borrowers at 60%+. This recklessness contributed directly to the 2008 financial crisis.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2">2008-2010: The Great Recession</h4>
                <p className="text-sm text-gray-700">
                  When the housing bubble burst, 8.8 million Americans lost their homes to foreclosure. Analysis showed borrowers with DTI ratios above 43% were 2.5x more likely to default. Borrowers with less than 20% down had 6x higher foreclosure rates. The crisis proved that the traditional 28/36 rule wasn't outdated—it was protective. Lenders had ignored risk at society's expense.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">2014-Present: Return to Standards</h4>
                <p className="text-sm text-gray-700">
                  The Dodd-Frank Act established the "Qualified Mortgage" (QM) rule: loans with DTI ratios above 43% receive less legal protection, incentivizing lenders to stay at or below this limit. The FHA formalized the 31/43 rule. Conventional loans returned to 28/36 standards. Today's lending environment is the most regulated and conservative since the 1970s. The result: homeownership rates have stabilized, and mortgage default rates are at historic lows (under 2% vs. 11% in 2010).
                </p>
              </div>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
              <p className="text-sm text-gray-700">
                <strong>The Lesson:</strong> DTI ratios aren't arbitrary—they're derived from 90 years of data across millions of mortgages and multiple economic cycles. The 28/36 rule has proven remarkably resilient because it balances two truths: (1) most people can comfortably afford housing costs at 28% of income, and (2) total debt above 36% creates financial stress that increases default risk. When lenders ignored these limits, the economy collapsed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HouseAffordabilityCalculatorComponent;
