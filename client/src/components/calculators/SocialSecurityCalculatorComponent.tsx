import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, TrendingUp, AlertCircle, Users, Calculator, Shield } from 'lucide-react';

const SocialSecurityCalculatorComponent = () => {
  // Scenario 1: Determine Ideal Application Age
  const [birthYear, setBirthYear] = useState('1970');
  const [lifeExpectancy, setLifeExpectancy] = useState('83');
  const [investmentReturn, setInvestmentReturn] = useState('5');
  const [colaRate, setColaRate] = useState('3');

  // Scenario 2: Compare Two Application Ages
  const [claimAge1, setClaimAge1] = useState('62');
  const [monthlyPayment1, setMonthlyPayment1] = useState('1600');
  const [claimAge2, setClaimAge2] = useState('70');
  const [monthlyPayment2, setMonthlyPayment2] = useState('2810');
  const [scenario2Return, setScenario2Return] = useState('5');
  const [scenario2COLA, setScenario2COLA] = useState('3');

  // Full Retirement Age lookup table based on birth year
  const getFullRetirementAge = (year: number): number => {
    if (year <= 1937) return 65;
    if (year >= 1938 && year <= 1942) return 65 + (year - 1937) * 2 / 12;
    if (year >= 1943 && year <= 1954) return 66;
    if (year >= 1955 && year <= 1959) return 66 + (year - 1954) * 2 / 12;
    if (year >= 1960) return 67;
    return 67;
  };

  // Calculate benefit reduction/increase based on claim age vs FRA
  const getBenefitMultiplier = (claimAge: number, fra: number): number => {
    if (claimAge < fra) {
      // Early claiming - reduction
      const monthsEarly = (fra - claimAge) * 12;
      if (monthsEarly <= 36) {
        // First 36 months: 5/9 of 1% per month
        return 1 - (monthsEarly * 5 / 9 / 100);
      } else {
        // Beyond 36 months: 5/12 of 1% per month for excess
        const firstReduction = 36 * 5 / 9 / 100;
        const additionalReduction = (monthsEarly - 36) * 5 / 12 / 100;
        return 1 - (firstReduction + additionalReduction);
      }
    } else if (claimAge > fra) {
      // Delayed claiming - increase of 8% per year (2/3% per month) up to age 70
      const yearsDelayed = Math.min(claimAge - fra, 70 - fra);
      return 1 + (yearsDelayed * 0.08);
    }
    return 1; // Claiming at FRA
  };

  // Estimate monthly benefit at FRA based on average scenarios
  const estimateFRABenefit = (year: number): number => {
    // Average PIA (Primary Insurance Amount) for middle-income earner
    // This is a simplified estimate; actual benefits vary widely
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Base on 2024 average SS benefit of ~$1,907/month
    // Adjust for future years assuming 3% annual increase
    const yearsToRetirement = Math.max(0, 67 - age);
    const inflationFactor = Math.pow(1.03, yearsToRetirement);
    
    return 1907 * inflationFactor;
  };

  // Scenario 1 Calculations: Determine Ideal Age
  const scenario1Results = useMemo(() => {
    const year = parseInt(birthYear || '1970');
    const lifeExp = parseInt(lifeExpectancy || '83');
    const returnRate = parseFloat(investmentReturn || '0') / 100;
    const cola = parseFloat(colaRate || '0') / 100;
    
    const fra = getFullRetirementAge(year);
    const estimatedFRABenefit = estimateFRABenefit(year);
    
    // Calculate cumulative benefits for each possible claim age (62-70)
    const ageAnalysis = [];
    let bestAge = 62;
    let bestValue = 0;
    
    for (let claimAge = 62; claimAge <= 70; claimAge++) {
      if (claimAge > lifeExp) continue;
      
      const multiplier = getBenefitMultiplier(claimAge, fra);
      const monthlyBenefit = estimatedFRABenefit * multiplier;
      const yearsReceiving = lifeExp - claimAge;
      
      // Calculate present value of all benefits with COLA
      let presentValue = 0;
      let currentMonthly = monthlyBenefit;
      
      for (let year = 0; year < yearsReceiving; year++) {
        const annualBenefit = currentMonthly * 12;
        const discountFactor = Math.pow(1 + returnRate, -(year));
        presentValue += annualBenefit * discountFactor;
        currentMonthly *= (1 + cola);
      }
      
      // Calculate total nominal value (not discounted)
      let totalNominal = 0;
      currentMonthly = monthlyBenefit;
      for (let year = 0; year < yearsReceiving; year++) {
        totalNominal += currentMonthly * 12;
        currentMonthly *= (1 + cola);
      }
      
      ageAnalysis.push({
        age: claimAge,
        monthlyBenefit,
        presentValue,
        totalNominal,
        yearsReceiving,
        multiplier
      });
      
      if (presentValue > bestValue) {
        bestValue = presentValue;
        bestAge = claimAge;
      }
    }
    
    return {
      fra,
      estimatedFRABenefit,
      ageAnalysis,
      bestAge,
      bestValue,
      bestMonthlyBenefit: ageAnalysis.find(a => a.age === bestAge)?.monthlyBenefit || 0
    };
  }, [birthYear, lifeExpectancy, investmentReturn, colaRate]);

  // Scenario 2 Calculations: Compare Two Ages
  const scenario2Results = useMemo(() => {
    const age1 = parseInt(claimAge1 || '62');
    const payment1 = parseFloat(monthlyPayment1 || '0');
    const age2 = parseInt(claimAge2 || '70');
    const payment2 = parseFloat(monthlyPayment2 || '0');
    const returnRate = parseFloat(scenario2Return || '0') / 100;
    const cola = parseFloat(scenario2COLA || '0') / 100;
    
    // Assume life expectancy of 85 for comparison
    const lifeExp = 85;
    
    // Option 1: Claim at earlier age
    const years1 = Math.max(0, lifeExp - age1);
    let pv1 = 0;
    let total1 = 0;
    let currentPayment1 = payment1;
    
    for (let year = 0; year < years1; year++) {
      const annualBenefit = currentPayment1 * 12;
      pv1 += annualBenefit / Math.pow(1 + returnRate, year);
      total1 += annualBenefit;
      currentPayment1 *= (1 + cola);
    }
    
    // Option 2: Claim at later age
    const years2 = Math.max(0, lifeExp - age2);
    const delayYears = age2 - age1;
    let pv2 = 0;
    let total2 = 0;
    let currentPayment2 = payment2;
    
    for (let year = 0; year < years2; year++) {
      const annualBenefit = currentPayment2 * 12;
      // Discount by both the year and the delay
      pv2 += annualBenefit / Math.pow(1 + returnRate, year + delayYears);
      total2 += annualBenefit;
      currentPayment2 *= (1 + cola);
    }
    
    // Find break-even age
    let breakEvenAge = age2;
    let cumulative1 = 0;
    let cumulative2 = 0;
    
    for (let age = age1; age <= lifeExp; age++) {
      const yearsFrom1 = age - age1;
      const yearsFrom2 = Math.max(0, age - age2);
      
      if (yearsFrom1 >= 0) {
        cumulative1 = (payment1 * 12 * (Math.pow(1 + cola, yearsFrom1 + 1) - 1)) / cola;
      }
      
      if (yearsFrom2 > 0) {
        cumulative2 = (payment2 * 12 * (Math.pow(1 + cola, yearsFrom2 + 1) - 1)) / cola;
      }
      
      if (cumulative2 >= cumulative1 && age >= age2) {
        breakEvenAge = age;
        break;
      }
    }
    
    const difference = pv2 - pv1;
    const betterOption = difference > 0 ? 2 : 1;
    
    return {
      option1: {
        claimAge: age1,
        monthlyPayment: payment1,
        yearsReceiving: years1,
        presentValue: pv1,
        totalNominal: total1
      },
      option2: {
        claimAge: age2,
        monthlyPayment: payment2,
        yearsReceiving: years2,
        presentValue: pv2,
        totalNominal: total2
      },
      difference: Math.abs(difference),
      betterOption,
      breakEvenAge,
      delayYears
    };
  }, [claimAge1, monthlyPayment1, claimAge2, monthlyPayment2, scenario2Return, scenario2COLA]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Shield className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Social Security Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          The U.S. Social Security website provides calculators for various purposes. This tool is designed to help 
          determine the ideal (financially speaking) age at which you should apply for Social Security retirement 
          benefits between ages 62-70.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Note:</strong> This calculator is intended for U.S. Social Security purposes only. Results are 
            estimates based on assumptions and should not be considered financial advice.
          </p>
        </div>
      </div>

      {/* Two Scenarios Tabs */}
      <Tabs defaultValue="scenario1" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto gap-2">
          <TabsTrigger value="scenario1" className="text-xs sm:text-sm p-2 sm:p-3">
            <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
            Determine Ideal Application Age
          </TabsTrigger>
          <TabsTrigger value="scenario2" className="text-xs sm:text-sm p-2 sm:p-3">
            <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
            Compare Two Application Ages
          </TabsTrigger>
        </TabsList>

        {/* Scenario 1: Determine Ideal Age */}
        <TabsContent value="scenario1" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl sm:text-2xl text-blue-900">
                Determine the Ideal Application Age
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Calculate the optimal age to apply for Social Security based on your life expectancy and investment returns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthYear" className="text-xs sm:text-sm font-medium">
                    Your Birth Year
                  </Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="text-sm sm:text-base"
                    placeholder="1970"
                  />
                  <p className="text-xs text-gray-500">
                    Your Full Retirement Age: {scenario1Results.fra.toFixed(1)} years
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifeExpectancy" className="text-xs sm:text-sm font-medium">
                    Your Life Expectancy
                  </Label>
                  <Input
                    id="lifeExpectancy"
                    type="number"
                    value={lifeExpectancy}
                    onChange={(e) => setLifeExpectancy(e.target.value)}
                    className="text-sm sm:text-base"
                    placeholder="83"
                  />
                  <p className="text-xs text-gray-500">Average U.S. life expectancy: ~77 years</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentReturn" className="text-xs sm:text-sm font-medium">
                    Your Investment Return
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="investmentReturn"
                      type="number"
                      step="0.1"
                      value={investmentReturn}
                      onChange={(e) => setInvestmentReturn(e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="5"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colaRate" className="text-xs sm:text-sm font-medium">
                    Cost-of-Living Adjustment (COLA)*
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="colaRate"
                      type="number"
                      step="0.1"
                      value={colaRate}
                      onChange={(e) => setColaRate(e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="3"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                  </div>
                  <p className="text-xs text-gray-500">Annual increase in benefits to match inflation</p>
                </div>
              </div>

              {/* Main Result */}
              <Card className="border-2 shadow-xl bg-gradient-to-r from-green-50 to-green-100 border-green-500">
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      🎯 Optimal Claiming Age
                    </h3>
                    <div className="text-5xl sm:text-6xl md:text-7xl font-bold text-green-700">
                      {scenario1Results.bestAge}
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      Years old - maximizes present value of lifetime benefits
                    </p>
                    <div className="bg-white p-4 rounded-lg border border-green-300 mt-4">
                      <p className="text-xs sm:text-sm text-gray-700 mb-2">
                        Estimated Monthly Benefit at Age {scenario1Results.bestAge}:
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-700">
                        ${scenario1Results.bestMonthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Present Value of Lifetime Benefits: ${scenario1Results.bestValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Age Comparison Table */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-base sm:text-lg">Benefit Analysis by Claiming Age</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Compare benefits at different claiming ages (62-70)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="text-left p-2 font-bold">Claim Age</th>
                          <th className="text-right p-2 font-bold">Monthly Benefit</th>
                          <th className="text-right p-2 font-bold">Years Receiving</th>
                          <th className="text-right p-2 font-bold">Present Value</th>
                          <th className="text-right p-2 font-bold">Total Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {scenario1Results.ageAnalysis.map((row) => (
                          <tr 
                            key={row.age} 
                            className={`hover:bg-gray-50 ${row.age === scenario1Results.bestAge ? 'bg-green-50 font-bold' : ''}`}
                          >
                            <td className="p-2">
                              {row.age} {row.age === scenario1Results.bestAge && '🎯'}
                              {row.age === scenario1Results.fra && ' (FRA)'}
                            </td>
                            <td className="text-right p-2">
                              ${row.monthlyBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="text-right p-2">{row.yearsReceiving} years</td>
                            <td className="text-right p-2">
                              ${row.presentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                            <td className="text-right p-2">
                              ${row.totalNominal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-4">
                    <p className="text-xs text-blue-900">
                      <strong>Note:</strong> FRA = Full Retirement Age. Claiming before FRA reduces benefits; 
                      delaying past FRA increases benefits by 8% per year until age 70.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card className="shadow-lg border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                  <CardTitle className="text-base sm:text-lg text-purple-900">Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Full Retirement Age (FRA):</strong> Age {scenario1Results.fra.toFixed(1)} for someone 
                        born in {birthYear}. Claiming at FRA gives you 100% of your benefit.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Early Claiming (Age 62):</strong> You can claim as early as 62, but benefits are reduced 
                        by ~30% compared to FRA. Good if you need income immediately or have shorter life expectancy.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Delayed Claiming (Age 70):</strong> For each year you delay past FRA (up to 70), benefits 
                        increase by 8%. At 70, benefits are ~24-32% higher than FRA depending on your FRA.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Break-Even Analysis:</strong> If you live past the break-even age, delaying benefits 
                        results in more total lifetime income. The longer you live, the more valuable delayed claiming becomes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 2: Compare Two Ages */}
        <TabsContent value="scenario2" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <CardTitle className="text-xl sm:text-2xl text-purple-900">
                Compare Two Application Ages
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Compare the financial difference between two Social Security claim ages with actual benefit estimates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Option 1 */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-200">
                    <CardTitle className="text-base sm:text-lg text-green-900">
                      Social Security Claim Option 1
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="claimAge1" className="text-xs sm:text-sm font-medium">
                        Retirement Age
                      </Label>
                      <Input
                        id="claimAge1"
                        type="number"
                        value={claimAge1}
                        onChange={(e) => setClaimAge1(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="62"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyPayment1" className="text-xs sm:text-sm font-medium">
                        Monthly Payment
                      </Label>
                      <Input
                        id="monthlyPayment1"
                        type="number"
                        value={monthlyPayment1}
                        onChange={(e) => setMonthlyPayment1(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="1600"
                      />
                      <p className="text-xs text-gray-600">
                        Get estimates from SSA.gov or your Social Security statement
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Option 2 */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
                    <CardTitle className="text-base sm:text-lg text-blue-900">
                      Social Security Claim Option 2 (Work Longer)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="claimAge2" className="text-xs sm:text-sm font-medium">
                        Retirement Age
                      </Label>
                      <Input
                        id="claimAge2"
                        type="number"
                        value={claimAge2}
                        onChange={(e) => setClaimAge2(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyPayment2" className="text-xs sm:text-sm font-medium">
                        Monthly Payment
                      </Label>
                      <Input
                        id="monthlyPayment2"
                        type="number"
                        value={monthlyPayment2}
                        onChange={(e) => setMonthlyPayment2(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="2810"
                      />
                      <p className="text-xs text-gray-600">
                        Higher payment due to delayed retirement credits
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Other Information */}
              <Card className="border-2 border-gray-200">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-base sm:text-lg">Other Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scenario2Return" className="text-xs sm:text-sm font-medium">
                        Your Investment Return
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="scenario2Return"
                          type="number"
                          step="0.1"
                          value={scenario2Return}
                          onChange={(e) => setScenario2Return(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scenario2COLA" className="text-xs sm:text-sm font-medium">
                        Cost-of-Living Adjustment (COLA)*
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="scenario2COLA"
                          type="number"
                          step="0.1"
                          value={scenario2COLA}
                          onChange={(e) => setScenario2COLA(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="3"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Result */}
              <Card className={`border-2 shadow-xl ${scenario2Results.betterOption === 2 ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Better Option: Claim at Age {scenario2Results.betterOption === 2 ? scenario2Results.option2.claimAge : scenario2Results.option1.claimAge}
                    </h3>
                    <div className="text-4xl sm:text-5xl md:text-6xl font-bold">
                      <span className={scenario2Results.betterOption === 2 ? 'text-blue-700' : 'text-green-700'}>
                        ${scenario2Results.difference.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      Advantage in present value terms (assumes life expectancy of 85)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Comparison */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-base sm:text-lg">Detailed Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 1 - Monthly Benefit</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        ${scenario2Results.option1.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Claiming at age {scenario2Results.option1.claimAge}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 2 - Monthly Benefit</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        ${scenario2Results.option2.monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}/month
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Claiming at age {scenario2Results.option2.claimAge}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 1 - Total Lifetime Benefits</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">
                        ${scenario2Results.option1.totalNominal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Over {scenario2Results.option1.yearsReceiving} years
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 2 - Total Lifetime Benefits</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        ${scenario2Results.option2.totalNominal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Over {scenario2Results.option2.yearsReceiving} years
                      </p>
                    </div>

                    <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 1 - Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-cyan-700">
                        ${scenario2Results.option1.presentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 2 - Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-indigo-700">
                        ${scenario2Results.option2.presentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mt-4">
                    <p className="text-xs sm:text-sm text-yellow-900">
                      <strong>⏰ Break-Even Age: {scenario2Results.breakEvenAge}</strong><br />
                      If you live past age {scenario2Results.breakEvenAge}, Option {scenario2Results.betterOption} provides 
                      more total lifetime benefits. By delaying {scenario2Results.delayYears} years, you increase monthly 
                      benefits by ${(scenario2Results.option2.monthlyPayment - scenario2Results.option1.monthlyPayment).toLocaleString()}/month.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Educational Content */}
      <div className="space-y-6 mt-8">
        {/* COLA Explanation */}
        <Card className="shadow-lg border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
              <TrendingUp className="w-6 h-6" />
              Cost-of-Living Adjustment (COLA)*
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <strong>Cost-of-Living Adjustment (COLA)</strong> is an annual increase applied to Social Security benefits 
              to account for inflation. COLA ensures that the purchasing power of SS and Supplemental Security Income (SSI) 
              remains equivalent to previous years.
            </p>

            <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg border border-cyan-200">
              <h4 className="font-bold text-sm sm:text-base text-cyan-900 mb-2">How COLA Works</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Based on the Consumer Price Index for Urban Wage Earners and Clerical Workers (CPI-W)</li>
                <li>• Calculated from Q3 of last year to Q3 of current year</li>
                <li>• If there's no increase in CPI-W, there is no COLA</li>
                <li>• Automatic adjustment - no action required from beneficiaries</li>
                <li>• Protects purchasing power over decades of retirement</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Recent COLA History</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-gray-600">2021</p>
                  <p className="font-bold text-sm text-blue-900">1.3%</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-gray-600">2022</p>
                  <p className="font-bold text-sm text-green-900">5.9%</p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <p className="text-xs text-gray-600">2023</p>
                  <p className="font-bold text-sm text-purple-900">8.7%</p>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <p className="text-xs text-gray-600">2024</p>
                  <p className="font-bold text-sm text-orange-900">3.2%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What is Social Security? */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <Shield className="w-6 h-6" />
              Social Security in the U.S.
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              The term <strong>"Social Security"</strong> refers to the U.S. system that provides monetary assistance to 
              people with inadequate or no income. Think of it as the "financial security of society." Officially known 
              as <strong>Old Age, Survivors, and Disability Insurance (OASDI)</strong>, Social Security plays a vital role 
              in keeping older Americans out of poverty.
            </p>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-2">Historical Background</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• <strong>1935:</strong> Social Security Act established by President Franklin Roosevelt during the Great Depression</li>
                <li>• <strong>January 1937:</strong> First taxes collected</li>
                <li>• <strong>1939:</strong> Survivors benefits added for retiree's spouse and children</li>
                <li>• <strong>1956:</strong> Disability benefits added to the program</li>
                <li>• Originally just a retirement program, now covers retirement, disability, and survivors</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Role in Retirement</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                Social Security is designed to replace approximately <strong>40% of pre-retirement income</strong> for 
                average workers. It was never intended to be a complete replacement of income.
              </p>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                <li>• Lower-wage earners receive higher relative benefits than higher-wage earners</li>
                <li>• Progressive benefit formula favors those who need it most</li>
                <li>• For most retirees, SS is their major source of income</li>
                <li>• For many, it's their only source of retirement income</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Social Security Facts */}
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="text-green-900 text-lg sm:text-xl">
              Social Security Facts & Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-700" />
                  <h4 className="font-bold text-sm sm:text-base text-green-900">Contributors</h4>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-700 mb-1">~169 million</p>
                <p className="text-xs sm:text-sm text-gray-700">Americans pay Social Security taxes</p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-sm sm:text-base text-blue-900">Beneficiaries</h4>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">~65 million</p>
                <p className="text-xs sm:text-sm text-gray-700">About 1 in 5 Americans collect monthly benefits</p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-700" />
                  <h4 className="font-bold text-sm sm:text-base text-purple-900">Dependency</h4>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-700 mb-1">3 out of 5</p>
                <p className="text-xs sm:text-sm text-gray-700">SS beneficiaries rely on it for more than half their income</p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-5 h-5 text-orange-700" />
                  <h4 className="font-bold text-sm sm:text-base text-orange-900">Efficiency</h4>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-orange-700 mb-1">~1%</p>
                <p className="text-xs sm:text-sm text-gray-700">Administrative costs as percentage of total expenditure</p>
              </div>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200 mt-4">
              <p className="text-xs sm:text-sm text-green-900">
                <strong>📊 Key Stat:</strong> About 1 out of 4 families receive benefits from Social Security, making it 
                one of the most widespread government programs in the United States.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Security Tax */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
              <DollarSign className="w-6 h-6" />
              How Social Security is Funded
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Social Security operates on a <strong>pay-as-you-go system</strong>: today's workforce pays SS taxes, and 
              those funds are distributed to today's beneficiaries. The program is funded primarily through payroll taxes 
              collected under the <strong>Federal Insurance Contributions Act (FICA)</strong>.
            </p>

            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-2">FICA Tax Rates (2024)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border border-purple-300">
                  <p className="text-xs text-gray-600 mb-1">Employee Contribution</p>
                  <p className="text-2xl font-bold text-purple-900">6.2%</p>
                  <p className="text-xs text-gray-600 mt-1">Of wages</p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-300">
                  <p className="text-xs text-gray-600 mb-1">Employer Contribution</p>
                  <p className="text-2xl font-bold text-purple-900">6.2%</p>
                  <p className="text-xs text-gray-600 mt-1">Of wages</p>
                </div>
                <div className="bg-white p-3 rounded border border-purple-300">
                  <p className="text-xs text-gray-600 mb-1">Self-Employed</p>
                  <p className="text-2xl font-bold text-purple-900">12.4%</p>
                  <p className="text-xs text-gray-600 mt-1">Total (both parts)</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">2024 Wage Cap</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                SS taxes are only collected on earnings up to <strong>$168,600</strong> in 2024. Earnings above this 
                level are not subject to Social Security tax.
              </p>
              <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                <p className="text-xs text-gray-700">
                  <strong>Maximum Tax in 2024:</strong>
                </p>
                <ul className="text-xs text-gray-700 mt-1 ml-4">
                  <li>• Employees: $10,453.20 (6.2% of $168,600)</li>
                  <li>• Self-employed: $20,906.40 (12.4% of $168,600)</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <h4 className="font-bold text-sm sm:text-base text-yellow-900 mb-2">How Your Dollar is Spent</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                For every dollar contributed towards Social Security:
              </p>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>72 cents</strong> → Retirement benefits for retirees and their families</li>
                <li>• <strong>16 cents</strong> → Disability benefits</li>
                <li>• <strong>9 cents</strong> → Survivor's benefits</li>
                <li>• <strong>Less than 1 cent</strong> → Administrative costs</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-2">Other Revenue Sources</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• <strong>~90%</strong> from payroll taxes (main source)</li>
                <li>• Income taxes on benefits paid to higher-income earners</li>
                <li>• Interest earned on trust fund reserves invested in U.S. Treasury bonds</li>
                <li>• Excess funds are loaned to U.S. Treasury</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Income Tax on Benefits */}
        <Card className="shadow-lg border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg sm:text-xl">
              <AlertCircle className="w-6 h-6" />
              Income Tax on Social Security Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Not all Social Security benefits are tax-free. Whether your benefits are taxable depends on your 
              <strong> combined income</strong>, which includes adjusted gross income, nontaxable interest, and 
              half of your SS benefits. Note: Roth IRA withdrawals do NOT count toward combined income.
            </p>

            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
              <h4 className="font-bold text-sm sm:text-base text-orange-900 mb-2">2024 Tax Thresholds</h4>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded border border-orange-300">
                  <p className="font-bold text-sm text-green-900 mb-1">No Tax</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4">
                    <li>• Single filers: Combined income under $25,000</li>
                    <li>• Married filing jointly: Combined income under $32,000</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-orange-300">
                  <p className="font-bold text-sm text-yellow-900 mb-1">Up to 50% Taxable</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4">
                    <li>• Single filers: Combined income $25,000 - $34,000</li>
                    <li>• Married filing jointly: Combined income $32,000 - $44,000</li>
                  </ul>
                </div>

                <div className="bg-white p-3 rounded border border-orange-300">
                  <p className="font-bold text-sm text-red-900 mb-1">Up to 85% Taxable</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4">
                    <li>• Single filers: Combined income over $34,000</li>
                    <li>• Married filing jointly: Combined income over $44,000</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>💡 Planning Tip:</strong> If you have other retirement income sources (401k, IRA, pensions, 
                investment income), your SS benefits will likely be taxed. Consider Roth conversions before retirement 
                to create tax-free income that doesn't increase combined income.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Who is Exempt */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200">
            <CardTitle className="text-red-900 text-lg sm:text-xl">
              Who is Exempt from Social Security Tax?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-bold text-sm text-red-900 mb-1">Religious Groups</p>
                <p className="text-xs sm:text-sm text-gray-700">
                  Members of religious groups that oppose receiving Social Security benefits during retirement can be exempt.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-bold text-sm text-red-900 mb-1">State & Local Government Workers</p>
                <p className="text-xs sm:text-sm text-gray-700">
                  Some state/local employees whose employers provide their own public pension systems that operate 
                  similarly to SS. This allows employees to fund their employer's plans instead.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-bold text-sm text-red-900 mb-1">Nonresident Aliens</p>
                <p className="text-xs sm:text-sm text-gray-700">
                  International employees working in the U.S. temporarily or international students in the U.S. temporarily.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-bold text-sm text-red-900 mb-1">Student Employees</p>
                <p className="text-xs sm:text-sm text-gray-700">
                  Students employed at the same school in which they are enrolled, whose employment is contingent on 
                  continued enrollment.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-bold text-sm text-red-900 mb-1">Disabled or Deceased</p>
                <p className="text-xs sm:text-sm text-gray-700">
                  Those who are disabled, deceased, or already receiving certain disability benefits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Retirement Age */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
              <Calendar className="w-6 h-6" />
              Understanding Full Retirement Age (FRA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <strong>Full Retirement Age (FRA)</strong>, sometimes called normal retirement age, is the minimum age at 
              which a person is entitled to full or unreduced retirement benefits from Social Security. FRA varies based 
              on your birth year.
            </p>

            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-sm sm:text-base text-indigo-900 mb-2">FRA by Birth Year</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-indigo-100 border-b-2 border-indigo-300">
                    <tr>
                      <th className="text-left p-2 font-bold">Birth Year</th>
                      <th className="text-center p-2 font-bold">Full Retirement Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1937 or earlier</td>
                      <td className="text-center p-2">65</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1943-1954</td>
                      <td className="text-center p-2">66</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1955</td>
                      <td className="text-center p-2">66 and 2 months</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1956</td>
                      <td className="text-center p-2">66 and 4 months</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1957</td>
                      <td className="text-center p-2">66 and 6 months</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1958</td>
                      <td className="text-center p-2">66 and 8 months</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-2">1959</td>
                      <td className="text-center p-2">66 and 10 months</td>
                    </tr>
                    <tr className="hover:bg-gray-50 bg-green-50">
                      <td className="p-2 font-bold">1960 or later</td>
                      <td className="text-center p-2 font-bold">67</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <h4 className="font-bold text-sm text-red-900 mb-1">Early Claiming (Age 62)</h4>
                <p className="text-xs text-gray-700">
                  Benefits reduced by up to <strong>30%</strong> if claimed at 62 vs FRA 67. Reduction is permanent.
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-bold text-sm text-blue-900 mb-1">At FRA</h4>
                <p className="text-xs text-gray-700">
                  Receive <strong>100%</strong> of your benefit. No reduction, no increase. Your calculated PIA amount.
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h4 className="font-bold text-sm text-green-900 mb-1">Delayed (Age 70)</h4>
                <p className="text-xs text-gray-700">
                  Benefits increased by <strong>8% per year</strong> delayed past FRA, up to age 70. No benefit to delay past 70.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* When to Apply */}
        <Card className="shadow-lg border-2 border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b-2 border-emerald-200">
            <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg sm:text-xl">
              <Calculator className="w-6 h-6" />
              When Should You Apply for Benefits?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              You can apply for Social Security retirement benefits as early as 61 years and 9 months old. The SSA will 
              process applications up to 4 months before benefits begin. When determining the ideal age to apply, consider 
              multiple factors:
            </p>

            <div className="space-y-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">💰 Immediate Need for Cash</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  If you're struggling financially at 62 with no other income, claiming early makes sense despite reduced 
                  benefits. Survival today trumps optimization for tomorrow.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">⏰ Life Expectancy</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Shorter life expectancy favors early claiming. If you don't expect to live long, receive benefits sooner. 
                  Longer life expectancy favors delayed claiming for higher monthly payments.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">💼 Current Earned Income</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  If you're still working before FRA and earning above the limit ($22,320 in 2024), $1 is deducted from 
                  benefits for every $2 earned above the limit. After FRA, no earnings limit applies.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">💑 Marital Status & Spousal Benefits</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Married couples should coordinate claiming strategies. A high-earning spouse delaying to 70 maximizes 
                  survivor benefits for the surviving spouse. The lower-earning spouse might claim earlier.
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">📊 Financial Health</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  Adequate savings and good health allow you to delay claiming. If you can afford to wait until 70, 
                  you'll maximize lifetime benefits (if you live long enough).
                </p>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">👥 Relative Age & Health of Spouse</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  If one spouse is significantly younger and healthier, the high earner should delay to maximize survivor 
                  benefits that will last for the younger spouse's lifetime.
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-300">
              <p className="text-xs sm:text-sm text-emerald-900 font-medium">
                ⚠️ <strong>One Reconsideration Allowed:</strong> You can withdraw your application within 12 months of 
                starting benefits if you repay all received distributions. SSA only allows this once in your lifetime.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Security Credits */}
        <Card className="shadow-lg border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
            <CardTitle className="text-cyan-900 text-lg sm:text-xl">
              Earning Social Security Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              To qualify for Social Security retirement benefits, you must earn <strong>credits</strong> (also called 
              quarters of coverage) through your work history.
            </p>

            <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg border border-cyan-200">
              <h4 className="font-bold text-sm sm:text-base text-cyan-900 mb-2">How Credits Work</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Maximum of <strong>4 credits</strong> can be earned per year</li>
                <li>• In 2024, you earn 1 credit for each <strong>$1,730</strong> in taxable income</li>
                <li>• Earning <strong>$6,920</strong> in 2024 = all 4 credits for the year</li>
                <li>• Typically need <strong>40 credits</strong> (10 years of work) to be eligible for retirement benefits</li>
                <li>• Once earned, credits cannot be lost</li>
                <li>• The earnings threshold increases annually with wage inflation</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">📊 Quick Example</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                A person earning $30,000 per year:
              </p>
              <ul className="text-xs text-gray-700 space-y-1 ml-4">
                <li>• Earns 4 credits per year (maximum allowed)</li>
                <li>• After 10 years of work = 40 credits</li>
                <li>• Eligible for retirement benefits ✓</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>Note:</strong> Certain jobs that don't require SS tax payment cannot earn credits. This includes 
                some state and local government workers who contribute to different retirement systems.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Spousal & Survivor Benefits */}
        <Card className="shadow-lg border-2 border-pink-200">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-2 border-pink-200">
            <CardTitle className="flex items-center gap-2 text-pink-900 text-lg sm:text-xl">
              <Users className="w-6 h-6" />
              Spousal and Survivor Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Social Security provides benefits not just for workers, but also for spouses, ex-spouses, widows, and widowers.
            </p>

            <div className="bg-pink-50 p-3 sm:p-4 rounded-lg border border-pink-200">
              <h4 className="font-bold text-sm sm:text-base text-pink-900 mb-2">Spousal Benefits</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Available to current spouses aged <strong>62 or older</strong></li>
                <li>• Can receive up to <strong>50% of working spouse's benefit</strong> at FRA</li>
                <li>• Working spouse must have filed for their own benefits first</li>
                <li>• Non-working spouse can claim based on working spouse's earnings record</li>
                <li>• If claiming before FRA, spousal benefit is reduced</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <h4 className="font-bold text-sm sm:text-base text-blue-900 mb-2">Survivor Benefits</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Widow/widower can collect as early as <strong>age 60</strong></li>
                <li>• Marriage must have lasted more than 9 months (waived if child under 16)</li>
                <li>• Can receive deceased spouse's full benefit amount</li>
                <li>• If both spouses received SS, survivor gets the higher of the two (not both)</li>
                <li>• Can switch between your benefit and survivor benefit to maximize payments</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <h4 className="font-bold text-sm sm:text-base text-green-900 mb-2">Divorced Spouse Benefits</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                A divorced person can receive benefits based on their ex-spouse's work history if all of the following apply:
              </p>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                <li>✓ Marriage lasted at least <strong>10 years</strong></li>
                <li>✓ Currently <strong>unmarried</strong></li>
                <li>✓ Age <strong>62 or older</strong></li>
                <li>✓ Ex-spouse is entitled to SS retirement or disability benefits</li>
                <li>✓ Your own benefit would be less than what you'd receive from ex-spouse's record</li>
              </ul>
              <p className="text-xs text-gray-700 mt-2">
                <strong>Note:</strong> Ex-spouse's benefits can be claimed even if they haven't filed yet, as long as both 
                are 62+ and divorced for at least 2 years.
              </p>
            </div>

            <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-sm sm:text-base text-purple-900 mb-2">💡 Optimization Strategy for Couples</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                If one spouse was the high earner but the other is expected to live longer, consider having the high earner 
                delay claiming until age 70. This maximizes the survivor benefit that will continue for the surviving spouse's 
                entire lifetime. The lower-earning spouse can claim earlier if needed for income.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Living Abroad */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="text-indigo-900 text-lg sm:text-xl">
              Receiving Benefits Outside the U.S.
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              It is possible to receive Social Security income while living outside the United States, provided you are 
              eligible for benefits.
            </p>

            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-sm sm:text-base text-indigo-900 mb-2">Key Points for Expatriates</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• SS checks can be deposited in U.S. bank accounts</li>
                <li>• In some cases, payments can be sent directly to foreign countries</li>
                <li>• <strong>Medicare benefits are NOT available outside the U.S.</strong></li>
                <li>• Must still file U.S. tax returns (and state returns where appropriate)</li>
                <li>• Foreign country tax laws may also apply to your SS benefits</li>
                <li>• Different rules apply for resident aliens and undocumented immigrants</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>⚠️ Important:</strong> Tax obligations remain even when living abroad. Consult with international 
                tax professionals to understand both U.S. and foreign country tax implications on your SS benefits.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="shadow-lg border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
              <strong>Disclaimer:</strong> This Social Security Calculator is provided for informational and educational 
              purposes only. It should not be considered financial, tax, or legal advice. Social Security rules and benefit 
              calculations are complex and subject to change. Actual benefits depend on your complete earnings history, 
              exact birth date, claiming strategy, and other factors. This calculator provides estimates based on simplified 
              assumptions. For official benefit estimates and personalized advice, visit <strong>SSA.gov</strong>, review 
              your Social Security statement, or consult with a qualified financial advisor. Always verify information with 
              the Social Security Administration before making claiming decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialSecurityCalculatorComponent;
