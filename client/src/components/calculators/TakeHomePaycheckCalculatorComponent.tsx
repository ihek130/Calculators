import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, DollarSign, TrendingDown, PieChart, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PayFrequency = 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'semiannually' | 'annually';
type FilingStatus = 'single' | 'married-joint' | 'married-separate' | 'head' | 'widow';

const TakeHomePaycheckCalculatorComponent = () => {
  // Income & Job Info
  const [salary, setSalary] = useState<string>('80000');
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('biweekly');
  const [filingStatus, setFilingStatus] = useState<FilingStatus>('single');
  
  // Dependents
  const [childrenUnder17, setChildrenUnder17] = useState<string>('0');
  const [otherDependents, setOtherDependents] = useState<string>('0');
  
  // Other Income & Deductions
  const [otherIncome, setOtherIncome] = useState<string>('0');
  const [pretaxDeductions, setPretaxDeductions] = useState<string>('6000');
  const [deductionsNotWithheld, setDeductionsNotWithheld] = useState<string>('0');
  const [itemizedDeductions, setItemizedDeductions] = useState<string>('0');
  
  // Additional Income & Taxes
  const [hasSecondJob, setHasSecondJob] = useState<boolean>(false);
  const [stateIncomeTaxRate, setStateIncomeTaxRate] = useState<string>('0');
  const [cityIncomeTaxRate, setCityIncomeTaxRate] = useState<string>('0');
  const [isSelfEmployed, setIsSelfEmployed] = useState<boolean>(false);

  // Helper: Get pay periods per year
  const getPayPeriodsPerYear = (frequency: PayFrequency): number => {
    const periods: Record<PayFrequency, number> = {
      daily: 260,
      weekly: 52,
      biweekly: 26,
      semimonthly: 24,
      monthly: 12,
      quarterly: 4,
      semiannually: 2,
      annually: 1
    };
    return periods[frequency];
  };

  // Helper: Calculate federal income tax using 2025 brackets
  const calculateFederalTax = (taxableIncome: number, status: FilingStatus): number => {
    const brackets2025: Record<FilingStatus, Array<[number, number, number]>> = {
      'single': [
        [0, 11925, 0.10],
        [11925, 48475, 0.12],
        [48475, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250525, 0.32],
        [250525, 626350, 0.35],
        [626350, Infinity, 0.37]
      ],
      'married-joint': [
        [0, 23850, 0.10],
        [23850, 96950, 0.12],
        [96950, 206700, 0.22],
        [206700, 394600, 0.24],
        [394600, 501050, 0.32],
        [501050, 751600, 0.35],
        [751600, Infinity, 0.37]
      ],
      'married-separate': [
        [0, 11925, 0.10],
        [11925, 48475, 0.12],
        [48475, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250525, 0.32],
        [250525, 375800, 0.35],
        [375800, Infinity, 0.37]
      ],
      'head': [
        [0, 17000, 0.10],
        [17000, 64850, 0.12],
        [64850, 103350, 0.22],
        [103350, 197300, 0.24],
        [197300, 250500, 0.32],
        [250500, 626350, 0.35],
        [626350, Infinity, 0.37]
      ],
      'widow': [
        [0, 23850, 0.10],
        [23850, 96950, 0.12],
        [96950, 206700, 0.22],
        [206700, 394600, 0.24],
        [394600, 501050, 0.32],
        [501050, 751600, 0.35],
        [751600, Infinity, 0.37]
      ]
    };

    const brackets = brackets2025[status];
    let tax = 0;
    let previousBracketTop = 0;

    for (const [bottom, top, rate] of brackets) {
      if (taxableIncome <= bottom) break;
      
      const taxableInBracket = Math.min(taxableIncome, top) - bottom;
      tax += taxableInBracket * rate;
      previousBracketTop = top;
      
      if (taxableIncome <= top) break;
    }

    return tax;
  };

  // Helper: Get standard deduction for 2025
  const getStandardDeduction = (status: FilingStatus): number => {
    const deductions: Record<FilingStatus, number> = {
      'single': 15000,
      'married-joint': 30000,
      'married-separate': 15000,
      'head': 22500,
      'widow': 30000
    };
    return deductions[status];
  };

  // Helper: Calculate child tax credit
  const calculateChildTaxCredit = (children: number, otherDeps: number): number => {
    return (children * 2000) + (otherDeps * 500);
  };

  // Calculations
  const annualSalary = parseFloat(salary) || 0;
  const annualOtherIncome = parseFloat(otherIncome) || 0;
  const annualPretaxDeductions = parseFloat(pretaxDeductions) || 0;
  const annualDeductionsNotWithheld = parseFloat(deductionsNotWithheld) || 0;
  const annualItemizedDeductions = parseFloat(itemizedDeductions) || 0;
  const numChildren = parseInt(childrenUnder17) || 0;
  const numOtherDeps = parseInt(otherDependents) || 0;
  const stateRate = parseFloat(stateIncomeTaxRate) || 0;
  const cityRate = parseFloat(cityIncomeTaxRate) || 0;

  // Gross annual income
  const grossAnnualIncome = annualSalary + annualOtherIncome;

  // Adjusted gross income (after pretax deductions)
  const adjustedGrossIncome = grossAnnualIncome - annualPretaxDeductions;

  // Calculate taxable income
  const standardDeduction = getStandardDeduction(filingStatus);
  const totalDeductions = annualItemizedDeductions > standardDeduction 
    ? annualItemizedDeductions 
    : standardDeduction;
  
  const taxableIncome = Math.max(0, adjustedGrossIncome - totalDeductions - annualDeductionsNotWithheld);

  // Federal income tax
  const federalIncomeTax = calculateFederalTax(taxableIncome, filingStatus);

  // Tax credits
  const childTaxCredit = calculateChildTaxCredit(numChildren, numOtherDeps);
  const federalTaxAfterCredits = Math.max(0, federalIncomeTax - childTaxCredit);

  // FICA taxes
  const socialSecurityWageBase = 176100; // 2025 limit
  const socialSecurityRate = isSelfEmployed ? 0.124 : 0.062;
  const medicareRate = isSelfEmployed ? 0.029 : 0.0145;
  const additionalMedicareRate = 0.009;
  
  // Medicare threshold based on filing status
  const medicareThreshold = filingStatus === 'married-joint' ? 250000 : 
                           filingStatus === 'married-separate' ? 125000 : 200000;

  const socialSecurityTax = Math.min(annualSalary, socialSecurityWageBase) * socialSecurityRate;
  const baseMedicareTax = annualSalary * medicareRate;
  const additionalMedicareTax = annualSalary > medicareThreshold 
    ? (annualSalary - medicareThreshold) * additionalMedicareRate 
    : 0;
  const totalMedicareTax = baseMedicareTax + additionalMedicareTax;
  const totalFICATax = socialSecurityTax + totalMedicareTax;

  // State and city taxes
  const stateTax = adjustedGrossIncome * (stateRate / 100);
  const cityTax = adjustedGrossIncome * (cityRate / 100);

  // Total annual deductions
  const totalAnnualDeductions = federalTaxAfterCredits + totalFICATax + stateTax + cityTax + annualPretaxDeductions;

  // Annual take-home pay
  const annualTakeHomePay = grossAnnualIncome - totalAnnualDeductions;

  // Per-paycheck amounts
  const payPeriodsPerYear = getPayPeriodsPerYear(payFrequency);
  const grossPaycheck = grossAnnualIncome / payPeriodsPerYear;
  const takeHomePaycheck = annualTakeHomePay / payPeriodsPerYear;
  const deductionsPerPaycheck = totalAnnualDeductions / payPeriodsPerYear;

  // Effective tax rate
  const effectiveTaxRate = grossAnnualIncome > 0 
    ? ((totalAnnualDeductions - annualPretaxDeductions) / grossAnnualIncome) * 100 
    : 0;

  // Helper: Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper: Format currency with decimals
  const formatCurrencyDecimals = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Helper: Get pay frequency display name
  const getPayFrequencyName = (freq: PayFrequency): string => {
    const names: Record<PayFrequency, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      semimonthly: 'Semi-monthly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      semiannually: 'Semi-annually',
      annually: 'Annually'
    };
    return names[freq];
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Take-Home-Paycheck Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-4">
          Estimate the actual paycheck amount that is brought home after taxes and deductions from salary. 
          Based on 2025 tax brackets and the new W-4 form.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Income & Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Job Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium">
                Your Job Income (Salary)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="salary"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="pl-7 text-sm"
                    placeholder="80000"
                  />
                </div>
                <div className="w-24">
                  <Input value="/year" disabled className="text-sm text-center bg-gray-50" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payFrequency" className="text-sm font-medium">
                Pay Frequency
              </Label>
              <Select value={payFrequency} onValueChange={(value) => setPayFrequency(value as PayFrequency)}>
                <SelectTrigger id="payFrequency" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="semimonthly">Semi-monthly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semiannually">Semi-annually</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filing Status & Dependents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="filingStatus" className="text-sm font-medium">
                Filing Status
              </Label>
              <Select value={filingStatus} onValueChange={(value) => setFilingStatus(value as FilingStatus)}>
                <SelectTrigger id="filingStatus" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married-joint">Married Filing Jointly</SelectItem>
                  <SelectItem value="married-separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head">Head of Household</SelectItem>
                  <SelectItem value="widow">Qualified Widow(er)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="children" className="text-sm font-medium">
                Number of Children Under Age 17
              </Label>
              <Input
                id="children"
                type="number"
                min="0"
                value={childrenUnder17}
                onChange={(e) => setChildrenUnder17(e.target.value)}
                className="text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Other Dependents & Other Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="otherDeps" className="text-sm font-medium">
                Number of Other Dependents
              </Label>
              <Input
                id="otherDeps"
                type="number"
                min="0"
                value={otherDependents}
                onChange={(e) => setOtherDependents(e.target.value)}
                className="text-sm"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherIncome" className="text-sm font-medium">
                Other Income (not from jobs)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="otherIncome"
                    type="number"
                    value={otherIncome}
                    onChange={(e) => setOtherIncome(e.target.value)}
                    className="pl-7 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="w-24">
                  <Input value="/year" disabled className="text-sm text-center bg-gray-50" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Interest, dividends, retirement income, etc.</p>
            </div>
          </div>

          {/* Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="pretaxDeductions" className="text-sm font-medium">
                Pretax Deductions Withheld
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="pretaxDeductions"
                    type="number"
                    value={pretaxDeductions}
                    onChange={(e) => setPretaxDeductions(e.target.value)}
                    className="pl-7 text-sm"
                    placeholder="6000"
                  />
                </div>
                <div className="w-24">
                  <Input value="/year" disabled className="text-sm text-center bg-gray-50" />
                </div>
              </div>
              <p className="text-xs text-gray-500">401k, health insurance, HSA, etc.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deductionsNotWithheld" className="text-sm font-medium">
                Deductions Not Withheld
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="deductionsNotWithheld"
                    type="number"
                    value={deductionsNotWithheld}
                    onChange={(e) => setDeductionsNotWithheld(e.target.value)}
                    className="pl-7 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="w-24">
                  <Input value="/year" disabled className="text-sm text-center bg-gray-50" />
                </div>
              </div>
              <p className="text-xs text-gray-500">IRA, student loan interest, etc.</p>
            </div>
          </div>

          {/* Itemized Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="itemizedDeductions" className="text-sm font-medium">
                Itemized Deductions
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="itemizedDeductions"
                    type="number"
                    value={itemizedDeductions}
                    onChange={(e) => setItemizedDeductions(e.target.value)}
                    className="pl-7 text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="w-24">
                  <Input value="/year" disabled className="text-sm text-center bg-gray-50" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Mortgage interest, charitable donations, state/local/property taxes, etc.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="secondJob"
                  checked={hasSecondJob}
                  onCheckedChange={(checked) => setHasSecondJob(checked as boolean)}
                />
                <Label htmlFor="secondJob" className="text-sm font-medium cursor-pointer">
                  Has 2nd, 3rd job income?
                </Label>
              </div>
            </div>
          </div>

          {/* State & City Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="stateTax" className="text-sm font-medium">
                State Income Tax Rate (%)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="stateTax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={stateIncomeTaxRate}
                  onChange={(e) => setStateIncomeTaxRate(e.target.value)}
                  className="text-sm"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityTax" className="text-sm font-medium">
                City Income Tax Rate (%)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="cityTax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={cityIncomeTaxRate}
                  onChange={(e) => setCityIncomeTaxRate(e.target.value)}
                  className="text-sm"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Self-Employed */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selfEmployed"
              checked={isSelfEmployed}
              onCheckedChange={(checked) => setIsSelfEmployed(checked as boolean)}
            />
            <Label htmlFor="selfEmployed" className="text-sm font-medium cursor-pointer">
              Are you self-employed or an independent contractor?
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <PieChart className="h-5 w-5 text-green-600" />
            Your Take-Home Pay Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Primary Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Gross Paycheck</div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">{formatCurrencyDecimals(grossPaycheck)}</div>
                <div className="text-xs text-blue-600 mt-1">{getPayFrequencyName(payFrequency)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Take-Home Paycheck</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-900">{formatCurrencyDecimals(takeHomePaycheck)}</div>
                <div className="text-xs text-green-600 mt-1">{getPayFrequencyName(payFrequency)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-sm text-red-600 font-medium mb-1">Total Deductions</div>
                <div className="text-2xl sm:text-3xl font-bold text-red-900">{formatCurrencyDecimals(deductionsPerPaycheck)}</div>
                <div className="text-xs text-red-600 mt-1">{getPayFrequencyName(payFrequency)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Annual Summary */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
            <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900">Annual Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Gross Annual Income:</span>
                <span className="font-semibold text-sm">{formatCurrency(grossAnnualIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Annual Take-Home Pay:</span>
                <span className="font-semibold text-sm text-green-600">{formatCurrency(annualTakeHomePay)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Annual Deductions:</span>
                <span className="font-semibold text-sm text-red-600">{formatCurrency(totalAnnualDeductions)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Effective Tax Rate:</span>
                <span className="font-semibold text-sm">{effectiveTaxRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Detailed Tax Breakdown */}
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-blue-600" />
              Detailed Tax Breakdown (Annual)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Federal Income Tax:</span>
                <span className="font-semibold text-sm">{formatCurrency(federalTaxAfterCredits)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Social Security Tax ({(socialSecurityRate * 100).toFixed(2)}%):</span>
                <span className="font-semibold text-sm">{formatCurrency(socialSecurityTax)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Medicare Tax ({(medicareRate * 100).toFixed(2)}% + {(additionalMedicareRate * 100).toFixed(2)}%):</span>
                <span className="font-semibold text-sm">{formatCurrency(totalMedicareTax)}</span>
              </div>
              {stateRate > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-sm text-gray-700">State Income Tax ({stateRate}%):</span>
                  <span className="font-semibold text-sm">{formatCurrency(stateTax)}</span>
                </div>
              )}
              {cityRate > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                  <span className="text-sm text-gray-700">City Income Tax ({cityRate}%):</span>
                  <span className="font-semibold text-sm">{formatCurrency(cityTax)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-blue-200">
                <span className="text-sm text-gray-700">Pretax Deductions:</span>
                <span className="font-semibold text-sm">{formatCurrency(annualPretaxDeductions)}</span>
              </div>
              {childTaxCredit > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-green-200 bg-green-50 px-3 -mx-3 rounded">
                  <span className="text-sm text-green-700">Child Tax Credit:</span>
                  <span className="font-semibold text-sm text-green-700">-{formatCurrency(childTaxCredit)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 border-t-2 border-blue-300 mt-2">
                <span className="text-base font-semibold text-gray-900">Total Deductions:</span>
                <span className="font-bold text-base text-red-600">{formatCurrency(totalAnnualDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Tax Filing Info */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-yellow-900 mb-2">Tax Information</h4>
                <div className="space-y-1 text-xs text-yellow-800">
                  <p><strong>Standard Deduction Used:</strong> {formatCurrency(standardDeduction)} (You can claim {formatCurrency(Math.max(totalDeductions, standardDeduction))})</p>
                  <p><strong>Taxable Income:</strong> {formatCurrency(taxableIncome)}</p>
                  <p><strong>Adjusted Gross Income:</strong> {formatCurrency(adjustedGrossIncome)}</p>
                  {isSelfEmployed && (
                    <p className="text-orange-700 font-medium">⚠️ Self-employed: Both employee and employer portions of FICA taxes applied</p>
                  )}
                  {annualSalary > socialSecurityWageBase && (
                    <p className="text-blue-700">Social Security tax capped at ${socialSecurityWageBase.toLocaleString()} wage base for 2025</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Periods Info */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="text-lg sm:text-xl">Pay Period Information</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Pay Frequency</div>
              <div className="text-xl font-bold text-purple-900">{getPayFrequencyName(payFrequency)}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Pay Periods per Year</div>
              <div className="text-xl font-bold text-purple-900">{payPeriodsPerYear}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Filing Status</div>
              <div className="text-xl font-bold text-purple-900 text-sm sm:text-base">
                {filingStatus === 'single' && 'Single'}
                {filingStatus === 'married-joint' && 'Married Joint'}
                {filingStatus === 'married-separate' && 'Married Separate'}
                {filingStatus === 'head' && 'Head of Household'}
                {filingStatus === 'widow' && 'Qualified Widow(er)'}
              </div>
            </div>
          </div>

          {payFrequency === 'biweekly' && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                <strong>Bi-weekly Pay Note:</strong> With bi-weekly pay, you'll receive 26 paychecks per year. 
                For 10 months, you'll get 2 paychecks, and for 2 months, you'll receive 3 paychecks!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Educational Content */}
      <div className="mt-8 space-y-6 sm:space-y-8">
        {/* Introduction */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Understanding Your Take-Home Pay</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Your take-home pay, also known as net pay or disposable income, is the actual amount of money you receive in your paycheck after all taxes and deductions are withheld. While your gross salary is the number you negotiate with your employer and see on job offers, your take-home pay is what actually hits your bank account and determines your real purchasing power. Understanding the difference between these two figures is crucial for effective financial planning, budgeting, and making informed career decisions.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              For most U.S. workers, the difference between gross and net pay can be substantial—typically ranging from 20% to 35% of gross income. This means if you earn $80,000 per year, your actual take-home pay might be closer to $52,000 to $64,000 after all deductions. The exact amount depends on numerous factors including your filing status, number of dependents, state and local taxes, and voluntary deductions like retirement contributions and health insurance premiums.
            </p>
          </CardContent>
        </Card>

        {/* Before-Tax vs After-Tax Income */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Before-Tax vs. After-Tax Income</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              In the United States, the concept of personal income or salary typically references the before-tax amount, called gross pay. This is the figure used on mortgage applications, tax bracket determinations, and salary comparisons because it's the raw income before individual circumstances like federal income tax, allowances, or health insurance deductions are applied. However, for personal finance purposes, the after-tax income figure is far more practical—it's the money you can actually spend on rent, groceries, savings, and entertainment.
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              For example, a person living paycheck-to-paycheck needs to know their take-home amount to calculate how much they'll have available for next month's rent and expenses. Similarly, when creating a household budget, using gross income would lead to overspending and financial stress. The take-home pay calculator helps bridge this gap by showing exactly how much money you'll receive after all mandatory and voluntary deductions, allowing you to plan your finances based on reality rather than assumptions.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4 rounded">
              <p className="text-sm font-semibold text-blue-900">
                Important Note: Enter your annual salary in the "Your Annual Income (Salary)" field as the before-tax amount. The "Final Paycheck" result shows your after-tax amount including all deductions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pay Frequency Explained */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Understanding Pay Frequency</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Pay frequency refers to how often you receive your paycheck from your employer. The most common schedules are weekly, bi-weekly, semi-monthly, and monthly, though other frequencies exist. It's crucial to make the distinction between bi-weekly and semi-monthly payments, even though they may seem similar at first glance. Bi-weekly means you're paid every other week (every 14 days), resulting in 26 paychecks per year. Semi-monthly means you're paid twice a month on specific dates (usually the 15th and 30th), resulting in 24 paychecks annually.
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The bi-weekly schedule offers an interesting advantage: since there are 52 weeks in a year, you'll receive 26 paychecks instead of 24. This means for ten months of the year, you'll receive two paychecks, but for two months, you'll receive three paychecks. These "extra" paychecks can be strategically used for debt payoff, emergency fund contributions, or saving for major purchases. Weekly pay (52 paychecks per year) is common in hourly jobs and provides more frequent cash flow, which some people prefer for budgeting purposes.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              From an employer perspective, less frequent payment schedules (monthly or semi-monthly) reduce administrative costs and payroll processing time. However, employees generally prefer more frequent payments due to psychological factors and easier cash flow management. Federal law requires that payment schedules be predictable—an employer cannot arbitrarily switch from bi-weekly one month to monthly the next. Some states have specific pay frequency requirements for certain industries. As a side note, pay periods have no effect on your total tax liability; you'll pay the same annual taxes regardless of whether you're paid weekly or monthly.
            </p>
          </CardContent>
        </Card>

        {/* Filing Status Guide */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Choosing Your Filing Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Your filing status is one of the most important factors affecting your tax liability and take-home pay. The IRS defines five filing statuses: Single, Married Filing Jointly, Married Filing Separately, Head of Household, and Qualified Widow(er). Single status applies to anyone not married, divorced, or legally separated according to state law. Married Filing Jointly allows married couples to file a single return together, typically resulting in lower taxes due to more favorable tax brackets and higher standard deductions.
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Married Filing Separately means each spouse files their own return, which can be beneficial in specific situations such as when one spouse has significant medical expenses or when keeping finances completely separate. Head of Household status is available to unmarried individuals who have paid more than half the cost of maintaining a home for themselves and a qualifying person, such as a child or dependent parent. This status offers more favorable tax treatment than Single status. Qualified Widow(er) status allows someone with a dependent child to retain the benefits of Married Filing Jointly for two years after their spouse's death.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              The most commonly chosen options are Single, Married Filing Jointly, and Head of Household. It's important to note that it's possible for a person to qualify for multiple filing statuses. For instance, someone who is unmarried might qualify as either Single or Head of Household depending on their circumstances. In such cases, it's wise to evaluate your options and choose the status that results in the lowest tax burden and highest take-home pay. The 2025 standard deduction is $15,000 for Single filers, $30,000 for Married Filing Jointly, and $22,500 for Head of Household.
            </p>
          </CardContent>
        </Card>

        {/* Understanding Deductions */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Types of Deductions That Affect Your Paycheck</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Deductions lower your taxable income and, consequently, your tax liability. Understanding the different types of deductions helps you maximize your take-home pay while planning for retirement and managing healthcare costs. There are three main categories of deductions that affect your paycheck calculations.
            </p>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 mt-6">1. Pretax Deductions Withheld</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              These are deductions automatically withheld from your salary by your employer before calculating taxes. Common pretax deductions include 401(k) retirement contributions, the employee's share of health insurance premiums, health savings account (HSA) contributions, flexible spending account (FSA) contributions, child support payments, and union or uniform dues. For example, if you earn $80,000 annually and contribute $6,000 to your 401(k), your taxable income drops to $74,000, reducing your federal income tax, Social Security tax, and Medicare tax. This makes pretax deductions one of the most powerful tools for reducing your overall tax burden while saving for the future.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2. Deductions Not Withheld</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              These are deductions that won't be automatically taken from your paycheck but can be subtracted from your taxable income when you file your tax return. Examples include traditional IRA contributions (up to $7,000 for 2025, or $8,000 if you're 50 or older), student loan interest (up to $2,500), qualified tuition and education-related fees, and certain business expenses for self-employed individuals. While these don't immediately increase your paycheck, they reduce your overall tax liability when you file your return, potentially resulting in a larger refund or smaller tax payment.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">3. Itemized Deductions</h3>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              Itemized deductions are expenditures on eligible products, services, or contributions that can be subtracted from your taxable income. These include qualified mortgage interest, state and local income taxes plus either property or sales taxes (capped at $10,000 total), charitable donations, and medical and dental expenses exceeding 10% of your adjusted gross income. For 2025, the standard deduction is $15,000 for single filers and $30,000 for married couples filing jointly. Taxpayers can choose either itemized deductions or the standard deduction—whichever results in a higher deduction and therefore lower tax liability. Most taxpayers use the standard deduction because it's simpler and often provides a greater benefit.
            </p>
          </CardContent>
        </Card>

        {/* FICA Taxes Explained */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">FICA Taxes: Social Security and Medicare</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              FICA (Federal Insurance Contributions Act) taxes fund Social Security and Medicare programs. Every worker in the United States pays FICA taxes, whether they're an employee or an independent contractor. For employees, these taxes are split 50/50 between the employee and employer—you pay half, and your employer pays the other half. Independent contractors and self-employed individuals pay the full amount (both halves) because they're considered both the employee and the employer. This is one reason why independent contractors typically charge higher hourly rates than regular employees performing the same work.
            </p>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 mt-6">Social Security Tax</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The Social Security tax rate is 6.20% for employees (12.40% total including employer contribution) up to an annual maximum wage base of $176,100 for 2025. This means if you earn $80,000, you'll pay $4,960 in Social Security taxes (6.2% of $80,000). However, if you earn $200,000, you'll only pay Social Security tax on the first $176,100, resulting in $10,918.20 in Social Security taxes. Income above the wage base is not subject to Social Security tax. This system helps fund retirement benefits, disability insurance, and survivor benefits for Americans.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">Medicare Tax</h3>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              The Medicare tax rate is 1.45% for employees (2.90% total including employer contribution) on all wages—there's no income cap. Additionally, high earners pay an Additional Medicare Tax of 0.9% on wages exceeding certain thresholds: $200,000 for single filers, $250,000 for married filing jointly, and $125,000 for married filing separately. For example, if you're single and earn $220,000, you'll pay the regular 1.45% Medicare tax on all $220,000 ($3,190), plus an additional 0.9% on the $20,000 above the $200,000 threshold ($180), for a total Medicare tax of $3,370. Self-employed individuals pay 2.9% on all income plus the 0.9% Additional Medicare Tax above the thresholds.
            </p>
          </CardContent>
        </Card>

        {/* Federal Income Tax */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Federal Income Tax and Progressive Tax Brackets</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Federal income tax is typically the largest deduction from your gross pay. It's a progressive tax system, meaning the tax rate increases as your taxable income increases. The 2025 federal income tax rates range from 10% for the lowest earners to 37% for the highest earners (those earning over $626,350 for single filers or $751,600 for married couples filing jointly). However, it's crucial to understand that having a top tax rate of, say, 24% doesn't mean all your income is taxed at 24%.
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The progressive system works by taxing different portions of your income at different rates. For example, if you're single and earn $60,000 in 2025, your first $11,925 is taxed at 10% ($1,192.50), the next portion from $11,925 to $48,475 is taxed at 12% ($4,386), and the remaining amount from $48,475 to $60,000 is taxed at 22% ($2,535.50), for a total federal income tax of approximately $8,114 before any credits or additional deductions. Your effective tax rate (total tax divided by total income) would be about 13.5%, significantly lower than your marginal rate of 22%.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              Federal income taxes are withheld automatically from employee paychecks based on information provided on your W-4 form. Independent contractors and self-employed individuals must submit quarterly estimated tax payments. Evasion of federal income tax carries serious consequences, including felony charges and imprisonment for up to five years, plus substantial financial penalties and interest on unpaid taxes.
            </p>
          </CardContent>
        </Card>

        {/* State and Local Taxes */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">State and Local Income Taxes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              While federal income tax applies to all Americans, state income tax varies dramatically by location. Seven states impose no income tax at all: Alaska, Florida, Nevada, South Dakota, Texas, Washington, and Wyoming. If you live in one of these states, you'll keep more of your paycheck compared to residents of high-tax states. Eight states have flat tax rates where everyone pays the same percentage regardless of income: Colorado, Illinois, Indiana, Massachusetts, Michigan, North Carolina, Pennsylvania, and Utah. The remaining 33 states plus the District of Columbia have progressive tax systems similar to the federal structure.
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              California has the highest maximum state income tax rate at 13.30%, which can significantly impact high earners' take-home pay. For example, a California resident earning $400,000 might pay over $40,000 in state income taxes alone. This is one reason why some high-income individuals and businesses choose to relocate to states with no income tax. Tennessee and New Hampshire occupy a gray area—they don't tax wages, but they do tax interest and dividend income (though New Hampshire is phasing this out).
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              City and municipal income taxes affect approximately 10% of the U.S. population, with the highest rates typically found in large cities like New York City (up to 3.876% for residents), Philadelphia (3.79%), Detroit (2.4%), and Cleveland (2.0%). These local taxes are in addition to state and federal taxes, further reducing take-home pay. When comparing job offers in different cities, it's essential to account for these varying tax rates—a $100,000 salary in Texas provides significantly more take-home pay than the same salary in New York City or San Francisco due to tax differences.
            </p>
          </CardContent>
        </Card>

        {/* How to Increase Take-Home Pay */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Strategies to Increase Your Take-Home Pay</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">1. Negotiate a Salary Increase</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The most straightforward way to increase take-home pay is earning more money. Ask for a raise, promotion, or performance bonus when you have legitimate grounds—such as exceeding performance expectations, taking on additional responsibilities, or contributing to significant company improvements. If internal salary increases aren't possible, consider transitioning to a new company. In the current job market, the highest salary increases often happen when changing employers, with average raises of 10-20% compared to typical annual raises of 3-5%.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">2. Optimize Payroll Deductions</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Review your insurance and benefit elections annually. If you're healthy with no major medical conditions, you might not need the most expensive platinum-level health insurance plan—a gold or silver plan with a higher deductible but lower premiums could save you $100-300 per paycheck. If both spouses' employers offer health insurance, compare the costs and coverage carefully; often, one plan is significantly better than the other. Similarly, review life insurance, disability insurance, and other voluntary deductions to ensure you're not overpaying for coverage you don't need.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">3. Adjust W-4 Withholding</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              If you consistently receive large tax refunds (over $1,500), you're essentially giving the government an interest-free loan throughout the year. Adjust your W-4 to reduce withholding and increase your take-home pay. Use the IRS Tax Withholding Estimator to find the right balance. Conversely, if you owe taxes every April, increase your withholding to avoid penalties and surprises.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">4. Work Overtime</h3>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Non-exempt employees covered by the Fair Labor Standards Act (FLSA) must receive overtime pay at one and a half times their regular rate for hours worked beyond 40 in a workweek. Some companies offer double-time for holidays or weekends. If you're non-exempt and your employer allows overtime, working an extra 5-10 hours per week can substantially increase your paycheck. For example, earning $25/hour regular time means $37.50/hour overtime—an extra 10 hours adds $375 to your weekly paycheck.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">5. Cash Out Paid Time Off</h3>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              Some employers allow employees to exchange unused PTO for cash at year-end. If you have 40 hours of unused vacation worth $1,000 in wages and don't plan to use it, converting it to cash provides an immediate boost to your paycheck. However, this should be a last resort—taking time off for rest and mental health is crucial for long-term career success and life satisfaction.
            </p>
          </CardContent>
        </Card>

        {/* Tax Planning Tips */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Important Tax Planning Considerations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              Understanding your take-home pay is just the first step in effective tax planning. Consider maximizing contributions to tax-advantaged accounts like 401(k)s, IRAs, and HSAs to reduce current taxes while building long-term wealth. For 2025, you can contribute up to $23,000 to a 401(k) ($30,500 if you're 50 or older), $7,000 to an IRA ($8,000 if 50+), and $4,300 to an HSA for individuals ($8,550 for families).
            </p>
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The child tax credit provides $2,000 per qualifying child under 17 and $500 for other dependents. This credit directly reduces your tax liability dollar-for-dollar, making it more valuable than a deduction. If you have two children, you'll save $4,000 on your federal income taxes, significantly increasing your take-home pay or tax refund.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              Finally, be cautious about temporarily pausing retirement contributions to increase short-term take-home pay. While this might help during financial emergencies, you'll miss out on compound growth and employer matching contributions. If your employer matches 50% of contributions up to 6% of salary, stopping your 401(k) contributions means losing free money—potentially thousands of dollars annually in lost matching contributions and tax savings.
            </p>
          </CardContent>
        </Card>

        {/* W-4 Form and Withholding Strategy */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Mastering Your W-4 Form and Withholding Strategy</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="mb-4 leading-relaxed text-sm sm:text-base text-gray-700">
              The W-4 form underwent its first major revision in 2020 since 1987, eliminating allowances and introducing a more straightforward approach to withholding calculations. Understanding how to properly complete your W-4 is crucial for optimizing your take-home pay throughout the year. The form now uses steps 3 and 4 to account for dependents and additional income, which this calculator helps you determine accurately. If you claim too many deductions on your W-4, you'll enjoy higher paychecks but might face a tax bill in April. Conversely, claiming too few deductions means smaller paychecks but a larger refund at tax time.
            </p>
            <p className="leading-relaxed text-sm sm:text-base text-gray-700">
              The optimal strategy is to have your withholding match your actual tax liability as closely as possible, resulting in neither a large refund nor a tax bill. Use the IRS Tax Withholding Estimator annually or whenever you experience major life changes like marriage, divorce, having children, buying a home, or taking a second job. These events significantly impact your tax situation and require W-4 adjustments. Remember that adjusting your withholding doesn't change your total annual tax liability—it only affects the timing of when you pay those taxes throughout the year versus at filing time.
            </p>
          </CardContent>
        </Card>

        {/* Conclusion */}
        <Card className="shadow-lg border-l-4 border-blue-600">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-xl sm:text-2xl text-gray-900">Key Takeaways</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Your take-home pay is typically 65-80% of your gross salary after all taxes and deductions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Bi-weekly pay schedules result in 26 paychecks per year, giving you two "extra" paychecks annually</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Filing status significantly affects your taxes—Head of Household and Married Filing Jointly typically offer the most favorable tax treatment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Pretax deductions like 401(k) contributions reduce your current tax burden while building long-term wealth</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">FICA taxes (Social Security 6.2% + Medicare 1.45%) are mandatory for all workers, with additional Medicare tax above certain income thresholds</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">State and local taxes vary dramatically—seven states have no income tax, while others like California charge over 13%</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Use your take-home pay figure, not gross salary, when creating budgets and making major financial decisions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
                <span className="text-sm sm:text-base text-gray-700">Review your W-4 withholding annually to avoid large refunds (over-withholding) or tax bills (under-withholding)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TakeHomePaycheckCalculatorComponent;
