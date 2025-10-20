import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertCircle
} from 'lucide-react';

interface RothIRAInputs {
  currentBalance: number;
  annualContribution: number;
  maximizeContributions: boolean;
  expectedReturn: number;
  currentAge: number;
  retirementAge: number;
  marginalTaxRate: number;
}

interface AccountBalance {
  age: number;
  principalStart: number;
  principalEnd: number;
  rothIRAStart: number;
  rothIRAEnd: number;
  taxableStart: number;
  taxableEnd: number;
}

interface RothIRAResults {
  rothBalance: number;
  taxableBalance: number;
  totalPrincipal: number;
  rothInterest: number;
  taxableInterest: number;
  totalTax: number;
  difference: number;
  schedule: AccountBalance[];
}

const RothIraCalculatorComponent = () => {
  const [inputs, setInputs] = useState<RothIRAInputs>({
    currentBalance: 20000,
    annualContribution: 7000,
    maximizeContributions: false,
    expectedReturn: 6,
    currentAge: 30,
    retirementAge: 65,
    marginalTaxRate: 25
  });

  const [results, setResults] = useState<RothIRAResults>({
    rothBalance: 0,
    taxableBalance: 0,
    totalPrincipal: 0,
    rothInterest: 0,
    taxableInterest: 0,
    totalTax: 0,
    difference: 0,
    schedule: []
  });

  // Contribution limits for 2025
  const CONTRIBUTION_LIMIT_UNDER_50 = 7000;
  const CONTRIBUTION_LIMIT_50_PLUS = 8000;

  // Calculate results
  const calculateRothIRA = (inputs: RothIRAInputs): RothIRAResults => {
    const {
      currentBalance,
      annualContribution,
      maximizeContributions,
      expectedReturn,
      currentAge,
      retirementAge,
      marginalTaxRate
    } = inputs;

    if (currentAge >= retirementAge || currentAge < 0 || retirementAge > 120) {
      return {
        rothBalance: 0,
        taxableBalance: 0,
        totalPrincipal: 0,
        rothInterest: 0,
        taxableInterest: 0,
        totalTax: 0,
        difference: 0,
        schedule: []
      };
    }

    const years = retirementAge - currentAge;
    const returnRate = expectedReturn / 100;
    const taxRate = marginalTaxRate / 100;
    const schedule: AccountBalance[] = [];

    let rothBalance = currentBalance;
    let taxableBalance = currentBalance;
    let totalContributions = currentBalance;
    let totalTaxPaid = 0;

    for (let year = 0; year < years; year++) {
      const age = currentAge + year;
      const principalStart = totalContributions;
      
      // Determine contribution amount
      let contribution = annualContribution;
      if (maximizeContributions) {
        contribution = age >= 50 ? CONTRIBUTION_LIMIT_50_PLUS : CONTRIBUTION_LIMIT_UNDER_50;
      }

      const rothStart = rothBalance;
      const taxableStart = taxableBalance;

      // Roth IRA grows tax-free
      rothBalance = rothBalance * (1 + returnRate) + contribution;

      // Taxable account - tax on interest earned
      const taxableInterestEarned = taxableBalance * returnRate;
      const taxOnInterest = taxableInterestEarned * taxRate;
      taxableBalance = taxableBalance + taxableInterestEarned - taxOnInterest + contribution;
      totalTaxPaid += taxOnInterest;

      totalContributions += contribution;

      const rothEnd = rothBalance;
      const taxableEnd = taxableBalance;
      const principalEnd = totalContributions;

      schedule.push({
        age: age,
        principalStart: Math.round(principalStart),
        principalEnd: Math.round(principalEnd),
        rothIRAStart: Math.round(rothStart),
        rothIRAEnd: Math.round(rothEnd),
        taxableStart: Math.round(taxableStart),
        taxableEnd: Math.round(taxableEnd)
      });
    }

    const finalRothBalance = Math.round(rothBalance);
    const finalTaxableBalance = Math.round(taxableBalance);
    const finalPrincipal = Math.round(totalContributions);
    const rothInterest = finalRothBalance - finalPrincipal;
    const taxableInterestBeforeTax = finalTaxableBalance + Math.round(totalTaxPaid) - finalPrincipal;

    return {
      rothBalance: finalRothBalance,
      taxableBalance: finalTaxableBalance,
      totalPrincipal: finalPrincipal,
      rothInterest: Math.round(rothInterest),
      taxableInterest: Math.round(taxableInterestBeforeTax),
      totalTax: Math.round(totalTaxPaid),
      difference: finalRothBalance - finalTaxableBalance,
      schedule
    };
  };

  // Handle input changes
  const handleInputChange = (field: keyof RothIRAInputs, value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      setInputs(prev => ({ ...prev, [field]: value }));
      return;
    }

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
        case 'marginalTaxRate':
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
    const calculationResults = calculateRothIRA(inputs);
    setResults(calculationResults);
  }, [inputs]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <PiggyBank className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            Roth IRA Calculator
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Estimate your Roth IRA balances and compare them with regular taxable accounts. 
            Plan your tax-free retirement income with detailed projections.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-purple-600" />
                Account Parameters
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

              {/* Annual Contribution */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Annual Contribution
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.annualContribution}
                    onChange={(e) => handleInputChange('annualContribution', e.target.value)}
                    className="pl-10"
                    placeholder="7000"
                    disabled={inputs.maximizeContributions}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  2025 limit: $7,000 (under 50) / $8,000 (50+)
                </p>
              </div>

              {/* Maximize Contributions */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="maximize"
                  checked={inputs.maximizeContributions}
                  onCheckedChange={(checked) => 
                    handleInputChange('maximizeContributions', checked as boolean)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="maximize"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    Maximize Contributions
                  </label>
                  <p className="text-xs text-gray-600">
                    Use 2025 IRS limits automatically
                  </p>
                </div>
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

              {/* Marginal Tax Rate */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Marginal Tax Rate
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.marginalTaxRate}
                    onChange={(e) => handleInputChange('marginalTaxRate', e.target.value)}
                    className="pl-10"
                    placeholder="25"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comparison Table */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Results at Age {inputs.retirementAge}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700"></th>
                      <th className="px-4 py-3 text-right font-medium text-purple-700">Roth IRA</th>
                      <th className="px-4 py-3 text-right font-medium text-blue-700">Taxable Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Balance at age {inputs.retirementAge}</td>
                      <td className="px-4 py-3 text-right text-purple-600 font-bold">{formatCurrency(results.rothBalance)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">{formatCurrency(results.taxableBalance)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total Principal</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(results.totalPrincipal)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(results.totalPrincipal)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total Interest</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(results.rothInterest)}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(results.taxableInterest)}</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">Total Tax</td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatCurrency(0)}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatCurrency(results.totalTax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Advantage Message */}
              {results.difference > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Roth IRA Advantage</p>
                      <p className="text-sm text-gray-700 mt-1">
                        According to provided information, the Roth IRA account can accumulate{' '}
                        <strong className="text-purple-600">{formatCurrency(results.difference)}</strong> more 
                        than a regular taxable account by age {inputs.retirementAge}.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                Growth comparison over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
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
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="rothIRAEnd" 
                    stroke="#9333ea" 
                    fill="#e9d5ff" 
                    name="Roth IRA"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="taxableEnd" 
                    stroke="#3b82f6" 
                    fill="#bfdbfe" 
                    name="Taxable Account"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="principalEnd" 
                    stroke="#10b981" 
                    fill="#d1fae5" 
                    name="Principal"
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
                Detailed year-by-year breakdown (showing first 10 years)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 text-left font-medium text-gray-700">Age</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-gray-700">Principal Start</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-gray-700">Principal End</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-purple-700">Roth Start</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-purple-700">Roth End</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-blue-700">Taxable Start</th>
                      <th className="px-2 sm:px-4 py-3 text-right font-medium text-blue-700">Taxable End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.schedule.slice(0, 10).map((row) => (
                      <tr key={row.age} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-3 font-medium">{row.age}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-gray-600">{formatCurrency(row.principalStart)}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-gray-600 font-medium">{formatCurrency(row.principalEnd)}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-purple-600">{formatCurrency(row.rothIRAStart)}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-purple-600 font-semibold">{formatCurrency(row.rothIRAEnd)}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-blue-600">{formatCurrency(row.taxableStart)}</td>
                        <td className="px-2 sm:px-4 py-3 text-right text-blue-600 font-semibold">{formatCurrency(row.taxableEnd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.schedule.length > 10 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Showing first 10 of {results.schedule.length} years
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content - Step 2 */}
      <div className="space-y-6">
        {/* What is a Roth IRA */}
        <Card className="shadow-lg border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-purple-600" />
              What is a Roth IRA?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>Roth IRA (Individual Retirement Account)</strong> is a tax-advantaged retirement savings account 
              that allows your money to grow tax-free. Unlike traditional IRAs where you get a tax deduction upfront, 
              Roth IRAs are funded with after-tax dollars, meaning you pay taxes on the money before contributing. 
              The major benefit is that all future withdrawals—including earnings—are completely tax-free in retirement, 
              provided you meet certain conditions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Key Benefits
                </h4>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Tax-free growth:</strong> Your investments grow without any tax burden</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Tax-free withdrawals:</strong> Qualified distributions are 100% tax-free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>No RMDs:</strong> No required minimum distributions during your lifetime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Contribution flexibility:</strong> Withdraw contributions anytime without penalty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Estate planning:</strong> Pass tax-free wealth to your beneficiaries</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Important Limitations
                </h4>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span><strong>Income limits:</strong> High earners may be restricted or ineligible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span><strong>Contribution limits:</strong> Annual caps apply ($7,000 or $8,000 for 50+)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span><strong>No immediate tax break:</strong> Contributions are not tax-deductible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span><strong>5-year rule:</strong> Must wait 5 years for qualified distributions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">!</span>
                    <span><strong>Early withdrawal penalties:</strong> 10% penalty on earnings if under 59½</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Rules & Limits */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-6 w-6 text-blue-600" />
              Contribution Rules & 2025 Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-bold text-lg text-blue-900 mb-4">2025 Annual Contribution Limits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Under Age 50</p>
                    <p className="text-4xl font-bold text-blue-600">$7,000</p>
                    <p className="text-xs text-gray-500 mt-2">Standard contribution limit</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Age 50 and Over</p>
                    <p className="text-4xl font-bold text-purple-600">$8,000</p>
                    <p className="text-xs text-gray-500 mt-2">Includes $1,000 catch-up contribution</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-semibold text-gray-900">Eligibility Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">✓ Must Have Earned Income</p>
                  <p className="text-sm text-gray-700">
                    You must have compensation (wages, salary, self-employment income) to contribute. 
                    Investment income doesn't count.
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">✓ Income Limits Apply</p>
                  <p className="text-sm text-gray-700">
                    High earners face reduced or eliminated contribution limits based on Modified Adjusted Gross Income (MAGI).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-6">
              <h4 className="font-semibold text-blue-900 mb-3">2025 Income Phase-Out Ranges</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white rounded">
                  <span className="font-medium text-gray-900">Single Filers</span>
                  <span className="text-blue-700 font-semibold">$146,000 - $161,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded">
                  <span className="font-medium text-gray-900">Married Filing Jointly</span>
                  <span className="text-blue-700 font-semibold">$230,000 - $240,000</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded">
                  <span className="font-medium text-gray-900">Married Filing Separately</span>
                  <span className="text-blue-700 font-semibold">$0 - $10,000</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                * If your MAGI falls within these ranges, your contribution limit is reduced proportionally. 
                Above the upper limit, you cannot contribute directly to a Roth IRA.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
              <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Contribution Deadline
              </h5>
              <p className="text-sm text-purple-800">
                You have until the tax filing deadline (typically April 15) of the following year to make contributions 
                for the current tax year. This gives you extra time to maximize your contributions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Qualified Distributions */}
        <Card className="shadow-lg border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-emerald-600" />
              Qualified Distributions & Withdrawal Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              To enjoy tax-free and penalty-free withdrawals from your Roth IRA, your distributions must be <strong>qualified</strong>. 
              Understanding these rules is crucial for maximizing the benefits of your Roth IRA.
            </p>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200 mt-4">
              <h4 className="font-bold text-lg text-emerald-900 mb-4">Requirements for Qualified Distributions</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900">The 5-Year Rule</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Your Roth IRA must be open for at least 5 years, counting from January 1 of the year you made 
                      your first contribution. This applies even if you're over 59½.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900">Age or Qualifying Event</p>
                    <p className="text-sm text-gray-700 mt-1">
                      You must be at least 59½ years old, OR meet one of the following exceptions: disability, 
                      first-time home purchase (up to $10,000), or death (for beneficiaries).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Contribution Withdrawals</h5>
                <p className="text-sm text-gray-700 mb-3">
                  You can withdraw your <strong>contributions</strong> (not earnings) at any time, tax-free and penalty-free, 
                  regardless of age or how long the account has been open.
                </p>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-xs font-mono text-blue-800">
                    Example: You contributed $35,000 over 5 years. You can withdraw up to $35,000 anytime without 
                    taxes or penalties.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h5 className="font-semibold text-amber-900 mb-3">Early Earnings Withdrawals</h5>
                <p className="text-sm text-gray-700 mb-3">
                  Withdrawing <strong>earnings</strong> before meeting qualified distribution requirements results in:
                </p>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">•</span>
                    <span>Income tax on the earnings withdrawn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-600">•</span>
                    <span>10% early withdrawal penalty (with exceptions)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 mt-6">
              <h5 className="font-semibold text-purple-900 mb-3">Withdrawal Order (IRS Ordering Rules)</h5>
              <p className="text-sm text-gray-700 mb-3">
                The IRS mandates a specific order for Roth IRA withdrawals:
              </p>
              <ol className="space-y-2 text-sm text-purple-800">
                <li className="flex items-start gap-3">
                  <span className="font-bold bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">1</span>
                  <span><strong>Regular contributions</strong> (always tax-free and penalty-free)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">2</span>
                  <span><strong>Conversion contributions</strong> (taxable if withdrawn within 5 years of conversion)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs">3</span>
                  <span><strong>Earnings</strong> (subject to taxes and penalties if non-qualified)</span>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Roth IRA vs Traditional IRA vs Taxable */}
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Roth IRA vs. Traditional IRA vs. Taxable Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Understanding the differences between retirement account types helps you make informed decisions about 
              where to invest your money for maximum tax efficiency.
            </p>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-purple-700">Roth IRA</th>
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-blue-700">Traditional IRA</th>
                    <th className="border border-indigo-200 px-4 py-3 text-left font-semibold text-gray-700">Taxable Account</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Tax Treatment of Contributions</td>
                    <td className="border border-gray-200 px-4 py-3">After-tax (no deduction)</td>
                    <td className="border border-gray-200 px-4 py-3">Pre-tax (tax deductible)</td>
                    <td className="border border-gray-200 px-4 py-3">After-tax (no deduction)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Tax on Growth</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Tax-free</td>
                    <td className="border border-gray-200 px-4 py-3">Tax-deferred</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">Taxed annually</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Tax on Withdrawals</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Tax-free (qualified)</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">Fully taxable</td>
                    <td className="border border-gray-200 px-4 py-3">Capital gains tax only</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Contribution Limits (2025)</td>
                    <td className="border border-gray-200 px-4 py-3">$7,000 / $8,000 (50+)</td>
                    <td className="border border-gray-200 px-4 py-3">$7,000 / $8,000 (50+)</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Income Limits</td>
                    <td className="border border-gray-200 px-4 py-3 text-amber-600">Yes (phase-outs apply)</td>
                    <td className="border border-gray-200 px-4 py-3 text-amber-600">Yes (if covered by workplace plan)</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">None</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Required Minimum Distributions</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">No RMDs</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">Required at age 73</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">None</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Early Withdrawal Penalty</td>
                    <td className="border border-gray-200 px-4 py-3">10% on earnings only (before 59½)</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">10% on full amount (before 59½)</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">None</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Contribution Flexibility</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Withdraw contributions anytime</td>
                    <td className="border border-gray-200 px-4 py-3 text-red-600">Penalties apply</td>
                    <td className="border border-gray-200 px-4 py-3 text-emerald-600 font-semibold">Full flexibility</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3 font-medium">Best For</td>
                    <td className="border border-gray-200 px-4 py-3">Young investors, expecting higher future tax rates</td>
                    <td className="border border-gray-200 px-4 py-3">Higher earners needing current tax deduction</td>
                    <td className="border border-gray-200 px-4 py-3">After maxing retirement accounts or needing liquidity</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-200 mt-6">
              <h5 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Strategic Recommendation
              </h5>
              <p className="text-sm text-indigo-800 leading-relaxed">
                <strong>Ideal strategy:</strong> Max out Roth IRA contributions first for tax-free growth, then contribute to 
                Traditional IRA or 401(k) if you need tax deductions, and finally invest in taxable accounts for additional savings. 
                The Roth IRA's tax-free withdrawals in retirement can provide significant value, especially if you expect to be in 
                a higher tax bracket later or if tax rates increase.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Converting Traditional IRA to Roth IRA */}
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-6 w-6 text-orange-600" />
              Converting Traditional IRA to Roth IRA (Roth Conversion)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>Roth conversion</strong> (also called a Roth IRA conversion) allows you to transfer money from a 
              Traditional IRA, SEP IRA, or SIMPLE IRA into a Roth IRA. This powerful strategy can provide long-term tax benefits, 
              but it comes with immediate tax consequences that require careful planning.
            </p>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border border-orange-200 mt-4">
              <h4 className="font-bold text-lg text-orange-900 mb-4">How Roth Conversion Works</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">Choose Amount to Convert</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Decide how much of your Traditional IRA you want to convert. You can convert the entire balance or 
                      just a portion. There are no income limits for Roth conversions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">Pay Taxes on Converted Amount</p>
                    <p className="text-sm text-gray-700 mt-1">
                      The converted amount is added to your taxable income for the year. You'll pay ordinary income tax 
                      at your current tax rate—not capital gains rates. This is the key trade-off.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">Enjoy Tax-Free Growth</p>
                    <p className="text-sm text-gray-700 mt-1">
                      After conversion, the money grows tax-free in your Roth IRA. All future qualified withdrawals 
                      are tax-free, potentially saving thousands in retirement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  When Conversion Makes Sense
                </h5>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Low income years:</strong> Converting during low-income years minimizes tax impact</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Long time horizon:</strong> More years for tax-free growth to compound</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Expect higher future tax rates:</strong> Pay taxes now at lower rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Cash available:</strong> Can pay conversion tax from non-retirement funds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span><strong>Avoid RMDs:</strong> Roth IRAs have no required minimum distributions</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Conversion Risks & Considerations
                </h5>
                <ul className="space-y-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span><strong>Immediate tax bill:</strong> Could push you into a higher tax bracket</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span><strong>5-year waiting period:</strong> Converted amounts must wait 5 years to avoid penalty</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span><strong>Medicare premiums:</strong> Higher income may increase IRMAA surcharges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span><strong>No recharacterization:</strong> Conversions are irreversible (since 2018)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">!</span>
                    <span><strong>State taxes:</strong> May owe state income tax on conversion</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-6">
              <h5 className="font-semibold text-blue-900 mb-3">Strategic Conversion Techniques</h5>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1">Partial Conversions</p>
                  <p className="text-gray-700">
                    Convert smaller amounts over multiple years to stay within your current tax bracket and avoid 
                    bracket creep. This "bracket management" strategy spreads the tax burden over time.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1">Backdoor Roth IRA</p>
                  <p className="text-gray-700">
                    High earners can make non-deductible contributions to a Traditional IRA, then immediately convert 
                    to a Roth IRA. This sidesteps income limits, though the pro-rata rule may apply.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1">Market Downturn Conversions</p>
                  <p className="text-gray-700">
                    Converting during market downturns means lower account values and smaller tax bills. When the 
                    market recovers, all growth happens tax-free in your Roth IRA.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200 mt-6">
              <h5 className="font-semibold text-purple-900 mb-3">Example Conversion Scenario</h5>
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Situation:</strong> Sarah has $100,000 in a Traditional IRA and is in the 24% tax bracket.
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Strategy:</strong> Instead of converting all at once ($24,000 tax bill), she converts $25,000 
                  per year for 4 years, staying in the 24% bracket.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Result:</strong> Total tax paid: $24,000 over 4 years. Her $100,000 now grows tax-free, 
                  and she avoids RMDs at age 73, potentially saving tens of thousands in taxes during retirement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Strategies */}
        <Card className="shadow-lg border-l-4 border-l-teal-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PiggyBank className="h-6 w-6 text-teal-600" />
              Roth IRA Investment Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Your Roth IRA isn't just a savings account—it's an investment vehicle that can hold stocks, bonds, mutual funds, 
              ETFs, and more. Since all gains are tax-free, strategic asset placement can maximize your wealth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <h5 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Best Investments for Roth IRA
                </h5>
                <ul className="space-y-3 text-sm text-teal-800">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5 font-bold">★</span>
                    <div>
                      <p className="font-semibold">Growth Stocks & Aggressive Funds</p>
                      <p className="text-xs text-gray-600">High potential gains become tax-free profits</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5 font-bold">★</span>
                    <div>
                      <p className="font-semibold">Real Estate Investment Trusts (REITs)</p>
                      <p className="text-xs text-gray-600">High dividend yields without annual tax burden</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5 font-bold">★</span>
                    <div>
                      <p className="font-semibold">High-Yield Dividend Stocks</p>
                      <p className="text-xs text-gray-600">Dividends grow tax-free instead of being taxed annually</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5 font-bold">★</span>
                    <div>
                      <p className="font-semibold">Actively Managed Funds</p>
                      <p className="text-xs text-gray-600">Avoid capital gains distributions that trigger taxes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5 font-bold">★</span>
                    <div>
                      <p className="font-semibold">Small-Cap & Emerging Markets</p>
                      <p className="text-xs text-gray-600">Higher risk/reward profile benefits from tax-free status</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Asset Location Strategy
                </h5>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Tax-efficient placement:</strong> Put tax-inefficient investments in your Roth IRA and 
                  tax-efficient ones in taxable accounts.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="bg-white p-3 rounded border border-blue-100">
                    <p className="font-semibold text-blue-900">Roth IRA ✓</p>
                    <p className="text-xs text-gray-600">Bonds, REITs, high-turnover funds, taxable bonds</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-100">
                    <p className="font-semibold text-blue-900">Taxable Account ✓</p>
                    <p className="text-xs text-gray-600">Tax-efficient index funds, long-term stocks, municipal bonds</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-6">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Diversification Principles
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Young Investors (20s-40s)</p>
                  <p className="text-gray-700 text-xs">
                    80-100% stocks: Focus on growth with decades until retirement. Higher volatility is acceptable.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Mid-Career (40s-50s)</p>
                  <p className="text-gray-700 text-xs">
                    60-80% stocks, 20-40% bonds: Balance growth with some stability as retirement approaches.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-amber-100">
                  <p className="font-semibold text-amber-900 mb-2">Near Retirement (60+)</p>
                  <p className="text-gray-700 text-xs">
                    40-60% stocks, 40-60% bonds: Preserve capital while maintaining growth potential.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
              <p className="text-sm text-purple-800">
                <strong>Pro tip:</strong> Consider a "mega backdoor Roth" if your 401(k) allows after-tax contributions 
                and in-service distributions. This can let you contribute significantly more than the standard $7,000/$8,000 limits.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Common Mistakes & Tips */}
        <Card className="shadow-lg border-l-4 border-l-rose-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-rose-600" />
              Common Mistakes to Avoid & Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mistakes Column */}
              <div>
                <h4 className="font-semibold text-rose-900 mb-4 text-lg flex items-center gap-2">
                  <span className="bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✕</span>
                  Common Mistakes
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Not Starting Early</p>
                    <p className="text-xs text-gray-700">
                      Delaying Roth IRA contributions costs you decades of tax-free compound growth. Even small amounts 
                      early on make a massive difference.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Exceeding Income Limits</p>
                    <p className="text-xs text-gray-700">
                      Contributing when you're above the income threshold results in 6% excess contribution penalties. 
                      Use the backdoor Roth strategy instead.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Leaving Cash Sitting</p>
                    <p className="text-xs text-gray-700">
                      Contributing to your Roth IRA but not investing it means you miss out on growth. Invest contributions 
                      immediately according to your strategy.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Ignoring the 5-Year Rule</p>
                    <p className="text-xs text-gray-700">
                      Withdrawing earnings before the account has been open 5 years (even if you're 59½) triggers taxes 
                      and penalties.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Missing Annual Contributions</p>
                    <p className="text-xs text-gray-700">
                      Contribution limits don't roll over. If you don't contribute one year, that opportunity is lost forever. 
                      Maximize every year when possible.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                    <p className="font-semibold text-rose-900 mb-1 text-sm">Not Considering Spouse's Roth</p>
                    <p className="text-xs text-gray-700">
                      Non-working spouses can contribute through a Spousal Roth IRA, effectively doubling your household's 
                      annual contribution limit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pro Tips Column */}
              <div>
                <h4 className="font-semibold text-emerald-900 mb-4 text-lg flex items-center gap-2">
                  <span className="bg-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">✓</span>
                  Pro Tips
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Automate Your Contributions</p>
                    <p className="text-xs text-gray-700">
                      Set up automatic monthly transfers to your Roth IRA. This ensures you max out contributions and 
                      benefit from dollar-cost averaging.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Front-Load Contributions</p>
                    <p className="text-xs text-gray-700">
                      Contribute early in the year rather than waiting until the deadline. This gives your money more time 
                      to grow tax-free—potentially adding thousands over decades.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Use Tax Refund Strategically</p>
                    <p className="text-xs text-gray-700">
                      Direct your tax refund straight to your Roth IRA. This is found money that can grow tax-free and 
                      help you reach your contribution limit.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Rebalance Tax-Free</p>
                    <p className="text-xs text-gray-700">
                      Unlike taxable accounts, rebalancing within your Roth IRA doesn't trigger capital gains taxes. 
                      Take advantage of this to maintain your target allocation.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Name Beneficiaries</p>
                    <p className="text-xs text-gray-700">
                      Keep beneficiary designations updated. Roth IRAs pass directly to beneficiaries outside of probate, 
                      and inherited Roth IRAs continue to grow tax-free.
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="font-semibold text-emerald-900 mb-1 text-sm">Consider a Roth Ladder</p>
                    <p className="text-xs text-gray-700">
                      For early retirees, convert Traditional IRA funds to Roth gradually, then wait 5 years to access them 
                      penalty-free—even before age 59½.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 mt-6">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-6 w-6" />
                Final Thoughts
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                The Roth IRA is one of the most powerful wealth-building tools available to individual investors. Its combination 
                of tax-free growth, flexible withdrawals, no RMDs, and estate planning benefits make it invaluable for long-term 
                financial security. Start early, contribute consistently, invest wisely, and let the power of tax-free compounding 
                work in your favor. Consult with a tax professional or financial advisor to create a strategy tailored to your 
                specific situation, especially when considering conversions or complex scenarios.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RothIraCalculatorComponent;
