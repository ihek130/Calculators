import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, DollarSign, FileText, TrendingUp, PiggyBank, Users, GraduationCap, BookOpen, Shield, CreditCard, Target } from 'lucide-react';

interface TaxInputs {
  // Filing Status & Dependents
  filingStatus: string;
  youngDependents: string;
  otherDependents: string;
  taxYear: string;
  
  // Income
  wages: string;
  federalWithheld: string;
  stateWithheld: string;
  localWithheld: string;
  interestIncome: string;
  ordinaryDividends: string;
  qualifiedDividends: string;
  passiveIncome: string;
  shortTermCapitalGain: string;
  longTermCapitalGain: string;
  otherIncome: string;
  
  // Deductions & Credits
  iraContributions: string;
  realEstateTax: string;
  mortgageInterest: string;
  charitableDonations: string;
  studentLoanInterest: string;
  childCareExpense: string;
  educationExpense1: string;
  educationExpense2: string;
  educationExpense3: string;
  educationExpense4: string;
  otherDeductibles: string;
}

interface TaxResult {
  totalIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  federalTaxOwed: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
  standardDeduction: number;
  itemizedDeductions: number;
  usedDeduction: number;
  refundOrOwed: number;
  totalCredits: number;
  breakdown: {
    wages: number;
    totalOtherIncome: number;
    totalDeductions: number;
    totalWithholdings: number;
  };
}

// Tax brackets for 2024 and 2025
const TAX_BRACKETS = {
  2024: {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191050, rate: 0.24 },
      { min: 191050, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ],
    marriedJoint: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 }
    ],
    marriedSeparate: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 365600, rate: 0.35 },
      { min: 365600, max: Infinity, rate: 0.37 }
    ],
    headOfHousehold: [
      { min: 0, max: 16550, rate: 0.10 },
      { min: 16550, max: 63100, rate: 0.12 },
      { min: 63100, max: 100500, rate: 0.22 },
      { min: 100500, max: 191050, rate: 0.24 },
      { min: 191050, max: 243700, rate: 0.32 },
      { min: 243700, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ]
  },
  2025: {
    single: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 196425, rate: 0.24 },
      { min: 196425, max: 250525, rate: 0.32 },
      { min: 250525, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 }
    ],
    marriedJoint: [
      { min: 0, max: 23850, rate: 0.10 },
      { min: 23850, max: 96950, rate: 0.12 },
      { min: 96950, max: 206700, rate: 0.22 },
      { min: 206700, max: 394600, rate: 0.24 },
      { min: 394600, max: 501050, rate: 0.32 },
      { min: 501050, max: 751600, rate: 0.35 },
      { min: 751600, max: Infinity, rate: 0.37 }
    ],
    marriedSeparate: [
      { min: 0, max: 11925, rate: 0.10 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250525, rate: 0.32 },
      { min: 250525, max: 375800, rate: 0.35 },
      { min: 375800, max: Infinity, rate: 0.37 }
    ],
    headOfHousehold: [
      { min: 0, max: 17000, rate: 0.10 },
      { min: 17000, max: 64850, rate: 0.12 },
      { min: 64850, max: 103350, rate: 0.22 },
      { min: 103350, max: 196425, rate: 0.24 },
      { min: 196425, max: 250500, rate: 0.32 },
      { min: 250500, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 }
    ]
  }
};

// Standard deductions
const STANDARD_DEDUCTIONS = {
  2024: {
    single: 14600,
    marriedJoint: 29200,
    marriedSeparate: 14600,
    headOfHousehold: 21900
  },
  2025: {
    single: 15000,
    marriedJoint: 30000,
    marriedSeparate: 15000,
    headOfHousehold: 22500
  }
};

const IncomeTaxCalculatorComponent: React.FC = () => {
  const [inputs, setInputs] = useState<TaxInputs>({
    filingStatus: 'single',
    youngDependents: '0',
    otherDependents: '0',
    taxYear: '2024',
    wages: '80000',
    federalWithheld: '9000',
    stateWithheld: '0',
    localWithheld: '0',
    interestIncome: '0',
    ordinaryDividends: '0',
    qualifiedDividends: '0',
    passiveIncome: '0',
    shortTermCapitalGain: '0',
    longTermCapitalGain: '0',
    otherIncome: '0',
    iraContributions: '0',
    realEstateTax: '0',
    mortgageInterest: '0',
    charitableDonations: '0',
    studentLoanInterest: '0',
    childCareExpense: '0',
    educationExpense1: '0',
    educationExpense2: '0',
    educationExpense3: '0',
    educationExpense4: '0',
    otherDeductibles: '0'
  });

  const [result, setResult] = useState<TaxResult | null>(null);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const formatCurrencyFull = (amount: number): string => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateFederalTax = (taxableIncome: number, filingStatus: string, taxYear: string): { tax: number, marginalRate: number } => {
    const brackets = (TAX_BRACKETS as any)[taxYear][filingStatus];
    let tax = 0;
    let marginalRate = 0;

    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        tax += taxableAtBracket * bracket.rate;
        marginalRate = bracket.rate;
      }
    }

    return { tax, marginalRate };
  };

  const calculateTaxCredits = (youngDependents: number, otherDependents: number, childCareExpense: number, educationExpenses: number): number => {
    let credits = 0;
    
    // Child Tax Credit - $2,000 per child under 17
    credits += youngDependents * 2000;
    
    // Child and Dependent Care Credit - 20-35% of expenses up to $3,000 per child
    const childCareCredit = Math.min(childCareExpense * 0.20, youngDependents * 3000 * 0.20);
    credits += childCareCredit;
    
    // Education Credit - simplified calculation
    credits += Math.min(educationExpenses * 0.25, 2500); // American Opportunity Credit approximation
    
    return credits;
  };

  useEffect(() => {
    const calculateTax = () => {
      try {
        // Parse inputs
        const wages = parseFloat(inputs.wages) || 0;
        const federalWithheld = parseFloat(inputs.federalWithheld) || 0;
        const stateWithheld = parseFloat(inputs.stateWithheld) || 0;
        const localWithheld = parseFloat(inputs.localWithheld) || 0;
        const interestIncome = parseFloat(inputs.interestIncome) || 0;
        const ordinaryDividends = parseFloat(inputs.ordinaryDividends) || 0;
        const qualifiedDividends = parseFloat(inputs.qualifiedDividends) || 0;
        const passiveIncome = parseFloat(inputs.passiveIncome) || 0;
        const shortTermCapitalGain = parseFloat(inputs.shortTermCapitalGain) || 0;
        const longTermCapitalGain = parseFloat(inputs.longTermCapitalGain) || 0;
        const otherIncome = parseFloat(inputs.otherIncome) || 0;
        
        // Deductions
        const iraContributions = parseFloat(inputs.iraContributions) || 0;
        const realEstateTax = parseFloat(inputs.realEstateTax) || 0;
        const mortgageInterest = parseFloat(inputs.mortgageInterest) || 0;
        const charitableDonations = parseFloat(inputs.charitableDonations) || 0;
        const studentLoanInterest = Math.min(parseFloat(inputs.studentLoanInterest) || 0, 2500); // Max $2,500
        const childCareExpense = parseFloat(inputs.childCareExpense) || 0;
        const otherDeductibles = parseFloat(inputs.otherDeductibles) || 0;
        
        const youngDependents = parseInt(inputs.youngDependents) || 0;
        const otherDependents = parseInt(inputs.otherDependents) || 0;
        
        const educationExpenses = (parseFloat(inputs.educationExpense1) || 0) +
                                 (parseFloat(inputs.educationExpense2) || 0) +
                                 (parseFloat(inputs.educationExpense3) || 0) +
                                 (parseFloat(inputs.educationExpense4) || 0);

        // Calculate total income
        const totalIncome = wages + interestIncome + ordinaryDividends + qualifiedDividends + 
                           passiveIncome + shortTermCapitalGain + longTermCapitalGain + otherIncome;

        // Calculate AGI (Above-the-line deductions)
        const aboveTheLineDeductions = iraContributions + studentLoanInterest;
        const adjustedGrossIncome = totalIncome - aboveTheLineDeductions;

        // Calculate itemized deductions (Below-the-line)
        const itemizedDeductions = realEstateTax + mortgageInterest + charitableDonations + 
                                 childCareExpense + educationExpenses + otherDeductibles;

        // Get standard deduction
        const standardDeduction = (STANDARD_DEDUCTIONS as any)[inputs.taxYear][inputs.filingStatus];

        // Use higher of standard or itemized
        const usedDeduction = Math.max(standardDeduction, itemizedDeductions);

        // Calculate taxable income
        const taxableIncome = Math.max(0, adjustedGrossIncome - usedDeduction);

        // Calculate federal tax
        const { tax: federalTaxOwed, marginalRate } = calculateFederalTax(taxableIncome, inputs.filingStatus, inputs.taxYear);

        // Calculate tax credits
        const totalCredits = calculateTaxCredits(youngDependents, otherDependents, childCareExpense, educationExpenses);

        // Calculate final tax liability
        const finalTaxLiability = Math.max(0, federalTaxOwed - totalCredits);

        // Calculate refund or amount owed
        const totalWithholdings = federalWithheld + stateWithheld + localWithheld;
        const refundOrOwed = totalWithholdings - finalTaxLiability;

        // Calculate effective tax rate
        const effectiveTaxRate = adjustedGrossIncome > 0 ? (finalTaxLiability / adjustedGrossIncome) * 100 : 0;

        const taxResult: TaxResult = {
          totalIncome,
          adjustedGrossIncome,
          taxableIncome,
          federalTaxOwed: finalTaxLiability,
          effectiveTaxRate,
          marginalTaxRate: marginalRate * 100,
          standardDeduction,
          itemizedDeductions,
          usedDeduction,
          refundOrOwed,
          totalCredits,
          breakdown: {
            wages,
            totalOtherIncome: totalIncome - wages,
            totalDeductions: usedDeduction + aboveTheLineDeductions,
            totalWithholdings
          }
        };

        setResult(taxResult);
      } catch (error) {
        console.error('Tax calculation error:', error);
      }
    };

    calculateTax();
  }, [inputs]);

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Income Tax Calculator
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
          Estimate your federal tax refund or amount owed. Based on 2024 and 2025 tax brackets with automatic calculations that update as you type.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Filing Information
              </CardTitle>
              <CardDescription className="text-base sm:text-lg">
                Basic filing status and dependent information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filingStatus" className="text-base sm:text-lg">Filing Status</Label>
                  <Select value={inputs.filingStatus} onValueChange={(value) => setInputs(prev => ({...prev, filingStatus: value}))}>
                    <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="marriedJoint">Married Filing Jointly</SelectItem>
                      <SelectItem value="marriedSeparate">Married Filing Separately</SelectItem>
                      <SelectItem value="headOfHousehold">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxYear" className="text-base sm:text-lg">Tax Year</Label>
                  <Select value={inputs.taxYear} onValueChange={(value) => setInputs(prev => ({...prev, taxYear: value}))}>
                    <SelectTrigger className="h-8 sm:h-10 text-base sm:text-lg">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youngDependents" className="flex items-center gap-1 text-base sm:text-lg">
                    <span className="truncate">Young Dependents (0-16)</span>
                  </Label>
                  <Input
                    id="youngDependents"
                    type="number"
                    value={inputs.youngDependents}
                    onChange={(e) => setInputs(prev => ({...prev, youngDependents: e.target.value}))}
                    className="h-8 sm:h-10 text-base sm:text-lg"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherDependents" className="flex items-center gap-1 text-base sm:text-lg">
                    <span className="truncate">Other Dependents (17+)</span>
                  </Label>
                  <Input
                    id="otherDependents"
                    type="number"
                    value={inputs.otherDependents}
                    onChange={(e) => setInputs(prev => ({...prev, otherDependents: e.target.value}))}
                    className="h-8 sm:h-10 text-base sm:text-lg"
                    placeholder="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="income" className="text-base sm:text-lg">Income</TabsTrigger>
              <TabsTrigger value="deductions" className="text-base sm:text-lg">Deductions & Credits</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="space-y-3 sm:space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                    Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wages" className="text-base sm:text-lg">Wages & Tips (W-2 Box 1)</Label>
                      <Input
                        id="wages"
                        type="number"
                        value={inputs.wages}
                        onChange={(e) => setInputs(prev => ({...prev, wages: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="80000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="federalWithheld" className="text-base sm:text-lg">Federal Tax Withheld (W-2 Box 2)</Label>
                      <Input
                        id="federalWithheld"
                        type="number"
                        value={inputs.federalWithheld}
                        onChange={(e) => setInputs(prev => ({...prev, federalWithheld: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="9000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stateWithheld" className="text-base sm:text-lg">State Tax Withheld</Label>
                      <Input
                        id="stateWithheld"
                        type="number"
                        value={inputs.stateWithheld}
                        onChange={(e) => setInputs(prev => ({...prev, stateWithheld: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="localWithheld" className="text-base sm:text-lg">Local Tax Withheld</Label>
                      <Input
                        id="localWithheld"
                        type="number"
                        value={inputs.localWithheld}
                        onChange={(e) => setInputs(prev => ({...prev, localWithheld: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interestIncome" className="text-base sm:text-lg">Interest Income (1099-INT)</Label>
                      <Input
                        id="interestIncome"
                        type="number"
                        value={inputs.interestIncome}
                        onChange={(e) => setInputs(prev => ({...prev, interestIncome: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ordinaryDividends" className="text-base sm:text-lg">Ordinary Dividends</Label>
                      <Input
                        id="ordinaryDividends"
                        type="number"
                        value={inputs.ordinaryDividends}
                        onChange={(e) => setInputs(prev => ({...prev, ordinaryDividends: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualifiedDividends" className="text-base sm:text-lg">Qualified Dividends (1099-DIV)</Label>
                      <Input
                        id="qualifiedDividends"
                        type="number"
                        value={inputs.qualifiedDividends}
                        onChange={(e) => setInputs(prev => ({...prev, qualifiedDividends: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passiveIncome" className="text-base sm:text-lg">Passive Income (Rentals, etc.)</Label>
                      <Input
                        id="passiveIncome"
                        type="number"
                        value={inputs.passiveIncome}
                        onChange={(e) => setInputs(prev => ({...prev, passiveIncome: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortTermCapitalGain" className="text-base sm:text-lg">Short-term Capital Gains</Label>
                      <Input
                        id="shortTermCapitalGain"
                        type="number"
                        value={inputs.shortTermCapitalGain}
                        onChange={(e) => setInputs(prev => ({...prev, shortTermCapitalGain: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longTermCapitalGain" className="text-base sm:text-lg">Long-term Capital Gains</Label>
                      <Input
                        id="longTermCapitalGain"
                        type="number"
                        value={inputs.longTermCapitalGain}
                        onChange={(e) => setInputs(prev => ({...prev, longTermCapitalGain: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherIncome" className="text-base sm:text-lg">Other Income</Label>
                      <Input
                        id="otherIncome"
                        type="number"
                        value={inputs.otherIncome}
                        onChange={(e) => setInputs(prev => ({...prev, otherIncome: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deductions" className="space-y-3 sm:space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5" />
                    Deductions & Credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="iraContributions" className="text-base sm:text-lg">IRA Contributions</Label>
                      <Input
                        id="iraContributions"
                        type="number"
                        value={inputs.iraContributions}
                        onChange={(e) => setInputs(prev => ({...prev, iraContributions: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="realEstateTax" className="text-base sm:text-lg">Real Estate Tax</Label>
                      <Input
                        id="realEstateTax"
                        type="number"
                        value={inputs.realEstateTax}
                        onChange={(e) => setInputs(prev => ({...prev, realEstateTax: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mortgageInterest" className="text-base sm:text-lg">Mortgage Interest</Label>
                      <Input
                        id="mortgageInterest"
                        type="number"
                        value={inputs.mortgageInterest}
                        onChange={(e) => setInputs(prev => ({...prev, mortgageInterest: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="charitableDonations" className="text-base sm:text-lg">Charitable Donations</Label>
                      <Input
                        id="charitableDonations"
                        type="number"
                        value={inputs.charitableDonations}
                        onChange={(e) => setInputs(prev => ({...prev, charitableDonations: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studentLoanInterest" className="text-base sm:text-lg">Student Loan Interest (Max $2,500)</Label>
                      <Input
                        id="studentLoanInterest"
                        type="number"
                        value={inputs.studentLoanInterest}
                        onChange={(e) => setInputs(prev => ({...prev, studentLoanInterest: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="childCareExpense" className="text-base sm:text-lg">Child & Dependent Care</Label>
                      <Input
                        id="childCareExpense"
                        type="number"
                        value={inputs.childCareExpense}
                        onChange={(e) => setInputs(prev => ({...prev, childCareExpense: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base sm:text-lg">Education Expenses</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          value={inputs.educationExpense1}
                          onChange={(e) => setInputs(prev => ({...prev, educationExpense1: e.target.value}))}
                          className="h-8 sm:h-10 text-base sm:text-lg"
                          placeholder="Student 1"
                        />
                        <Input
                          type="number"
                          value={inputs.educationExpense2}
                          onChange={(e) => setInputs(prev => ({...prev, educationExpense2: e.target.value}))}
                          className="h-8 sm:h-10 text-base sm:text-lg"
                          placeholder="Student 2"
                        />
                        <Input
                          type="number"
                          value={inputs.educationExpense3}
                          onChange={(e) => setInputs(prev => ({...prev, educationExpense3: e.target.value}))}
                          className="h-8 sm:h-10 text-base sm:text-lg"
                          placeholder="Student 3"
                        />
                        <Input
                          type="number"
                          value={inputs.educationExpense4}
                          onChange={(e) => setInputs(prev => ({...prev, educationExpense4: e.target.value}))}
                          className="h-8 sm:h-10 text-base sm:text-lg"
                          placeholder="Student 4"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otherDeductibles" className="text-base sm:text-lg">Other Deductibles</Label>
                      <Input
                        id="otherDeductibles"
                        type="number"
                        value={inputs.otherDeductibles}
                        onChange={(e) => setInputs(prev => ({...prev, otherDeductibles: e.target.value}))}
                        className="h-8 sm:h-10 text-base sm:text-lg"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  Tax Calculation Results
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">
                  {result.refundOrOwed >= 0 ? `Estimated Refund: ${formatCurrency(result.refundOrOwed)}` : `Amount Owed: ${formatCurrency(Math.abs(result.refundOrOwed))}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg ${result.refundOrOwed >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-base sm:text-lg font-medium ${result.refundOrOwed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.refundOrOwed >= 0 ? 'Tax Refund' : 'Amount Owed'}
                    </div>
                    <div className={`text-xl sm:text-2xl font-bold ${result.refundOrOwed >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(Math.abs(result.refundOrOwed))}
                    </div>
                    <div className={`text-base ${result.refundOrOwed >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {result.refundOrOwed >= 0 ? 'Expected refund' : 'Additional tax due'}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg">
                    <div className="text-base sm:text-lg text-blue-600 font-medium">Effective Tax Rate</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">
                      {result.effectiveTaxRate.toFixed(1)}%
                    </div>
                    <div className="text-base text-blue-600">
                      Marginal: {result.marginalTaxRate.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                  <h4 className="text-base sm:text-lg font-medium mb-3">Tax Breakdown</h4>
                  <div className="space-y-2 text-base sm:text-lg">
                    <div className="flex justify-between">
                      <span>Total Income:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adjusted Gross Income:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.adjustedGrossIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deductions Used:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.usedDeduction)}</span>
                    </div>
                    <div className="flex justify-between text-base sm:text-lg text-gray-600">
                      <span>  Standard: {formatCurrencyFull(result.standardDeduction)}</span>
                      <span>Itemized: {formatCurrencyFull(result.itemizedDeductions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxable Income:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Federal Tax Before Credits:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.federalTaxOwed + result.totalCredits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Credits:</span>
                      <span className="font-semibold text-green-600">-{formatCurrencyFull(result.totalCredits)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Final Tax Liability:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.federalTaxOwed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Withholdings:</span>
                      <span className="font-semibold">{formatCurrencyFull(result.breakdown.totalWithholdings)}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 font-bold ${result.refundOrOwed >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      <span>{result.refundOrOwed >= 0 ? 'Refund:' : 'Amount Owed:'}</span>
                      <span>{formatCurrencyFull(Math.abs(result.refundOrOwed))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Educational Content Section */}
      <div className="space-y-4 sm:space-y-8">
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Complete Guide to Federal Income Tax Planning
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-sm sm:text-base">
            Master advanced federal income tax strategies, understand complex deduction rules, maximize tax credits, and implement sophisticated planning techniques. 
            This comprehensive guide covers everything from basic tax concepts to advanced optimization strategies used by tax professionals.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Tax Fundamentals Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <FileText className="h-5 w-5" />
                Advanced Tax Fundamentals & Income Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Comprehensive Income Classifications</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Ordinary Income (High Tax Rates):</strong> W-2 wages, salaries, tips, bonuses, commissions, self-employment income, short-term capital gains, interest from bonds and savings accounts, rental income from active participation, unemployment compensation, and taxable retirement distributions</li>
                  <li><strong>Long-Term Capital Gains (Preferential Rates):</strong> Assets held &gt;12 months taxed at 0%, 15%, or 20% based on income levels. Includes stocks, bonds, real estate (excluding primary residence), collectibles, and cryptocurrency held long-term</li>
                  <li><strong>Short-Term Capital Gains:</strong> Assets held ≤12 months taxed as ordinary income. This includes day trading profits, quick real estate flips, and short-term cryptocurrency gains</li>
                  <li><strong>Qualified Dividend Income:</strong> Dividends from U.S. corporations and qualified foreign corporations held for required holding periods (61+ days for common stock, 91+ days for preferred stock) receive capital gains treatment</li>
                  <li><strong>Tax-Exempt Income:</strong> Municipal bond interest (federal tax-free, potentially state tax-free), Roth IRA qualified distributions, life insurance proceeds, gifts and inheritances (with step-up basis), and HSA distributions for qualified medical expenses</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Progressive Tax System Mechanics</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Marginal Tax Rate:</strong> The percentage rate applied to your last dollar of taxable income. This determines the tax impact of additional income or deductions. For 2024, rates are 10%, 12%, 22%, 24%, 32%, 35%, and 37%</li>
                  <li><strong>Effective Tax Rate:</strong> Total tax divided by total income, representing your average tax rate. This is always lower than marginal rate due to progressive brackets and provides a better picture of overall tax burden</li>
                  <li><strong>Tax Bracket Optimization:</strong> Understanding bracket thresholds helps with income timing, Roth conversion strategies, and charitable giving optimization. Small income adjustments near bracket boundaries can yield significant tax savings</li>
                  <li><strong>Alternative Minimum Tax (AMT):</strong> Parallel tax calculation that limits certain deductions. AMT exemption for 2024: $81,300 (single), $126,500 (married filing jointly). Primarily affects high earners with significant state tax deductions or incentive stock options</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Filing Status Selection</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Married Filing Jointly:</strong> Generally optimal for couples with similar incomes or when one spouse has significantly higher income. Provides highest standard deduction ($29,200 in 2024), access to more credits, and favorable bracket thresholds</li>
                  <li><strong>Married Filing Separately:</strong> May be beneficial when spouses have vastly different incomes, significant medical expenses (7.5% AGI threshold), or when one spouse has substantial miscellaneous deductions. Consider impact on credit phase-outs</li>
                  <li><strong>Head of Household:</strong> Requires qualifying dependent and provides higher standard deduction ($21,900 in 2024) plus more favorable tax brackets than single filing. Must pay &gt;50% of household maintenance costs</li>
                  <li><strong>Qualifying Surviving Spouse:</strong> Available for two years after spouse's death if maintaining household for dependent child. Provides married filing jointly rates and standard deduction amounts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Income Recognition Timing Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Constructive Receipt Doctrine:</strong> Income is taxable when available to you, regardless of when actually received. Cash basis taxpayers cannot defer income simply by not cashing checks or accessing accounts</li>
                  <li><strong>Year-End Income Acceleration:</strong> Beneficial in lower-income years or before anticipated rate increases. Consider accelerating bonuses, exercising stock options, or taking retirement distributions when in lower brackets</li>
                  <li><strong>Income Deferral Techniques:</strong> Defer bonuses to following year, utilize deferred compensation plans, implement installment sales for asset dispositions, or contribute to traditional retirement accounts to reduce current-year AGI</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Deductions Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <PiggyBank className="h-5 w-5" />
                Advanced Deduction Strategies & AGI Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Above-the-Line Deductions (Adjustments to Income)</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Traditional IRA Contributions:</strong> Up to $7,000 ($8,000 if 50+) for 2024. Deduction phases out for high earners with workplace plans: $77,000-$87,000 (single), $123,000-$143,000 (married filing jointly). Strategic for reducing AGI and accessing other income-based benefits</li>
                  <li><strong>Student Loan Interest Deduction:</strong> Maximum $2,500 deduction for qualified education loan interest. Phases out between $75,000-$90,000 (single), $155,000-$185,000 (married filing jointly). Includes both principal and interest portions of refinanced loans</li>
                  <li><strong>Health Savings Account (HSA):</strong> Triple tax advantage - deductible contributions, tax-free growth, tax-free qualified withdrawals. 2024 limits: $4,150 (individual), $8,300 (family), plus $1,000 catch-up if 55+. Must be enrolled in qualified high-deductible health plan</li>
                  <li><strong>Self-Employment Tax Deduction:</strong> Deduct 50% of self-employment tax paid (employer-equivalent portion). Applies to Schedule C business income, partnership income, and LLC income taxed as partnership</li>
                  <li><strong>Educator Expense Deduction:</strong> K-12 educators can deduct up to $300 for classroom supplies, books, equipment, and professional development. Both spouses can claim if both are educators ($600 total)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Standard vs. Itemized Deduction Strategy</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>2024 Standard Deduction Amounts:</strong> $14,600 (single), $29,200 (married filing jointly), $14,600 (married filing separately), $21,900 (head of household). Additional $1,550 for each spouse 65+ or blind</li>
                  <li><strong>Key Itemized Deductions:</strong> State and local taxes (SALT) capped at $10,000, mortgage interest on up to $750,000 acquisition debt, charitable contributions (generally up to 60% of AGI), medical expenses exceeding 7.5% of AGI</li>
                  <li><strong>SALT Deduction Optimization:</strong> Consider timing of property tax payments, estimated tax payments, and state income tax withholding. Some states offer workarounds through entity-level taxes for business owners</li>
                  <li><strong>Mortgage Interest Strategy:</strong> Interest on acquisition debt up to $750,000 is deductible. Home equity loan interest deductible only if proceeds used to buy, build, or improve the home securing the loan</li>
                  <li><strong>Medical Expense Planning:</strong> Only expenses exceeding 7.5% of AGI are deductible. Consider timing elective procedures, bunching expenses in single year, or using HSA/FSA for pre-tax benefit</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Advanced Charitable Giving Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Qualified Charitable Distribution (QCD):</strong> Direct transfer from IRA to charity (age 70½+) counts toward required minimum distribution but isn't included in AGI. Maximum $105,000 per year (2024), potentially more tax-efficient than itemizing</li>
                  <li><strong>Donor-Advised Funds:</strong> Contribute appreciated securities for immediate deduction while retaining advisory privileges over grant timing. Avoids capital gains tax and allows for strategic deduction bunching</li>
                  <li><strong>Appreciated Asset Donations:</strong> Donating appreciated stocks, real estate, or other assets provides deduction at fair market value while avoiding capital gains tax. Hold assets &gt;1 year for full fair market value deduction</li>
                  <li><strong>Bunching Strategy:</strong> Alternate between itemizing and standard deduction by timing charitable gifts, property tax payments, and other deductible expenses in alternating years to maximize total deductions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Business Expense Deductions</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Home Office Deduction:</strong> Simplified method: $5 per square foot up to 300 sq ft ($1,500 max). Actual expense method: percentage of home expenses based on office space percentage. Must be used exclusively for business</li>
                  <li><strong>Vehicle Expense Options:</strong> Standard mileage rate ($0.67/mile for 2024) or actual expense method. Keep detailed mileage logs. Can switch methods but restrictions apply if previously claimed depreciation</li>
                  <li><strong>Business Meal Deductions:</strong> Generally 50% deductible for business meals. Temporary 100% deduction for restaurant meals expired. Entertainment expenses are not deductible</li>
                  <li><strong>Equipment and Technology:</strong> Section 179 allows immediate expensing of qualifying business equipment up to $1,220,000 (2024). Bonus depreciation allows 80% first-year depreciation for qualifying property</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tax Credits Card */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <CreditCard className="h-5 w-5" />
                Comprehensive Tax Credits & Advanced Credit Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Family and Dependent Credits</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Child Tax Credit (CTC):</strong> $2,000 per qualifying child under 17. Up to $1,700 refundable (Additional Child Tax Credit). Phases out starting at $200,000 (single), $400,000 (married filing jointly). Child must be U.S. citizen or resident with valid SSN</li>
                  <li><strong>Credit for Other Dependents:</strong> $500 for qualifying dependents who don't qualify for CTC (children 17-18, disabled adult children, elderly parents). Same income phase-out thresholds as CTC</li>
                  <li><strong>Child and Dependent Care Credit:</strong> 20-35% of qualifying expenses up to $3,000 per dependent ($6,000 for 2+ dependents). Credit percentage decreases as AGI increases above $15,000. Care must enable work or active job search</li>
                  <li><strong>Earned Income Tax Credit (EITC):</strong> Refundable credit for lower-income workers. 2024 maximum: $7,430 (3+ children), $6,604 (2 children), $4,213 (1 child), $632 (no children). Strict income and filing requirements</li>
                  <li><strong>Adoption Credit:</strong> Up to $16,810 per child (2024) for qualified adoption expenses. Credit is refundable for special needs adoptions. Phases out for higher-income taxpayers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Education Credits & Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>American Opportunity Tax Credit (AOTC):</strong> Up to $2,500 per eligible student for first 4 years of post-secondary education. 40% refundable ($1,000 max). Covers tuition, fees, and required materials. Phases out: $80,000-$90,000 (single), $160,000-$180,000 (married filing jointly)</li>
                  <li><strong>Lifetime Learning Credit:</strong> Up to $2,000 per tax return (not per student) for any post-secondary education or job skills courses. Non-refundable. No limit on years claimed. Phases out: $59,000-$69,000 (single), $118,000-$138,000 (married filing jointly)</li>
                  <li><strong>Credit Selection Strategy:</strong> Cannot claim both AOTC and LLC for same student in same year. AOTC generally more valuable due to higher credit amount and refundability. Consider income phase-out differences when planning</li>
                  <li><strong>Educational Assistance Programs:</strong> Employer-provided educational assistance up to $5,250 per year is excludable from income. Coordinate with education credits for maximum benefit</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Energy and Environmental Credits</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Residential Clean Energy Credit:</strong> 30% credit for solar electric, solar water heating, geothermal heat pumps, small wind energy, and fuel cells. No lifetime dollar limit. Phases down to 26% (2033), 22% (2034)</li>
                  <li><strong>Energy Efficient Home Improvement Credit:</strong> 30% credit up to $1,200 annually for qualifying home improvements (insulation, windows, doors, HVAC). Separate limits for heat pumps ($2,000), biomass stoves ($1,500), electrical panel upgrades ($600)</li>
                  <li><strong>Electric Vehicle Credits:</strong> Up to $7,500 for new qualified plug-in electric vehicles. Income limits: $300,000 (married filing jointly), $225,000 (head of household), $150,000 (single). Vehicle price caps: $80,000 (vans, SUVs, trucks), $55,000 (other vehicles)</li>
                  <li><strong>Used Electric Vehicle Credit:</strong> Up to $4,000 for qualified used electric vehicles. Income limits: $150,000 (married filing jointly), $112,500 (head of household), $75,000 (single). Vehicle price cap: $25,000</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Retirement and Healthcare Credits</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Retirement Savings Contributions Credit (Saver's Credit):</strong> 10%, 20%, or 50% of retirement contributions up to $2,000 ($4,000 married filing jointly). Available for IRA, 401(k), 403(b), and other qualified plan contributions. Strict income limits apply</li>
                  <li><strong>Premium Tax Credit:</strong> Advance payments available through Health Insurance Marketplace to reduce monthly premiums. Reconciled on tax return based on actual income. Important to report income changes to avoid repayment obligations</li>
                  <li><strong>Health Coverage Tax Credit:</strong> Available for certain displaced workers and pension recipients. Covers 72.5% of qualified health insurance premiums</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Business and Investment Credits</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Small Business Health Care Tax Credit:</strong> Up to 50% of premiums paid for employee health insurance (35% for tax-exempt employers). Available to businesses with &lt;25 full-time equivalent employees and average wages &lt;$68,000 (2024)</li>
                  <li><strong>Work Opportunity Tax Credit:</strong> Up to $9,600 per qualified employee from targeted groups (ex-felons, veterans, SNAP recipients). Generally 25-40% of first-year wages</li>
                  <li><strong>Research and Development Credit:</strong> Credit for increasing research activities. Complex calculation involving current year research expenses compared to base period. Can be substantial for qualifying businesses</li>
                  <li><strong>Foreign Tax Credit:</strong> Prevents double taxation on foreign income. Can claim credit for foreign income taxes paid, subject to limitation based on U.S. tax on foreign income</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tax Strategies Card */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Target className="h-5 w-5" />
                Advanced Tax Optimization & Wealth-Building Strategies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Sophisticated Income and Investment Timing</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Tax-Loss Harvesting:</strong> Systematically realize investment losses to offset gains. Wash sale rule prevents repurchasing same/substantially identical securities within 30 days. Consider tax-loss harvesting in taxable accounts while maintaining asset allocation through retirement accounts</li>
                  <li><strong>Capital Gains Management:</strong> Hold investments &gt;12 months for preferential rates (0%, 15%, 20%). Strategic rebalancing in retirement accounts avoids taxable events. Consider gifting appreciated assets to charity or lower-bracket family members</li>
                  <li><strong>Asset Location Strategy:</strong> Place tax-inefficient investments (REITs, bonds, actively managed funds) in tax-deferred accounts. Keep tax-efficient investments (index funds, individual stocks) in taxable accounts for potential step-up basis</li>
                  <li><strong>Roth Conversion Ladders:</strong> Convert traditional IRA assets to Roth during lower-income years (early retirement, job gaps, business losses). Manage conversion amounts to stay within desired tax brackets. Pay conversion taxes from non-retirement funds when possible</li>
                  <li><strong>Qualified Small Business Stock (QSBS):</strong> Potential 100% exclusion of gain up to $10 million or 10x basis for C corporation stock held &gt;5 years. Must meet stringent requirements including gross assets &lt;$50 million when stock issued</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Advanced Retirement Planning Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Mega Backdoor Roth:</strong> After-tax contributions to 401(k) plans (up to $70,000 total including employer match for 2024) with in-service withdrawals or rollovers to Roth IRA. Requires employer plan allowing after-tax contributions and withdrawals/rollovers</li>
                  <li><strong>Traditional Backdoor Roth:</strong> Non-deductible traditional IRA contribution followed by Roth conversion. Eliminates income limits for Roth IRA access. Watch for pro-rata rule if you have existing traditional IRA balances</li>
                  <li><strong>401(k) Loan Strategies:</strong> Borrow up to 50% of vested balance ($50,000 max) without taxable event. Can be useful for real estate down payments or temporary liquidity needs. Must repay within 5 years (longer for primary residence purchase)</li>
                  <li><strong>Defined Benefit Plans:</strong> For high-income business owners, DB plans allow much larger deductible contributions than 401(k) plans. Annual contribution can exceed $275,000 for older, high-income individuals. Requires actuarial calculations and ongoing administrative costs</li>
                  <li><strong>Cash Balance Plans:</strong> Hybrid defined benefit plan offering predictable benefits with account-style communications. Allows larger contributions than traditional 401(k) while being less volatile than traditional defined benefit plans</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Estate and Gift Tax Integration</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Annual Gift Tax Exclusion:</strong> $18,000 per recipient for 2024 ($36,000 for married couples). Unlimited gifts between U.S. citizen spouses. Gifts to non-citizen spouses limited to $185,000 (2024)</li>
                  <li><strong>Generation-Skipping Transfer Tax:</strong> Additional 40% tax on transfers to grandchildren or non-relatives &gt;37.5 years younger. GST exemption: $13.61 million (2024). Coordinate with gift and estate tax planning</li>
                  <li><strong>Grantor Trust Strategies:</strong> Intentionally defective grantor trusts (IDGTs) allow gift/estate tax benefits while grantor pays income taxes. Can enhance wealth transfer by reducing trust assets through tax payments</li>
                  <li><strong>Charitable Remainder Trusts (CRTs):</strong> Provide income stream while achieving charitable deduction and capital gains deferral. Particularly valuable for highly appreciated, low-basis assets. Remainder must be at least 10% of initial value</li>
                  <li><strong>Qualified Personal Residence Trusts (QPRTs):</strong> Transfer residence to heirs at reduced gift tax value while retaining occupancy rights. Effective when residence is expected to appreciate significantly. Risk of grantor death during term</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Business Tax Optimization</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Section 199A QBI Deduction:</strong> Up to 20% deduction for qualified business income from pass-through entities. Subject to wage/property limitations for high earners. Specified service trades or businesses (SSTBs) face additional restrictions above income thresholds</li>
                  <li><strong>Augusta Rule (Section 280A):</strong> Rent your home to your business for up to 14 days annually without reporting rental income. Business can deduct reasonable rental payments. Useful for business meetings, conferences, or home office space</li>
                  <li><strong>Captive Insurance Companies:</strong> Form insurance subsidiary to insure business risks. Premiums are deductible business expenses while building wealth in insurance company. Complex structure requiring substantial business risks and professional management</li>
                  <li><strong>Opportunity Zone Investments:</strong> Invest capital gains in qualified opportunity zone funds for potential tax benefits: deferred gain recognition, partial gain forgiveness if held 5+ years, and tax-free appreciation if held 10+ years</li>
                  <li><strong>Like-Kind Exchanges (1031 Exchanges):</strong> Defer capital gains on investment real estate by exchanging for similar property. Must identify replacement property within 45 days and complete exchange within 180 days. Professional intermediary required</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">International Tax Considerations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Foreign Earned Income Exclusion:</strong> Exclude up to $126,500 (2024) of foreign earned income if you meet bona fide residence or physical presence tests. Additional housing exclusion available. Must file Form 2555</li>
                  <li><strong>Foreign Bank Account Report (FBAR):</strong> Report foreign financial accounts if aggregate value exceeds $10,000 at any time during year. Filed separately from tax return (FinCEN Form 114). Severe penalties for non-compliance</li>
                  <li><strong>Form 8938 (FATCA):</strong> Report specified foreign financial assets if exceeding threshold amounts. Higher thresholds for foreign residents. Overlaps with FBAR but has different requirements and penalties</li>
                  <li><strong>Passive Foreign Investment Company (PFIC):</strong> Special tax rules for foreign mutual funds and similar investments. Can result in punitive tax treatment. Consider U.S.-domiciled international funds or direct stock holdings instead</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Tips Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Shield className="h-5 w-5" />
              Professional Tax Management & Compliance Excellence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Comprehensive Record Keeping</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• Maintain tax records for minimum 3 years (7 years for substantial underreporting, indefinitely for fraud)</li>
                  <li>• Document business expenses with receipts, invoices, cancelled checks, and detailed logs</li>
                  <li>• Track investment basis using specific identification, FIFO, or average cost methods consistently</li>
                  <li>• Preserve Form 8606 records for nondeductible IRA contributions to avoid double taxation on distributions</li>
                  <li>• Keep employment records including W-2s, 1099s, and documentation of fringe benefits</li>
                  <li>• Maintain charitable contribution documentation: receipts for amounts ≥$250, written acknowledgments for non-cash gifts ≥$500</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Professional Engagement</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• Engage CPA for complex situations: multiple income sources, significant investments, business ownership, international assets</li>
                  <li>• Consider fee-only financial advisors for comprehensive tax-aware investment and retirement planning</li>
                  <li>• Utilize estate planning attorneys for advanced strategies involving trusts, business succession, or substantial assets</li>
                  <li>• Implement tax preparation software with prior-year comparison and audit support for consistency</li>
                  <li>• Schedule quarterly tax planning reviews rather than year-end scrambling for optimization opportunities</li>
                  <li>• Establish relationships with multiple professionals for second opinions on complex transactions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Proactive Tax Planning & Compliance</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• Calculate and remit quarterly estimated payments if expecting to owe ≥$1,000 (use Form 1040-ES)</li>
                  <li>• Monitor safe harbor requirements: 100% of prior year tax (110% if AGI &gt;$150,000) or 90% of current year</li>
                  <li>• Track major life events requiring tax adjustments: marriage, divorce, births, job changes, home purchases</li>
                  <li>• Plan for tax law changes and sunset provisions affecting deductions, credits, and rates</li>
                  <li>• Implement document management systems for efficient retrieval during audits or professional consultations</li>
                  <li>• Consider tax insurance or audit protection services for complex returns or aggressive positions</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Audit Defense and Risk Management</h4>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Audit Triggers:</strong> Excessive deductions relative to income, round numbers, missing forms (1099, K-1), home office claims, large charitable deductions</li>
                  <li>• <strong>Documentation Standards:</strong> Business expenses require receipts, business purpose documentation, and contemporaneous logs for travel and entertainment</li>
                  <li>• <strong>Professional Representation:</strong> Enrolled agents, CPAs, and attorneys can represent taxpayers before IRS. Circular 230 governs practitioner conduct and responsibilities</li>
                </ul>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li>• <strong>Statute of Limitations:</strong> Generally 3 years from filing date, 6 years for substantial underreporting (&gt;25% of gross income), no limit for fraud or failure to file</li>
                  <li>• <strong>Voluntary Disclosure:</strong> Offshore Voluntary Disclosure Program and domestic voluntary corrections can minimize penalties for unreported income</li>
                  <li>• <strong>Appeals Process:</strong> Disagreements can be appealed through IRS Appeals Office before going to Tax Court, District Court, or Court of Federal Claims</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="text-center text-sm sm:text-base text-gray-500 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <p>
            <strong>Important Disclaimer:</strong> This comprehensive income tax calculator and educational content provides estimates for federal income tax purposes only and constitutes general information, not personalized tax advice. 
            Calculations do not include state income taxes, local taxes, alternative minimum tax (AMT), net investment income tax, additional Medicare tax, or other specialized taxes that may apply to your situation. 
            Tax laws are highly complex, subject to frequent changes, and vary significantly based on individual circumstances. Phase-out ranges, income thresholds, and deduction limitations change annually and may affect your specific situation differently than illustrated. 
            This tool should not be relied upon for actual tax filing or major financial decisions. For personalized tax advice, proper planning strategies, and ensure full compliance with current federal, state, and local tax regulations, 
            please consult with qualified tax professionals including CPAs, enrolled agents, or tax attorneys who can analyze your complete financial picture and provide guidance tailored to your specific circumstances.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IncomeTaxCalculatorComponent;
