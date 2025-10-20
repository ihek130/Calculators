import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Percent,
  PiggyBank,
  Shield,
  Info,
  AlertCircle,
  BookOpen,
  Building2,
  Users,
  Briefcase
} from 'lucide-react';

interface IRAInputs {
  currentBalance: number;
  annualContribution: number;
  expectedReturn: number;
  currentAge: number;
  retirementAge: number;
  currentTaxRate: number;
  retirementTaxRate: number;
}

interface AnnualData {
  age: number;
  traditionalBeforeTax: number;
  traditionalAfterTax: number;
  rothAfterTax: number;
  taxableSavings: number;
  principal: number;
}

interface IRAResults {
  traditional: {
    beforeTax: number;
    afterTax: number;
  };
  roth: {
    afterTax: number;
  };
  taxable: {
    afterTax: number;
  };
  traditional_vs_roth: number;
  roth_vs_taxable: number;
  schedule: AnnualData[];
}

const IraCalculatorComponent = () => {
  const [inputs, setInputs] = useState<IRAInputs>({
    currentBalance: 20000,
    annualContribution: 7000,
    expectedReturn: 6,
    currentAge: 30,
    retirementAge: 65,
    currentTaxRate: 25,
    retirementTaxRate: 15
  });

  const [results, setResults] = useState<IRAResults>({
    traditional: {
      beforeTax: 0,
      afterTax: 0
    },
    roth: {
      afterTax: 0
    },
    taxable: {
      afterTax: 0
    },
    traditional_vs_roth: 0,
    roth_vs_taxable: 0,
    schedule: []
  });

  // Calculate IRA results
  const calculateIRA = (inputs: IRAInputs): IRAResults => {
    const {
      currentBalance,
      annualContribution,
      expectedReturn,
      currentAge,
      retirementAge,
      currentTaxRate,
      retirementTaxRate
    } = inputs;

    if (currentAge >= retirementAge || currentAge < 0 || retirementAge > 120) {
      return {
        traditional: { beforeTax: 0, afterTax: 0 },
        roth: { afterTax: 0 },
        taxable: { afterTax: 0 },
        traditional_vs_roth: 0,
        roth_vs_taxable: 0,
        schedule: []
      };
    }

    const years = retirementAge - currentAge;
    const returnRate = expectedReturn / 100;
    const currentTaxRateDecimal = currentTaxRate / 100;
    const retirementTaxRateDecimal = retirementTaxRate / 100;
    const schedule: AnnualData[] = [];

    // Traditional IRA: Before-tax contributions, grows tax-deferred, taxed on withdrawal
    let traditionalBalance = currentBalance;
    
    // Roth IRA: After-tax contributions, grows tax-free
    // Starting balance is after-tax equivalent
    let rothBalance = currentBalance * (1 - currentTaxRateDecimal);
    
    // Taxable savings: After-tax contributions, taxed annually on gains
    let taxableBalance = currentBalance * (1 - currentTaxRateDecimal);
    
    // Principal tracking
    let totalPrincipal = currentBalance;

    for (let year = 0; year < years; year++) {
      const age = currentAge + year;
      const principalStart = totalPrincipal;

      // Traditional IRA - full pre-tax contribution
      traditionalBalance = traditionalBalance * (1 + returnRate) + annualContribution;

      // Roth IRA - after-tax contribution
      const rothContribution = annualContribution * (1 - currentTaxRateDecimal);
      rothBalance = rothBalance * (1 + returnRate) + rothContribution;

      // Taxable savings - after-tax contribution, taxed on interest annually
      const taxableContribution = annualContribution * (1 - currentTaxRateDecimal);
      const taxableInterest = taxableBalance * returnRate;
      const taxOnInterest = taxableInterest * currentTaxRateDecimal;
      taxableBalance = taxableBalance + taxableInterest - taxOnInterest + taxableContribution;

      totalPrincipal += annualContribution;

      // Calculate after-tax traditional IRA balance
      const traditionalAfterTaxBalance = traditionalBalance * (1 - retirementTaxRateDecimal);

      schedule.push({
        age: age,
        traditionalBeforeTax: Math.round(traditionalBalance),
        traditionalAfterTax: Math.round(traditionalAfterTaxBalance),
        rothAfterTax: Math.round(rothBalance),
        taxableSavings: Math.round(taxableBalance),
        principal: Math.round(totalPrincipal)
      });
    }

    const finalTraditionalBeforeTax = Math.round(traditionalBalance);
    const finalTraditionalAfterTax = Math.round(traditionalBalance * (1 - retirementTaxRateDecimal));
    const finalRothAfterTax = Math.round(rothBalance);
    const finalTaxableAfterTax = Math.round(taxableBalance);

    const traditional_vs_roth = finalTraditionalAfterTax - finalRothAfterTax;
    const roth_vs_taxable = finalRothAfterTax - finalTaxableAfterTax;

    return {
      traditional: {
        beforeTax: finalTraditionalBeforeTax,
        afterTax: finalTraditionalAfterTax
      },
      roth: {
        afterTax: finalRothAfterTax
      },
      taxable: {
        afterTax: finalTaxableAfterTax
      },
      traditional_vs_roth,
      roth_vs_taxable,
      schedule
    };
  };

  // Handle input changes
  const handleInputChange = (field: keyof IRAInputs, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Input validation with bounds
    const validatedValue = (() => {
      switch (field) {
        case 'currentBalance':
          return Math.max(0, Math.min(numValue, 10000000));
        case 'annualContribution':
          return Math.max(0, Math.min(numValue, 100000));
        case 'expectedReturn':
          return Math.max(0, Math.min(numValue, 30));
        case 'currentAge':
          return Math.max(0, Math.min(numValue, 100));
        case 'retirementAge':
          return Math.max(0, Math.min(numValue, 120));
        case 'currentTaxRate':
        case 'retirementTaxRate':
          return Math.max(0, Math.min(numValue, 50));
        default:
          return numValue;
      }
    })();
    
    setInputs(prev => ({ ...prev, [field]: validatedValue }));
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format currency for chart (compact)
  const formatCurrencyCompact = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  // Calculate results on input changes
  useEffect(() => {
    const calculationResults = calculateIRA(inputs);
    setResults(calculationResults);
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-100 rounded-full">
              <PiggyBank className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            IRA Calculator
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Evaluate and compare Traditional IRAs, SEP IRAs, SIMPLE IRAs, Roth IRAs, and regular taxable savings. 
            For comparison purposes, Roth IRA and taxable savings are converted to after-tax values.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-indigo-600" />
                IRA Parameters
              </CardTitle>
              <CardDescription className="text-sm">
                Modify the values and calculate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Current Balance */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Current Balance
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.currentBalance}
                    onChange={(e) => handleInputChange('currentBalance', e.target.value)}
                    className="pl-10"
                    placeholder="20000"
                  />
                </div>
              </div>

              {/* Annual Before-Tax Contribution */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Annual Before-Tax Contribution
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.annualContribution}
                    onChange={(e) => handleInputChange('annualContribution', e.target.value)}
                    className="pl-10"
                    placeholder="7000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  2025 limit: $7,000 (under 50) / $8,000 (50+)
                </p>
              </div>

              {/* Expected Rate of Return */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Expected Rate of Return
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.expectedReturn}
                    onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                    className="pl-10"
                    placeholder="6.0"
                  />
                </div>
              </div>

              {/* Current Age */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Current Age
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.currentAge}
                    onChange={(e) => handleInputChange('currentAge', e.target.value)}
                    className="pl-10"
                    placeholder="30"
                  />
                </div>
              </div>

              {/* Retirement Age */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Retirement Age
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.retirementAge}
                    onChange={(e) => handleInputChange('retirementAge', e.target.value)}
                    className="pl-10"
                    placeholder="65"
                  />
                </div>
              </div>

              {/* Current Marginal Tax Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Current Marginal Tax Rate
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.currentTaxRate}
                    onChange={(e) => handleInputChange('currentTaxRate', e.target.value)}
                    className="pl-10"
                    placeholder="25"
                  />
                </div>
              </div>

              {/* Expected Tax Rate in Retirement */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Expected Tax Rate in Retirement
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.retirementTaxRate}
                    onChange={(e) => handleInputChange('retirementTaxRate', e.target.value)}
                    className="pl-10"
                    placeholder="15"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results Comparison Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Results at Age {inputs.retirementAge}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700"></th>
                      <th className="px-4 py-3 text-right font-medium text-indigo-700">
                        <span className="hidden sm:inline">Traditional, SIMPLE, or SEP IRA</span>
                        <span className="sm:hidden">Traditional IRA</span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-purple-700">Roth IRA</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">
                        <span className="hidden sm:inline">Regular Taxable Savings</span>
                        <span className="sm:hidden">Taxable</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        Balance at age {inputs.retirementAge}
                      </td>
                      <td className="px-4 py-3 text-right text-indigo-600 font-bold">
                        {formatCurrency(results.traditional.beforeTax)}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-600 font-bold">
                        {formatCurrency(results.roth.afterTax)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">
                        {formatCurrency(results.taxable.afterTax)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-amber-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        Balance at age {inputs.retirementAge} (after tax)
                      </td>
                      <td className="px-4 py-3 text-right text-indigo-700 font-bold">
                        {formatCurrency(results.traditional.afterTax)}
                      </td>
                      <td className="px-4 py-3 text-right text-purple-700 font-bold">
                        {formatCurrency(results.roth.afterTax)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-700 font-bold">
                        {formatCurrency(results.taxable.afterTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comparison Messages */}
              <div className="space-y-3 mt-6">
                {results.traditional_vs_roth > 0 ? (
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        A <strong className="text-indigo-700">Traditional, SIMPLE, or SEP IRA</strong> account can accumulate{' '}
                        <strong className="text-indigo-600">{formatCurrency(results.traditional_vs_roth)}</strong> more 
                        after-tax balance than a Roth IRA account at age {inputs.retirementAge}.
                      </p>
                    </div>
                  </div>
                ) : results.traditional_vs_roth < 0 ? (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        A <strong className="text-purple-700">Roth IRA</strong> account can accumulate{' '}
                        <strong className="text-purple-600">{formatCurrency(Math.abs(results.traditional_vs_roth))}</strong> more 
                        after-tax balance than a Traditional IRA account at age {inputs.retirementAge}.
                      </p>
                    </div>
                  </div>
                ) : null}

                {results.roth_vs_taxable > 0 && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">
                        A <strong className="text-purple-700">Roth IRA</strong> account can accumulate{' '}
                        <strong className="text-purple-600">{formatCurrency(results.roth_vs_taxable)}</strong> more 
                        than a regular taxable savings account.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance Accumulation Graph */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Balance Accumulation Graph
              </CardTitle>
              <CardDescription>
                Growth comparison over time (after-tax values)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={450}>
                <AreaChart data={results.schedule}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="age" 
                    label={{ value: 'Age', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tickFormatter={formatCurrencyCompact}
                    label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Age ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="line"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="traditionalBeforeTax" 
                    stroke="#6366f1" 
                    fill="#c7d2fe" 
                    name="Traditional/SIMPLE/SEP IRA (before tax)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="traditionalAfterTax" 
                    stroke="#4f46e5" 
                    fill="#a5b4fc" 
                    name="Traditional/SIMPLE/SEP IRA (after tax)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rothAfterTax" 
                    stroke="#9333ea" 
                    fill="#e9d5ff" 
                    name="Roth IRA (after tax)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="taxableSavings" 
                    stroke="#3b82f6" 
                    fill="#bfdbfe" 
                    name="Regular taxable savings (after tax)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="principal" 
                    stroke="#10b981" 
                    fill="#d1fae5" 
                    name="Principal"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Annual Schedule Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Annual Schedule
              </CardTitle>
              <CardDescription>
                Detailed year-by-year breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-3 text-left font-medium text-gray-700" rowSpan={2}>Age</th>
                      <th className="px-2 sm:px-3 py-3 text-center font-medium text-indigo-700 border-l border-gray-300" colSpan={2}>
                        <span className="hidden sm:inline">Traditional/SIMPLE/SEP IRA (Before Tax)</span>
                        <span className="sm:hidden">Trad. IRA (Before Tax)</span>
                      </th>
                      <th className="px-2 sm:px-3 py-3 text-center font-medium text-indigo-700 border-l border-gray-300" colSpan={2}>
                        <span className="hidden sm:inline">Traditional/SIMPLE/SEP IRA (After Tax)</span>
                        <span className="sm:hidden">Trad. IRA (After Tax)</span>
                      </th>
                      <th className="px-2 sm:px-3 py-3 text-center font-medium text-purple-700 border-l border-gray-300" colSpan={2}>
                        Roth IRA (After Tax)
                      </th>
                      <th className="px-2 sm:px-3 py-3 text-center font-medium text-blue-700 border-l border-gray-300" colSpan={2}>
                        <span className="hidden sm:inline">Regular Taxable Savings (After Tax)</span>
                        <span className="sm:hidden">Taxable (After Tax)</span>
                      </th>
                    </tr>
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs border-l border-gray-300">Start</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs">End</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs border-l border-gray-300">Start</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs">End</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs border-l border-gray-300">Start</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs">End</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs border-l border-gray-300">Start</th>
                      <th className="px-2 sm:px-3 py-2 text-right font-medium text-gray-600 text-xs">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.schedule.map((row, index) => {
                      // Calculate start values from previous row
                      const prevRow = index > 0 ? results.schedule[index - 1] : null;
                      const traditionalStart = prevRow ? prevRow.traditionalBeforeTax : inputs.currentBalance;
                      const traditionalAfterTaxStart = prevRow ? prevRow.traditionalAfterTax : inputs.currentBalance * (1 - inputs.currentTaxRate / 100);
                      const rothStart = prevRow ? prevRow.rothAfterTax : inputs.currentBalance * (1 - inputs.currentTaxRate / 100);
                      const taxableStart = prevRow ? prevRow.taxableSavings : inputs.currentBalance * (1 - inputs.currentTaxRate / 100);

                      return (
                        <tr key={row.age} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-3 py-2 font-medium text-gray-900">{row.age}</td>
                          <td className="px-2 sm:px-3 py-2 text-right text-indigo-600 border-l border-gray-200 text-xs">
                            {formatCurrency(traditionalStart)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-indigo-600 font-semibold text-xs">
                            {formatCurrency(row.traditionalBeforeTax)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-indigo-700 border-l border-gray-200 text-xs">
                            {formatCurrency(traditionalAfterTaxStart)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-indigo-700 font-semibold text-xs">
                            {formatCurrency(row.traditionalAfterTax)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-purple-600 border-l border-gray-200 text-xs">
                            {formatCurrency(rothStart)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-purple-600 font-semibold text-xs">
                            {formatCurrency(row.rothAfterTax)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-blue-600 border-l border-gray-200 text-xs">
                            {formatCurrency(taxableStart)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 text-right text-blue-600 font-semibold text-xs">
                            {formatCurrency(row.taxableSavings)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content - Step 2 */}
      <div className="space-y-6">
        {/* What is an IRA */}
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-indigo-600" />
              What is an IRA?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              In the United States, an <strong>IRA (Individual Retirement Account)</strong> is a type of retirement plan 
              with taxation benefits defined by IRS Publication 590. It is a government tax break designed to incentivize 
              people to invest money for retirement. IRAs offer significant tax advantages that can help your retirement 
              savings grow faster than regular investment accounts.
            </p>

            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-lg border border-indigo-200 mt-4">
              <h4 className="font-bold text-indigo-900 mb-3">Key Benefits of IRAs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">Tax Advantages</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Either tax-deductible contributions (Traditional) or tax-free withdrawals (Roth)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">Tax-Sheltered Growth</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Investments grow without annual tax burden on gains and dividends
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PiggyBank className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">Retirement Security</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Build substantial wealth for retirement through compound growth
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-900 text-sm">Investment Flexibility</p>
                    <p className="text-xs text-gray-700 mt-1">
                      Wide range of investment options including stocks, bonds, and funds
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed mt-4">
              Among the different IRAs, the most common are <strong>Traditional IRAs</strong> and <strong>Roth IRAs</strong>. 
              The contributions to a Roth IRA are not tax-deductible, but the withdrawals after retirement are tax-free. 
              Conversely, the contributions to a Traditional IRA are tax-deductible but are taxed on withdrawals after retirement.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <p className="text-sm text-blue-900">
                <strong>Important consideration:</strong> For most people, their expected income after retirement will be 
                lower than during working years. Therefore, their expected marginal tax rates after retirement will likely 
                be lower. As a result, they may find that Traditional IRAs are more financially beneficial because taxation 
                occurs in retirement (at lower rates) rather than during prime working years.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Types of IRAs */}
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="h-6 w-6 text-purple-600" />
              Types of IRAs Explained
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Traditional IRA */}
            <div className="p-5 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-indigo-900 text-lg mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Traditional IRA
              </h4>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                As the most common IRA in use, Traditional IRAs are qualified retirement plans that have tax shields in 
                place for funds set aside for retirement. They are ideal for people who want to reduce their tax bill 
                while simultaneously saving for retirement.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Tax Treatment:</strong> Contributions are tax-deductible for most people (subject to income limits)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Withdrawals:</strong> Taxed as ordinary income; penalty-free after age 59½
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>RMDs:</strong> Required Minimum Distributions mandatory starting at age 73
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>2025 Contribution Limit:</strong> $7,000 (under 50) / $8,000 (50+)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Best For:</strong> Individuals seeking immediate tax deductions and expect lower tax rates in retirement
                  </p>
                </div>
              </div>
            </div>

            {/* Roth IRA */}
            <div className="p-5 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-900 text-lg mb-3 flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Roth IRA
              </h4>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                These are often initiated and managed by individuals with contributions coming from after-tax income or assets. 
                Investment income is tax-free, and withdrawals are tax-free. After turning age 59½, withdrawals from Roth IRAs 
                are penalty-free. However, Roth IRA withdrawals are not mandatory during the owner's lifetime.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Tax Treatment:</strong> Contributions made with after-tax dollars (not deductible)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Withdrawals:</strong> Completely tax-free in retirement (qualified distributions)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>RMDs:</strong> No required minimum distributions during owner's lifetime
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Income Limits:</strong> Phase-out ranges apply (2025: $146K-$161K single, $230K-$240K MFJ)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Best For:</strong> Young investors and those expecting higher tax rates in retirement
                  </p>
                </div>
              </div>
            </div>

            {/* SEP IRA */}
            <div className="p-5 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-bold text-orange-900 text-lg mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                SEP IRA (Simplified Employee Pension)
              </h4>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                SEP IRAs are initiated by employers and allow employers to make contributions to the IRA accounts of their 
                employees. Mostly used by small businesses or self-employed individuals, they are designed to be easier to 
                set up than other employer-sponsored retirement plans.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Contribution Limit (2025):</strong> Lesser of 25% of gross income or $70,000
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Tax Treatment:</strong> Functions similarly to Traditional IRA (tax-deferred growth)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Vesting:</strong> All proceeds are immediately 100% vested
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Employer Deduction:</strong> Contributions are tax-deductible business expenses
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Best For:</strong> Self-employed individuals and small business owners with high income
                  </p>
                </div>
              </div>
            </div>

            {/* SIMPLE IRA */}
            <div className="p-5 bg-teal-50 rounded-lg border border-teal-200">
              <h4 className="font-bold text-teal-900 text-lg mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                SIMPLE IRA (Savings Incentive Match Plan for Employees)
              </h4>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                SIMPLE IRAs are mainly designed for small businesses with 100 or fewer employees. The administrative costs 
                are much lower than those required by a 401(k). Employers must choose between two matching options for their employees.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Contribution Limit (2025):</strong> $16,500 (plus $3,500 catch-up for 50+, $5,250 for 60-63)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Employer Matching:</strong> Either 3% match or fixed 2% of compensation
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Early Withdrawal Penalty:</strong> 25% penalty (vs 10% for Traditional/Roth)
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Withdrawal Restriction:</strong> Can only be cashed out penalty-free after two years
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-teal-600 mt-0.5">✓</span>
                  <p className="text-gray-700">
                    <strong>Best For:</strong> Small businesses seeking simple, low-cost retirement plans for employees
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IRA vs 401(k) Comparison */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Traditional IRA vs. 401(k)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Traditional IRAs and 401(k)s are two of the most popular tax-deferred, defined contribution retirement plans. 
              Both turn pre-tax income into tax-deductible contributions placed into retirement plans that receive 
              tax-sheltered growth, with the goal of incentivizing saving for retirement.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-indigo-100">
                    <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                    <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-700">Traditional IRA</th>
                    <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-indigo-700">401(k)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Setup</td>
                    <td className="border border-gray-200 px-4 py-3">Individual - can open at most financial firms</td>
                    <td className="border border-gray-200 px-4 py-3">Employer-sponsored program</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">2025 Contribution Limit</td>
                    <td className="border border-gray-200 px-4 py-3">$7,000 / $8,000 (50+)</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">$23,500 / $31,000 (50+)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Employer Match</td>
                    <td className="border border-gray-200 px-4 py-3">None</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Often available (typically 3-6%)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Investment Options</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Almost limitless</td>
                    <td className="border border-gray-200 px-4 py-3">Limited to employer's offerings</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Administrative Fees</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Generally lower</td>
                    <td className="border border-gray-200 px-4 py-3">Can be relatively high</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Income Limits</td>
                    <td className="border border-gray-200 px-4 py-3">Yes (if covered by workplace plan)</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">None</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 mt-6">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Optimal Strategy
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                If your 401(k) has a contribution match, contribute at minimum the amount your company is willing to match—that's 
                free money! After securing the match, you can decide whether to continue contributing to your 401(k) up to the 
                annual limit or diversify by contributing to an IRA. In 2025, it's possible to contribute the maximum to both 
                ($23,500 to 401(k) and $7,000/$8,000 to IRA), provided you meet income requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* IRA Rollovers */}
        <Card className="shadow-lg border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              IRA Rollovers & Consolidation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Existing qualified retirement plans, such as 401(k)s, 403(b)s, SIMPLE IRAs, or SEP IRAs, can be "rolled over" 
              or consolidated into a Traditional IRA. Many other plans, including 457 plans or inherited employer-sponsored 
              plans (for designated beneficiaries), can also be rolled over.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rollover Benefits
                </h5>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Consolidate multiple retirement accounts for easier management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Access to broader investment options than employer plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>Potentially lower fees and administrative costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>No taxes due when rolling over directly into IRA</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important Considerations
                </h5>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span>Report all rollovers on tax returns (Form 1099-R and 5498)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span>Traditional and Roth IRA funds must be kept separate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span>Cashing out triggers early withdrawal penalties and taxes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span>Consider leaving funds in old 401(k) if fees are low</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Early withdrawals from IRAs or 401(k)s are both subject to a 10% penalty along with 
                standard income taxes (unless you qualify for exceptions like first-time home purchase, disability, or 
                medical expenses).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Investment Options */}
        <Card className="shadow-lg border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-6 w-6 text-violet-600" />
              Investment Options in an IRA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              One beneficial aspect of IRAs is that they are available through most financial firms with ample investment 
              options to choose from. The following are common options along with their strengths and weaknesses.
            </p>

            <div className="space-y-4 mt-4">
              <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                <h5 className="font-semibold text-violet-900 mb-2">Mutual Funds & Index Funds</h5>
                <p className="text-sm text-gray-700 mb-2">
                  A mutual fund is a pool of money managed by a fund manager. Index funds are mutual funds based on market 
                  indexes like the S&P 500. Both offer a hands-off approach to investing.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Long-term growth</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Diversification</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Lower fees</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-2">Individual Stocks (Active Investing)</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Requires hands-on approach with investors actively picking stocks. Can generate higher returns but carries 
                  significant risk. Not recommended for beginners.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">High risk</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">High potential return</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Requires expertise</span>
                </div>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h5 className="font-semibold text-teal-900 mb-2">Robo-Advisors</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Automated systems that manage investments using low-cost algorithms. Can set up customized, diverse 
                  portfolios within minutes, adjusted periodically based on preferences.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Low cost</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Automated</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Easy setup</span>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-orange-900 mb-2">Alternative Investments</h5>
                <p className="text-sm text-gray-700 mb-2">
                  IRAs can hold precious metals, real estate investment trusts (REITs), annuities, or Certificates of 
                  Deposit (CDs). Self-directed IRAs allow even more options.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Diversification</span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Complex</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Unique opportunities</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
              <h5 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Prohibited Investments
              </h5>
              <p className="text-sm text-red-800">
                The following are <strong>not allowed</strong> in any IRA: Life insurance, S corporations, collectibles, 
                antiques, art, personal real estate used as residence or rental income, and certain derivative positions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="shadow-lg border-l-4 border-l-rose-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-rose-600" />
              Key Takeaways & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-emerald-900 mb-3">✓ Best Practices</h5>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li>• Start contributing as early as possible to maximize compound growth</li>
                  <li>• Max out employer 401(k) match before considering other options</li>
                  <li>• Consider both Traditional and Roth IRAs based on your tax situation</li>
                  <li>• Diversify investments within your IRA to manage risk</li>
                  <li>• Review and rebalance your portfolio annually</li>
                  <li>• Contribute consistently—automate if possible</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">💡 Strategic Tips</h5>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Use Traditional IRA if you need current tax deduction</li>
                  <li>• Choose Roth IRA if you expect higher future tax rates</li>
                  <li>• Self-employed? Consider SEP IRA for higher contribution limits</li>
                  <li>• Small business owner? SIMPLE IRA offers employer matching</li>
                  <li>• Keep detailed records of all contributions and conversions</li>
                  <li>• Consult a financial advisor for personalized strategies</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-200 mt-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Remember:</strong> IRAs are powerful wealth-building tools that offer significant tax advantages. 
                Whether you choose Traditional, Roth, SEP, or SIMPLE, the most important factor is to start early and 
                contribute consistently. The tax shields and compound growth over decades can result in substantially more 
                retirement savings than regular taxable accounts. Use this calculator to model different scenarios and make 
                informed decisions about your retirement planning strategy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IraCalculatorComponent;
