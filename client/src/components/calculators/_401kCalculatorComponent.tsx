import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  PiggyBank,
  AlertCircle,
  Info,
  Percent,
  Target,
  Award,
  Shield
} from 'lucide-react';

// ==================== INTERFACES ====================

interface BasicInputs {
  currentAge: number;
  currentSalary: number;
  currentBalance: number;
  contributionPercent: number;
  employerMatch: number;
  employerMatchLimit: number;
  retirementAge: number;
  lifeExpectancy: number;
  salaryIncrease: number;
  annualReturn: number;
  inflationRate: number;
}

interface EarlyWithdrawalInputs {
  withdrawalAmount: number;
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate: number;
  isEmployed: boolean;
  hasDisability: boolean;
  hasExemption: boolean;
}

interface MaximizeMatchInputs {
  currentAge: number;
  currentSalary: number;
  employerMatch1: number;
  employerMatch1Limit: number;
  employerMatch2: number;
  employerMatch2Limit: number;
}

interface YearlyProjection {
  age: number;
  year: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  investmentReturn: number;
  endBalance: number;
  totalContributions: number;
  totalEarnings: number;
}

const _401kCalculatorComponent = () => {
  // ==================== STATE MANAGEMENT ====================
  
  const [activeTab, setActiveTab] = useState<'basic' | 'withdrawal' | 'maximize'>('basic');
  
  // Basic Calculator State
  const [basicInputs, setBasicInputs] = useState<BasicInputs>({
    currentAge: 30,
    currentSalary: 75000,
    currentBalance: 35000,
    contributionPercent: 10,
    employerMatch: 50,
    employerMatchLimit: 3,
    retirementAge: 65,
    lifeExpectancy: 85,
    salaryIncrease: 3,
    annualReturn: 6,
    inflationRate: 3
  });

  // Early Withdrawal State
  const [withdrawalInputs, setWithdrawalInputs] = useState<EarlyWithdrawalInputs>({
    withdrawalAmount: 10000,
    federalTaxRate: 25,
    stateTaxRate: 5,
    localTaxRate: 0,
    isEmployed: true,
    hasDisability: false,
    hasExemption: false
  });

  // Maximize Match State
  const [matchInputs, setMatchInputs] = useState<MaximizeMatchInputs>({
    currentAge: 30,
    currentSalary: 75000,
    employerMatch1: 50,
    employerMatch1Limit: 3,
    employerMatch2: 20,
    employerMatch2Limit: 6
  });

  const [projections, setProjections] = useState<YearlyProjection[]>([]);
  const [retirementBalance, setRetirementBalance] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  // ==================== CALCULATIONS ====================

  // Basic 401(k) Calculator Logic
  const calculateBasic401k = () => {
    const {
      currentAge,
      currentSalary,
      currentBalance,
      contributionPercent,
      employerMatch,
      employerMatchLimit,
      retirementAge,
      salaryIncrease,
      annualReturn
    } = basicInputs;

    const years = retirementAge - currentAge;
    const yearlyData: YearlyProjection[] = [];
    
    let balance = currentBalance;
    let salary = currentSalary;
    let totalEmployeeContrib = 0;
    let totalEmployerContrib = 0;

    // 2025 IRS Contribution Limits
    const contributionLimit2025 = 23500;
    const catchUpLimit = currentAge >= 50 ? 7500 : 0;
    const maxContribution = contributionLimit2025 + catchUpLimit;

    for (let i = 0; i < years; i++) {
      const age = currentAge + i;
      const year = new Date().getFullYear() + i;
      
      // Employee contribution (capped at IRS limits)
      const employeeContribAmount = Math.min(
        (salary * contributionPercent) / 100,
        maxContribution
      );
      
      // Employer match calculation
      const matchableContrib = Math.min(
        contributionPercent,
        employerMatchLimit
      );
      const employerContribAmount = (salary * matchableContrib * employerMatch) / 10000;
      
      const totalYearlyContrib = employeeContribAmount + employerContribAmount;
      
      // Add contributions to balance
      balance += totalYearlyContrib;
      
      // Apply investment return
      const investmentGain = balance * (annualReturn / 100);
      balance += investmentGain;
      
      // Track totals
      totalEmployeeContrib += employeeContribAmount;
      totalEmployerContrib += employerContribAmount;
      
      yearlyData.push({
        age,
        year,
        employeeContribution: employeeContribAmount,
        employerContribution: employerContribAmount,
        totalContribution: totalYearlyContrib,
        investmentReturn: investmentGain,
        endBalance: balance,
        totalContributions: totalEmployeeContrib + totalEmployerContrib,
        totalEarnings: balance - currentBalance - totalEmployeeContrib - totalEmployerContrib
      });
      
      // Increase salary for next year
      salary *= (1 + salaryIncrease / 100);
    }

    setProjections(yearlyData);
    setRetirementBalance(balance);
    setTotalContributions(totalEmployeeContrib + totalEmployerContrib);
    setTotalEarnings(balance - currentBalance - totalEmployeeContrib - totalEmployerContrib);
  };

  // Early Withdrawal Calculator
  const calculateEarlyWithdrawal = () => {
    const {
      withdrawalAmount,
      federalTaxRate,
      stateTaxRate,
      localTaxRate,
      isEmployed,
      hasDisability,
      hasExemption
    } = withdrawalInputs;

    // 10% early withdrawal penalty (unless exempt)
    const earlyWithdrawalPenalty = (hasDisability || hasExemption || !isEmployed) ? 0 : 0.10;
    
    const federalTax = withdrawalAmount * (federalTaxRate / 100);
    const stateTax = withdrawalAmount * (stateTaxRate / 100);
    const localTax = withdrawalAmount * (localTaxRate / 100);
    const penaltyAmount = withdrawalAmount * earlyWithdrawalPenalty;
    
    const totalTaxes = federalTax + stateTax + localTax + penaltyAmount;
    const netAmount = withdrawalAmount - totalTaxes;

    return {
      withdrawalAmount,
      federalTax,
      stateTax,
      localTax,
      penaltyAmount,
      totalTaxes,
      netAmount,
      effectiveTaxRate: (totalTaxes / withdrawalAmount) * 100
    };
  };

  // Maximize Employer Match Calculator
  const calculateMaximizeMatch = () => {
    const {
      currentSalary,
      employerMatch1,
      employerMatch1Limit,
      employerMatch2,
      employerMatch2Limit
    } = matchInputs;

    // Calculate optimal contribution percentage
    const maxMatchLimit = Math.max(employerMatch1Limit, employerMatch2Limit);
    
    // Calculate match amounts at different contribution levels
    const matchScenarios = [];
    for (let contrib = 0; contrib <= maxMatchLimit + 5; contrib += 0.5) {
      let totalMatch = 0;
      
      // First tier match
      if (contrib <= employerMatch1Limit) {
        totalMatch += (currentSalary * contrib * employerMatch1) / 10000;
      } else {
        totalMatch += (currentSalary * employerMatch1Limit * employerMatch1) / 10000;
      }
      
      // Second tier match (if applicable)
      if (employerMatch2 > 0 && contrib > employerMatch1Limit && contrib <= employerMatch2Limit) {
        const secondTierContrib = contrib - employerMatch1Limit;
        totalMatch += (currentSalary * secondTierContrib * employerMatch2) / 10000;
      } else if (employerMatch2 > 0 && contrib > employerMatch2Limit) {
        const secondTierContrib = employerMatch2Limit - employerMatch1Limit;
        totalMatch += (currentSalary * secondTierContrib * employerMatch2) / 10000;
      }
      
      matchScenarios.push({
        contributionPercent: contrib,
        employeeContribution: (currentSalary * contrib) / 100,
        employerMatch: totalMatch,
        totalAnnual: (currentSalary * contrib) / 100 + totalMatch
      });
    }

    return matchScenarios;
  };

  // Auto-calculate on input changes
  useEffect(() => {
    if (activeTab === 'basic') {
      calculateBasic401k();
    }
  }, [basicInputs, activeTab]);

  const withdrawalResults = activeTab === 'withdrawal' ? calculateEarlyWithdrawal() : null;
  const matchScenarios = activeTab === 'maximize' ? calculateMaximizeMatch() : [];

  // ==================== CHART DATA PREPARATION ====================

  // Balance Growth Chart Data
  const balanceChartData = projections.filter((_, idx) => idx % 5 === 0 || idx === projections.length - 1).map(p => ({
    year: p.year,
    age: p.age,
    balance: Math.round(p.endBalance),
    contributions: Math.round(p.totalContributions),
    earnings: Math.round(p.totalEarnings)
  }));

  // Contribution Breakdown Pie Chart
  const contributionPieData = projections.length > 0 ? [
    {
      name: 'Your Contributions',
      value: Math.round(projections.reduce((sum, p) => sum + p.employeeContribution, 0)),
      color: '#1E88E5'
    },
    {
      name: 'Employer Match',
      value: Math.round(projections.reduce((sum, p) => sum + p.employerContribution, 0)),
      color: '#00A3A3'
    },
    {
      name: 'Investment Gains',
      value: Math.round(totalEarnings),
      color: '#4CAF50'
    }
  ] : [];

  const COLORS = ['#1E88E5', '#00A3A3', '#4CAF50'];

  // ==================== RENDER ====================

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4 px-2">
        <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-blue-100 rounded-full mb-2 sm:mb-4">
          <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
          401(k) Retirement Calculator
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Plan your retirement savings with our comprehensive 401(k) calculator. Estimate your balance at retirement, 
          analyze early withdrawal costs, and maximize employer matching contributions.
        </p>
      </div>

      {/* Calculator Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="basic" className="text-xs sm:text-sm py-2 sm:py-3">
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Basic Calculator</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawal" className="text-xs sm:text-sm py-2 sm:py-3">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Early Withdrawal</span>
            <span className="sm:hidden">Withdrawal</span>
          </TabsTrigger>
          <TabsTrigger value="maximize" className="text-xs sm:text-sm py-2 sm:py-3">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Maximize Match</span>
            <span className="sm:hidden">Match</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================== BASIC CALCULATOR TAB ==================== */}
        <TabsContent value="basic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentAge" className="text-sm font-medium">Current Age</Label>
                      <Input
                        id="currentAge"
                        type="number"
                        value={basicInputs.currentAge}
                        onChange={(e) => setBasicInputs({...basicInputs, currentAge: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentSalary" className="text-sm font-medium">Current Annual Salary ($)</Label>
                      <Input
                        id="currentSalary"
                        type="number"
                        value={basicInputs.currentSalary}
                        onChange={(e) => setBasicInputs({...basicInputs, currentSalary: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentBalance" className="text-sm font-medium">Current 401(k) Balance ($)</Label>
                      <Input
                        id="currentBalance"
                        type="number"
                        value={basicInputs.currentBalance}
                        onChange={(e) => setBasicInputs({...basicInputs, currentBalance: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contributionPercent" className="text-sm font-medium">Contribution (% of salary)</Label>
                      <Input
                        id="contributionPercent"
                        type="number"
                        value={basicInputs.contributionPercent}
                        onChange={(e) => setBasicInputs({...basicInputs, contributionPercent: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerMatch" className="text-sm font-medium">Employer Match (%)</Label>
                      <Input
                        id="employerMatch"
                        type="number"
                        value={basicInputs.employerMatch}
                        onChange={(e) => setBasicInputs({...basicInputs, employerMatch: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerMatchLimit" className="text-sm font-medium">Employer Match Limit (%)</Label>
                      <Input
                        id="employerMatchLimit"
                        type="number"
                        value={basicInputs.employerMatchLimit}
                        onChange={(e) => setBasicInputs({...basicInputs, employerMatchLimit: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="retirementAge" className="text-sm font-medium">Expected Retirement Age</Label>
                      <Input
                        id="retirementAge"
                        type="number"
                        value={basicInputs.retirementAge}
                        onChange={(e) => setBasicInputs({...basicInputs, retirementAge: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lifeExpectancy" className="text-sm font-medium">Life Expectancy</Label>
                      <Input
                        id="lifeExpectancy"
                        type="number"
                        value={basicInputs.lifeExpectancy}
                        onChange={(e) => setBasicInputs({...basicInputs, lifeExpectancy: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryIncrease" className="text-sm font-medium">Expected Salary Increase (% per year)</Label>
                      <Input
                        id="salaryIncrease"
                        type="number"
                        step="0.1"
                        value={basicInputs.salaryIncrease}
                        onChange={(e) => setBasicInputs({...basicInputs, salaryIncrease: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annualReturn" className="text-sm font-medium">Expected Annual Return (% per year)</Label>
                      <Input
                        id="annualReturn"
                        type="number"
                        step="0.1"
                        value={basicInputs.annualReturn}
                        onChange={(e) => setBasicInputs({...basicInputs, annualReturn: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="inflationRate" className="text-sm font-medium">Expected Inflation Rate (% per year)</Label>
                      <Input
                        id="inflationRate"
                        type="number"
                        step="0.1"
                        value={basicInputs.inflationRate}
                        onChange={(e) => setBasicInputs({...basicInputs, inflationRate: Number(e.target.value)})}
                        className="text-base"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Award className="h-5 w-5 text-blue-600" />
                    Retirement Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">Balance at Retirement</div>
                      <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                        ${retirementBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        At age {basicInputs.retirementAge}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Contributions</div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                        ${totalContributions.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Your + Employer Match
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">Investment Earnings</div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
                        ${totalEarnings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {totalContributions > 0 ? `${((totalEarnings / totalContributions) * 100).toFixed(1)}% return` : '0% return'}
                      </div>
                    </div>

                    <div className="bg-blue-600 text-white rounded-lg p-3 sm:p-4 shadow">
                      <div className="text-xs sm:text-sm mb-1 opacity-90">Years Until Retirement</div>
                      <div className="text-lg sm:text-xl md:text-2xl font-bold">
                        {basicInputs.retirementAge - basicInputs.currentAge} years
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">2025 contribution limit: $23,500 (under 50)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Max employer match to get free money</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">Start early - compound interest is powerful</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Charts Section */}
          {projections.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Balance Growth Chart */}
              <Card className="shadow-lg">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Balance Growth Over Time</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Projected 401(k) balance until retirement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="balance" 
                          stackId="1"
                          stroke="#1E88E5" 
                          fill="#1E88E5" 
                          name="Total Balance"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Contribution Breakdown */}
              <Card className="shadow-lg">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Contribution Breakdown</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Where your retirement savings come from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={contributionPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {contributionPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                        <Legend 
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          formatter={(value, entry: any) => `${value}: ${((entry.payload.value / contributionPieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:text-sm">
                    {contributionPieData.map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></div>
                          <span className="font-medium text-gray-700">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">${entry.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ==================== EARLY WITHDRAWAL TAB ==================== */}
        <TabsContent value="withdrawal" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Early Withdrawal Details
                </CardTitle>
                <CardDescription className="text-sm">
                  Calculate the actual amount you'll receive after taxes and penalties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawalAmount">Early Withdrawal Amount ($)</Label>
                  <Input
                    id="withdrawalAmount"
                    type="number"
                    value={withdrawalInputs.withdrawalAmount}
                    onChange={(e) => setWithdrawalInputs({...withdrawalInputs, withdrawalAmount: Number(e.target.value)})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="federalTaxRate">Federal Tax Rate (%)</Label>
                    <Input
                      id="federalTaxRate"
                      type="number"
                      value={withdrawalInputs.federalTaxRate}
                      onChange={(e) => setWithdrawalInputs({...withdrawalInputs, federalTaxRate: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateTaxRate">State Tax Rate (%)</Label>
                    <Input
                      id="stateTaxRate"
                      type="number"
                      value={withdrawalInputs.stateTaxRate}
                      onChange={(e) => setWithdrawalInputs({...withdrawalInputs, stateTaxRate: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localTaxRate">Local Tax Rate (%)</Label>
                    <Input
                      id="localTaxRate"
                      type="number"
                      value={withdrawalInputs.localTaxRate}
                      onChange={(e) => setWithdrawalInputs({...withdrawalInputs, localTaxRate: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isEmployed" className="text-sm">Are you currently employed?</Label>
                    <Switch
                      id="isEmployed"
                      checked={withdrawalInputs.isEmployed}
                      onCheckedChange={(checked) => setWithdrawalInputs({...withdrawalInputs, isEmployed: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasDisability" className="text-sm">Do you have a qualifying disability?</Label>
                    <Switch
                      id="hasDisability"
                      checked={withdrawalInputs.hasDisability}
                      onCheckedChange={(checked) => setWithdrawalInputs({...withdrawalInputs, hasDisability: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hasExemption" className="text-sm">Do you qualify for penalty exemptions?</Label>
                    <Switch
                      id="hasExemption"
                      checked={withdrawalInputs.hasExemption}
                      onCheckedChange={(checked) => setWithdrawalInputs({...withdrawalInputs, hasExemption: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {withdrawalResults && (
              <Card className="shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Withdrawal Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white rounded-lg p-4 shadow">
                    <div className="text-sm text-gray-600 mb-1">Withdrawal Amount</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${withdrawalResults.withdrawalAmount.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Federal Tax ({withdrawalInputs.federalTaxRate}%)</span>
                      <span className="font-semibold text-red-600">
                        -${withdrawalResults.federalTax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">State Tax ({withdrawalInputs.stateTaxRate}%)</span>
                      <span className="font-semibold text-red-600">
                        -${withdrawalResults.stateTax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Local Tax ({withdrawalInputs.localTaxRate}%)</span>
                      <span className="font-semibold text-red-600">
                        -${withdrawalResults.localTax.toLocaleString()}
                      </span>
                    </div>
                    {withdrawalResults.penaltyAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Early Withdrawal Penalty (10%)</span>
                        <span className="font-semibold text-red-600">
                          -${withdrawalResults.penaltyAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="bg-white rounded-lg p-4 shadow">
                    <div className="text-sm text-gray-600 mb-1">Total Taxes & Penalties</div>
                    <div className="text-xl font-bold text-red-600">
                      -${withdrawalResults.totalTaxes.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Effective rate: {withdrawalResults.effectiveTaxRate.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-green-600 text-white rounded-lg p-4 shadow">
                    <div className="text-sm mb-1 opacity-90">Net Amount You'll Receive</div>
                    <div className="text-2xl font-bold">
                      ${withdrawalResults.netAmount.toLocaleString()}
                    </div>
                  </div>

                  {withdrawalResults.penaltyAmount > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        <strong>Warning:</strong> Early withdrawals before age 59½ typically incur a 10% penalty 
                        plus income taxes, significantly reducing your retirement savings.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ==================== MAXIMIZE MATCH TAB ==================== */}
        <TabsContent value="maximize" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="h-5 w-5 text-blue-600" />
                  Employer Match Configuration
                </CardTitle>
                <CardDescription className="text-sm">
                  Find the optimal contribution to maximize your employer's match
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matchAge">Current Age</Label>
                    <Input
                      id="matchAge"
                      type="number"
                      value={matchInputs.currentAge}
                      onChange={(e) => setMatchInputs({...matchInputs, currentAge: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matchSalary">Current Annual Salary ($)</Label>
                    <Input
                      id="matchSalary"
                      type="number"
                      value={matchInputs.currentSalary}
                      onChange={(e) => setMatchInputs({...matchInputs, currentSalary: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-700">Employer Match Tier 1</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employerMatch1">Match Percentage (%)</Label>
                      <Input
                        id="employerMatch1"
                        type="number"
                        value={matchInputs.employerMatch1}
                        onChange={(e) => setMatchInputs({...matchInputs, employerMatch1: Number(e.target.value)})}
                      />
                      <p className="text-xs text-gray-500">
                        e.g., 50% means $0.50 per $1.00
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerMatch1Limit">Match Limit (% of salary)</Label>
                      <Input
                        id="employerMatch1Limit"
                        type="number"
                        value={matchInputs.employerMatch1Limit}
                        onChange={(e) => setMatchInputs({...matchInputs, employerMatch1Limit: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-gray-700">Employer Match Tier 2 (Optional)</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employerMatch2">Match Percentage (%)</Label>
                      <Input
                        id="employerMatch2"
                        type="number"
                        value={matchInputs.employerMatch2}
                        onChange={(e) => setMatchInputs({...matchInputs, employerMatch2: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerMatch2Limit">Match Limit (% of salary)</Label>
                      <Input
                        id="employerMatch2Limit"
                        type="number"
                        value={matchInputs.employerMatch2Limit}
                        onChange={(e) => setMatchInputs({...matchInputs, employerMatch2Limit: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Optimal Contribution Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={matchScenarios.filter((_, idx) => idx % 2 === 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="contributionPercent" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Your Contribution %', position: 'insideBottom', offset: -5, fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="employeeContribution" stackId="a" fill="#1E88E5" name="Your Contribution" />
                      <Bar dataKey="employerMatch" stackId="a" fill="#00A3A3" name="Employer Match" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {matchScenarios.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Recommended Strategy:</p>
                      <p className="text-xs text-blue-800">
                        Contribute at least <strong>{matchInputs.employerMatch2Limit || matchInputs.employerMatch1Limit}%</strong> of 
                        your salary to receive the maximum employer match of{' '}
                        <strong>
                          ${matchScenarios.find(s => s.contributionPercent === (matchInputs.employerMatch2Limit || matchInputs.employerMatch1Limit))?.employerMatch.toLocaleString()}
                        </strong> per year.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Educational Content */}
      <div className="mt-8 sm:mt-12 space-y-6 sm:space-y-8">
        <Separator />
        
        {/* Section Header */}
        <div className="text-center space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            Complete Guide to 401(k) Retirement Planning
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-base sm:text-lg">
            Master your retirement savings strategy with comprehensive insights into 401(k) plans, tax advantages, 
            employer matching, investment strategies, and withdrawal rules. Build lasting wealth through informed retirement planning.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* What is a 401(k)? */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Info className="h-5 w-5" />
                Understanding 401(k) Retirement Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">What is a 401(k) Plan?</h4>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  A 401(k) retirement savings plan is an employer-sponsored defined contribution plan authorized under Section 401(k) 
                  of the Internal Revenue Code. Created by the Revenue Act of 1978, this tax-advantaged retirement vehicle has become 
                  the cornerstone of American retirement planning, serving over 60 million active participants and holding more than 
                  $7.3 trillion in assets as of 2024.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">How 401(k) Plans Work</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Pre-Tax Contributions:</strong> Employees elect to defer a portion of their paycheck into their 401(k) account before income taxes are calculated, immediately reducing taxable income</li>
                  <li><strong>Tax-Deferred Growth:</strong> All investment earnings including dividends, interest, and capital gains grow completely tax-free until withdrawal during retirement</li>
                  <li><strong>Employer Participation:</strong> Companies typically select investment options, manage administrative requirements, and may offer matching contributions as an employee benefit</li>
                  <li><strong>Participant Control:</strong> Employees choose their contribution percentage, select investments from employer-provided options, and designate beneficiaries</li>
                  <li><strong>Portability Features:</strong> Account balances are portable when changing employers through rollovers to new employer plans or Individual Retirement Accounts (IRAs)</li>
                  <li><strong>Vesting Schedules:</strong> While employee contributions are immediately 100% vested, employer match may have vesting schedules requiring 2-6 years of service for full ownership</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">401(k) vs. Pension Plans (Defined Benefit Plans)</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Investment Risk:</strong> 401(k) participants bear investment risk and reward, while traditional pensions guarantee fixed retirement income regardless of market performance</li>
                  <li><strong>Portability Advantage:</strong> 401(k) accounts follow workers between jobs, while pension benefits typically require long tenure (10-25 years) to maximize value</li>
                  <li><strong>Market Dominance:</strong> Only 15% of private sector workers have pension access (down from 35% in 1990s), while 68% have access to 401(k) or similar defined contribution plans</li>
                  <li><strong>Flexibility Benefits:</strong> 401(k) accounts offer loan provisions, hardship withdrawals, and investment choice, while pensions provide predictable monthly income for life</li>
                  <li><strong>Employer Cost Structure:</strong> 401(k) plans cost employers 2-4% of payroll vs. 10-15% for traditional pensions, explaining the shift toward defined contribution plans</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 2025 Contribution Limits & Rules */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                2025 Contribution Limits & IRS Regulations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">2025 IRS Contribution Limits</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Standard Limit (Under 50):</strong> $23,500 maximum employee deferral for 2025, up from $23,000 in 2024, representing annual inflation adjustments</li>
                  <li><strong>Age 50+ Catch-Up:</strong> Additional $7,500 catch-up contribution for workers 50 and older, totaling $31,000 maximum annual contribution</li>
                  <li><strong>Age 60-63 Super Catch-Up:</strong> Enhanced $11,250 catch-up for employees aged 60-63, allowing $34,750 total contributions during peak earning years</li>
                  <li><strong>Total Contribution Limit:</strong> Combined employee + employer contributions cannot exceed $70,000 (or $77,500 with catch-up) or 100% of compensation, whichever is less</li>
                  <li><strong>Highly Compensated Employee Rules:</strong> Workers earning over $155,000 (2024 threshold) face additional nondiscrimination testing to ensure equitable plan benefits</li>
                  <li><strong>Historical Growth:</strong> Contribution limits have increased 174% since 2001 ($10,500 then vs. $23,500 in 2025), tracking wage inflation and cost-of-living adjustments</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Contribution Planning</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Maximize Employer Match First:</strong> Always contribute enough to capture full employer match before other savings—it's an immediate 50-100% return on investment</li>
                  <li><strong>Gradual Increase Strategy:</strong> Increase contributions 1% annually or with each raise until reaching maximum limits, minimizing budget impact</li>
                  <li><strong>Tax Bracket Optimization:</strong> Higher earners (22% bracket and above) benefit most from 401(k) tax savings, saving $5,170-$8,743 in federal taxes annually at maximum contribution</li>
                  <li><strong>Front-Loading Benefits:</strong> Contributing maximum amounts early in the year maximizes tax-deferred compounding time, potentially adding $50,000+ to retirement savings over career</li>
                  <li><strong>Bonus and Windfall Allocation:</strong> Direct annual bonuses, tax refunds, and unexpected income to 401(k) to accelerate wealth building without affecting daily budget</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Contribution Timing Considerations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Per-Paycheck Maximization:</strong> Contributing exactly to reach annual limit by December ensures consistent market participation and prevents exceeding IRS caps</li>
                  <li><strong>True-Up Provisions:</strong> Some employers provide year-end "true-up" contributions if you maxed out early and missed match in later months—verify your plan's policy</li>
                  <li><strong>Mid-Year Hire Challenges:</strong> Starting a job mid-year requires higher per-paycheck percentages to reach annual limits—calculate carefully to maximize contributions</li>
                  <li><strong>Multiple Employer Considerations:</strong> IRS limits apply across all 401(k) plans—track total contributions when changing jobs to avoid excess contribution penalties</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Employer Matching Strategies */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Award className="h-5 w-5" />
                Employer Matching: Maximizing Free Money
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Understanding Employer Match Formulas</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Dollar-for-Dollar Match:</strong> Most generous structure matching 100% of employee contributions up to specified percentage (typically 3-6% of salary)</li>
                  <li><strong>50% Match Formula:</strong> Common structure providing $0.50 per dollar contributed, often up to 6% of salary (yielding 3% total employer contribution)</li>
                  <li><strong>Tiered Match Programs:</strong> Multi-level matching like 100% on first 3% + 50% on next 3%, incentivizing higher employee contributions</li>
                  <li><strong>Safe Harbor Contributions:</strong> Mandatory 3-4% employer contributions regardless of employee participation, used to satisfy nondiscrimination testing requirements</li>
                  <li><strong>Profit-Sharing Component:</strong> Discretionary employer contributions based on company performance, ranging from 0-10% of salary in profitable years</li>
                  <li><strong>Match Cap Calculations:</strong> Understand whether match limits are based on base salary only or include bonuses, commissions, and overtime compensation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Vesting Schedules & Ownership Timeline</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Immediate Vesting:</strong> 42% of plans offer immediate 100% ownership of employer contributions from day one—verify your plan's schedule</li>
                  <li><strong>Graded Vesting:</strong> Gradual ownership accrual (20% per year over 5 years, or 33% per year over 3 years), rewarding tenure and reducing turnover</li>
                  <li><strong>Cliff Vesting:</strong> Zero ownership until specific anniversary (typically 3 years), then 100% ownership—risky if leaving before cliff date</li>
                  <li><strong>Safe Harbor Immediate Vesting:</strong> Safe harbor employer contributions must be 100% vested immediately under IRS regulations</li>
                  <li><strong>Strategic Departure Timing:</strong> Employees within months of vesting milestone should consider timing job changes to capture thousands in employer contributions</li>
                  <li><strong>Forfeiture Impact:</strong> Americans forfeit approximately $1.35 billion annually in unvested 401(k) contributions by changing jobs before vesting—understand your timeline</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Maximizing Match Value</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Financial Priority Ranking:</strong> Contribute to receive full employer match before paying off low-interest debt or building excess emergency savings—the guaranteed return is unmatched</li>
                  <li><strong>True-Up Provisions:</strong> Some plans "true up" at year-end to catch missed match if you maxed contributions early—confirm your plan's policy to optimize timing</li>
                  <li><strong>Bonus Deferral Strategy:</strong> Direct bonus allocations to 401(k) to capture match on bonus income if your plan allows matching on variable compensation</li>
                  <li><strong>Lifetime Value Calculation:</strong> At 6% salary with 50% match, a 30-year career yields approximately $150,000-$400,000 in free employer contributions (depending on salary growth)</li>
                  <li><strong>Survey Data Findings:</strong> 20% of eligible employees fail to contribute enough to receive full employer match, leaving an average $1,336 annually on the table</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Investment Strategies */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <TrendingUp className="h-5 w-5" />
                401(k) Investment Strategies & Portfolio Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Common 401(k) Investment Options</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Target-Date Retirement Funds:</strong> "Set and forget" funds automatically adjusting from aggressive (90% stocks) to conservative (30% stocks) as retirement approaches</li>
                  <li><strong>Index Funds:</strong> Low-cost funds tracking market indices (S&P 500, Total Market) with expense ratios as low as 0.03-0.15%, maximizing long-term returns through low fees</li>
                  <li><strong>Actively Managed Funds:</strong> Professional portfolio management attempting to outperform market benchmarks, charging 0.50-1.50% expense ratios with mixed success rates</li>
                  <li><strong>Bond Funds:</strong> Fixed-income investments providing stability and income, appropriate for conservative investors and those nearing retirement</li>
                  <li><strong>Company Stock:</strong> Employer securities often available at discount but risky—Enron and Worldcom collapses destroyed billions in employee retirement savings</li>
                  <li><strong>Stable Value Funds:</strong> Principal-protected options guaranteeing 2-4% returns, suitable for ultra-conservative investors but vulnerable to inflation erosion</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Age-Based Asset Allocation Strategies</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>20s-30s (30-40 years to retirement):</strong> 90-100% stocks for maximum growth potential, accepting short-term volatility for long-term wealth accumulation</li>
                  <li><strong>40s-50s (15-25 years to retirement):</strong> 70-80% stocks / 20-30% bonds, balancing growth needs with increasing stability as retirement approaches</li>
                  <li><strong>50s-60s (5-15 years to retirement):</strong> 60-70% stocks / 30-40% bonds, preserving accumulated wealth while maintaining growth to combat inflation</li>
                  <li><strong>Retirement (0-5 years to retirement):</strong> 40-50% stocks / 50-60% bonds, emphasizing capital preservation while maintaining purchasing power through moderate equity exposure</li>
                  <li><strong>Rule of 110/120:</strong> Subtract age from 110 or 120 to determine stock allocation percentage (e.g., 30-year-old: 90% stocks, 60-year-old: 50-60% stocks)</li>
                  <li><strong>Glide Path Consideration:</strong> Target-date funds use predetermined glide paths that may be too conservative or aggressive for individual risk tolerance—review underlying allocations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Fee Minimization & Performance Optimization</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Expense Ratio Impact:</strong> 1% annual fee difference costs $100,000+ over 30-year career due to compounding—prioritize low-cost index funds under 0.20% when available</li>
                  <li><strong>Hidden Fee Awareness:</strong> Administrative fees (0.25-1.50% annually), trading costs, and revenue-sharing arrangements can reduce net returns—review plan fee disclosures</li>
                  <li><strong>Diversification Requirement:</strong> Spread investments across large-cap, mid-cap, small-cap, international, and bond funds to reduce single-market risk exposure</li>
                  <li><strong>Rebalancing Strategy:</strong> Annually reset allocations to target percentages, automatically selling high and buying low without emotional market timing</li>
                  <li><strong>Avoid Market Timing:</strong> Time in market beats timing the market—missing just 10 best market days over 20 years cuts returns by 50% according to JP Morgan analysis</li>
                  <li><strong>Company Stock Limit:</strong> Department of Labor recommends under 10% portfolio allocation to employer stock to avoid concentration risk exemplified by Enron disaster</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Early Withdrawal Rules */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Early Withdrawal Penalties & Exceptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Standard Penalty Structure</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>10% Early Withdrawal Penalty:</strong> IRS assesses 10% penalty on distributions before age 59½, plus ordinary income taxes on entire withdrawal amount</li>
                  <li><strong>Double Tax Hit Example:</strong> $10,000 withdrawal in 24% tax bracket costs $2,400 income tax + $1,000 penalty + lost growth = $5,500+ total cost</li>
                  <li><strong>Opportunity Cost Analysis:</strong> $20,000 early withdrawal at age 35 costs approximately $200,000 in lost retirement wealth by age 65 (assuming 7% annual growth)</li>
                  <li><strong>State Tax Implications:</strong> State income taxes (0-13.3% depending on location) add additional cost on top of federal penalties and taxes</li>
                  <li><strong>Mandatory Withholding:</strong> Plan administrators must withhold 20% for federal taxes on distributions, potentially creating short-term cash flow challenges</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Penalty-Free Withdrawal Exceptions</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Separation from Service After 55:</strong> Workers leaving employer at age 55+ (50+ for public safety employees) can access funds penalty-free from that employer's plan only</li>
                  <li><strong>Substantially Equal Periodic Payments (SEPP/72(t)):</strong> IRS Rule 72(t) allows penalty-free withdrawals using life expectancy calculations, but requires 5+ years of consistent withdrawals</li>
                  <li><strong>Permanent Disability:</strong> Total and permanent disability as defined by IRS allows penalty-free access regardless of age, requiring medical documentation</li>
                  <li><strong>Medical Expense Exception:</strong> Unreimbursed medical expenses exceeding 7.5% of adjusted gross income qualify for penalty-free withdrawal (still subject to income taxes)</li>
                  <li><strong>IRS Levy:</strong> IRS tax levy to satisfy tax debt avoids the 10% penalty but indicates severe financial situation requiring professional intervention</li>
                  <li><strong>Qualified Domestic Relations Order (QDRO):</strong> Court-ordered divisions in divorce proceedings allow ex-spouse access without penalty, though income taxes still apply</li>
                  <li><strong>Birth or Adoption:</strong> Up to $5,000 penalty-free per qualifying event (2020+ SECURE Act provision), must occur within one year of birth/adoption</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Hardship Withdrawal Criteria</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Immediate Financial Need:</strong> Must demonstrate immediate and heavy financial need that cannot be met through other resources including spousal assets</li>
                  <li><strong>Qualified Expenses:</strong> Medical costs, prevent foreclosure/eviction, funeral expenses, home purchase (principal residence), post-secondary tuition, and disaster-related expenses</li>
                  <li><strong>Suspension Penalty:</strong> Some plans require 6-month contribution suspension after hardship withdrawal, potentially sacrificing employer match during suspension period</li>
                  <li><strong>Documentation Requirements:</strong> Extensive paperwork proving hardship including bills, notices, and evidence of exhausting other options before plan approval</li>
                  <li><strong>Alternative Consideration:</strong> 401(k) loans (if available) may provide better option than hardship withdrawal—repay yourself with interest rather than paying taxes and penalties</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Required Minimum Distributions */}
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-700">
                <Calendar className="h-5 w-5" />
                Required Minimum Distributions (RMDs) & Retirement Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">RMD Rules & Requirements</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Starting Age:</strong> RMDs begin at age 73 for those born 1951-1959, age 75 for those born 1960+, mandating annual minimum distributions based on life expectancy</li>
                  <li><strong>First RMD Deadline:</strong> April 1st following the year you turn 73, with second RMD due by December 31st of same year (potentially creating double tax year)</li>
                  <li><strong>Calculation Method:</strong> Divide prior year December 31st account balance by IRS life expectancy factor (gradually decreasing from 27.4 years at 73 to 5.9 years at 100)</li>
                  <li><strong>Multiple Account Rules:</strong> Calculate RMD separately for each 401(k), though IRA RMDs can be taken from single account (401(k)s cannot be aggregated)</li>
                  <li><strong>Still-Working Exception:</strong> If still employed and not 5% owner, can delay RMDs from current employer's plan (but not IRAs or previous employers' 401(k)s)</li>
                  <li><strong>Inherited Account Rules:</strong> Non-spouse beneficiaries generally must withdraw entire account within 10 years (SECURE Act 2.0), with some exceptions for eligible designated beneficiaries</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">RMD Penalties & Compliance</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Severe Penalty Structure:</strong> 25% penalty (reduced from previous 50%) on amount not withdrawn by deadline—$10,000 shortfall costs $2,500 penalty plus missed withdrawal still required</li>
                  <li><strong>Penalty Reduction Option:</strong> Penalty drops to 10% if corrected within two-year window, emphasizing importance of immediate correction upon discovery</li>
                  <li><strong>Waiver Request Process:</strong> IRS may waive penalty for reasonable error (illness, incorrect advice) if shortfall withdrawn promptly and Form 5329 filed explaining situation</li>
                  <li><strong>Automatic Calculation Services:</strong> Most plan administrators calculate RMDs automatically, but account owner bears ultimate responsibility for compliance</li>
                  <li><strong>Tax Withholding Options:</strong> Federal tax withholding (10-100%) can be elected to cover tax liability, though not required if making quarterly estimated tax payments</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Distribution Planning</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Tax-Efficient Withdrawal Sequencing:</strong> Consider drawing from taxable accounts first (years 59½-73), preserving tax-deferred growth as long as possible before RMDs force distributions</li>
                  <li><strong>Roth Conversion Strategy:</strong> Converting traditional 401(k) to Roth IRA before age 73 eliminates future RMDs, though requires paying taxes on conversion amount upfront</li>
                  <li><strong>Qualified Charitable Distributions (QCDs):</strong> Direct up to $105,000 annually (2024 limit, indexed for inflation) to charity from IRA to satisfy RMD without increasing taxable income</li>
                  <li><strong>Medicare Premium Impact:</strong> RMDs increase adjusted gross income, potentially triggering higher Medicare Part B and Part D premiums ($174-$594/month based on income) two years later</li>
                  <li><strong>Social Security Taxation:</strong> RMDs can push 50-85% of Social Security benefits into taxable territory—coordinate distributions with Social Security claiming strategy</li>
                  <li><strong>Market Timing Flexibility:</strong> RMD only mandates amount, not timing within calendar year—consider market conditions when taking required distributions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roth 401(k) Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Target className="h-5 w-5" />
              Roth 401(k): After-Tax Retirement Savings Alternative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Roth 401(k) Fundamentals</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>After-Tax Contributions:</strong> Contribute post-tax dollars now for completely tax-free withdrawals in retirement including all growth and earnings</li>
                  <li><strong>Same Contribution Limits:</strong> $23,500 base limit (2025) plus catch-up contributions apply—can split between traditional and Roth 401(k) up to combined limit</li>
                  <li><strong>No Income Restrictions:</strong> Unlike Roth IRA (income limits at $161,000 single / $240,000 married for 2024), Roth 401(k) available to all earners regardless of income</li>
                  <li><strong>Tax-Free Withdrawals:</strong> Qualified distributions (after age 59½ and 5-year holding period) are completely tax-free—no income taxes ever on growth</li>
                  <li><strong>Five-Year Rule:</strong> Account must be open 5 years before age 59½ withdrawals—clock starts January 1 of contribution year, not actual contribution date</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Roth vs. Traditional Decision Framework</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Choose Roth if:</strong> Currently in low tax bracket (12-22%), expecting higher retirement income, early career with decades of tax-free growth ahead</li>
                  <li><strong>Choose Traditional if:</strong> High current tax bracket (32%+) needing immediate tax reduction, expecting lower retirement tax bracket, nearing retirement</li>
                  <li><strong>Tax Rate Breakeven:</strong> If current and retirement tax brackets equal, Roth and traditional yield identical after-tax results—Roth provides more flexibility</li>
                  <li><strong>Diversification Strategy:</strong> Split contributions (50/50 or 60/40) between Roth and traditional provides tax diversification and withdrawal flexibility in retirement</li>
                  <li><strong>Estate Planning Benefit:</strong> Roth accounts pass to heirs tax-free, while traditional 401(k) creates tax burden for beneficiaries withdrawing over 10-year period</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Roth 401(k) RMD Rules</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>RMD Requirement:</strong> Unlike Roth IRAs, Roth 401(k) accounts are subject to RMDs starting at age 73, forcing potentially unnecessary taxable events</li>
                  <li><strong>Rollover Solution:</strong> Convert Roth 401(k) to Roth IRA before age 73 to eliminate RMD requirement entirely—tax-free, penalty-free conversion</li>
                  <li><strong>SECURE 2.0 Change:</strong> Starting 2024, RMDs from Roth 401(k) eliminated for original account owner (but not beneficiaries), matching Roth IRA treatment</li>
                  <li><strong>Employer Match Treatment:</strong> Employer matching contributions go into traditional 401(k) even for Roth contributions—match is pre-tax money subject to taxes when withdrawn</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Tax-Free Growth Power</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Compounding Advantage:</strong> $500/month Roth 401(k) contribution for 30 years at 7% return yields $611,000 completely tax-free vs. $458,000 after-tax in traditional (25% bracket)</li>
                  <li><strong>Withdrawal Flexibility:</strong> Access contributions (not earnings) anytime without penalty—useful emergency backup, though not recommended to tap retirement savings</li>
                  <li><strong>Tax Hedge Strategy:</strong> Roth 401(k) protects against future tax rate increases—if rates rise 5-10%, traditional 401(k) holders face higher tax bills</li>
                  <li><strong>Medicare Impact:</strong> Roth withdrawals don't count toward income for Medicare premium calculations, potentially saving $3,000-7,000 annually in Part B/D surcharges</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Changes & Rollovers */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="h-5 w-5" />
              Job Changes: Rollover Options & Portability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Four Rollover Options</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>1. Leave with Former Employer:</strong> Maintain existing account if balance exceeds $5,000, avoiding transfer hassles but losing convenience of unified management</li>
                  <li><strong>2. Roll to New Employer Plan:</strong> Consolidate retirement accounts under single administrator, simplifying tracking and potentially accessing better investment options or lower fees</li>
                  <li><strong>3. Roll to IRA:</strong> Maximum investment flexibility, lowest fees with discount brokers, unlimited fund options vs. employer plan restrictions—most popular choice for DIY investors</li>
                  <li><strong>4. Cash Out (Not Recommended):</strong> Immediate 20% withholding + 10% penalty + state taxes + lost compounding growth makes this extremely expensive option</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Direct vs. Indirect Rollover</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Direct Rollover (Recommended):</strong> Funds transfer directly between financial institutions—no taxes withheld, no 60-day deadline, no complications</li>
                  <li><strong>Indirect Rollover (Risky):</strong> Check issued to participant who has 60 days to deposit in new account—20% automatic withholding plus 60-day deadline risk</li>
                  <li><strong>60-Day Rule Consequences:</strong> Missing 60-day deadline treats distribution as taxable income plus 10% penalty if under 59½—IRS grants limited hardship waivers only</li>
                  <li><strong>One-Per-Year Limit:</strong> Only one indirect rollover allowed per 12-month period across all IRAs—direct rollovers unlimited, another reason to avoid indirect method</li>
                  <li><strong>Tax Form Reporting:</strong> Rollovers must be reported on Form 1040 even though not taxable—maintain rollover documentation for 7 years minimum</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Strategic Rollover Considerations</h4>
                <ul className="space-y-1 text-sm sm:text-base text-gray-600">
                  <li><strong>Fee Comparison Analysis:</strong> Former employer plans averaging 1% fees vs. 0.10-0.30% at discount brokers (Vanguard, Fidelity, Schwab) saves thousands annually</li>
                  <li><strong>Investment Option Expansion:</strong> IRA rollovers provide access to 10,000+ investment options vs. typical 10-30 options in employer plans</li>
                  <li><strong>Creditor Protection Variation:</strong> 401(k) assets have unlimited federal ERISA protection; IRA protection varies by state ($1-$1.5 million in bankruptcy)</li>
                  <li><strong>Early Retirement Access:</strong> Age 55 separation allows penalty-free 401(k) access; IRAs require waiting until 59½ (or using 72(t) SEPP)—keep with old employer if early retiree</li>
                  <li><strong>Roth Conversion Opportunity:</strong> Job change rollover presents optimal time for Roth conversion analysis—potentially lower income year reduces conversion tax cost</li>
                  <li><strong>Employer Stock NUA:</strong> If holding appreciated employer stock, Net Unrealized Appreciation rules may provide tax savings—consult CPA before rolling to IRA</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Disclaimer */}
        <div className="text-center text-sm sm:text-base text-gray-500 bg-gray-50 p-3 sm:p-4 rounded-lg">
          <p>
            <strong>Important Disclaimer:</strong> This 401(k) calculator provides educational estimates and should not constitute legal, financial, tax, or investment advice. 
            Actual retirement outcomes depend on numerous factors including contribution consistency, investment returns, employer matching policies, fee structures, tax law changes, 
            and individual financial circumstances. Contribution limits, tax rules, penalty exceptions, and RMD requirements are subject to annual IRS adjustments and legislative changes. 
            Investment performance is not guaranteed and past returns do not predict future results. Early withdrawal penalties, tax consequences, and opportunity costs significantly 
            impact retirement wealth accumulation. For personalized retirement planning, tax optimization strategies, investment allocation recommendations, and comprehensive financial guidance 
            tailored to your specific situation, age, risk tolerance, and retirement goals, consult with qualified financial advisors, certified public accountants, or certified financial planners 
            who can analyze your complete financial picture and provide advice compliant with current regulations and your individual circumstances.
          </p>
        </div>
      </div>
    </div>
  );
};

export default _401kCalculatorComponent;
