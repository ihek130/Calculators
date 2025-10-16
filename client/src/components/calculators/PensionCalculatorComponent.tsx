import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Calendar, Users, AlertCircle, Heart, Calculator, FileText, Clock } from 'lucide-react';

const PensionCalculatorComponent = () => {
  // Scenario 1: Lump Sum vs Monthly Pension
  const [scenario1RetirementAge, setScenario1RetirementAge] = useState('65');
  const [lumpSumAmount, setLumpSumAmount] = useState('800000');
  const [lumpSumReturn, setLumpSumReturn] = useState('5');
  const [monthlyPension, setMonthlyPension] = useState('5000');
  const [scenario1COLA, setScenario1COLA] = useState('3.5');
  
  // Scenario 2: Single-Life vs Joint-Survivor
  const [scenario2RetirementAge, setScenario2RetirementAge] = useState('65');
  const [lifeExpectancy, setLifeExpectancy] = useState('77');
  const [spouseAge, setSpouseAge] = useState('62');
  const [spouseLifeExpectancy, setSpouseLifeExpectancy] = useState('82');
  const [singleLifePension, setSingleLifePension] = useState('5000');
  const [jointSurvivorPension, setJointSurvivorPension] = useState('3000');
  const [scenario2Return, setScenario2Return] = useState('5');
  const [scenario2COLA, setScenario2COLA] = useState('3.5');
  
  // Scenario 3: Work Longer for Better Pension
  const [option1RetirementAge, setOption1RetirementAge] = useState('60');
  const [option1MonthlyIncome, setOption1MonthlyIncome] = useState('2500');
  const [option2RetirementAge, setOption2RetirementAge] = useState('65');
  const [option2MonthlyIncome, setOption2MonthlyIncome] = useState('3800');
  const [scenario3Return, setScenario3Return] = useState('5');
  const [scenario3COLA, setScenario3COLA] = useState('3.5');

  // Scenario 1 Calculations: Lump Sum vs Monthly Pension
  const scenario1Results = useMemo(() => {
    const retirementAge = parseFloat(scenario1RetirementAge || '65');
    const lumpSum = parseFloat(lumpSumAmount || '0');
    const annualReturn = parseFloat(lumpSumReturn || '0') / 100;
    const monthlyPay = parseFloat(monthlyPension || '0');
    const cola = parseFloat(scenario1COLA || '0') / 100;
    
    // Assume life expectancy of 85 for calculations
    const yearsInRetirement = 85 - retirementAge;
    const monthsInRetirement = yearsInRetirement * 12;
    
    // Option 1: Lump Sum - Calculate future value with investment returns
    const lumpSumFutureValue = lumpSum * Math.pow(1 + annualReturn, yearsInRetirement);
    const lumpSumMonthlyWithdrawal = lumpSum > 0 ? (lumpSum * (annualReturn / 12)) / (1 - Math.pow(1 + (annualReturn / 12), -monthsInRetirement)) : 0;
    
    // Option 2: Monthly Pension - Calculate total value with COLA
    let totalPensionValue = 0;
    let currentMonthlyPension = monthlyPay;
    
    for (let year = 0; year < yearsInRetirement; year++) {
      totalPensionValue += currentMonthlyPension * 12;
      currentMonthlyPension *= (1 + cola);
    }
    
    // Present value of pension payments
    const presentValuePension = monthlyPay > 0 ? 
      (monthlyPay * 12 * (1 - Math.pow(1 + annualReturn, -yearsInRetirement))) / annualReturn : 0;
    
    // Comparison
    const lumpSumAdvantage = lumpSum - presentValuePension;
    const isBetterOption = lumpSumAdvantage > 0 ? 'Lump Sum' : 'Monthly Pension';
    
    return {
      lumpSumFutureValue,
      lumpSumMonthlyWithdrawal,
      totalPensionValue,
      presentValuePension,
      lumpSumAdvantage: Math.abs(lumpSumAdvantage),
      isBetterOption,
      yearsInRetirement
    };
  }, [scenario1RetirementAge, lumpSumAmount, lumpSumReturn, monthlyPension, scenario1COLA]);

  // Scenario 2 Calculations: Single-Life vs Joint-Survivor
  const scenario2Results = useMemo(() => {
    const retirementAge = parseFloat(scenario2RetirementAge || '65');
    const yourLifeExp = parseFloat(lifeExpectancy || '77');
    const spouseCurrentAge = parseFloat(spouseAge || '62');
    const spouseLifeExp = parseFloat(spouseLifeExpectancy || '82');
    const singlePay = parseFloat(singleLifePension || '0');
    const jointPay = parseFloat(jointSurvivorPension || '0');
    const annualReturn = parseFloat(scenario2Return || '0') / 100;
    const cola = parseFloat(scenario2COLA || '0') / 100;
    
    const yourYearsInRetirement = yourLifeExp - retirementAge;
    const spouseAgeAtYourDeath = spouseCurrentAge + yourYearsInRetirement;
    const spouseYearsAfterYourDeath = Math.max(0, spouseLifeExp - spouseAgeAtYourDeath);
    
    // Single-Life: Payments until your death only
    let singleLifeTotal = 0;
    let currentSinglePay = singlePay;
    
    for (let year = 0; year < yourYearsInRetirement; year++) {
      singleLifeTotal += currentSinglePay * 12;
      currentSinglePay *= (1 + cola);
    }
    
    // Joint-Survivor: Payments until both pass away
    let jointSurvivorTotal = 0;
    let currentJointPay = jointPay;
    const totalYearsJoint = yourYearsInRetirement + spouseYearsAfterYourDeath;
    
    for (let year = 0; year < totalYearsJoint; year++) {
      jointSurvivorTotal += currentJointPay * 12;
      currentJointPay *= (1 + cola);
    }
    
    // Present values
    const pvSingleLife = singlePay > 0 ? 
      (singlePay * 12 * (1 - Math.pow(1 + annualReturn, -yourYearsInRetirement))) / annualReturn : 0;
    
    const pvJointSurvivor = jointPay > 0 ? 
      (jointPay * 12 * (1 - Math.pow(1 + annualReturn, -totalYearsJoint))) / annualReturn : 0;
    
    const advantage = pvJointSurvivor - pvSingleLife;
    const isBetterOption = advantage > 0 ? 'Joint-Survivor' : 'Single-Life';
    
    return {
      singleLifeTotal,
      jointSurvivorTotal,
      pvSingleLife,
      pvJointSurvivor,
      advantage: Math.abs(advantage),
      isBetterOption,
      yourYearsInRetirement,
      spouseYearsAfterYourDeath,
      totalYearsJoint
    };
  }, [scenario2RetirementAge, lifeExpectancy, spouseAge, spouseLifeExpectancy, singleLifePension, jointSurvivorPension, scenario2Return, scenario2COLA]);

  // Scenario 3 Calculations: Work Longer for Better Pension
  const scenario3Results = useMemo(() => {
    const retireAge1 = parseFloat(option1RetirementAge || '60');
    const monthlyIncome1 = parseFloat(option1MonthlyIncome || '0');
    const retireAge2 = parseFloat(option2RetirementAge || '65');
    const monthlyIncome2 = parseFloat(option2MonthlyIncome || '0');
    const annualReturn = parseFloat(scenario3Return || '0') / 100;
    const cola = parseFloat(scenario3COLA || '0') / 100;
    
    // Assume life expectancy of 85
    const lifeExp = 85;
    const yearsOption1 = lifeExp - retireAge1;
    const yearsOption2 = lifeExp - retireAge2;
    const additionalWorkYears = retireAge2 - retireAge1;
    
    // Option 1: Retire earlier with lower pension
    let totalOption1 = 0;
    let currentPay1 = monthlyIncome1;
    
    for (let year = 0; year < yearsOption1; year++) {
      totalOption1 += currentPay1 * 12;
      currentPay1 *= (1 + cola);
    }
    
    // Option 2: Work longer with higher pension
    let totalOption2 = 0;
    let currentPay2 = monthlyIncome2;
    
    for (let year = 0; year < yearsOption2; year++) {
      totalOption2 += currentPay2 * 12;
      currentPay2 *= (1 + cola);
    }
    
    // Present values
    const pvOption1 = monthlyIncome1 > 0 ? 
      (monthlyIncome1 * 12 * (1 - Math.pow(1 + annualReturn, -yearsOption1))) / annualReturn : 0;
    
    const pvOption2 = monthlyIncome2 > 0 ? 
      (monthlyIncome2 * 12 * (1 - Math.pow(1 + annualReturn, -yearsOption2))) / annualReturn : 0;
    
    // Discount option 2 by years of additional work
    const pvOption2Adjusted = pvOption2 / Math.pow(1 + annualReturn, additionalWorkYears);
    
    const advantage = pvOption2Adjusted - pvOption1;
    const isBetterOption = advantage > 0 ? 'Work Longer (Option 2)' : 'Retire Earlier (Option 1)';
    
    // Break-even age
    let breakEvenAge = retireAge2;
    let cumulative1 = 0;
    let cumulative2 = 0;
    let pay1 = monthlyIncome1;
    let pay2 = monthlyIncome2;
    
    for (let age = retireAge2; age <= lifeExp; age++) {
      const yearsFromRetire1 = age - retireAge1;
      cumulative1 = (monthlyIncome1 * 12 * (Math.pow(1 + cola, yearsFromRetire1) - 1)) / cola;
      
      const yearsFromRetire2 = age - retireAge2;
      cumulative2 = (monthlyIncome2 * 12 * (Math.pow(1 + cola, yearsFromRetire2) - 1)) / cola;
      
      if (cumulative2 >= cumulative1) {
        breakEvenAge = age;
        break;
      }
    }
    
    return {
      totalOption1,
      totalOption2,
      pvOption1,
      pvOption2Adjusted,
      advantage: Math.abs(advantage),
      isBetterOption,
      yearsOption1,
      yearsOption2,
      additionalWorkYears,
      breakEvenAge
    };
  }, [option1RetirementAge, option1MonthlyIncome, option2RetirementAge, option2MonthlyIncome, scenario3Return, scenario3COLA]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <Calculator className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Pension Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Pension policies can vary with different organizations. Because important pension-related decisions made 
          before retirement cannot be reversed, employees may need to consider them carefully. Evaluate three common 
          pension scenarios to make informed retirement decisions.
        </p>
      </div>

      {/* Three Scenarios Tabs */}
      <Tabs defaultValue="scenario1" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-2">
          <TabsTrigger value="scenario1" className="text-xs sm:text-sm p-2 sm:p-3">
            <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
            Lump Sum vs Monthly
          </TabsTrigger>
          <TabsTrigger value="scenario2" className="text-xs sm:text-sm p-2 sm:p-3">
            <Users className="w-4 h-4 mr-1 sm:mr-2" />
            Single-Life vs Joint
          </TabsTrigger>
          <TabsTrigger value="scenario3" className="text-xs sm:text-sm p-2 sm:p-3">
            <Clock className="w-4 h-4 mr-1 sm:mr-2" />
            Work Longer?
          </TabsTrigger>
        </TabsList>

        {/* Scenario 1: Lump Sum vs Monthly Pension */}
        <TabsContent value="scenario1" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl sm:text-2xl text-blue-900">
                Lump Sum Payment or Monthly Pension Income?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Compare taking a one-time lump sum payment versus receiving monthly pension payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card className="border-2 border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scenario1Age" className="text-xs sm:text-sm font-medium">
                        Your Retirement Age
                      </Label>
                      <Input
                        id="scenario1Age"
                        type="number"
                        value={scenario1RetirementAge}
                        onChange={(e) => setScenario1RetirementAge(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="65"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Options Comparison */}
                <Card className="border-2 border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-base sm:text-lg">Other Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cola1" className="text-xs sm:text-sm font-medium">
                        Cost-of-Living Adjustment (COLA)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cola1"
                          type="number"
                          step="0.1"
                          value={scenario1COLA}
                          onChange={(e) => setScenario1COLA(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="3.5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                      <p className="text-xs text-gray-500">Annual increase in pension payments to keep up with inflation</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Option 1: Lump Sum */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-200">
                    <CardTitle className="text-base sm:text-lg text-green-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Option 1: Lump Sum Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="lumpSum" className="text-xs sm:text-sm font-medium">
                        Lump Sum Payment Amount
                      </Label>
                      <Input
                        id="lumpSum"
                        type="number"
                        value={lumpSumAmount}
                        onChange={(e) => setLumpSumAmount(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="800000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lumpSumReturn" className="text-xs sm:text-sm font-medium">
                        Your Investment Return
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="lumpSumReturn"
                          type="number"
                          step="0.1"
                          value={lumpSumReturn}
                          onChange={(e) => setLumpSumReturn(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Option 2: Monthly Pension */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 border-b-2 border-purple-200">
                    <CardTitle className="text-base sm:text-lg text-purple-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Option 2: Monthly Pension Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPension" className="text-xs sm:text-sm font-medium">
                        Monthly Pension Income
                      </Label>
                      <Input
                        id="monthlyPension"
                        type="number"
                        value={monthlyPension}
                        onChange={(e) => setMonthlyPension(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="5000"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <Card className={`border-2 shadow-xl ${scenario1Results.isBetterOption === 'Lump Sum' ? 'bg-green-50 border-green-500' : 'bg-purple-50 border-purple-500'}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Recommended Option: {scenario1Results.isBetterOption}
                    </h3>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      <span className={scenario1Results.isBetterOption === 'Lump Sum' ? 'text-green-700' : 'text-purple-700'}>
                        ${scenario1Results.lumpSumAdvantage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      Advantage in present value terms
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
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Lump Sum Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        ${parseFloat(lumpSumAmount || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Monthly Pension Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">
                        ${scenario1Results.presentValuePension.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Lump Sum - Monthly Withdrawal Available</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        ${scenario1Results.lumpSumMonthlyWithdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                      </p>
                      <p className="text-xs text-gray-600 mt-1">If you invest the lump sum</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Pension Payments (Lifetime)</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        ${scenario1Results.totalPensionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Over {scenario1Results.yearsInRetirement} years</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 2: Single-Life vs Joint-Survivor - Will continue in next message */}
        <TabsContent value="scenario2" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <CardTitle className="text-xl sm:text-2xl text-purple-900">
                Single-Life or Joint-and-Survivor Pension Payout?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Compare pension payouts that end at your death versus those that continue for your spouse
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Information */}
                <Card className="border-2 border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-base sm:text-lg">Your Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scenario2Age" className="text-xs sm:text-sm font-medium">
                        Your Retirement Age
                      </Label>
                      <Input
                        id="scenario2Age"
                        type="number"
                        value={scenario2RetirementAge}
                        onChange={(e) => setScenario2RetirementAge(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="65"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lifeExp" className="text-xs sm:text-sm font-medium">
                        Your Life Expectancy
                      </Label>
                      <Input
                        id="lifeExp"
                        type="number"
                        value={lifeExpectancy}
                        onChange={(e) => setLifeExpectancy(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="77"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Spouse Information */}
                <Card className="border-2 border-pink-200">
                  <CardHeader className="bg-pink-50">
                    <CardTitle className="text-base sm:text-lg">Spouse Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="spouseAge" className="text-xs sm:text-sm font-medium">
                        Spouse's Age When You Retire
                      </Label>
                      <Input
                        id="spouseAge"
                        type="number"
                        value={spouseAge}
                        onChange={(e) => setSpouseAge(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="62"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="spouseLifeExp" className="text-xs sm:text-sm font-medium">
                        Spouse's Life Expectancy
                      </Label>
                      <Input
                        id="spouseLifeExp"
                        type="number"
                        value={spouseLifeExpectancy}
                        onChange={(e) => setSpouseLifeExpectancy(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="82"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Single-Life Pension */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-200">
                    <CardTitle className="text-base sm:text-lg text-green-900">
                      Single-Life Pension
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="singleLife" className="text-xs sm:text-sm font-medium">
                        Monthly Pension Amount
                      </Label>
                      <Input
                        id="singleLife"
                        type="number"
                        value={singleLifePension}
                        onChange={(e) => setSingleLifePension(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="5000"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Joint-Survivor Pension */}
                <Card className="border-2 border-orange-200 bg-orange-50">
                  <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 border-b-2 border-orange-200">
                    <CardTitle className="text-base sm:text-lg text-orange-900">
                      Joint-Survivor Pension
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="jointSurvivor" className="text-xs sm:text-sm font-medium">
                        Monthly Pension Amount
                      </Label>
                      <Input
                        id="jointSurvivor"
                        type="number"
                        value={jointSurvivorPension}
                        onChange={(e) => setJointSurvivorPension(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="3000"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-base sm:text-lg">Other Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="return2" className="text-xs sm:text-sm font-medium">
                        Your Investment Return
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="return2"
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
                      <Label htmlFor="cola2" className="text-xs sm:text-sm font-medium">
                        Cost-of-Living Adjustment (COLA)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cola2"
                          type="number"
                          step="0.1"
                          value={scenario2COLA}
                          onChange={(e) => setScenario2COLA(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="3.5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <Card className={`border-2 shadow-xl ${scenario2Results.isBetterOption === 'Joint-Survivor' ? 'bg-orange-50 border-orange-500' : 'bg-green-50 border-green-500'}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Recommended Option: {scenario2Results.isBetterOption}
                    </h3>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      <span className={scenario2Results.isBetterOption === 'Joint-Survivor' ? 'text-orange-700' : 'text-green-700'}>
                        ${scenario2Results.advantage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      Advantage in present value terms
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
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Single-Life Total Payments</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        ${scenario2Results.singleLifeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Over {scenario2Results.yourYearsInRetirement} years</p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Joint-Survivor Total Payments</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        ${scenario2Results.jointSurvivorTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Over {scenario2Results.totalYearsJoint} years</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Single-Life Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        ${scenario2Results.pvSingleLife.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Joint-Survivor Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">
                        ${scenario2Results.pvJointSurvivor.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300 mt-4">
                    <p className="text-xs sm:text-sm text-yellow-900">
                      <strong>Timeline:</strong> Spouse will receive payments for {scenario2Results.spouseYearsAfterYourDeath} 
                      years after your passing (until age {parseFloat(spouseLifeExpectancy || '0')}).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario 3: Work Longer for Better Pension */}
        <TabsContent value="scenario3" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
              <CardTitle className="text-xl sm:text-2xl text-cyan-900">
                Should You Work Longer for a Better Pension?
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Compare retiring earlier with lower pension versus working longer for higher pension payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pension Option 1 */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader className="bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-200">
                    <CardTitle className="text-base sm:text-lg text-green-900">
                      Pension Option 1 (Retire Earlier)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="option1Age" className="text-xs sm:text-sm font-medium">
                        Retirement Age
                      </Label>
                      <Input
                        id="option1Age"
                        type="number"
                        value={option1RetirementAge}
                        onChange={(e) => setOption1RetirementAge(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="60"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option1Income" className="text-xs sm:text-sm font-medium">
                        Monthly Pension Income
                      </Label>
                      <Input
                        id="option1Income"
                        type="number"
                        value={option1MonthlyIncome}
                        onChange={(e) => setOption1MonthlyIncome(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="2500"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pension Option 2 */}
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-50 border-b-2 border-blue-200">
                    <CardTitle className="text-base sm:text-lg text-blue-900">
                      Pension Option 2 (Work Longer)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="option2Age" className="text-xs sm:text-sm font-medium">
                        Retirement Age
                      </Label>
                      <Input
                        id="option2Age"
                        type="number"
                        value={option2RetirementAge}
                        onChange={(e) => setOption2RetirementAge(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="65"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="option2Income" className="text-xs sm:text-sm font-medium">
                        Monthly Pension Income
                      </Label>
                      <Input
                        id="option2Income"
                        type="number"
                        value={option2MonthlyIncome}
                        onChange={(e) => setOption2MonthlyIncome(e.target.value)}
                        className="text-sm sm:text-base"
                        placeholder="3800"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-2 border-gray-200">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-base sm:text-lg">Other Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="return3" className="text-xs sm:text-sm font-medium">
                        Your Investment Return
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="return3"
                          type="number"
                          step="0.1"
                          value={scenario3Return}
                          onChange={(e) => setScenario3Return(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cola3" className="text-xs sm:text-sm font-medium">
                        Cost-of-Living Adjustment (COLA)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cola3"
                          type="number"
                          step="0.1"
                          value={scenario3COLA}
                          onChange={(e) => setScenario3COLA(e.target.value)}
                          className="text-sm sm:text-base"
                          placeholder="3.5"
                        />
                        <span className="text-xs sm:text-sm text-gray-600">% per year</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className={`border-2 shadow-xl ${scenario3Results.isBetterOption === 'Work Longer (Option 2)' ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center space-y-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Recommended: {scenario3Results.isBetterOption}
                    </h3>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                      <span className={scenario3Results.isBetterOption === 'Work Longer (Option 2)' ? 'text-blue-700' : 'text-green-700'}>
                        ${scenario3Results.advantage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700">
                      Advantage in present value terms
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
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 1 - Total Lifetime Payments</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-700">
                        ${scenario3Results.totalOption1.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Over {scenario3Results.yearsOption1} years</p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 2 - Total Lifetime Payments</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-700">
                        ${scenario3Results.totalOption2.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Over {scenario3Results.yearsOption2} years</p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 1 - Present Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-700">
                        ${scenario3Results.pvOption1.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Option 2 - Present Value (Adjusted)</p>
                      <p className="text-xl sm:text-2xl font-bold text-orange-700">
                        ${scenario3Results.pvOption2Adjusted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300 mt-4">
                    <p className="text-xs sm:text-sm text-cyan-900">
                      <strong>⏰ Break-Even Age:</strong> At age {scenario3Results.breakEvenAge}, the cumulative 
                      payments from working longer will equal the early retirement option. Working {scenario3Results.additionalWorkYears} 
                      additional years increases your pension by ${(parseFloat(option2MonthlyIncome || '0') - parseFloat(option1MonthlyIncome || '0')).toLocaleString()}/month.
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
        {/* What Are Pensions? */}
        <Card className="shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900 text-lg sm:text-xl">
              <FileText className="w-6 h-6" />
              Understanding Pensions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Traditionally, <strong>employee pensions</strong> are funds that employers contribute to as a benefit for 
              their employees. Upon retirement, money can be drawn from a pension pot or sold to an insurance company to 
              be distributed as periodic payments until death (a life annuity).
            </p>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              In the U.S., the main advantage of a pension as a vehicle of saving for retirement lies in the fact that 
              pensions provide <strong>preferential tax benefits</strong> for money placed into them as well as any 
              subsequent earnings on investment. In many modern instances, the term "pension" is used interchangeably 
              with the term "retirement plan."
            </p>
          </CardContent>
        </Card>

        {/* Defined-Benefit vs Defined-Contribution */}
        <Card className="shadow-lg border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
              <TrendingUp className="w-6 h-6" />
              Defined-Benefit vs. Defined-Contribution Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h4 className="font-bold text-base sm:text-lg text-blue-900 mb-2">Defined-Benefit (DB) Plan</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ Employer <strong>guarantees</strong> a specific benefit at retirement</li>
                  <li>✓ Benefit based on salary, age, and years of service</li>
                  <li>✓ Employer bears investment risk</li>
                  <li>✓ Payments typically last for life</li>
                  <li>✓ <strong>No contribution limits</strong></li>
                  <li>✓ Becoming less common in private sector</li>
                  <li>✓ Examples: Traditional pensions, Social Security</li>
                </ul>
                <div className="bg-blue-100 p-3 rounded mt-3">
                  <p className="text-xs text-blue-900 font-medium">
                    💼 This calculator focuses on DB plans - the traditional "pension" concept
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <h4 className="font-bold text-base sm:text-lg text-green-900 mb-2">Defined-Contribution (DC) Plan</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ Employer may <strong>match contributions</strong> up to certain %</li>
                  <li>✓ Benefit depends on contributions + investment returns</li>
                  <li>✓ Employee bears investment risk</li>
                  <li>✓ More flexibility and portability</li>
                  <li>✓ <strong>Contribution limits apply</strong> (e.g., $23,000 for 401k in 2024)</li>
                  <li>✓ Now dominant in private sector</li>
                  <li>✓ Examples: 401(k), 403(b), IRA, Roth IRA</li>
                </ul>
                <div className="bg-green-100 p-3 rounded mt-3">
                  <p className="text-xs text-green-900 font-medium">
                    📊 For DC plans, use our 401(k) Calculator or IRA Calculator
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300 mt-4">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>⚠️ The Shift:</strong> DB plans have declined dramatically since the 1980s. In 1980, 38% of 
                private sector workers had DB plans; by 2020, only 15% did. DC plans now dominate due to lower costs 
                and reduced employer liability.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lump Sum vs Monthly Benefits */}
        <Card className="shadow-lg border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900 text-lg sm:text-xl">
              <DollarSign className="w-6 h-6" />
              Lump Sum vs. Monthly Benefit Payout
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Most DB plans offer the choice between a one-time lump sum payment or monthly benefit payouts. In pension 
              terminology, the lump sum is sometimes called the <strong>commuted value</strong>—the present value of 
              all future cash flows required to fulfill the pension obligation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-sm sm:text-base text-green-900 mb-2">✅ Lump Sum Advantages</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                  <li>• <strong>Maximum flexibility:</strong> Invest, spend, or save as desired</li>
                  <li>• Can be rolled into an IRA with tax deferral</li>
                  <li>• IRA assets can pass to heirs (not possible with most pensions)</li>
                  <li>• Good option if life expectancy is shorter than average</li>
                  <li>• Can potentially earn higher returns through smart investing</li>
                  <li>• Protection if employer goes bankrupt</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-sm sm:text-base text-green-900 mb-2">✅ Monthly Benefit Advantages</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                  <li>• <strong>Guaranteed income for life:</strong> No risk of outliving your money</li>
                  <li>• Protection from market volatility and poor investment decisions</li>
                  <li>• Simpler - no need to manage investments</li>
                  <li>• May include automatic COLA increases</li>
                  <li>• Better option if you expect to live longer than average</li>
                  <li>• Can't be spent all at once impulsively</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
              <h4 className="font-bold text-sm sm:text-base text-green-900 mb-2">⚠️ Key Considerations</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Life expectancy:</strong> Longer life favors monthly payments; shorter favors lump sum</li>
                <li>• <strong>Financial discipline:</strong> Can you manage a large sum responsibly?</li>
                <li>• <strong>Investment knowledge:</strong> Comfortable managing investments yourself?</li>
                <li>• <strong>Heirs:</strong> Want to leave money to beneficiaries? Choose lump sum + IRA rollover</li>
                <li>• <strong>Spouse protection:</strong> Monthly pensions typically stop at death (unless joint option)</li>
                <li>• <strong>Interest rates:</strong> Higher rates = smaller lump sums (affects comparison)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Single-Life vs Joint-Survivor */}
        <Card className="shadow-lg border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900 text-lg sm:text-xl">
              <Users className="w-6 h-6" />
              Single-Life vs. Joint-and-Survivor Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h4 className="font-bold text-base sm:text-lg text-blue-900 mb-2">Single-Life Pension</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  Pays a monthly benefit for the remainder of the beneficiary's life only. As soon as they pass away, 
                  pension payments halt completely.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ <strong>Highest monthly payment</strong></li>
                  <li>✓ Best for singles without dependents</li>
                  <li>✓ Some offer guarantee periods (5-10 years)</li>
                  <li>✗ Spouse left without income after death</li>
                  <li>✗ No survivor protection</li>
                </ul>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-300">
                <h4 className="font-bold text-base sm:text-lg text-pink-900 mb-2">Joint-and-Survivor Pension</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  Pays a monthly benefit until <strong>both</strong> the retiree and their spouse pass away. 
                  Provides financial security for the surviving spouse.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>✓ <strong>Protects spouse financially</strong></li>
                  <li>✓ Payments continue after retiree's death</li>
                  <li>✓ Peace of mind for couples</li>
                  <li>✗ Lower monthly payment than single-life</li>
                  <li>✗ Reduction typically 10-50% of single-life amount</li>
                </ul>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Survivor Benefit Ratios</h4>
              <p className="text-xs sm:text-sm text-gray-700 mb-2">
                Joint-and-survivor plans specify what percentage the surviving spouse receives after the retiree's death:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="bg-blue-50 p-2 rounded text-center">
                  <p className="font-bold text-lg text-blue-900">50%</p>
                  <p className="text-xs text-gray-600">Survivor gets half</p>
                </div>
                <div className="bg-purple-50 p-2 rounded text-center">
                  <p className="font-bold text-lg text-purple-900">66%</p>
                  <p className="text-xs text-gray-600">Two-thirds</p>
                </div>
                <div className="bg-green-50 p-2 rounded text-center">
                  <p className="font-bold text-lg text-green-900">75%</p>
                  <p className="text-xs text-gray-600">Three-quarters</p>
                </div>
                <div className="bg-orange-50 p-2 rounded text-center">
                  <p className="font-bold text-lg text-orange-900">100%</p>
                  <p className="text-xs text-gray-600">Full amount</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                <strong>Example:</strong> A couple receives $3,000/month with a 50% survivor ratio. After one spouse 
                dies, the survivor receives $1,500/month (50% of $3,000) for the rest of their life.
              </p>
            </div>

            <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-300">
              <p className="text-xs sm:text-sm text-orange-900">
                <strong>💡 Which to Choose?</strong> Single-life plans pay the most per month, but joint-survivor 
                provides crucial protection for married couples. Consider your spouse's other income sources, health, 
                and life expectancy. If your spouse is significantly younger or healthier, joint-survivor becomes more valuable.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cost-of-Living Adjustment (COLA) */}
        <Card className="shadow-lg border-2 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
              <TrendingUp className="w-6 h-6" />
              Cost-of-Living Adjustment (COLA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Due to inflation, prices of goods and services rise over time. A <strong>Cost-of-Living Adjustment (COLA)</strong> 
              helps maintain the purchasing power of retirement payouts by gradually increasing pension amounts based on inflation.
            </p>

            <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg border border-cyan-200">
              <h4 className="font-bold text-sm sm:text-base text-cyan-900 mb-2">How COLA Works</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Pension payments increase annually to keep pace with inflation</li>
                <li>• Typical COLA rates: 2-4% per year (tied to CPI)</li>
                <li>• <strong>Social Security</strong> includes automatic COLA adjustments</li>
                <li>• Most <strong>private pensions do NOT</strong> include COLA</li>
                <li>• Without COLA, purchasing power erodes over time</li>
              </ul>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">📊 COLA Impact Example</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Starting with <strong>$3,000/month</strong> pension:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xs text-gray-600">Today</p>
                  <p className="font-bold text-sm text-blue-900">$3,000</p>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <p className="text-xs text-gray-600">After 10 years (3% COLA)</p>
                  <p className="font-bold text-sm text-green-900">$4,032</p>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <p className="text-xs text-gray-600">After 20 years (3% COLA)</p>
                  <p className="font-bold text-sm text-purple-900">$5,418</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xs text-gray-600">No COLA (constant)</p>
                  <p className="font-bold text-sm text-red-900">$3,000</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                Without COLA, your $3,000 would have the buying power of only <strong>~$1,673</strong> after 20 years 
                (assuming 3% annual inflation).
              </p>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>⚠️ Important:</strong> When evaluating pension options, always ask about COLA provisions. 
                A pension with COLA is significantly more valuable long-term than one without, especially for younger 
                retirees who will receive payments for decades.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* The Fall of DB Plans */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2 border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900 text-lg sm:text-xl">
              <AlertCircle className="w-6 h-6" />
              The Decline of Defined-Benefit Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              In the U.S., DB plans have been heavily scrutinized and their use has declined dramatically in favor of 
              DC plans. While the public sector still houses most DB plans today, the golden age of traditional pensions 
              appears to be over for private sector workers.
            </p>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300">
              <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Why DB Plans Have Fallen Out of Favor</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• <strong>Unpredictable employee tenure:</strong> Plans assume long service (25+ years), but modern 
                workers change jobs frequently</li>
                <li>• <strong>Company bankruptcy risk:</strong> Even with PBGC insurance, employees may receive reduced 
                benefits if employer fails</li>
                <li>• <strong>Frozen plans:</strong> Many companies have "frozen" their DB plans, stopping future benefit 
                accruals due to rising costs</li>
                <li>• <strong>Rising healthcare costs:</strong> Increased longevity means companies pay benefits for longer periods</li>
                <li>• <strong>Interest rate sensitivity:</strong> Low interest rates increase pension obligations significantly</li>
                <li>• <strong>Administrative complexity:</strong> DB plans require extensive actuarial work and regulatory compliance</li>
                <li>• <strong>Lack of portability:</strong> DB benefits don't transfer when changing employers</li>
                <li>• <strong>Accounting impact:</strong> Large pension liabilities hurt company balance sheets</li>
              </ul>
            </div>

            <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
              <h4 className="font-bold text-sm sm:text-base text-red-900 mb-2">📉 The Numbers</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="text-2xl font-bold text-red-900">38%</p>
                  <p className="text-xs text-gray-700">Private workers with DB plans in 1980</p>
                </div>
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="text-2xl font-bold text-red-900">15%</p>
                  <p className="text-xs text-gray-700">Private workers with DB plans in 2020</p>
                </div>
                <div className="bg-white p-3 rounded border border-red-300">
                  <p className="text-2xl font-bold text-red-900">73%</p>
                  <p className="text-xs text-gray-700">Public sector workers still have DB plans</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-900">
                <strong>🏛️ Public Sector Exception:</strong> Government employees (federal, state, local) still predominantly 
                have DB plans because governments are unlikely to "go bankrupt" in the traditional sense. However, even 
                some state and local governments have shifted new hires to DC or hybrid plans to manage costs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Security */}
        <Card className="shadow-lg border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
              <Heart className="w-6 h-6" />
              Social Security: America's Largest Pension
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              <strong>Social Security</strong> is the most common defined-benefit plan in the United States. Most American 
              workers are qualified for collecting Social Security benefits after retirement, making it a critical component 
              of retirement income planning.
            </p>

            <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-sm sm:text-base text-indigo-900 mb-2">Key Facts About Social Security</h4>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2 ml-4">
                <li>• Designed to replace approximately <strong>40% of pre-retirement income</strong></li>
                <li>• Full retirement age: 67 for those born in 1960 or later</li>
                <li>• Can claim as early as age 62 (with reduced benefits)</li>
                <li>• Can delay until age 70 (with increased benefits)</li>
                <li>• Benefits include automatic COLA adjustments annually</li>
                <li>• Survivor and disability benefits available</li>
                <li>• Funded by payroll taxes (6.2% employee + 6.2% employer)</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-300">
              <p className="text-xs sm:text-sm text-yellow-900">
                <strong>⚠️ Important Planning Note:</strong> Social Security typically replaces only 40% of pre-retirement 
                income. Depending entirely on Social Security in retirement is generally not viable. Most financial advisors 
                recommend having multiple income sources: Social Security + pension (if available) + personal savings (401k, IRA, 
                investments) to maintain your pre-retirement standard of living.
              </p>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-300 mt-3">
              <p className="text-xs sm:text-sm text-gray-700">
                💻 For detailed Social Security benefit calculations and claiming strategies, use our dedicated 
                <strong> Social Security Calculator</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Decision-Making Guide */}
        <Card className="shadow-lg border-2 border-emerald-200">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b-2 border-emerald-200">
            <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg sm:text-xl">
              <Calculator className="w-6 h-6" />
              Pension Decision-Making Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              Pension decisions are among the most important financial choices you'll make, and they're usually 
              <strong> irreversible</strong>. Use this guide to make informed decisions.
            </p>

            <div className="space-y-3">
              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">1. Understand Your Timeline</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ When can you retire with full benefits?</li>
                  <li>✓ What's the penalty for early retirement?</li>
                  <li>✓ What's the bonus for delayed retirement?</li>
                  <li>✓ Review your pension summary plan description (SPD) carefully</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">2. Assess Your Health & Longevity</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Family history of longevity or early mortality?</li>
                  <li>✓ Current health conditions that may shorten lifespan?</li>
                  <li>✓ Consider spouse's health and age difference</li>
                  <li>✓ Longer expected life → favor monthly payments</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">3. Evaluate Other Income Sources</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Do you have substantial 401(k) or IRA savings?</li>
                  <li>✓ Will you receive Social Security benefits?</li>
                  <li>✓ Does your spouse have their own pension or retirement income?</li>
                  <li>✓ Real estate or other passive income?</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">4. Consider Your Risk Tolerance</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Comfortable managing investments? → Lump sum may work</li>
                  <li>✓ Want guaranteed income security? → Monthly payments better</li>
                  <li>✓ Worried about market volatility? → Choose guaranteed option</li>
                  <li>✓ Financially savvy with discipline? → Either option viable</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">5. Factor in Spouse Protection</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Single-life pays more but leaves spouse vulnerable</li>
                  <li>✓ Joint-survivor pays less but protects spouse</li>
                  <li>✓ Consider age gap: larger gap → more valuable joint option</li>
                  <li>✓ Lump sum + IRA rollover can pass to heirs</li>
                </ul>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg border-l-4 border-emerald-500">
                <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-1">6. Run Multiple Scenarios</h4>
                <ul className="text-xs sm:text-sm text-gray-700 space-y-1 ml-4">
                  <li>✓ Use this calculator with different assumptions</li>
                  <li>✓ Test various life expectancies and COLA rates</li>
                  <li>✓ Compare present values (not just monthly amounts)</li>
                  <li>✓ Model different investment return scenarios</li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 sm:p-4 rounded-lg border border-emerald-300 mt-4">
              <p className="text-xs sm:text-sm text-emerald-900 font-medium">
                👨‍⚖️ <strong>Seek Professional Advice:</strong> Pension decisions are complex and permanent. Consider 
                consulting with a certified financial planner (CFP), especially one who specializes in retirement planning. 
                The cost of professional advice is minimal compared to the lifetime value of your pension.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="shadow-lg border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
              <strong>Disclaimer:</strong> This Pension Calculator is provided for informational and educational purposes only. 
              It should not be considered financial, tax, or legal advice. Actual pension values and benefits depend on numerous 
              factors specific to your employer's plan, including vesting schedules, benefit formulas, plan amendments, and 
              company financial health. Calculations are estimates based on standard assumptions and may not reflect your 
              specific situation. Tax implications of pension decisions vary by individual circumstances. Always consult with 
              qualified financial advisors, tax professionals, and your plan administrator before making final pension decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PensionCalculatorComponent;
