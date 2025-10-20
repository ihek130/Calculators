import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Users,
  Shield,
  Info,
  AlertCircle,
  Clock
} from 'lucide-react';

interface RMDInputs {
  birthYear: number;
  rmdYear: number;
  accountBalance: number;
  spouseIsPrimaryBeneficiary: boolean;
  spouseBirthYear: number;
  estimatedReturnRate: number;
}

interface YearlyRMD {
  year: number;
  age: number;
  distributionPeriod: number;
  rmd: number;
  endBalance: number;
}

interface RMDResults {
  currentRmd: number;
  distributionPeriod: number;
  schedule: YearlyRMD[];
}

const RmdCalculatorComponent = () => {
  const [inputs, setInputs] = useState<RMDInputs>({
    birthYear: 1950,
    rmdYear: 2025,
    accountBalance: 200000,
    spouseIsPrimaryBeneficiary: false,
    spouseBirthYear: 1952,
    estimatedReturnRate: 5
  });

  const [results, setResults] = useState<RMDResults>({
    currentRmd: 0,
    distributionPeriod: 0,
    schedule: []
  });

  // IRS Uniform Lifetime Table (2022 and later)
  const uniformLifetimeTable: { [age: number]: number } = {
    72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
    81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9,
    90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3,
    99: 6.8, 100: 6.4, 101: 6.0, 102: 5.6, 103: 5.2, 104: 4.9, 105: 4.6, 106: 4.3, 107: 4.1,
    108: 3.9, 109: 3.7, 110: 3.5, 111: 3.4, 112: 3.3, 113: 3.1, 114: 3.0, 115: 2.9, 116: 2.8,
    117: 2.7, 118: 2.5, 119: 2.3, 120: 2.0
  };

  // Simplified Joint Life Expectancy Table (spouse more than 10 years younger)
  const getJointLifeExpectancy = (ownerAge: number, spouseAge: number): number => {
    const ageDiff = ownerAge - spouseAge;
    if (ageDiff <= 10) return uniformLifetimeTable[ownerAge] || 2.0;
    
    // Simplified approximation for spouse more than 10 years younger
    const baseExpectancy = uniformLifetimeTable[ownerAge] || 2.0;
    const adjustment = Math.max(0, (ageDiff - 10) * 0.5);
    return baseExpectancy + adjustment;
  };

  // Calculate RMD
  const calculateRMD = (inputs: RMDInputs): RMDResults => {
    const {
      birthYear,
      rmdYear,
      accountBalance,
      spouseIsPrimaryBeneficiary,
      spouseBirthYear,
      estimatedReturnRate
    } = inputs;

    const currentAge = rmdYear - birthYear;
    
    // RMD age requirement is 73 (as of 2023)
    if (currentAge < 73) {
      return {
        currentRmd: 0,
        distributionPeriod: 0,
        schedule: []
      };
    }

    let distributionPeriod: number;

    if (spouseIsPrimaryBeneficiary && spouseBirthYear > 0) {
      const spouseAge = rmdYear - spouseBirthYear;
      const ageDiff = currentAge - spouseAge;
      
      if (ageDiff > 10) {
        distributionPeriod = getJointLifeExpectancy(currentAge, spouseAge);
      } else {
        distributionPeriod = uniformLifetimeTable[currentAge] || 2.0;
      }
    } else {
      distributionPeriod = uniformLifetimeTable[currentAge] || 2.0;
    }

    const currentRmd = accountBalance / distributionPeriod;

    // Calculate future RMDs
    const schedule: YearlyRMD[] = [];
    let balance = accountBalance;
    const returnRate = estimatedReturnRate / 100;

    for (let year = 0; year < 50 && balance > 0; year++) {
      const age = currentAge + year;
      const yearNumber = rmdYear + year;
      
      if (age > 120) break;

      let yearDistributionPeriod: number;
      if (spouseIsPrimaryBeneficiary && spouseBirthYear > 0) {
        const spouseAge = yearNumber - spouseBirthYear;
        const ageDiff = age - spouseAge;
        yearDistributionPeriod = ageDiff > 10 
          ? getJointLifeExpectancy(age, spouseAge)
          : (uniformLifetimeTable[age] || 2.0);
      } else {
        yearDistributionPeriod = uniformLifetimeTable[age] || 2.0;
      }

      const yearRmd = balance / yearDistributionPeriod;
      
      // Apply growth and subtract RMD
      balance = balance * (1 + returnRate) - yearRmd;
      
      if (balance < 0) balance = 0;

      schedule.push({
        year: yearNumber,
        age: age,
        distributionPeriod: Math.round(yearDistributionPeriod * 10) / 10,
        rmd: Math.round(yearRmd * 100) / 100,
        endBalance: Math.round(balance * 100) / 100
      });

      if (balance < 1) break;
    }

    return {
      currentRmd: Math.round(currentRmd * 100) / 100,
      distributionPeriod: Math.round(distributionPeriod * 10) / 10,
      schedule
    };
  };

  // Handle input changes
  const handleInputChange = (field: keyof RMDInputs, value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      setInputs(prev => ({ ...prev, [field]: value }));
      return;
    }

    // For year fields, allow empty string or any number input without validation during typing
    if (field === 'birthYear' || field === 'spouseBirthYear' || field === 'rmdYear') {
      const numValue = typeof value === 'string' ? (value === '' ? 0 : parseFloat(value) || 0) : value;
      setInputs(prev => ({ ...prev, [field]: numValue }));
      return;
    }

    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    
    // Input validation with bounds (only for non-year fields)
    const validatedValue = (() => {
      switch (field) {
        case 'accountBalance':
          return Math.max(0, Math.min(numValue, 100000000));
        case 'estimatedReturnRate':
          return Math.max(0, Math.min(numValue, 30));
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    const calculationResults = calculateRMD(inputs);
    setResults(calculationResults);
  }, [inputs]);

  const currentAge = inputs.rmdYear - inputs.birthYear;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 via-orange-50 to-red-50">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            RMD Calculator
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Once you reach age 73, the IRS requires retirement account holders to withdraw a minimum amount each year. 
            This calculator determines your Required Minimum Distribution based on IRS Publication 590-B.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-orange-600" />
                RMD Parameters
              </CardTitle>
              <CardDescription className="text-sm">
                Modify the values and calculate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Year of Birth */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Your Year of Birth
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.birthYear}
                    onChange={(e) => handleInputChange('birthYear', e.target.value)}
                    className="pl-10"
                    placeholder="1950"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your current age: {currentAge}
                </p>
              </div>

              {/* Year of RMD */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Year of RMD
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.rmdYear}
                    onChange={(e) => handleInputChange('rmdYear', e.target.value)}
                    className="pl-10"
                    placeholder="2025"
                  />
                </div>
              </div>

              {/* Account Balance */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Account Balance as of 12/31/{inputs.rmdYear - 1}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    value={inputs.accountBalance}
                    onChange={(e) => handleInputChange('accountBalance', e.target.value)}
                    className="pl-10"
                    placeholder="200000"
                  />
                </div>
              </div>

              {/* Spouse is Primary Beneficiary */}
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="spouse"
                  checked={inputs.spouseIsPrimaryBeneficiary}
                  onCheckedChange={(checked) => 
                    handleInputChange('spouseIsPrimaryBeneficiary', checked as boolean)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor="spouse"
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    Is your spouse the primary beneficiary?
                  </label>
                  <p className="text-xs text-gray-600">
                    Check if spouse is sole beneficiary and 10+ years younger
                  </p>
                </div>
              </div>

              {/* Spouse's Date of Birth */}
              {inputs.spouseIsPrimaryBeneficiary && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Label className="text-sm font-medium mb-2 block">
                    Your Spouse's Year of Birth
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="number"
                      value={inputs.spouseBirthYear}
                      onChange={(e) => handleInputChange('spouseBirthYear', e.target.value)}
                      className="pl-10"
                      placeholder="1952"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Age difference: {currentAge - (inputs.rmdYear - inputs.spouseBirthYear)} years
                  </p>
                </div>
              )}

              {/* Estimated Rate of Return */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Estimated Rate of Return (Optional)
                </Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.1"
                    value={inputs.estimatedReturnRate}
                    onChange={(e) => handleInputChange('estimatedReturnRate', e.target.value)}
                    className="pl-10"
                    placeholder="5.0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used to project future account balances
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* RMD Result Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Your RMD for {inputs.rmdYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentAge < 73 ? (
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 text-lg">Not Yet Required</p>
                      <p className="text-sm text-gray-700 mt-2">
                        You are currently {currentAge} years old. RMDs are not required until you reach age 73. 
                        You will need to take your first RMD in {inputs.birthYear + 73}.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-2">Your Required Minimum Distribution</p>
                    <p className="text-5xl font-bold text-orange-600 mb-2">
                      {formatCurrency(results.currentRmd)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Distribution period: <strong>{results.distributionPeriod}</strong> years
                    </p>
                  </div>

                  {/* RMD Calculation Formula */}
                  <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">RMD Calculation</h4>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Account Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(inputs.accountBalance)}
                        </p>
                      </div>
                      <div className="text-3xl text-gray-400">÷</div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Distribution Period</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {results.distributionPeriod}
                        </p>
                      </div>
                      <div className="text-3xl text-gray-400">=</div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Required Minimum Distribution</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {formatCurrency(results.currentRmd)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Important Information */}
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">Important Deadline</p>
                        <p className="text-xs text-gray-700 mt-1">
                          You must withdraw your RMD by <strong>December 31, {inputs.rmdYear}</strong>. 
                          First-time RMDs can be delayed until April 1 of the following year, but this means 
                          taking two distributions in one year.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Future Projections Chart */}
          {currentAge >= 73 && results.schedule.length > 0 && (
            <>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Future Account Balance & RMD Projections
                  </CardTitle>
                  <CardDescription>
                    Assuming {inputs.estimatedReturnRate}% annual return and only RMD withdrawals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={results.schedule}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="age" 
                        label={{ value: 'Your Age', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        tickFormatter={formatCurrencyCompact}
                        label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Age ${label}`}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="endBalance" 
                        stroke="#10b981" 
                        fill="#d1fae5" 
                        name="Account Balance"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rmd" 
                        stroke="#f59e0b" 
                        fill="#fef3c7" 
                        name="Annual RMD"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* RMD Schedule Table */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Annual RMD Schedule
                  </CardTitle>
                  <CardDescription>
                    Year-by-year breakdown of required distributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left font-medium text-gray-700">Year</th>
                          <th className="px-3 py-3 text-left font-medium text-gray-700">Your Age</th>
                          <th className="px-3 py-3 text-right font-medium text-gray-700">
                            <span className="hidden sm:inline">Distribution Period</span>
                            <span className="sm:hidden">Dist. Period</span>
                          </th>
                          <th className="px-3 py-3 text-right font-medium text-orange-700">RMD</th>
                          <th className="px-3 py-3 text-right font-medium text-emerald-700">
                            <span className="hidden sm:inline">End of Year Balance</span>
                            <span className="sm:hidden">End Balance</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.schedule.map((row) => (
                          <tr key={row.year} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-900">{row.year}</td>
                            <td className="px-3 py-2 text-gray-700">{row.age}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{row.distributionPeriod}</td>
                            <td className="px-3 py-2 text-right text-orange-600 font-semibold">
                              {formatCurrency(row.rmd)}
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                              {formatCurrency(row.endBalance)}
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
        </div>
      </div>

      {/* Educational Content - Step 2 */}
      <div className="space-y-6">
        {/* What are RMDs */}
        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-orange-600" />
              What are Required Minimum Distributions (RMDs)?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>Required Minimum Distribution (RMD)</strong> is the minimum amount the IRS mandates you to withdraw 
              from certain tax-deferred retirement accounts each year. The specific amount varies based on your account balance 
              and life expectancy as determined by the IRS. As you withdraw your RMD, you will also pay taxes on the distribution. 
              Note that RMDs are just that: <em>required minimum</em> distributions—if you need to pull more money from your 
              accounts after reaching retirement age, you can.
            </p>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-5 rounded-lg border border-orange-200 mt-4">
              <h4 className="font-bold text-orange-900 mb-3">Why RMDs Exist</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                The IRS enforces RMDs to ensure that taxpayers don't skip out on their tax obligations. Since the money in 
                tax-deferred accounts has been growing without taxation for decades, Uncle Sam hasn't taken his cut. By requiring 
                RMDs, the government creates a "taxable event" and finally collects taxes on money that has been tax-deferred 
                for years or even decades.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h5 className="font-semibold text-blue-900 text-sm">Age 73</h5>
                </div>
                <p className="text-xs text-gray-700">
                  Current RMD age requirement (increased from 72 by SECURE Act 2.0 in 2022)
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h5 className="font-semibold text-purple-900 text-sm">Age 75 (2033)</h5>
                </div>
                <p className="text-xs text-gray-700">
                  Scheduled to increase again to age 75 starting in 2033
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h5 className="font-semibold text-red-900 text-sm">25% Penalty</h5>
                </div>
                <p className="text-xs text-gray-700">
                  Tax penalty on amounts not withdrawn (reducible to 10% if corrected within 2 years)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Dates & Deadlines */}
        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-red-600" />
              Important Dates for Taking RMDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              You're required to take your first RMD by <strong>April 1st</strong> in the calendar year after you turn 73. 
              This age was increased from 72 due to the passage of the SECURE Act 2.0 in December 2022. Prior to 2019, 
              the RMD age was 70½, then it was increased to 72 by the SECURE Act in 2019.
            </p>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-5 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-900 mb-3">RMD Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">First RMD Deadline</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Due by <strong>April 1</strong> of the year after you turn 73. The IRS allows you to delay your 
                      first withdrawal, but be careful—taking this route means you'll have to take a second RMD before 
                      December 31 of the same year. Taking two RMDs in one year creates two taxable events and might 
                      even push you into a higher tax bracket.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-red-900">Annual RMD Deadline</p>
                    <p className="text-sm text-gray-700 mt-1">
                      For every calendar year after you take your first distribution, you must withdraw your entire RMD 
                      by <strong>December 31</strong>. This deadline offers flexibility in determining when and how much 
                      you withdraw throughout the year, as long as you meet your RMD amount by year-end.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Example Timeline
              </h5>
              <p className="text-sm text-gray-700 leading-relaxed">
                After turning 73 in 2025, you can take your first RMD in 2025 or delay it until April 1, 2026. However, 
                you still need to take your second RMD by December 31, 2026, and withdraw RMDs every calendar year after 
                that by December 31.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How to Delay RMD Deadlines
              </h5>
              <p className="text-sm text-gray-700 mb-2">
                Besides delaying your first withdrawal until April 1, another way to delay your RMD is by continuing 
                employment at the company that sponsors your retirement account after your 73rd birthday.
              </p>
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> Assuming you own less than 5% of the company, you can delay your first RMD 
                until retirement. However, you'll still have to take RMDs from any other retirement accounts (like IRAs), 
                and once you leave the company, the RMD mandate kicks in for that account too.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* How RMDs are Calculated */}
        <Card className="shadow-lg border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calculator className="h-6 w-6 text-indigo-600" />
              How RMDs are Calculated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Calculating your RMD follows a straightforward process based on IRS guidelines. However, the exact IRS table 
              you'll need depends on your marital or inheritance situation.
            </p>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-4">RMD Calculation Steps</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                  <p className="text-sm text-gray-700">
                    <strong>Determine account balance</strong> as of December 31 of the prior year
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                  <p className="text-sm text-gray-700">
                    <strong>Find the distribution period</strong> (life expectancy) that corresponds to your age on the appropriate IRS table
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                  <p className="text-sm text-gray-700">
                    <strong>Divide Step 1 by Step 2</strong> to determine your RMD amount
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">IRS Uniform Lifetime Table</h5>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Use this table if:</strong>
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• You're married to a spouse less than 10 years younger</li>
                  <li>• You're single</li>
                  <li>• Your spouse is not your sole beneficiary</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  This is the most commonly used table for RMD calculations.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-3">Joint Life Expectancy Table</h5>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Use this table if:</strong>
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>• You're married to a spouse more than 10 years younger</li>
                  <li>• Your spouse is your sole beneficiary</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  This table provides longer distribution periods, resulting in lower annual RMDs.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> While it's possible to calculate your RMD by hand using IRS Publication 590-B, 
                our calculator simplifies the process. Just input the required information and we'll do the calculations 
                based on the appropriate IRS table for your situation.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Which Accounts Require RMDs */}
        <Card className="shadow-lg border-l-4 border-l-emerald-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-6 w-6 text-emerald-600" />
              What Retirement Accounts Require RMDs?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Most tax-advantaged and defined contribution retirement accounts impose RMD requirements. Understanding which 
              accounts are subject to RMDs is crucial for proper retirement planning.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-5 bg-emerald-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Accounts Subject to RMDs
                </h5>
                <ul className="space-y-2 text-sm text-emerald-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Traditional IRAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>SEP IRAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>SIMPLE IRAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Rollover IRAs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Traditional 401(k) plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Most 403(b) and 457(b) plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Variable annuities held in an IRA (qualified annuities)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Profit-sharing plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">•</span>
                    <span>Small business retirement accounts</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-purple-50 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Notable Exception: Roth IRAs
                </h5>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Roth IRAs</strong> don't require RMDs during the owner's lifetime, as these are funded with 
                  after-tax dollars. This is one of the major advantages of Roth IRAs.
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  However, <strong>Roth 401(k)s</strong> technically require RMDs, but you can roll over that 401(k) to 
                  a Roth IRA, which eliminates RMDs altogether.
                </p>
                <p className="text-xs text-gray-600">
                  Note: Inherited Roth IRAs have different rules and may require distributions within 10 years for 
                  non-spouse beneficiaries.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3">Do I Calculate RMD for Every Account?</h5>
              <p className="text-sm text-gray-700 mb-3">
                <strong>Yes.</strong> If you have several retirement accounts, you'll need to calculate your RMDs for 
                each account individually. However, you may be able to combine your total RMD and withdraw a consolidated 
                distribution from one or more accounts of the same type.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Traditional IRAs:</strong> Calculate separately, but can withdraw total from one or several traditional IRA accounts
                </p>
                <p>
                  <strong>401(k)s:</strong> Must calculate and withdraw separately for each account
                </p>
                <p>
                  <strong>403(b)s:</strong> Calculate separately, but can withdraw total from one or several 403(b) accounts
                </p>
                <p>
                  <strong>Inherited accounts:</strong> Cannot be combined with other inherited accounts from different people
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
              <p className="text-sm text-amber-900">
                <strong>Important:</strong> Taking withdrawals from a Roth IRA never satisfies RMD requirements because 
                those withdrawals aren't taxed. Additionally, pulling out more than your required minimum distribution 
                doesn't reduce your RMD obligation for future years.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Penalties & Tax Implications */}
        <Card className="shadow-lg border-l-4 border-l-rose-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-rose-600" />
              Penalties, Taxes, and Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-red-50 p-5 rounded-lg border border-rose-200">
              <h4 className="font-bold text-rose-900 mb-3">What Happens If You Don't Take RMDs?</h4>
              <p className="text-sm text-gray-700 mb-3">
                As the "R" in RMD stands for "required," there are significant penalties for failing to take your distributions.
              </p>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-rose-100">
                  <p className="font-semibold text-rose-900 mb-2">Standard Penalty: 25% Excise Tax</p>
                  <p className="text-sm text-gray-700">
                    The IRS charges a <strong>25% excise tax</strong> on the undistributed amount. If you fall short of 
                    your annual RMD by $1,000, $250 of the shortfall will incur a tax payable to the IRS as a penalty.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-rose-100">
                  <p className="font-semibold text-rose-900 mb-2">Reduced Penalty: 10% (If Corrected)</p>
                  <p className="text-sm text-gray-700">
                    If the mistake is corrected during a two-year "correction window," the penalty can be reduced to 
                    <strong> 10%</strong>. This provides some relief for those who act quickly to fix the error.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mt-4">
              <h5 className="font-semibold text-blue-900 mb-3">RMDs and Taxes</h5>
              <p className="text-sm text-gray-700 mb-3">
                Generally, RMDs are taxed as <strong>ordinary income</strong> at both state and federal levels. Withdrawals 
                count toward your total taxable income for the year in question.
              </p>
              <div className="bg-white p-4 rounded-lg border border-blue-100 mt-3">
                <p className="text-sm text-gray-700">
                  <strong>Tax Bracket Warning:</strong> If you're working or withdrawing from other accounts, RMDs may 
                  push you into a higher tax bracket. Plan your withdrawals carefully to minimize tax impact.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h5 className="font-semibold text-emerald-900 mb-3">Strategy: Roth Conversions</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Convert Traditional IRA assets to Roth IRA before reaching RMD age to avoid future RMDs.
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>✓ Pay taxes now at potentially lower rates</li>
                  <li>✓ No RMDs on Roth IRAs during your lifetime</li>
                  <li>✓ Tax-free growth and withdrawals in retirement</li>
                </ul>
              </div>

              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h5 className="font-semibold text-teal-900 mb-3">Strategy: Qualified Charitable Distributions (QCD)</h5>
                <p className="text-sm text-gray-700 mb-2">
                  Donate your entire RMD directly to charity to satisfy RMD and lower your tax bill.
                </p>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li>✓ Satisfies RMD requirement</li>
                  <li>✓ Not counted as taxable income</li>
                  <li>✓ Up to $105,000 per year (2024 limit)</li>
                  <li>✓ Benefits charity while reducing tax burden</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Brokerage Reporting Requirements
              </h5>
              <p className="text-sm text-gray-700 mb-3">
                The IRS requires brokerage firms, custodians, and trustees to offer to calculate RMDs for account holders. 
                However, the IRS also stipulates that <strong>RMD calculations and withdrawals are ultimately the taxpayer's 
                responsibility</strong>.
              </p>
              <p className="text-sm text-gray-700">
                If your brokerage makes a mistake, you can still be held liable for any penalties. While it's possible to 
                get penalties waived for "reasonable errors," there's no guarantee. That's why we recommend calculating your 
                own RMDs for each account every year—just to be on the safe side.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inherited RMDs */}
        <Card className="shadow-lg border-l-4 border-l-violet-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-violet-600" />
              Inherited RMDs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              When you inherit a retirement account with RMDs like an IRA, the rules vary significantly based on your 
              relationship with the original owner and the type of account. These rules became more complex after the 
              SECURE Act of 2019.
            </p>

            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-5 rounded-lg border border-violet-200">
              <h4 className="font-bold text-violet-900 mb-3">Ten Year Distribution Rule</h4>
              <p className="text-sm text-gray-700 mb-3">
                Post-2019, <strong>non-spouse beneficiaries</strong> must distribute the full amount of the IRA within 
                ten years after the original account holder's death. The SECURE Act of 2019 mostly eliminated the option 
                for non-spouse IRA inheritors to stretch IRA withdrawals based on their own life expectancy.
              </p>
              <div className="bg-white p-4 rounded-lg border border-violet-100">
                <p className="font-semibold text-violet-900 mb-2">Exceptions for Eligible Designated Beneficiaries:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Surviving spouses</li>
                  <li>• Minor children (until reaching majority age)</li>
                  <li>• Disabled or chronically ill persons</li>
                  <li>• Persons less than ten years younger than the original account owner</li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                  These individuals may delay or stretch RMDs, though the length of time varies by category.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Inheriting IRAs as a Spouse</h5>
                <p className="text-sm text-gray-700 mb-3">
                  Spouses have the most flexibility when inheriting an IRA. They can:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Roll into their own IRA:</strong> Continue saving and delay RMDs until they turn 73</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Use an Inherited IRA:</strong> Delay RMDs until December 31 of the year after spouse's 
                    death (if spouse was over 73) or until the spouse would have turned 73 (if under 73)</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 bg-purple-50 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-3">Inheriting Roth IRAs</h5>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>As a Spouse:</strong> Can assume inherited Roth IRAs as their own without minimum distribution 
                  requirements. Rolling over quickly is usually the best strategy.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>As a Non-Spouse:</strong> Must follow the SECURE Act's ten-year rule. However, since withdrawals 
                  are tax-free, the impact is less severe than with traditional IRAs.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
              <h5 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Inherited 401(k) Complexity
              </h5>
              <p className="text-sm text-gray-700">
                The rules for inheriting a 401(k) are more complex and vary by plan policies and state laws. Options may 
                include leaving funds in the plan, immediate removal, five-year distributions, or rolling into an Inherited 
                IRA. For larger estates, consult a financial advisor or attorney specializing in inheritance laws.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Takeaways */}
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="h-6 w-6 text-blue-600" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">✓ Start at Age 73</p>
                  <p className="text-xs text-gray-700">RMDs begin at 73 (increasing to 75 in 2033)</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm font-semibold text-emerald-900">✓ December 31 Deadline</p>
                  <p className="text-xs text-gray-700">Annual RMDs must be withdrawn by year-end</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-semibold text-purple-900">✓ Calculate for Each Account</p>
                  <p className="text-xs text-gray-700">Individual calculations required, some can be aggregated</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <p className="text-sm font-semibold text-rose-900">✗ 25% Penalty for Failure</p>
                  <p className="text-xs text-gray-700">Severe penalties apply if RMDs are not taken</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-semibold text-amber-900">✓ Roth IRAs Exempt</p>
                  <p className="text-xs text-gray-700">No RMDs during owner's lifetime for Roth IRAs</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <p className="text-sm font-semibold text-teal-900">✓ QCD Strategy Available</p>
                  <p className="text-xs text-gray-700">Donate RMD to charity to reduce tax burden</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200 mt-6">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Remember:</strong> RMDs are a critical aspect of retirement planning. Missing an RMD can result 
                in substantial penalties, while properly managing them can help optimize your tax situation. Use this 
                calculator annually to stay on top of your required distributions, and consider working with a financial 
                advisor to develop strategies like Roth conversions or qualified charitable distributions to minimize 
                your tax burden in retirement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RmdCalculatorComponent;
