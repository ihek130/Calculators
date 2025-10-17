import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, PieChart, TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';

interface CDInputs {
  initialDeposit: number;
  interestRate: number;
  compoundFrequency: string;
  years: number;
  months: number;
  marginalTaxRate: number;
}

interface CDResults {
  endBalance: number;
  totalInterest: number;
  afterTaxInterest: number;
  effectiveRate: number;
  schedule: Array<{
    year: number;
    deposit: number;
    interest: number;
    endingBalance: number;
    taxableInterest: number;
    afterTaxBalance: number;
  }>;
}

const CdCalculatorComponent = () => {
  const [inputs, setInputs] = useState<CDInputs>({
    initialDeposit: 10000,
    interestRate: 5.0,
    compoundFrequency: 'annually',
    years: 3,
    months: 0,
    marginalTaxRate: 0
  });

  const [results, setResults] = useState<CDResults>({
    endBalance: 0,
    totalInterest: 0,
    afterTaxInterest: 0,
    effectiveRate: 0,
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

  const getCompoundFrequency = (frequency: string): number => {
    switch (frequency) {
      case 'daily': return 365;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'semiannually': return 2;
      case 'annually': return 1;
      default: return 1;
    }
  };

  const calculateCD = (): CDResults => {
    const { initialDeposit, interestRate, compoundFrequency, years, months, marginalTaxRate } = inputs;
    
    if (initialDeposit <= 0 || interestRate <= 0) {
      return {
        endBalance: 0,
        totalInterest: 0,
        afterTaxInterest: 0,
        effectiveRate: 0,
        schedule: []
      };
    }

    const totalYears = years + (months / 12);
    const annualRate = interestRate / 100;
    const compoundsPerYear = getCompoundFrequency(compoundFrequency);
    
    // Compound interest formula: A = P(1 + r/n)^(nt)
    const endBalance = initialDeposit * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * totalYears);
    const totalInterest = endBalance - initialDeposit;
    const taxableInterest = totalInterest * (marginalTaxRate / 100);
    const afterTaxInterest = totalInterest - taxableInterest;
    const effectiveRate = totalYears > 0 ? ((endBalance / initialDeposit) ** (1 / totalYears) - 1) * 100 : 0;

    // Generate accumulation schedule
    const schedule = [];
    
    if (showMonthlySchedule) {
      // Monthly schedule
      const totalMonths = years * 12 + months;
      for (let month = 1; month <= totalMonths; month++) {
        const monthsElapsed = month / 12;
        const monthEndBalance = initialDeposit * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * monthsElapsed);
        const prevBalance = month === 1 ? initialDeposit : 
          initialDeposit * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * ((month - 1) / 12));
        const monthInterest = monthEndBalance - prevBalance;
        const monthTaxableInterest = monthInterest * (marginalTaxRate / 100);
        const cumulativeTaxes = (monthEndBalance - initialDeposit) * (marginalTaxRate / 100);
        const monthAfterTaxBalance = monthEndBalance - cumulativeTaxes;

        schedule.push({
          year: month,
          deposit: month === 1 ? initialDeposit : 0,
          interest: monthInterest,
          endingBalance: monthEndBalance,
          taxableInterest: monthTaxableInterest,
          afterTaxBalance: monthAfterTaxBalance
        });
      }
    } else {
      // Annual schedule
      for (let year = 1; year <= years; year++) {
        const yearEndBalance = initialDeposit * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * year);
        const yearInterest = year === 1 ? yearEndBalance - initialDeposit : 
          yearEndBalance - (initialDeposit * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * (year - 1)));
        const yearTaxableInterest = yearInterest * (marginalTaxRate / 100);
        const cumulativeTaxes = (yearEndBalance - initialDeposit) * (marginalTaxRate / 100);
        const yearAfterTaxBalance = yearEndBalance - cumulativeTaxes;

        schedule.push({
          year,
          deposit: year === 1 ? initialDeposit : 0,
          interest: yearInterest,
          endingBalance: yearEndBalance,
          taxableInterest: yearTaxableInterest,
          afterTaxBalance: yearAfterTaxBalance
        });
      }
    }

    return {
      endBalance,
      totalInterest,
      afterTaxInterest,
      effectiveRate,
      schedule
    };
  };

  useEffect(() => {
    const newResults = calculateCD();
    setResults(newResults);
  }, [inputs, showMonthlySchedule]);

  const handleInputChange = (field: keyof CDInputs, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: field === 'compoundFrequency' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : value)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center justify-center gap-2 sm:gap-3">
            <Calculator className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-600" />
            CD Calculator
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Calculate your Certificate of Deposit returns with compound interest, tax considerations, 
            and detailed accumulation schedules to make informed investment decisions.
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-800">CD Investment Details</CardTitle>
            <CardDescription className="text-sm sm:text-base">Enter your certificate of deposit parameters to calculate returns</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              
              <div className="space-y-2">
                <Label htmlFor="initialDeposit" className="text-sm font-medium text-gray-700">
                  Initial Deposit Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="initialDeposit"
                    type="number"
                    value={inputs.initialDeposit}
                    onChange={(e) => handleInputChange('initialDeposit', e.target.value)}
                    className="pl-10"
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm font-medium text-gray-700">
                  Annual Interest Rate (%)
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
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="compoundFrequency" className="text-sm font-medium text-gray-700">
                  Compounding Frequency
                </Label>
                <Select 
                  value={inputs.compoundFrequency} 
                  onValueChange={(value) => handleInputChange('compoundFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannually">Semi-annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years" className="text-sm font-medium text-gray-700">
                  Investment Term (Years)
                </Label>
                <Input
                  id="years"
                  type="number"
                  value={inputs.years}
                  onChange={(e) => handleInputChange('years', e.target.value)}
                  placeholder="3"
                  min="0"
                  max="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="months" className="text-sm font-medium text-gray-700">
                  Additional Months
                </Label>
                <Input
                  id="months"
                  type="number"
                  value={inputs.months}
                  onChange={(e) => handleInputChange('months', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="11"
                />
              </div>

              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="marginalTaxRate" className="text-sm font-medium text-gray-700">
                  Marginal Tax Rate (%)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="marginalTaxRate"
                    type="number"
                    step="0.1"
                    value={inputs.marginalTaxRate}
                    onChange={(e) => handleInputChange('marginalTaxRate', e.target.value)}
                    className="pl-10"
                    placeholder="22.0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              Investment Results
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-blue-800">Final Balance</h3>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{formatCurrency(results.endBalance)}</p>
                <p className="text-xs text-blue-700 mt-1">
                  Principal + Interest
                </p>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-green-800">Total Interest</h3>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(results.totalInterest)}</p>
                <p className="text-xs text-green-700 mt-1">
                  Before taxes
                </p>
              </div>

              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-purple-800">After-Tax Interest</h3>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">{formatCurrency(results.afterTaxInterest)}</p>
                <p className="text-xs text-purple-700 mt-1">
                  Net earnings
                </p>
              </div>

              <div className="bg-indigo-50 p-4 sm:p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-indigo-800">Effective Rate</h3>
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                </div>
                <p className="text-lg sm:text-2xl font-bold text-indigo-900">{formatPercent(results.effectiveRate)}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Annual return
                </p>
              </div>
            </div>

            {/* Interactive Graphs */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
              
              {/* Growth Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Investment Growth Over Time</h3>
                <div className="relative h-64">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="growthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <g key={i}>
                        <line
                          x1={50 + (i * 60)}
                          y1={20}
                          x2={50 + (i * 60)}
                          y2={200}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                        />
                        <text
                          x={50 + (i * 60)}
                          y={215}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          Year {i}
                        </text>
                      </g>
                    ))}

                    {/* Growth line */}
                    {results.schedule.length > 0 && (
                      <polyline
                        points={`50,200 ${results.schedule.map((item, index) => 
                          `${50 + ((index + 1) * 60)},${200 - ((item.endingBalance - inputs.initialDeposit) / Math.max(results.endBalance - inputs.initialDeposit, 1)) * 160}`
                        ).join(' ')}`}
                        fill="url(#growthGradient)"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data points */}
                    {results.schedule.map((item, index) => (
                      <circle
                        key={index}
                        cx={50 + ((index + 1) * 60)}
                        cy={200 - ((item.endingBalance - inputs.initialDeposit) / Math.max(results.endBalance - inputs.initialDeposit, 1)) * 160}
                        r="4"
                        fill="#1D4ED8"
                        className="cursor-pointer"
                      >
                        <title>{`Year ${item.year}: ${formatCurrency(item.endingBalance)}`}</title>
                      </circle>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Principal vs Interest Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">Principal vs Interest Breakdown</h3>
                <div className="relative h-64">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    {/* Principal bar */}
                    <rect
                      x="120"
                      y={200 - (inputs.initialDeposit / results.endBalance) * 160}
                      width="80"
                      height={(inputs.initialDeposit / results.endBalance) * 160}
                      fill="#10B981"
                      rx="4"
                    />
                    
                    {/* Interest bar */}
                    <rect
                      x="220"
                      y={200 - (results.totalInterest / results.endBalance) * 160}
                      width="80"
                      height={(results.totalInterest / results.endBalance) * 160}
                      fill="#3B82F6"
                      rx="4"
                    />

                    {/* Labels */}
                    <text x="160" y="220" textAnchor="middle" className="text-sm fill-gray-700 font-medium">
                      Principal
                    </text>
                    <text x="260" y="220" textAnchor="middle" className="text-sm fill-gray-700 font-medium">
                      Interest
                    </text>

                    {/* Values */}
                    <text x="160" y="235" textAnchor="middle" className="text-xs fill-gray-600">
                      {formatCurrency(inputs.initialDeposit)}
                    </text>
                    <text x="260" y="235" textAnchor="middle" className="text-xs fill-gray-600">
                      {formatCurrency(results.totalInterest)}
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accumulation Schedule */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Accumulation Schedule
                </CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!showMonthlySchedule ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setShowMonthlySchedule(false)}
                >
                  Annual
                </Button>
                <Button
                  variant={showMonthlySchedule ? "default" : "outline"}
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => setShowMonthlySchedule(true)}
                >
                  Monthly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">
                      {showMonthlySchedule ? 'Month' : 'Year'}
                    </th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Deposit</th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Interest</th>
                    <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Ending Balance</th>
                    {inputs.marginalTaxRate > 0 && (
                      <>
                        <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">Tax Owed</th>
                        <th className="text-right p-2 sm:p-3 font-semibold text-gray-700 text-xs sm:text-sm">After-Tax Balance</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.schedule.map((row, index) => (
                    <tr key={row.year} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="p-2 sm:p-3 text-gray-800 font-medium text-sm">{row.year}</td>
                      <td className="p-2 sm:p-3 text-right text-gray-800 text-sm">{formatCurrency(row.deposit)}</td>
                      <td className="p-2 sm:p-3 text-right text-gray-800 text-sm">{formatCurrency(row.interest)}</td>
                      <td className="p-2 sm:p-3 text-right font-semibold text-gray-800 text-sm">
                        {formatCurrency(row.endingBalance)}
                      </td>
                      {inputs.marginalTaxRate > 0 && (
                        <>
                          <td className="p-2 sm:p-3 text-right text-red-600 text-sm">{formatCurrency(row.taxableInterest)}</td>
                          <td className="p-2 sm:p-3 text-right font-semibold text-green-700 text-sm">
                            {formatCurrency(row.afterTaxBalance)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Educational Content */}
        <Card className="mb-6 sm:mb-8 shadow-xl mx-2 sm:mx-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Understanding Certificates of Deposit: Foundation of Conservative Investing
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-gray-600">
              Comprehensive guide to CD investing, FDIC protection, tax implications, and strategic applications 
              for building wealth through guaranteed returns and capital preservation strategies.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 prose max-w-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">What is a Certificate of Deposit?</h3>
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                  A Certificate of Deposit represents a formal agreement between investors and financial institutions to 
                  deposit money for predetermined periods in exchange for guaranteed interest rates. Unlike savings accounts 
                  with variable rates, CDs provide fixed returns over specific timeframes, typically ranging from three months 
                  to five years, with longer terms generally offering higher interest rates due to increased commitment and 
                  liquidity constraints.
                </p>
                
                <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">
                  As low-risk investment vehicles, CDs occupy the conservative end of the investment spectrum, offering 
                  predictable returns without market volatility exposure. Financial institutions utilize CD funds for 
                  lending operations while providing depositors with guaranteed principal protection and predetermined 
                  interest earnings throughout the certificate term. This mutual benefit arrangement has made CDs foundational 
                  instruments for conservative portfolio construction and capital preservation strategies.
                </p>

                <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800">Essential CD Investment Components</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="font-semibold text-blue-800 text-sm sm:text-base">Initial Deposit Requirements & Minimums</p>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed">
                      CD deposits typically require minimum amounts ranging from $500 to $10,000, with "jumbo" CDs 
                      requiring $100,000 or more for premium interest rates. Higher initial deposits often secure 
                      better rates and improved terms, making deposit amount selection crucial for maximizing returns 
                      while maintaining FDIC protection limits of $250,000 per depositor per institution.
                    </p>
                  </div>
                  
                  <div className="p-2 sm:p-3 bg-green-50 rounded border-l-4 border-green-400">
                    <p className="font-semibold text-green-800 text-sm sm:text-base">Interest Rates & APY Calculations</p>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed">
                      CD interest rates are expressed as Annual Percentage Yield (APY), representing effective annual 
                      returns including compound interest effects. Unlike APR used for loans, APY accurately reflects 
                      total earnings potential, making it the standard metric for CD rate comparisons across institutions. 
                      Rates vary based on term length, deposit amount, and prevailing Federal Reserve policies.
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                    <p className="font-semibold text-purple-800 text-sm sm:text-base">Compounding Frequency Impact</p>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed">
                      Compounding frequency significantly affects total returns, with daily compounding providing 
                      superior results compared to annual compounding. The mathematical difference becomes more 
                      pronounced with larger deposits and longer terms. For example, $10,000 at 5% APY compounded 
                      daily versus annually can yield differences of $50-100+ over multi-year periods.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">FDIC Protection & Federal Safety Framework</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-800">Federal Deposit Insurance Corporation (FDIC)</h4>
                    <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">
                      CDs from FDIC-insured banks receive federal protection up to $250,000 per depositor, per institution, 
                      making them among the safest investment options available. This government backing ensures principal 
                      and accrued interest recovery even during bank failures, providing unmatched security for conservative 
                      investors. The FDIC has maintained this protection since 1933, with zero losses to insured depositors 
                      throughout multiple economic crises and bank failures.
                    </p>
                    
                    <div className="space-y-2 sm:space-y-3">
                      <div className="border-l-4 border-blue-300 pl-3 sm:pl-4">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">Coverage Limits & Strategic Distribution</p>
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                          Investors with deposits exceeding $250,000 can maintain full FDIC protection by 
                          distributing funds across multiple FDIC-insured institutions. This strategy preserves 
                          complete safety while potentially accessing competitive rates from various banks. 
                          Joint accounts receive separate $250,000 coverage per account holder, effectively 
                          doubling protection for married couples.
                        </p>
                      </div>
                      
                      <div className="border-l-4 border-green-300 pl-3 sm:pl-4">
                        <p className="font-semibold text-gray-800 text-sm sm:text-base">Credit Union Alternative Protection</p>
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                          Credit union CDs receive equivalent protection through National Credit Union Share 
                          Insurance Fund (NCUSIF), providing identical $250,000 coverage per member per 
                          institution. This parallel protection system maintains the same safety standards 
                          while potentially offering competitive rates through member-owned cooperative structures.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-100 rounded-lg border border-blue-200">
              <h4 className="text-base sm:text-lg font-semibold mb-2 text-blue-800">Compound Interest Formula</h4>
              <div className="font-mono text-center text-base sm:text-lg mb-2 sm:mb-3 text-blue-800 bg-white rounded p-2">
                A = P(1 + r/n)^(nt)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-blue-700">
                <div>
                  <p><strong>A</strong> = Final amount (principal + interest)</p>
                  <p><strong>P</strong> = Principal deposit amount</p>
                  <p><strong>r</strong> = Annual interest rate (as decimal)</p>
                </div>
                <div>
                  <p><strong>n</strong> = Compounding frequency per year</p>
                  <p><strong>t</strong> = Time in years</p>
                  <p><strong>Example:</strong> $10,000 at 5% compounded annually for 3 years</p>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">CD Types & Strategic Investment Applications</h3>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  Various CD types serve different investment objectives and risk tolerances, from traditional fixed-rate 
                  certificates to specialized products offering unique features. Understanding these options enables 
                  strategic selection based on individual financial goals, market conditions, and liquidity requirements. 
                  Each type presents distinct advantages and limitations requiring careful evaluation.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base">Traditional Fixed-Rate CDs</h4>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      Standard CDs provide guaranteed interest rates throughout the entire term, offering complete 
                      predictability for conservative investors. These certificates form the foundation of safe 
                      investment portfolios, particularly valuable for retirees requiring steady income streams 
                      without market volatility exposure. Terms range from 3 months to 5 years with rates 
                      generally increasing with longer commitments.
                    </p>
                    
                    <p className="text-green-700 text-xs leading-relaxed">
                      <strong>Best for:</strong> Conservative investors, retirement income planning, emergency 
                      fund positioning, and short to medium-term financial goals requiring capital preservation 
                      with modest growth potential.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Variable-Rate & Callable CDs</h4>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      Variable-rate CDs adjust interest payments based on benchmark rate changes, offering potential 
                      upside during rising rate environments while maintaining principal protection. Callable CDs 
                      provide higher initial rates but allow issuers to redeem certificates early if rates decline, 
                      creating reinvestment risk for investors seeking long-term rate locks.
                    </p>
                    
                    <p className="text-blue-700 text-xs leading-relaxed">
                      <strong>Best for:</strong> Investors anticipating rising rates, those comfortable with rate 
                      uncertainty, and situations where premium initial rates justify potential early redemption risks.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-1 sm:mb-2 text-sm sm:text-base">Jumbo & Specialty CDs</h4>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      Jumbo CDs requiring $100,000+ deposits typically offer premium rates for substantial investments. 
                      Specialty products include step-up CDs allowing one-time rate increases, liquid CDs permitting 
                      limited penalty-free withdrawals, and brokered CDs traded on secondary markets for additional 
                      liquidity options beyond traditional bank offerings.
                    </p>
                    
                    <p className="text-purple-700 text-xs leading-relaxed">
                      <strong>Best for:</strong> High-net-worth investors, business cash management, institutional 
                      investors, and situations requiring specialized features balancing yield with flexibility requirements.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Tax Implications & Strategic Planning</h3>
                
                <p className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
                  CD interest represents taxable income requiring strategic tax planning for optimization. Understanding 
                  federal and state tax implications enables informed decisions about CD timing, placement within tax-advantaged 
                  accounts, and coordination with overall tax management strategies. Proper planning can significantly 
                  impact after-tax returns and overall investment efficiency.
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-1 sm:mb-2 text-sm sm:text-base">Federal & State Tax Treatment</h4>
                    <p className="text-red-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      CD interest is taxed as ordinary income at federal rates up to 37% plus applicable state income 
                      taxes, potentially creating substantial tax burdens for high-income investors. Unlike qualified 
                      dividends receiving preferential rates, CD interest lacks favorable tax treatment, making 
                      after-tax return calculations crucial for accurate investment analysis.
                    </p>
                    
                    <p className="text-red-700 text-xs leading-relaxed">
                      High earners in combined federal/state brackets exceeding 40% should carefully evaluate 
                      after-tax CD returns against tax-advantaged alternatives or municipal securities for 
                      competitive after-tax yields.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 text-sm sm:text-base">IRA & 401(k) CD Strategies</h4>
                    <p className="text-yellow-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      CDs within traditional IRAs and 401(k) plans grow tax-deferred until retirement withdrawals, 
                      eliminating annual tax obligations on interest earnings. Roth IRA CDs provide tax-free growth 
                      and withdrawals after age 59½, making them attractive for conservative allocation portions 
                      of retirement portfolios requiring principal protection guarantees.
                    </p>
                    
                    <p className="text-yellow-700 text-xs leading-relaxed">
                      IRA CDs work particularly well for older investors approaching retirement who need to reduce 
                      portfolio risk while maintaining tax-advantaged growth for remaining working years.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-1 sm:mb-2 text-sm sm:text-base">Timing & Tax Management</h4>
                    <p className="text-indigo-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      CD maturation timing affects tax year income recognition, enabling strategic planning for 
                      tax bracket management. Investors can coordinate CD maturities with other income events, 
                      retirement transitions, or major deduction years to optimize overall tax efficiency. 
                      Early withdrawal penalties may provide tax deductions offsetting some penalty costs.
                    </p>
                    
                    <p className="text-indigo-700 text-xs leading-relaxed">
                      Consider laddering CD maturities across tax years to smooth income recognition and 
                      avoid bracket creep during high-income periods or retirement planning transitions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">CD Laddering & Portfolio Integration Strategies</h3>
              
              <p className="text-gray-700 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                CD laddering creates systematic approaches to managing interest rate risk while maintaining liquidity 
                through staggered maturity dates. This strategy enables investors to capture higher yields from 
                longer-term CDs while preserving regular access to principal for reinvestment or alternative opportunities. 
                Effective laddering requires careful planning of amounts, terms, and integration with broader portfolio objectives.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1 sm:mb-2 text-sm sm:text-base">Basic Laddering Implementation</h4>
                    <p className="text-green-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      Traditional ladders divide investment amounts equally across multiple CD terms, creating 
                      regular maturity cycles. A five-year ladder using $50,000 might allocate $10,000 each 
                      to 1, 2, 3, 4, and 5-year CDs. Upon maturity, each amount reinvests in the longest 
                      term, eventually creating annual access to one-fifth of principal while maintaining 
                      higher average yields compared to short-term alternatives.
                    </p>
                    
                    <p className="text-green-700 text-xs leading-relaxed">
                      Example: $10,000 allocations maturing annually provide $10,000 liquidity each year 
                      while the remaining $40,000 earns longer-term rates, balancing yield with accessibility.
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Advanced Laddering Variations</h4>
                    <p className="text-blue-700 text-xs sm:text-sm leading-relaxed mb-1 sm:mb-2">
                      Customized ladders adjust allocation weights and term selection based on interest rate 
                      forecasts, liquidity needs, and risk preferences. Barbell strategies concentrate in 
                      short and long terms while avoiding intermediate maturities. Bullet strategies target 
                      specific future dates for coordinated maturities supporting major financial objectives.
                    </p>
                    
                    <p className="text-blue-700 text-xs leading-relaxed">
                      Rate environment adaptation involves emphasizing shorter terms during rising rate periods 
                      and extending average maturities when rates appear to have peaked.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-1 sm:mb-2 text-sm sm:text-base">Historical Rate Environment Context</h4>
                    <p className="text-purple-700 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4">
                      Understanding historical CD rate cycles provides context for current investment decisions 
                      and future planning. CD rates have fluctuated dramatically over decades, reflecting 
                      Federal Reserve monetary policy, inflation cycles, and economic conditions affecting 
                      deposit market competition and regulatory environments.
                    </p>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <div className="p-2 sm:p-3 bg-red-50 rounded border-l-4 border-red-400">
                        <p className="font-semibold text-red-800 text-xs sm:text-sm">High Rate Period (Late 1970s-Early 1980s)</p>
                        <p className="text-red-700 text-xs leading-relaxed">
                          CD rates reached nearly 20% during peak inflation periods of 1979-1981, providing substantial 
                          real returns for conservative investors. These exceptional rates reflected Federal Reserve 
                          efforts to combat inflation through aggressive monetary policy tightening measures.
                        </p>
                      </div>

                      <div className="p-2 sm:p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="font-semibold text-yellow-800 text-xs sm:text-sm">Recent Rate Recovery (2022-2025)</p>
                        <p className="text-yellow-700 text-xs leading-relaxed">
                          Rising inflation prompted Federal Reserve rate increases, driving CD yields above 5% by 
                          2023-2024 for the first time since 2007. This demonstrates the cyclical nature of CD 
                          rate environments and Federal Reserve monetary policy influence on deposit rates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">Strategic Investment Applications</h4>
                    <p className="text-gray-700 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed">
                      CDs serve multiple portfolio functions beyond simple savings, including emergency fund positioning, 
                      retirement income generation, and portfolio risk reduction. Understanding these applications 
                      enables strategic integration within comprehensive financial planning frameworks.
                    </p>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <div className="p-1 sm:p-2 bg-blue-50 rounded">
                        <p className="font-semibold text-blue-800 text-xs sm:text-sm">Portfolio Diversification & Risk Management</p>
                        <p className="text-blue-700 text-xs leading-relaxed">
                          CDs reduce overall portfolio volatility while providing predictable returns, particularly 
                          valuable as retirement approaches and capital preservation becomes paramount over growth objectives.
                        </p>
                      </div>
                      
                      <div className="p-1 sm:p-2 bg-green-50 rounded">
                        <p className="font-semibold text-green-800 text-xs sm:text-sm">Goal-Based Savings Strategies</p>
                        <p className="text-green-700 text-xs leading-relaxed">
                          Short to medium-term objectives like home down payments, vehicle purchases, or education funding 
                          benefit from CD certainty, eliminating market risk that could compromise goal achievement timing.
                        </p>
                      </div>
                      
                      <div className="p-1 sm:p-2 bg-purple-50 rounded">
                        <p className="font-semibold text-purple-800 text-xs sm:text-sm">Cash Flow & Liquidity Management</p>
                        <p className="text-purple-700 text-xs leading-relaxed">
                          CD laddering provides systematic liquidity while maximizing yield on temporary cash positions, 
                          supporting business operations and personal financial flexibility requirements.
                        </p>
                      </div>
                    </div>
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

export default CdCalculatorComponent;