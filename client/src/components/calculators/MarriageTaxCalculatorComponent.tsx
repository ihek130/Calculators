import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Heart, TrendingUp, AlertCircle, Users, Calculator } from 'lucide-react';

const MarriageTaxCalculatorComponent = () => {
  // Spouse 1 State
  const [spouse1Salary, setSpouse1Salary] = useState('65000');
  const [spouse1Interest, setSpouse1Interest] = useState('0');
  const [spouse1Rental, setSpouse1Rental] = useState('0');
  const [spouse1ShortTermGain, setSpouse1ShortTermGain] = useState('0');
  const [spouse1LongTermGain, setSpouse1LongTermGain] = useState('0');
  const [spouse1QualifiedDividends, setSpouse1QualifiedDividends] = useState('0');
  const [spouse1Retirement, setSpouse1Retirement] = useState('10000');
  const [spouse1FileStatus, setSpouse1FileStatus] = useState('single');
  const [spouse1Dependents, setSpouse1Dependents] = useState('0');
  const [spouse1MortgageInterest, setSpouse1MortgageInterest] = useState('0');
  const [spouse1Charitable, setSpouse1Charitable] = useState('0');
  const [spouse1StudentLoan, setSpouse1StudentLoan] = useState('0');
  const [spouse1ChildCare, setSpouse1ChildCare] = useState('0');
  const [spouse1Education, setSpouse1Education] = useState('0');
  const [spouse1UseStandard, setSpouse1UseStandard] = useState(true);
  const [spouse1TaxRate, setSpouse1TaxRate] = useState('5');
  const [spouse1SelfEmployed, setSpouse1SelfEmployed] = useState(false);

  // Spouse 2 State
  const [spouse2Salary, setSpouse2Salary] = useState('45000');
  const [spouse2Interest, setSpouse2Interest] = useState('0');
  const [spouse2Rental, setSpouse2Rental] = useState('0');
  const [spouse2ShortTermGain, setSpouse2ShortTermGain] = useState('0');
  const [spouse2LongTermGain, setSpouse2LongTermGain] = useState('0');
  const [spouse2QualifiedDividends, setSpouse2QualifiedDividends] = useState('0');
  const [spouse2Retirement, setSpouse2Retirement] = useState('6000');
  const [spouse2FileStatus, setSpouse2FileStatus] = useState('single');
  const [spouse2Dependents, setSpouse2Dependents] = useState('0');
  const [spouse2MortgageInterest, setSpouse2MortgageInterest] = useState('0');
  const [spouse2Charitable, setSpouse2Charitable] = useState('0');
  const [spouse2StudentLoan, setSpouse2StudentLoan] = useState('0');
  const [spouse2ChildCare, setSpouse2ChildCare] = useState('0');
  const [spouse2Education, setSpouse2Education] = useState('0');
  const [spouse2UseStandard, setSpouse2UseStandard] = useState(true);
  const [spouse2TaxRate, setSpouse2TaxRate] = useState('5');
  const [spouse2SelfEmployed, setSpouse2SelfEmployed] = useState(false);

  // 2025 Federal Tax Brackets
  const taxBrackets2025 = {
    single: [
      { min: 0, max: 11600, rate: 0.10 },
      { min: 11600, max: 47150, rate: 0.12 },
      { min: 47150, max: 100525, rate: 0.22 },
      { min: 100525, max: 191950, rate: 0.24 },
      { min: 191950, max: 243725, rate: 0.32 },
      { min: 243725, max: 609350, rate: 0.35 },
      { min: 609350, max: Infinity, rate: 0.37 }
    ],
    married: [
      { min: 0, max: 23200, rate: 0.10 },
      { min: 23200, max: 94300, rate: 0.12 },
      { min: 94300, max: 201050, rate: 0.22 },
      { min: 201050, max: 383900, rate: 0.24 },
      { min: 383900, max: 487450, rate: 0.32 },
      { min: 487450, max: 731200, rate: 0.35 },
      { min: 731200, max: Infinity, rate: 0.37 }
    ]
  };

  const standardDeduction2025 = {
    single: 14600,
    married: 29200
  };

  const calculateTax = (taxableIncome: number, status: 'single' | 'married') => {
    const brackets = taxBrackets2025[status];
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max - bracket.min
      );
      
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return tax;
  };

  const calculateIndividualTax = (
    salary: number,
    interest: number,
    rental: number,
    shortTermGain: number,
    longTermGain: number,
    qualifiedDividends: number,
    retirement: number,
    fileStatus: string,
    dependents: number,
    mortgageInterest: number,
    charitable: number,
    studentLoan: number,
    childCare: number,
    education: number,
    useStandard: boolean,
    taxRate: number,
    selfEmployed: boolean
  ) => {
    // Calculate gross income
    const ordinaryIncome = salary + interest + rental + shortTermGain;
    
    // Self-employment tax (if applicable)
    const selfEmploymentTax = selfEmployed ? salary * 0.153 : 0;
    const selfEmploymentDeduction = selfEmployed ? selfEmploymentTax / 2 : 0;

    // Adjusted Gross Income (AGI)
    let agi = ordinaryIncome - retirement - selfEmploymentDeduction - Math.min(studentLoan, 2500);

    // Standard or itemized deductions
    const itemizedDeductions = mortgageInterest + charitable + Math.min(childCare, 3000) + Math.min(education, 4000);
    const standardDed = fileStatus === 'single' ? standardDeduction2025.single : standardDeduction2025.married;
    const deduction = useStandard ? standardDed : Math.max(itemizedDeductions, standardDed);

    // Taxable income
    const taxableIncome = Math.max(0, agi - deduction);

    // Calculate federal tax on ordinary income
    const federalTax = calculateTax(taxableIncome, fileStatus === 'single' ? 'single' : 'married');

    // Long-term capital gains tax (preferential rates: 0%, 15%, 20%)
    let ltcgTax = 0;
    if (longTermGain > 0 || qualifiedDividends > 0) {
      const totalLTCG = longTermGain + qualifiedDividends;
      if (fileStatus === 'single') {
        if (taxableIncome + totalLTCG <= 47025) {
          ltcgTax = 0; // 0% rate
        } else if (taxableIncome + totalLTCG <= 518900) {
          ltcgTax = totalLTCG * 0.15; // 15% rate
        } else {
          ltcgTax = totalLTCG * 0.20; // 20% rate
        }
      } else { // married
        if (taxableIncome + totalLTCG <= 94050) {
          ltcgTax = 0; // 0% rate
        } else if (taxableIncome + totalLTCG <= 583750) {
          ltcgTax = totalLTCG * 0.15; // 15% rate
        } else {
          ltcgTax = totalLTCG * 0.20; // 20% rate
        }
      }
    }

    // State and local taxes
    const stateTax = taxableIncome * (taxRate / 100);

    // Total tax
    const totalTax = federalTax + ltcgTax + stateTax + selfEmploymentTax;

    return {
      grossIncome: ordinaryIncome + longTermGain + qualifiedDividends,
      agi,
      deduction,
      taxableIncome,
      federalTax,
      ltcgTax,
      stateTax,
      selfEmploymentTax,
      totalTax,
      effectiveRate: ordinaryIncome > 0 ? (totalTax / (ordinaryIncome + longTermGain + qualifiedDividends)) * 100 : 0
    };
  };

  const calculateMarriedTax = () => {
    // Combined income
    const combinedSalary = parseFloat(spouse1Salary || '0') + parseFloat(spouse2Salary || '0');
    const combinedInterest = parseFloat(spouse1Interest || '0') + parseFloat(spouse2Interest || '0');
    const combinedRental = parseFloat(spouse1Rental || '0') + parseFloat(spouse2Rental || '0');
    const combinedShortTerm = parseFloat(spouse1ShortTermGain || '0') + parseFloat(spouse2ShortTermGain || '0');
    const combinedLongTerm = parseFloat(spouse1LongTermGain || '0') + parseFloat(spouse2LongTermGain || '0');
    const combinedQualified = parseFloat(spouse1QualifiedDividends || '0') + parseFloat(spouse2QualifiedDividends || '0');
    const combinedRetirement = parseFloat(spouse1Retirement || '0') + parseFloat(spouse2Retirement || '0');
    const combinedDependents = parseFloat(spouse1Dependents || '0') + parseFloat(spouse2Dependents || '0');
    
    // Combined deductions
    const combinedMortgage = parseFloat(spouse1MortgageInterest || '0') + parseFloat(spouse2MortgageInterest || '0');
    const combinedCharitable = parseFloat(spouse1Charitable || '0') + parseFloat(spouse2Charitable || '0');
    const combinedStudentLoan = Math.min(parseFloat(spouse1StudentLoan || '0') + parseFloat(spouse2StudentLoan || '0'), 2500);
    const combinedChildCare = Math.min(parseFloat(spouse1ChildCare || '0') + parseFloat(spouse2ChildCare || '0'), 3000);
    const combinedEducation = Math.min(parseFloat(spouse1Education || '0') + parseFloat(spouse2Education || '0'), 4000);
    const useStandard = spouse1UseStandard || spouse2UseStandard;
    const avgTaxRate = (parseFloat(spouse1TaxRate || '0') + parseFloat(spouse2TaxRate || '0')) / 2;
    const eitherSelfEmployed = spouse1SelfEmployed || spouse2SelfEmployed;

    const ordinaryIncome = combinedSalary + combinedInterest + combinedRental + combinedShortTerm;
    
    // Self-employment tax
    const selfEmploymentTax = eitherSelfEmployed ? combinedSalary * 0.153 : 0;
    const selfEmploymentDeduction = eitherSelfEmployed ? selfEmploymentTax / 2 : 0;

    // AGI
    let agi = ordinaryIncome - combinedRetirement - selfEmploymentDeduction - combinedStudentLoan;

    // Deductions
    const itemizedDeductions = combinedMortgage + combinedCharitable + combinedChildCare + combinedEducation;
    const standardDed = standardDeduction2025.married;
    const deduction = useStandard ? standardDed : Math.max(itemizedDeductions, standardDed);

    // Taxable income
    const taxableIncome = Math.max(0, agi - deduction);

    // Federal tax
    const federalTax = calculateTax(taxableIncome, 'married');

    // LTCG tax
    let ltcgTax = 0;
    if (combinedLongTerm > 0 || combinedQualified > 0) {
      const totalLTCG = combinedLongTerm + combinedQualified;
      if (taxableIncome + totalLTCG <= 94050) {
        ltcgTax = 0;
      } else if (taxableIncome + totalLTCG <= 583750) {
        ltcgTax = totalLTCG * 0.15;
      } else {
        ltcgTax = totalLTCG * 0.20;
      }
    }

    // State tax
    const stateTax = taxableIncome * (avgTaxRate / 100);

    // Total
    const totalTax = federalTax + ltcgTax + stateTax + selfEmploymentTax;

    return {
      grossIncome: ordinaryIncome + combinedLongTerm + combinedQualified,
      agi,
      deduction,
      taxableIncome,
      federalTax,
      ltcgTax,
      stateTax,
      selfEmploymentTax,
      totalTax,
      effectiveRate: ordinaryIncome > 0 ? (totalTax / (ordinaryIncome + combinedLongTerm + combinedQualified)) * 100 : 0
    };
  };

  // Auto-calculate results whenever inputs change (with useMemo for performance and reactivity)
  const spouse1Results = useMemo(() => calculateIndividualTax(
    parseFloat(spouse1Salary || '0'),
    parseFloat(spouse1Interest || '0'),
    parseFloat(spouse1Rental || '0'),
    parseFloat(spouse1ShortTermGain || '0'),
    parseFloat(spouse1LongTermGain || '0'),
    parseFloat(spouse1QualifiedDividends || '0'),
    parseFloat(spouse1Retirement || '0'),
    spouse1FileStatus,
    parseFloat(spouse1Dependents || '0'),
    parseFloat(spouse1MortgageInterest || '0'),
    parseFloat(spouse1Charitable || '0'),
    parseFloat(spouse1StudentLoan || '0'),
    parseFloat(spouse1ChildCare || '0'),
    parseFloat(spouse1Education || '0'),
    spouse1UseStandard,
    parseFloat(spouse1TaxRate || '0'),
    spouse1SelfEmployed
  ), [
    spouse1Salary,
    spouse1Interest,
    spouse1Rental,
    spouse1ShortTermGain,
    spouse1LongTermGain,
    spouse1QualifiedDividends,
    spouse1Retirement,
    spouse1FileStatus,
    spouse1Dependents,
    spouse1MortgageInterest,
    spouse1Charitable,
    spouse1StudentLoan,
    spouse1ChildCare,
    spouse1Education,
    spouse1UseStandard,
    spouse1TaxRate,
    spouse1SelfEmployed
  ]);

  const spouse2Results = useMemo(() => calculateIndividualTax(
    parseFloat(spouse2Salary || '0'),
    parseFloat(spouse2Interest || '0'),
    parseFloat(spouse2Rental || '0'),
    parseFloat(spouse2ShortTermGain || '0'),
    parseFloat(spouse2LongTermGain || '0'),
    parseFloat(spouse2QualifiedDividends || '0'),
    parseFloat(spouse2Retirement || '0'),
    spouse2FileStatus,
    parseFloat(spouse2Dependents || '0'),
    parseFloat(spouse2MortgageInterest || '0'),
    parseFloat(spouse2Charitable || '0'),
    parseFloat(spouse2StudentLoan || '0'),
    parseFloat(spouse2ChildCare || '0'),
    parseFloat(spouse2Education || '0'),
    spouse2UseStandard,
    parseFloat(spouse2TaxRate || '0'),
    spouse2SelfEmployed
  ), [
    spouse2Salary,
    spouse2Interest,
    spouse2Rental,
    spouse2ShortTermGain,
    spouse2LongTermGain,
    spouse2QualifiedDividends,
    spouse2Retirement,
    spouse2FileStatus,
    spouse2Dependents,
    spouse2MortgageInterest,
    spouse2Charitable,
    spouse2StudentLoan,
    spouse2ChildCare,
    spouse2Education,
    spouse2UseStandard,
    spouse2TaxRate,
    spouse2SelfEmployed
  ]);

  const marriedResults = useMemo(() => calculateMarriedTax(), [
    spouse1Salary,
    spouse1Interest,
    spouse1Rental,
    spouse1ShortTermGain,
    spouse1LongTermGain,
    spouse1QualifiedDividends,
    spouse1Retirement,
    spouse1Dependents,
    spouse1MortgageInterest,
    spouse1Charitable,
    spouse1StudentLoan,
    spouse1ChildCare,
    spouse1Education,
    spouse1UseStandard,
    spouse1TaxRate,
    spouse1SelfEmployed,
    spouse2Salary,
    spouse2Interest,
    spouse2Rental,
    spouse2ShortTermGain,
    spouse2LongTermGain,
    spouse2QualifiedDividends,
    spouse2Retirement,
    spouse2Dependents,
    spouse2MortgageInterest,
    spouse2Charitable,
    spouse2StudentLoan,
    spouse2ChildCare,
    spouse2Education,
    spouse2UseStandard,
    spouse2TaxRate,
    spouse2SelfEmployed
  ]);

  const totalSingleTax = spouse1Results.totalTax + spouse2Results.totalTax;
  const marriagePenalty = marriedResults.totalTax - totalSingleTax;
  const isBonus = marriagePenalty < 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Heart className="w-10 h-10 text-pink-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Marriage Tax Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Marriage has significant financial implications for the individuals involved, including its impact on taxation. 
          This calculator helps estimate the financial impact of filing a joint tax return as a married couple (as opposed to filing separately as singles) 
          based on 2025 federal income tax brackets and data specific to the United States.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Tax Filing Status Note:</strong> For tax purposes, whether a person is classified as married is based on the last day of the tax year. 
            This means a person married on the last day of the tax year is considered married for the entire year. Similarly, a person that is divorced 
            would be considered unmarried for the entire tax year.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card className="shadow-xl border-2 border-gray-200">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 border-b-2 border-gray-200">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-gray-900">
            <Calculator className="w-6 h-6" />
            Enter Income & Deduction Information
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter financial information for both spouses to calculate tax implications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Column Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 text-center">Spouse 1</h3>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg border-2 border-pink-300">
              <h3 className="text-lg sm:text-xl font-bold text-pink-900 text-center">Spouse 2</h3>
            </div>
          </div>

          {/* Income Section */}
          <div className="space-y-4">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 border-b-2 pb-2">Income Information</h4>
            
            {/* Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-salary" className="text-xs sm:text-sm font-medium">
                  Salary + Business Income
                </Label>
                <Input
                  id="spouse1-salary"
                  type="number"
                  value={spouse1Salary}
                  onChange={(e) => setSpouse1Salary(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="65000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-salary" className="text-xs sm:text-sm font-medium">
                  Salary + Business Income
                </Label>
                <Input
                  id="spouse2-salary"
                  type="number"
                  value={spouse2Salary}
                  onChange={(e) => setSpouse2Salary(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="45000"
                />
              </div>
            </div>

            {/* Interest + Dividends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-interest" className="text-xs sm:text-sm font-medium">
                  Interest + Dividends Income
                </Label>
                <Input
                  id="spouse1-interest"
                  type="number"
                  value={spouse1Interest}
                  onChange={(e) => setSpouse1Interest(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-interest" className="text-xs sm:text-sm font-medium">
                  Interest + Dividends Income
                </Label>
                <Input
                  id="spouse2-interest"
                  type="number"
                  value={spouse2Interest}
                  onChange={(e) => setSpouse2Interest(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Rental Income */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-rental" className="text-xs sm:text-sm font-medium">
                  Rental, Royalty, Passive Income
                </Label>
                <Input
                  id="spouse1-rental"
                  type="number"
                  value={spouse1Rental}
                  onChange={(e) => setSpouse1Rental(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-rental" className="text-xs sm:text-sm font-medium">
                  Rental, Royalty, Passive Income
                </Label>
                <Input
                  id="spouse2-rental"
                  type="number"
                  value={spouse2Rental}
                  onChange={(e) => setSpouse2Rental(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Short Term Capital Gain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-shortterm" className="text-xs sm:text-sm font-medium">
                  Short Term Capital Gain
                </Label>
                <Input
                  id="spouse1-shortterm"
                  type="number"
                  value={spouse1ShortTermGain}
                  onChange={(e) => setSpouse1ShortTermGain(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-shortterm" className="text-xs sm:text-sm font-medium">
                  Short Term Capital Gain
                </Label>
                <Input
                  id="spouse2-shortterm"
                  type="number"
                  value={spouse2ShortTermGain}
                  onChange={(e) => setSpouse2ShortTermGain(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Long Term Capital Gain */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-longterm" className="text-xs sm:text-sm font-medium">
                  Long Term Capital Gain
                </Label>
                <Input
                  id="spouse1-longterm"
                  type="number"
                  value={spouse1LongTermGain}
                  onChange={(e) => setSpouse1LongTermGain(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-longterm" className="text-xs sm:text-sm font-medium">
                  Long Term Capital Gain
                </Label>
                <Input
                  id="spouse2-longterm"
                  type="number"
                  value={spouse2LongTermGain}
                  onChange={(e) => setSpouse2LongTermGain(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Qualified Dividends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-qualified" className="text-xs sm:text-sm font-medium">
                  Qualified Dividends
                </Label>
                <Input
                  id="spouse1-qualified"
                  type="number"
                  value={spouse1QualifiedDividends}
                  onChange={(e) => setSpouse1QualifiedDividends(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-qualified" className="text-xs sm:text-sm font-medium">
                  Qualified Dividends
                </Label>
                <Input
                  id="spouse2-qualified"
                  type="number"
                  value={spouse2QualifiedDividends}
                  onChange={(e) => setSpouse2QualifiedDividends(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 401K/IRA Savings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-retirement" className="text-xs sm:text-sm font-medium">
                  401K, IRA... Savings
                </Label>
                <Input
                  id="spouse1-retirement"
                  type="number"
                  value={spouse1Retirement}
                  onChange={(e) => setSpouse1Retirement(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-retirement" className="text-xs sm:text-sm font-medium">
                  401K, IRA... Savings
                </Label>
                <Input
                  id="spouse2-retirement"
                  type="number"
                  value={spouse2Retirement}
                  onChange={(e) => setSpouse2Retirement(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="6000"
                />
              </div>
            </div>

            {/* File Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-status" className="text-xs sm:text-sm font-medium">
                  File Status (Before Marriage)
                </Label>
                <Select value={spouse1FileStatus} onValueChange={setSpouse1FileStatus}>
                  <SelectTrigger id="spouse1-status" className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="head">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-status" className="text-xs sm:text-sm font-medium">
                  File Status (Before Marriage)
                </Label>
                <Select value={spouse2FileStatus} onValueChange={setSpouse2FileStatus}>
                  <SelectTrigger id="spouse2-status" className="text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="head">Head of Household</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Number of Dependents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-dependents" className="text-xs sm:text-sm font-medium">
                  No. of Dependents
                </Label>
                <Input
                  id="spouse1-dependents"
                  type="number"
                  value={spouse1Dependents}
                  onChange={(e) => setSpouse1Dependents(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-dependents" className="text-xs sm:text-sm font-medium">
                  No. of Dependents
                </Label>
                <Input
                  id="spouse2-dependents"
                  type="number"
                  value={spouse2Dependents}
                  onChange={(e) => setSpouse2Dependents(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="space-y-4 pt-6 border-t-2">
            <h4 className="text-base sm:text-lg font-bold text-gray-900">Deductions</h4>
            
            {/* Mortgage Interest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-mortgage" className="text-xs sm:text-sm font-medium">
                  Mortgage Interest
                </Label>
                <Input
                  id="spouse1-mortgage"
                  type="number"
                  value={spouse1MortgageInterest}
                  onChange={(e) => setSpouse1MortgageInterest(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-mortgage" className="text-xs sm:text-sm font-medium">
                  Mortgage Interest
                </Label>
                <Input
                  id="spouse2-mortgage"
                  type="number"
                  value={spouse2MortgageInterest}
                  onChange={(e) => setSpouse2MortgageInterest(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Charitable Donations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-charitable" className="text-xs sm:text-sm font-medium">
                  Charitable Donations
                </Label>
                <Input
                  id="spouse1-charitable"
                  type="number"
                  value={spouse1Charitable}
                  onChange={(e) => setSpouse1Charitable(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-charitable" className="text-xs sm:text-sm font-medium">
                  Charitable Donations
                </Label>
                <Input
                  id="spouse2-charitable"
                  type="number"
                  value={spouse2Charitable}
                  onChange={(e) => setSpouse2Charitable(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Student Loan Interest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-student" className="text-xs sm:text-sm font-medium">
                  Student Loan Interest ($2,500 Max)
                </Label>
                <Input
                  id="spouse1-student"
                  type="number"
                  value={spouse1StudentLoan}
                  onChange={(e) => setSpouse1StudentLoan(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="2500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-student" className="text-xs sm:text-sm font-medium">
                  Student Loan Interest ($2,500 Max)
                </Label>
                <Input
                  id="spouse2-student"
                  type="number"
                  value={spouse2StudentLoan}
                  onChange={(e) => setSpouse2StudentLoan(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="2500"
                />
              </div>
            </div>

            {/* Child Care Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-childcare" className="text-xs sm:text-sm font-medium">
                  Child Care Expenses ($3,000 Max)
                </Label>
                <Input
                  id="spouse1-childcare"
                  type="number"
                  value={spouse1ChildCare}
                  onChange={(e) => setSpouse1ChildCare(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-childcare" className="text-xs sm:text-sm font-medium">
                  Child Care Expenses ($3,000 Max)
                </Label>
                <Input
                  id="spouse2-childcare"
                  type="number"
                  value={spouse2ChildCare}
                  onChange={(e) => setSpouse2ChildCare(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="3000"
                />
              </div>
            </div>

            {/* Education Tuition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-education" className="text-xs sm:text-sm font-medium">
                  Education Tuition ($4,000 Max)
                </Label>
                <Input
                  id="spouse1-education"
                  type="number"
                  value={spouse1Education}
                  onChange={(e) => setSpouse1Education(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="4000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-education" className="text-xs sm:text-sm font-medium">
                  Education Tuition ($4,000 Max)
                </Label>
                <Input
                  id="spouse2-education"
                  type="number"
                  value={spouse2Education}
                  onChange={(e) => setSpouse2Education(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                  max="4000"
                />
              </div>
            </div>

            {/* Use Standard Deduction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <Checkbox
                  id="spouse1-standard"
                  checked={spouse1UseStandard}
                  onCheckedChange={(checked) => setSpouse1UseStandard(checked as boolean)}
                />
                <Label htmlFor="spouse1-standard" className="text-xs sm:text-sm font-medium cursor-pointer">
                  Use Standard Deduction?
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <Checkbox
                  id="spouse2-standard"
                  checked={spouse2UseStandard}
                  onCheckedChange={(checked) => setSpouse2UseStandard(checked as boolean)}
                />
                <Label htmlFor="spouse2-standard" className="text-xs sm:text-sm font-medium cursor-pointer">
                  Use Standard Deduction?
                </Label>
              </div>
            </div>

            {/* State + City Tax Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="spouse1-taxrate" className="text-xs sm:text-sm font-medium">
                  State + City Tax Rate (%)
                </Label>
                <Input
                  id="spouse1-taxrate"
                  type="number"
                  value={spouse1TaxRate}
                  onChange={(e) => setSpouse1TaxRate(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="5"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spouse2-taxrate" className="text-xs sm:text-sm font-medium">
                  State + City Tax Rate (%)
                </Label>
                <Input
                  id="spouse2-taxrate"
                  type="number"
                  value={spouse2TaxRate}
                  onChange={(e) => setSpouse2TaxRate(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="5"
                  step="0.1"
                />
              </div>
            </div>

            {/* Self-Employed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <Checkbox
                  id="spouse1-selfemployed"
                  checked={spouse1SelfEmployed}
                  onCheckedChange={(checked) => setSpouse1SelfEmployed(checked as boolean)}
                />
                <Label htmlFor="spouse1-selfemployed" className="text-xs sm:text-sm font-medium cursor-pointer">
                  Self-Employed
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
                <Checkbox
                  id="spouse2-selfemployed"
                  checked={spouse2SelfEmployed}
                  onCheckedChange={(checked) => setSpouse2SelfEmployed(checked as boolean)}
                />
                <Label htmlFor="spouse2-selfemployed" className="text-xs sm:text-sm font-medium cursor-pointer">
                  Self-Employed
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {spouse1Results && spouse2Results && marriedResults && (
        <div className="space-y-6">
          {/* Marriage Penalty/Bonus Banner */}
          <Card className={`border-2 ${isBonus ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} shadow-xl`}>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isBonus ? '🎉 Marriage Bonus' : '⚠️ Marriage Penalty'}
                </h3>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                  <span className={isBonus ? 'text-green-700' : 'text-red-700'}>
                    {isBonus ? '-' : '+'}{Math.abs(marriagePenalty).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-700">
                  {isBonus 
                    ? 'You will SAVE this much by filing jointly as a married couple!' 
                    : 'You will PAY this much more by filing jointly as a married couple.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Spouse 1 Filing Single */}
            <Card className="border-2 border-blue-300 shadow-lg">
              <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
                <CardTitle className="text-center text-blue-900">Spouse 1 (Filing Single)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Gross Income:</span>
                    <span className="font-bold">${spouse1Results.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">AGI:</span>
                    <span className="font-bold">${spouse1Results.agi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Deduction:</span>
                    <span className="font-bold">${spouse1Results.deduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="font-bold">${spouse1Results.taxableIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-100 rounded border-t-2 border-blue-300 mt-3">
                    <span className="font-bold text-blue-900">Total Tax:</span>
                    <span className="font-bold text-blue-900">${spouse1Results.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-blue-50 rounded">
                    <span className="text-gray-600">Effective Rate:</span>
                    <span className="font-bold">{spouse1Results.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spouse 2 Filing Single */}
            <Card className="border-2 border-pink-300 shadow-lg">
              <CardHeader className="bg-pink-50 border-b-2 border-pink-200">
                <CardTitle className="text-center text-pink-900">Spouse 2 (Filing Single)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Gross Income:</span>
                    <span className="font-bold">${spouse2Results.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">AGI:</span>
                    <span className="font-bold">${spouse2Results.agi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Deduction:</span>
                    <span className="font-bold">${spouse2Results.deduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="font-bold">${spouse2Results.taxableIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-pink-100 rounded border-t-2 border-pink-300 mt-3">
                    <span className="font-bold text-pink-900">Total Tax:</span>
                    <span className="font-bold text-pink-900">${spouse2Results.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-pink-50 rounded">
                    <span className="text-gray-600">Effective Rate:</span>
                    <span className="font-bold">{spouse2Results.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filing Jointly as Married */}
            <Card className="border-2 border-purple-300 shadow-lg">
              <CardHeader className="bg-purple-50 border-b-2 border-purple-200">
                <CardTitle className="text-center text-purple-900">Filing Jointly (Married)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Gross Income:</span>
                    <span className="font-bold">${marriedResults.grossIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">AGI:</span>
                    <span className="font-bold">${marriedResults.agi.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Deduction:</span>
                    <span className="font-bold">${marriedResults.deduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600">Taxable Income:</span>
                    <span className="font-bold">${marriedResults.taxableIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-purple-100 rounded border-t-2 border-purple-300 mt-3">
                    <span className="font-bold text-purple-900">Total Tax:</span>
                    <span className="font-bold text-purple-900">${marriedResults.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-purple-50 rounded">
                    <span className="text-gray-600">Effective Rate:</span>
                    <span className="font-bold">{marriedResults.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Comparison */}
          <Card className="border-2 border-gray-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
              <CardTitle className="text-center text-gray-900">Tax Comparison Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-300 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Tax If Filing Separately</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">
                    ${totalSingleTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-300 text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Tax If Filing Jointly</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">
                    ${marriedResults.totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className={`p-4 rounded-lg border-2 text-center ${isBonus ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Difference</p>
                  <p className={`text-xl sm:text-2xl font-bold ${isBonus ? 'text-green-700' : 'text-red-700'}`}>
                    {isBonus ? '-' : '+'}{Math.abs(marriagePenalty).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ({((Math.abs(marriagePenalty) / totalSingleTax) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Educational Content - Will add in next message */}
      
      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
          Understanding Marriage & Taxes: Complete Guide
        </h2>

        {/* Benefits of Filing Jointly */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg sm:text-xl">
              <Heart className="w-5 h-5" />
              Benefits of Filing Jointly as Married Spouses
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Spouses usually choose to file their taxes jointly once married. Filing jointly combines both spouses' income, deductions, and credits on one tax return. 
              The IRS typically treats married couples more favorably when they file jointly compared to filing separately or as single individuals.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-3">💰 Access to More Tax Benefits</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  Single filers miss out on certain tax benefits that become available when filing jointly:
                </p>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>• <strong>Earned Income Tax Credit (EITC):</strong> Up to $7,830 for married couples with 3+ children (2025)</li>
                  <li>• <strong>Education Tax Credits:</strong> American Opportunity Credit ($2,500/year) and Lifetime Learning Credit ($2,000/year)</li>
                  <li>• <strong>Student Loan Interest Deduction:</strong> Up to $2,500 in deductible interest</li>
                  <li>• <strong>Tuition and Fees Deduction:</strong> Up to $4,000 in qualified education expenses</li>
                  <li>• <strong>Child and Dependent Care Credit:</strong> Up to $3,000 for one dependent or $6,000 for two+</li>
                  <li>• <strong>Credit for the Elderly and Disabled:</strong> $3,750-$7,500 depending on circumstances</li>
                  <li>• <strong>Adoption Credit:</strong> Up to $15,950 per child (2025)</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-sm sm:text-base text-green-900 mb-3">📊 Lower Tax Bracket Benefits</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  Filing jointly is usually better when the income disparity between spouses is high:
                </p>
                <div className="bg-white p-3 rounded border border-green-200 text-xs sm:text-sm">
                  <p className="font-bold text-green-900 mb-2">Example: Single-Income Household</p>
                  <div className="space-y-1">
                    <p>• Spouse 1: $120,000 salary</p>
                    <p>• Spouse 2: $0 (stay-at-home parent)</p>
                    <p className="pt-2 border-t mt-2 font-bold text-red-700">Filing Separately:</p>
                    <p>Spouse 1 pays ~$22,000 in federal tax (24% bracket)</p>
                    <p className="pt-2 border-t mt-2 font-bold text-green-700">Filing Jointly:</p>
                    <p>Couple pays ~$16,000 in federal tax (12-22% brackets)</p>
                    <p className="pt-2 font-bold bg-green-100 p-2 rounded mt-2">Savings: $6,000/year!</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-2">
                  The married filing jointly brackets are approximately double the single brackets, which means 
                  the higher-earning spouse's income gets "averaged" with the lower-earning spouse's income, 
                  resulting in a lower overall tax rate.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-3">🏦 Spousal IRA Contribution</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                Contributors must have earned income in order to contribute to traditional or Roth IRAs. However, filing jointly 
                allows for a <strong>spousal IRA</strong>, which authorizes a non-working or stay-at-home spouse to contribute to 
                retirement even though they didn't earn income during the year.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-xs text-purple-900 mb-1">2025 Contribution Limits:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• <strong>Under age 50:</strong> $7,000 per spouse ($14,000 total)</li>
                    <li>• <strong>Age 50+:</strong> $8,000 per spouse ($16,000 total)</li>
                    <li>• Working spouse's income must cover both contributions</li>
                    <li>• Each spouse needs their own IRA account</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-xs text-purple-900 mb-1">Long-Term Impact:</p>
                  <p className="text-xs text-gray-700">
                    Contributing $14,000/year to spousal IRAs for 30 years at 7% average return = <strong>$1.4 million</strong> in retirement savings. 
                    This benefit alone can justify filing jointly for single-income households.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
              <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-3">🏠 Estate Tax Protection</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                Marriage can help wealthy spouses protect their assets should they die. Federal tax law allows assets to be 
                transferred to a widow or widower without being subject to the federal estate tax through the <strong>unlimited 
                marital deduction</strong>.
              </p>
              <div className="bg-white p-3 rounded border border-orange-200 text-xs sm:text-sm">
                <ul className="space-y-1">
                  <li>• <strong>2025 Estate Tax Exemption:</strong> $13.99 million per person ($27.98 million per married couple)</li>
                  <li>• <strong>Portability:</strong> Surviving spouse can use deceased spouse's unused exemption (total $27.98M)</li>
                  <li>• <strong>Unlimited Marital Deduction:</strong> Transfer unlimited assets to spouse tax-free upon death</li>
                  <li>• <strong>Step-Up in Basis:</strong> Inherited assets get "stepped up" to current market value, avoiding capital gains tax</li>
                </ul>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
              <h4 className="font-bold text-sm sm:text-base text-cyan-900 mb-3">📈 Higher Income Thresholds</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                Many tax benefits and deductions phase out at higher income levels. Married couples filing jointly generally have 
                higher phase-out thresholds than single filers:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2 rounded border border-cyan-200">
                  <p className="font-bold text-cyan-900">Roth IRA Contribution Phase-Out:</p>
                  <p className="text-gray-700">Single: $150,000-$165,000</p>
                  <p className="text-gray-700">Married: $236,000-$246,000</p>
                </div>
                <div className="bg-white p-2 rounded border border-cyan-200">
                  <p className="font-bold text-cyan-900">Social Security Taxation Threshold:</p>
                  <p className="text-gray-700">Single: $25,000-$34,000</p>
                  <p className="text-gray-700">Married: $32,000-$44,000</p>
                </div>
                <div className="bg-white p-2 rounded border border-cyan-200">
                  <p className="font-bold text-cyan-900">Capital Gains 0% Rate:</p>
                  <p className="text-gray-700">Single: Up to $47,025</p>
                  <p className="text-gray-700">Married: Up to $94,050</p>
                </div>
                <div className="bg-white p-2 rounded border border-cyan-200">
                  <p className="font-bold text-cyan-900">Medicare IRMAA Surcharge:</p>
                  <p className="text-gray-700">Single: Starts at $106,000</p>
                  <p className="text-gray-700">Married: Starts at $212,000</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Married Filing Separately */}
        <Card className="border-yellow-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b border-yellow-200">
            <CardTitle className="flex items-center gap-2 text-yellow-900 text-lg sm:text-xl">
              <Users className="w-5 h-5" />
              Married Filing Separately: When It Makes Sense
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Although married couples typically choose to file their tax returns jointly, some may choose to file them separately. 
              However, because this can be financially beneficial in only very rare cases, married couples usually opt to file jointly. 
              The calculator above does not show results for this filing option because it rarely makes financial sense.
            </p>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h4 className="font-bold text-sm sm:text-base text-red-900 mb-3">⚠️ Disadvantages of Filing Separately</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div>
                  <p className="font-bold text-red-900 mb-2">Tax Benefits You LOSE:</p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>✗ Earned Income Tax Credit (EITC)</li>
                    <li>✗ Child and Dependent Care Credit</li>
                    <li>✗ Education credits (American Opportunity, Lifetime Learning)</li>
                    <li>✗ Student loan interest deduction</li>
                    <li>✗ Tuition and fees deduction</li>
                    <li>✗ Credit for elderly or disabled</li>
                    <li>✗ Adoption credit exclusion</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-red-900 mb-2">Additional Restrictions:</p>
                  <ul className="text-gray-700 space-y-1 ml-4">
                    <li>• Capital loss deduction limited to $1,500 (vs. $3,000 jointly)</li>
                    <li>• Lower income thresholds for IRA deduction phase-outs</li>
                    <li>• Both must take standard deduction or both itemize (can't mix)</li>
                    <li>• Child tax credit phases out at much lower income ($75,000 vs. $150,000)</li>
                    <li>• Roth IRA contribution limited starting at just $10,000 income</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-300">
              <h4 className="font-bold text-sm sm:text-base text-green-900 mb-3">✅ Rare Situations Where Separate Filing Helps</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-xs sm:text-sm text-green-900 mb-1">1. High Medical Expenses (One Spouse)</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    Medical expenses are only deductible above 7.5% of AGI. If one spouse has very high medical bills and low income, 
                    filing separately could allow them to meet the 7.5% threshold more easily.
                  </p>
                  <div className="bg-green-50 p-2 rounded mt-2 text-xs">
                    <p className="font-bold">Example:</p>
                    <p>Spouse 1: $30,000 income, $15,000 medical bills</p>
                    <p>Spouse 2: $150,000 income, $0 medical bills</p>
                    <p className="mt-1"><strong>Filing Separately:</strong> Spouse 1 can deduct $12,750 ($15k - 7.5% of $30k)</p>
                    <p><strong>Filing Jointly:</strong> Only $1,500 deductible ($15k - 7.5% of $180k)</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-xs sm:text-sm text-green-900 mb-1">2. Income-Driven Student Loan Repayment</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    If one spouse has substantial student loans under an income-driven repayment plan (SAVE, PAYE, IBR), 
                    filing separately keeps the high-earning spouse's income from being counted, resulting in lower monthly payments.
                  </p>
                  <div className="bg-green-50 p-2 rounded mt-2 text-xs">
                    <p className="font-bold">Example:</p>
                    <p>Spouse 1: $50,000 salary, $100,000 student loans (SAVE plan)</p>
                    <p>Spouse 2: $150,000 salary, $0 student loans</p>
                    <p className="mt-1"><strong>Filing Separately:</strong> Payment based on $50k = ~$400/month</p>
                    <p><strong>Filing Jointly:</strong> Payment based on $200k = ~$1,800/month</p>
                    <p className="mt-1 text-red-700"><strong>Note:</strong> Must calculate if tax increase from MFS exceeds loan payment savings!</p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-xs sm:text-sm text-green-900 mb-1">3. Separation or Divorce Pending</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    If spouses are separated and don't trust each other, filing separately protects each person from being 
                    liable for the other's tax issues, underreported income, or fraud. You're not jointly liable for errors 
                    when filing separately.
                  </p>
                </div>

                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-xs sm:text-sm text-green-900 mb-1">4. Spousal Tax Issues or Fraud Concerns</p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    If one spouse has tax debt, liens, or you suspect they're underreporting income, filing separately protects 
                    your refund from being seized to pay their debt. Also protects you from "innocent spouse relief" complications.
                  </p>
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded border border-yellow-300 mt-3">
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>💡 Pro Tip:</strong> Calculate both ways! Tax software can run both scenarios (filing jointly vs. separately) 
                  to see which saves more money. In 95%+ of cases, filing jointly wins. Only file separately if the math clearly shows savings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Marriage Penalty */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900 text-lg sm:text-xl">
              <AlertCircle className="w-5 h-5" />
              The Marriage Penalty: When You Pay More
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              In some situations, married couples end up paying more in taxes than single, otherwise equivalent, individuals. 
              This is referred to as the <strong>marriage penalty</strong> in the United States. This penalty can be significant 
              if both individuals in the marriage have very high incomes since filing jointly can result in being subject to a 
              higher tax bracket than the equivalent, combined income of two single people.
            </p>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-400">
              <h4 className="font-bold text-sm sm:text-base text-red-900 mb-3">⚠️ Who Gets Hit with Marriage Penalty?</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="font-bold text-xs sm:text-sm text-red-900 mb-2">1. Dual High-Income Earners (Most Common)</p>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    When both spouses earn similar high incomes, their combined income pushes them into higher tax brackets more 
                    quickly than if they filed as singles.
                  </p>
                  <div className="bg-red-50 p-3 rounded text-xs">
                    <p className="font-bold text-red-900 mb-2">Example: Two High Earners</p>
                    <div className="space-y-1">
                      <p>Both spouses earn: $200,000 each ($400,000 combined)</p>
                      <p className="pt-2 font-bold text-blue-700">Filing as Singles:</p>
                      <p>Each pays ~$42,000 federal tax = <strong>$84,000 total</strong></p>
                      <p className="text-xs text-gray-600">(Income mostly in 24% and 32% brackets)</p>
                      
                      <p className="pt-2 font-bold text-red-700">Filing Jointly:</p>
                      <p>Couple pays ~$91,000 federal tax</p>
                      <p className="text-xs text-gray-600">(More income pushed into 32% and 35% brackets)</p>
                      
                      <p className="pt-2 bg-red-200 p-2 rounded font-bold">Marriage Penalty: +$7,000/year 😔</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="font-bold text-xs sm:text-sm text-red-900 mb-2">2. Loss of Tax Credits Due to Combined Income</p>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    Two married individuals with lower to moderate incomes may be disqualified from receiving tax credits they 
                    would otherwise receive as singles because their combined income exceeds the threshold.
                  </p>
                  <div className="bg-red-50 p-3 rounded text-xs">
                    <p className="font-bold text-red-900 mb-2">Example: Earned Income Tax Credit (EITC)</p>
                    <div className="space-y-1">
                      <p>Spouse 1: $35,000, 2 children</p>
                      <p>Spouse 2: $40,000, 0 children</p>
                      
                      <p className="pt-2 font-bold text-green-700">Filing as Singles:</p>
                      <p>Spouse 1 qualifies for $6,164 EITC (2 kids, $35k income)</p>
                      <p>Spouse 2 gets $0 EITC (no qualifying children)</p>
                      <p><strong>Total EITC: $6,164</strong></p>
                      
                      <p className="pt-2 font-bold text-red-700">Filing Jointly:</p>
                      <p>Combined $75,000 income, 2 children</p>
                      <p>Phase-out reduces EITC to just $2,950</p>
                      
                      <p className="pt-2 bg-red-200 p-2 rounded font-bold">Lost EITC: -$3,214/year 😔</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="font-bold text-xs sm:text-sm text-red-900 mb-2">3. Additional Medicare Tax (High Earners)</p>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    The 0.9% Additional Medicare Tax kicks in at $200,000 for singles but only $250,000 for married couples 
                    filing jointly. This is NOT double the single threshold, creating a penalty for dual-income couples.
                  </p>
                  <div className="bg-red-50 p-3 rounded text-xs">
                    <p className="font-bold text-red-900 mb-2">Example:</p>
                    <p>Both spouses earn $150,000 ($300,000 combined)</p>
                    <p className="mt-1"><strong>As Singles:</strong> Neither pays Additional Medicare Tax (both under $200k)</p>
                    <p><strong>As Married:</strong> Pay 0.9% on $50,000 over threshold = <strong>$450 penalty</strong></p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="font-bold text-xs sm:text-sm text-red-900 mb-2">4. Net Investment Income Tax (NIIT) Threshold</p>
                  <p className="text-xs sm:text-sm text-gray-700 mb-2">
                    The 3.8% Net Investment Income Tax starts at $200,000 for singles but only $250,000 for married couples. 
                    Again, not double the single threshold.
                  </p>
                  <div className="bg-red-50 p-3 rounded text-xs">
                    <p>Two singles with $150k salary + $60k investment income each:</p>
                    <p className="mt-1"><strong>As Singles:</strong> Each pays 3.8% on $10k over threshold = $380 × 2 = $760</p>
                    <p><strong>As Married:</strong> Pay 3.8% on $120k over $250k threshold = <strong>$4,560</strong></p>
                    <p className="mt-1 bg-red-200 p-2 rounded font-bold">Penalty: +$3,800/year</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-3">📊 Marriage Penalty by Income Level</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-200">
                      <th className="border border-blue-300 p-2 text-left">Income Scenario</th>
                      <th className="border border-blue-300 p-2">Single Tax</th>
                      <th className="border border-blue-300 p-2">Married Tax</th>
                      <th className="border border-blue-300 p-2">Penalty/Bonus</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-blue-300 p-2">$50k + $50k</td>
                      <td className="border border-blue-300 p-2 text-center">$13,400</td>
                      <td className="border border-blue-300 p-2 text-center">$12,700</td>
                      <td className="border border-blue-300 p-2 text-center text-green-700 font-bold">-$700 Bonus ✓</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="border border-blue-300 p-2">$100k + $0</td>
                      <td className="border border-blue-300 p-2 text-center">$17,400</td>
                      <td className="border border-blue-300 p-2 text-center">$12,700</td>
                      <td className="border border-blue-300 p-2 text-center text-green-700 font-bold">-$4,700 Bonus ✓</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-blue-300 p-2">$100k + $100k</td>
                      <td className="border border-blue-300 p-2 text-center">$34,800</td>
                      <td className="border border-blue-300 p-2 text-center">$34,300</td>
                      <td className="border border-blue-300 p-2 text-center text-green-700 font-bold">-$500 Bonus ✓</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="border border-blue-300 p-2">$200k + $200k</td>
                      <td className="border border-blue-300 p-2 text-center">$84,000</td>
                      <td className="border border-blue-300 p-2 text-center">$91,000</td>
                      <td className="border border-blue-300 p-2 text-center text-red-700 font-bold">+$7,000 Penalty ✗</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-blue-300 p-2">$300k + $300k</td>
                      <td className="border border-blue-300 p-2 text-center">$156,000</td>
                      <td className="border border-blue-300 p-2 text-center">$169,000</td>
                      <td className="border border-blue-300 p-2 text-center text-red-700 font-bold">+$13,000 Penalty ✗</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 mt-3">
                <strong>Pattern:</strong> Single-income households and moderate dual-income households get bonuses. 
                High dual-income households ($200k+ each) face penalties.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-3">💡 Strategies to Reduce Marriage Penalty</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">1. Max Out Retirement Contributions</p>
                  <p className="text-gray-700">
                    Contribute max to 401(k) ($23,500 each in 2025), HSA ($8,550 family), and traditional IRA to reduce taxable income.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">2. Charitable Donations</p>
                  <p className="text-gray-700">
                    Donate appreciated stock or cash to qualified charities. Deduct up to 60% of AGI. Consider donor-advised funds.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">3. Health Savings Account (HSA)</p>
                  <p className="text-gray-700">
                    Family HSA contribution ($8,550 in 2025) reduces taxable income. Triple tax advantage: deductible, grows tax-free, withdrawals tax-free.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">4. Tax-Loss Harvesting</p>
                  <p className="text-gray-700">
                    Sell losing investments to offset capital gains. Can deduct up to $3,000 in net losses against ordinary income.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">5. Consider Timing of Marriage</p>
                  <p className="text-gray-700">
                    Since marital status is determined on Dec 31, consider delaying wedding until January if you'd face a large penalty.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-200">
                  <p className="font-bold text-purple-900 mb-1">6. Business Expenses (If Self-Employed)</p>
                  <p className="text-gray-700">
                    Deduct all legitimate business expenses. Consider home office deduction, equipment, mileage, health insurance premiums.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>⚖️ Long-Term Perspective:</strong> While marriage penalties exist, situations can and often do change. 
                What results in short-term tax penalties can potentially have long-term tax benefits. When one spouse stops working 
                (to raise children, retire, or take a break), the penalty often becomes a bonus. Marriage also provides non-tax 
                financial benefits like shared insurance, inheritance rights, social security spousal benefits, and legal protections 
                that may outweigh temporary tax penalties.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tax Planning Tips */}
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5" />
              Tax Planning Tips for Married Couples
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-xs sm:text-sm text-blue-900 mb-2">📅 Calculate Both Ways Annually</h4>
                <p className="text-xs text-gray-700">
                  Run the numbers for both filing jointly and separately every year. Life changes (job loss, promotion, new baby, 
                  medical expenses) can shift which filing status saves more money.
                </p>
              </div>

              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-xs sm:text-sm text-green-900 mb-2">💰 Adjust W-4 Withholding</h4>
                <p className="text-xs text-gray-700">
                  After marriage, update your W-4 with your employer. Use the IRS Tax Withholding Estimator to avoid owing taxes 
                  or getting a huge refund (which is an interest-free loan to the government).
                </p>
              </div>

              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-xs sm:text-sm text-purple-900 mb-2">🏦 Coordinate Retirement Accounts</h4>
                <p className="text-xs text-gray-700">
                  If employer matches differ, maximize the higher match first. Consider Roth vs. Traditional IRA based on combined 
                  tax bracket. Spousal IRA lets non-working spouse contribute.
                </p>
              </div>

              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-xs sm:text-sm text-orange-900 mb-2">🏥 Choose Best Health Insurance</h4>
                <p className="text-xs text-gray-700">
                  Compare both employers' health insurance plans. Consider dropping one plan to save premiums. HSA-eligible high-deductible 
                  plans offer tax advantages for healthy couples.
                </p>
              </div>

              <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-xs sm:text-sm text-red-900 mb-2">📝 Keep Records Together</h4>
                <p className="text-xs text-gray-700">
                  Organize all tax documents in one place. Track deductible expenses like charitable donations, medical expenses, 
                  business expenses, and mortgage interest throughout the year.
                </p>
              </div>

              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
                <h4 className="font-bold text-xs sm:text-sm text-yellow-900 mb-2">👨‍👩‍👧‍👦 Plan for Life Changes</h4>
                <p className="text-xs text-gray-700">
                  Having a baby? Buying a house? Starting a business? Each major life event has tax implications. Consider timing 
                  these events to maximize tax benefits (e.g., having baby in December vs. January).
                </p>
              </div>

              <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg border border-cyan-300">
                <h4 className="font-bold text-xs sm:text-sm text-cyan-900 mb-2">💼 Hire a Tax Professional</h4>
                <p className="text-xs text-gray-700">
                  If combined income exceeds $200k, you own a business, have complex investments, or face a large penalty/bonus, 
                  hire a CPA. They can identify deductions and strategies DIY software misses.
                </p>
              </div>

              <div className="bg-pink-50 p-3 sm:p-4 rounded-lg border border-pink-300">
                <h4 className="font-bold text-xs sm:text-sm text-pink-900 mb-2">📧 File Electronically</h4>
                <p className="text-xs text-gray-700">
                  E-filing is faster, more accurate, and you get your refund quicker (direct deposit in 1-3 weeks vs. 6-8 weeks 
                  for paper filing). IRS Free File available if income under $79,000.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context */}
        <Card className="border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
              <Calculator className="w-5 h-5" />
              Marriage & Taxes: Historical Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300 mb-4">
                <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-2">The Evolution of Marriage Tax Treatment</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  The marriage penalty/bonus has existed in various forms since income tax began in 1913. Congress has repeatedly 
                  attempted to address it with mixed results:
                </p>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                  <li>
                    <strong>1948:</strong> Congress introduced joint filing to eliminate penalties for single-income married couples. 
                    This created the "marriage bonus" but also introduced penalties for dual-income couples.
                  </li>
                  <li>
                    <strong>1969:</strong> Reduced the single filer disadvantage but increased marriage penalty for dual-income couples.
                  </li>
                  <li>
                    <strong>1981:</strong> Created a two-earner deduction (up to $3,000) to reduce marriage penalty. Repealed in 1986.
                  </li>
                  <li>
                    <strong>2001 (Bush Tax Cuts):</strong> Doubled standard deduction for married couples and widened 10% and 15% brackets 
                    to exactly double the single brackets, reducing penalties for lower/middle-income couples.
                  </li>
                  <li>
                    <strong>2017 (Tax Cuts and Jobs Act):</strong> Further widened married brackets (now nearly double single brackets up 
                    to $600k+), significantly reducing marriage penalties for most couples except the highest earners.
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-sm sm:text-base text-green-900 mb-2">Why Marriage Penalties Still Exist</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  It's mathematically impossible to create a tax system that satisfies all three of these principles simultaneously:
                </p>
                <ol className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4 list-decimal">
                  <li><strong>Progressivity:</strong> Higher incomes pay higher tax rates</li>
                  <li><strong>Marriage Neutrality:</strong> Marriage doesn't change total tax burden</li>
                  <li><strong>Equal Treatment:</strong> Couples with equal combined income pay equal tax</li>
                </ol>
                <p className="text-xs sm:text-sm text-gray-700 mt-3">
                  The U.S. tax code prioritizes progressivity and equal treatment, which means marriage neutrality is sacrificed. 
                  As long as we have progressive tax brackets and file jointly, some couples will always face penalties while others 
                  receive bonuses.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-2">International Comparison</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  Different countries handle marriage and taxation differently:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2 rounded border border-purple-200">
                    <p className="font-bold text-purple-900">Individual Filing (UK, Canada, Australia):</p>
                    <p className="text-gray-700">Each person files separately regardless of marital status. Eliminates marriage penalty but 
                    also eliminates income splitting benefits.</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-purple-200">
                    <p className="font-bold text-purple-900">Income Splitting (Germany, France):</p>
                    <p className="text-gray-700">Married couples' income is split 50/50 and each half is taxed separately. Strongly benefits 
                    single-income households.</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-purple-200">
                    <p className="font-bold text-purple-900">Flat Tax (Russia, Baltic States):</p>
                    <p className="text-gray-700">Everyone pays same rate regardless of income. Eliminates marriage penalty but loses 
                    progressivity (wealthier pay same rate as poor).</p>
                  </div>
                  <div className="bg-white p-2 rounded border border-purple-200">
                    <p className="font-bold text-purple-900">U.S. System (Joint Filing):</p>
                    <p className="text-gray-700">Progressive brackets with joint filing option. Provides flexibility but creates marriage 
                    penalties/bonuses depending on income distribution.</p>
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

export default MarriageTaxCalculatorComponent;
