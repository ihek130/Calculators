import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, TrendingUp, DollarSign, Percent, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface YearData {
  year: number;
  deposit: number;
  interest: number;
  endingBalance: number;
  initialDeposit: number;
  contributions: number;
  interestEarned: number;
}

interface MonthData {
  month: number;
  deposit: number;
  interest: number;
  endingBalance: number;
}

const SavingsCalculatorComponent = () => {
  // Input states
  const [initialDeposit, setInitialDeposit] = useState<string>('20000');
  const [annualContribution, setAnnualContribution] = useState<string>('5000');
  const [annualIncrease, setAnnualIncrease] = useState<string>('3');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('0');
  const [monthlyIncrease, setMonthlyIncrease] = useState<string>('0');
  const [interestRate, setInterestRate] = useState<string>('3');
  const [compoundFrequency, setCompoundFrequency] = useState<string>('annually');
  const [yearsToSave, setYearsToSave] = useState<string>('10');
  const [taxRate, setTaxRate] = useState<string>('0');
  const [inflationRate, setInflationRate] = useState<string>('0');

  // Results states
  const [endBalance, setEndBalance] = useState<number>(0);
  const [totalDeposit, setTotalDeposit] = useState<number>(0);
  const [totalContributions, setTotalContributions] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [annualSchedule, setAnnualSchedule] = useState<YearData[]>([]);
  const [monthlySchedule, setMonthlySchedule] = useState<MonthData[]>([]);

  // Get compound periods per year
  const getCompoundPeriods = (frequency: string): number => {
    switch (frequency) {
      case 'daily': return 365;
      case 'weekly': return 52;
      case 'biweekly': return 26;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'semiannually': return 2;
      case 'annually': return 1;
      default: return 1;
    }
  };

  // Calculate savings
  useEffect(() => {
    const initial = parseFloat(initialDeposit) || 0;
    const annualCont = parseFloat(annualContribution) || 0;
    const annualIncr = parseFloat(annualIncrease) || 0;
    const monthlyCont = parseFloat(monthlyContribution) || 0;
    const monthlyIncr = parseFloat(monthlyIncrease) || 0;
    const rate = parseFloat(interestRate) || 0;
    const years = parseFloat(yearsToSave) || 0;
    const tax = parseFloat(taxRate) || 0;
    const inflation = parseFloat(inflationRate) || 0;

    if (years <= 0) {
      resetResults();
      return;
    }

    const compoundPeriods = getCompoundPeriods(compoundFrequency);
    const periodsPerYear = compoundPeriods;
    const totalPeriods = years * periodsPerYear;
    const ratePerPeriod = (rate / 100) / periodsPerYear;
    const taxRateDecimal = tax / 100;

    let balance = initial;
    let totalInterestEarned = 0;
    let totalContributionsMade = 0;

    const yearlyData: YearData[] = [];
    const monthlyData: MonthData[] = [];

    // Calculate for each period
    for (let period = 1; period <= totalPeriods; period++) {
      const currentYear = Math.floor((period - 1) / periodsPerYear);
      const periodInYear = (period - 1) % periodsPerYear;

      // Add annual contribution (at the end of each year, distributed across periods)
      let periodAnnualContribution = 0;
      if (compoundFrequency === 'annually' && periodInYear === periodsPerYear - 1) {
        // Add full annual contribution at end of year
        const yearlyContAmount = annualCont * Math.pow(1 + annualIncr / 100, currentYear);
        periodAnnualContribution = yearlyContAmount;
      } else if (compoundFrequency !== 'annually') {
        // Distribute annual contribution across periods
        const yearlyContAmount = annualCont * Math.pow(1 + annualIncr / 100, currentYear);
        periodAnnualContribution = yearlyContAmount / periodsPerYear;
      }

      // Add monthly contribution (if compound frequency supports it)
      let periodMonthlyContribution = 0;
      if (compoundFrequency === 'monthly' || compoundFrequency === 'weekly' || 
          compoundFrequency === 'daily' || compoundFrequency === 'biweekly') {
        const monthsElapsed = Math.floor(period / (periodsPerYear / 12));
        const monthlyContAmount = monthlyCont * Math.pow(1 + monthlyIncr / 100, monthsElapsed / 12);
        
        if (compoundFrequency === 'monthly') {
          periodMonthlyContribution = monthlyContAmount;
        } else if (compoundFrequency === 'biweekly') {
          periodMonthlyContribution = monthlyContAmount / 2;
        } else if (compoundFrequency === 'weekly') {
          periodMonthlyContribution = monthlyContAmount / 4;
        } else if (compoundFrequency === 'daily') {
          periodMonthlyContribution = monthlyContAmount / 30;
        }
      }

      const periodContribution = periodAnnualContribution + periodMonthlyContribution;
      balance += periodContribution;
      totalContributionsMade += periodContribution;

      // Calculate interest for this period
      const interestEarned = balance * ratePerPeriod;
      const interestAfterTax = interestEarned * (1 - taxRateDecimal);
      balance += interestAfterTax;
      totalInterestEarned += interestAfterTax;

      // Store monthly data (for monthly schedule view)
      if (compoundFrequency === 'monthly' || period % Math.max(1, Math.floor(periodsPerYear / 12)) === 0) {
        monthlyData.push({
          month: period,
          deposit: periodContribution,
          interest: interestAfterTax,
          endingBalance: balance,
        });
      }

      // Store yearly data (at end of each year)
      if (period % periodsPerYear === 0 || period === totalPeriods) {
        const yearNumber = Math.ceil(period / periodsPerYear);
        const yearStartBalance = yearNumber === 1 ? initial : yearlyData[yearNumber - 2]?.endingBalance || initial;
        const yearDeposits = balance - yearStartBalance - (totalInterestEarned - (yearlyData[yearNumber - 2]?.interestEarned || 0));
        const yearInterest = totalInterestEarned - (yearlyData[yearNumber - 2]?.interestEarned || 0);

        yearlyData.push({
          year: yearNumber,
          deposit: yearDeposits,
          interest: yearInterest,
          endingBalance: balance,
          initialDeposit: initial,
          contributions: totalContributionsMade,
          interestEarned: totalInterestEarned,
        });
      }
    }

    setEndBalance(balance);
    setTotalDeposit(initial);
    setTotalContributions(totalContributionsMade);
    setTotalInterest(totalInterestEarned);
    setAnnualSchedule(yearlyData);
    setMonthlySchedule(monthlyData);
  }, [initialDeposit, annualContribution, annualIncrease, monthlyContribution, monthlyIncrease, 
      interestRate, compoundFrequency, yearsToSave, taxRate, inflationRate]);

  const resetResults = () => {
    setEndBalance(0);
    setTotalDeposit(0);
    setTotalContributions(0);
    setTotalInterest(0);
    setAnnualSchedule([]);
    setMonthlySchedule([]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return ((value / (totalDeposit + totalContributions + totalInterest)) * 100).toFixed(0);
  };

  // Pie chart data
  const pieData = [
    { name: 'Initial Deposit', value: totalDeposit, color: '#3b82f6' },
    { name: 'Contributions', value: totalContributions, color: '#10b981' },
    { name: 'Interest', value: totalInterest, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Area chart data
  const areaChartData = annualSchedule.map(item => ({
    year: `Year ${item.year}`,
    'Initial Deposit': item.initialDeposit,
    'Contributions': item.contributions,
    'Interest': item.interestEarned,
    Total: item.endingBalance,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <PiggyBank className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Savings Calculator</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Calculate your savings growth with compound interest, contributions, tax, and inflation. Plan for retirement, emergency funds, or major purchases.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Inputs */}
        <div className="lg:col-span-1 space-y-6">
          {/* Initial Deposit */}
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <DollarSign className="w-5 h-5" />
                Initial Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="initialDeposit" className="text-sm font-semibold text-gray-700">
                  Initial Deposit
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="initialDeposit"
                    type="number"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    className="pl-10"
                    placeholder="20000"
                  />
                </div>
                <p className="text-xs text-gray-600">Starting balance (can be negative)</p>
              </div>
            </CardContent>
          </Card>

          {/* Contributions */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingUp className="w-5 h-5" />
                Contributions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="annualContribution" className="text-sm font-semibold text-gray-700">
                    Annual Contribution
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="annualContribution"
                      type="number"
                      value={annualContribution}
                      onChange={(e) => setAnnualContribution(e.target.value)}
                      className="pl-10"
                      placeholder="5000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annualIncrease" className="text-sm font-semibold text-gray-700">
                    Annual Increase
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="annualIncrease"
                      type="number"
                      value={annualIncrease}
                      onChange={(e) => setAnnualIncrease(e.target.value)}
                      placeholder="3"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-600">% /year</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyContribution" className="text-sm font-semibold text-gray-700">
                      Monthly Contribution
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="monthlyContribution"
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        className="pl-10"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="monthlyIncrease" className="text-sm font-semibold text-gray-700">
                      Monthly Increase
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="monthlyIncrease"
                        type="number"
                        value={monthlyIncrease}
                        onChange={(e) => setMonthlyIncrease(e.target.value)}
                        placeholder="0"
                        step="0.1"
                      />
                      <span className="text-sm text-gray-600">% /year</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interest & Time */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Percent className="w-5 h-5" />
                Interest & Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-sm font-semibold text-gray-700">
                  Interest Rate
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="interestRate"
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="3"
                    step="0.01"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compoundFrequency" className="text-sm font-semibold text-gray-700">
                  Compound Frequency
                </Label>
                <Select value={compoundFrequency} onValueChange={setCompoundFrequency}>
                  <SelectTrigger id="compoundFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semiannually">Semi-Annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsToSave" className="text-sm font-semibold text-gray-700">
                  Years to Save
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="yearsToSave"
                    type="number"
                    value={yearsToSave}
                    onChange={(e) => setYearsToSave(e.target.value)}
                    placeholder="10"
                    step="1"
                  />
                  <span className="text-sm text-gray-600">years</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & Inflation */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <BarChart3 className="w-5 h-5" />
                Tax & Inflation
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-sm font-semibold text-gray-700">
                  Tax Rate
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="taxRate"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="0"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-600">Tax on interest earned</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inflationRate" className="text-sm font-semibold text-gray-700">
                  Inflation Rate (Optional)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="inflationRate"
                    type="number"
                    value={inflationRate}
                    onChange={(e) => setInflationRate(e.target.value)}
                    placeholder="0"
                    step="0.1"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-600">Reduces purchasing power over time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Results */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="text-green-900">Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center p-4 sm:p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 mb-6">
                <p className="text-sm sm:text-lg text-gray-600 mb-2">End Balance</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-600 mb-4 sm:mb-6 break-words">
                  {formatCurrency(endBalance)}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-300">
                    <p className="text-sm text-gray-600 mb-1">Initial Deposit</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalDeposit)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-300">
                    <p className="text-sm text-gray-600 mb-1">Total Contributions</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalContributions)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-orange-300">
                    <p className="text-sm text-gray-600 mb-1">Total Interest Earned</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalInterest)}</p>
                  </div>
                </div>
              </div>

              {/* Pie Chart */}
              {pieData.length > 0 && (
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Balance Composition</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={(entry) => {
                          const percent = ((entry.value / (totalDeposit + totalContributions + totalInterest)) * 100).toFixed(0);
                          return `${percent}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs sm:text-sm">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accumulation Chart */}
          {areaChartData.length > 0 && (
            <Card className="border-cyan-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
                <CardTitle className="text-cyan-900">Accumulation Schedule</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={areaChartData}>
                    <defs>
                      <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Initial Deposit" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="url(#colorDeposit)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Contributions" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="url(#colorContrib)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Interest" 
                      stackId="1"
                      stroke="#f59e0b" 
                      fill="url(#colorInterest)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Schedule Tables */}
          {annualSchedule.length > 0 && (
            <Card className="border-indigo-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
                <CardTitle className="text-indigo-900">Detailed Schedule</CardTitle>
                <CardDescription>* Contributions are made at the end of each period</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Tabs defaultValue="annual" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-auto mb-6">
                    <TabsTrigger value="annual" className="text-xs sm:text-sm px-3 py-2">
                      Annual Schedule
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs sm:text-sm px-3 py-2">
                      Monthly Schedule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="annual">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-indigo-50 border-b-2 border-indigo-200">
                          <tr>
                            <th className="text-left p-2 sm:p-3 font-bold text-indigo-900">Year</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Deposit</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Interest</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Ending Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annualSchedule.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-2 sm:p-3 text-gray-900 font-medium">{row.year}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-700">{formatCurrency(row.deposit)}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-700">{formatCurrency(row.interest)}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-900 font-bold">{formatCurrency(row.endingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="monthly">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-indigo-50 border-b-2 border-indigo-200">
                          <tr>
                            <th className="text-left p-2 sm:p-3 font-bold text-indigo-900">Month</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Deposit</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Interest</th>
                            <th className="text-right p-2 sm:p-3 font-bold text-indigo-900">Ending Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlySchedule.slice(0, 120).map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="p-2 sm:p-3 text-gray-900 font-medium">{row.month}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-700">{formatCurrency(row.deposit)}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-700">{formatCurrency(row.interest)}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-900 font-bold">{formatCurrency(row.endingBalance)}</td>
                            </tr>
                          ))}
                          {monthlySchedule.length > 120 && (
                            <tr className="bg-gray-100">
                              <td colSpan={4} className="p-3 text-center text-gray-600 text-sm italic">
                                Showing first 120 months. Use Annual Schedule for full view.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Everything You Need to Know About Savings
        </h2>

        {/* Understanding Savings Accounts */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <PiggyBank className="w-5 h-5" />
              Understanding Savings Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              A <strong>savings account</strong> is a deposit account held at a financial institution that provides principal security and earns interest. In the U.S., most savings accounts are insured by the Federal Deposit Insurance Corporation (FDIC) up to <strong>$250,000 per depositor, per institution</strong>. This makes them one of the safest places to store your money.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                  ✅ Advantages
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Safety:</strong> FDIC insurance protects your deposits up to $250,000</li>
                  <li><strong>Liquidity:</strong> Access your money whenever you need it (with some limitations)</li>
                  <li><strong>Guaranteed returns:</strong> Interest rates are fixed or variable, but never negative</li>
                  <li><strong>Low minimums:</strong> Many accounts have no minimum balance requirements</li>
                  <li><strong>Easy setup:</strong> Can be opened online in minutes with most banks</li>
                </ul>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  ❌ Disadvantages
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li><strong>Low interest rates:</strong> Currently 3-5% APY, historically lower than inflation</li>
                  <li><strong>Transaction limits:</strong> Federal law previously limited withdrawals to 6/month (relaxed in 2020)</li>
                  <li><strong>Fees:</strong> Some accounts charge monthly maintenance fees ($5-$15) if balance falls below minimum</li>
                  <li><strong>Inflation risk:</strong> Purchasing power may decrease if interest doesn't keep pace with inflation</li>
                  <li><strong>Opportunity cost:</strong> Lower returns than stocks, bonds, or real estate over long term</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <h4 className="font-bold text-blue-900 mb-2">Savings vs. Checking Accounts</h4>
              <p className="text-sm text-gray-700 mb-3">
                While both are deposit accounts, they serve different purposes:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-bold text-blue-900 mb-2">Savings Account</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Earns interest (typically 0.5-5% APY)</li>
                    <li>• Limited transactions (6/month historically)</li>
                    <li>• For storing money you don't need immediately</li>
                    <li>• May require minimum balance</li>
                    <li>• No checks or debit cards (usually)</li>
                  </ul>
                </div>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="font-bold text-blue-900 mb-2">Checking Account</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Little to no interest (0-0.1% typically)</li>
                    <li>• Unlimited transactions</li>
                    <li>• For daily spending and bill payments</li>
                    <li>• Often no minimum balance required</li>
                    <li>• Includes checks, debit cards, ATM access</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <p className="text-sm text-gray-700">
                <strong>Pro Tip:</strong> Use both! Keep 1-2 months of expenses in checking for daily needs, and 3-6 months in savings for emergencies. Link them for free instant transfers between accounts. Many banks waive checking account fees if you also have a savings account with them.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Money Market Accounts */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="w-5 h-5" />
              Money Market Accounts (MMA)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              <strong>Money Market Accounts</strong> are a hybrid between savings and checking accounts. They typically offer higher interest rates than traditional savings accounts because your deposits are invested in low-risk securities like Treasury bills and commercial paper rather than just held in reserve.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-300">
              <h4 className="font-bold text-green-900 mb-3">Key Differences from Regular Savings</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-sm text-green-900 mb-2">Money Market Accounts</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• <strong>Higher rates:</strong> 0.5-1% more than savings (currently 4-6% APY)</li>
                    <li>• <strong>Check writing:</strong> Limited check-writing privileges (3-6 per month)</li>
                    <li>• <strong>Debit card:</strong> ATM and debit card access usually included</li>
                    <li>• <strong>Higher minimums:</strong> Often require $1,000-$10,000 minimum</li>
                    <li>• <strong>FDIC insured:</strong> Same $250,000 protection as savings</li>
                    <li>• <strong>Tiered rates:</strong> Higher balances earn better rates</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-sm text-green-900 mb-2">Traditional Savings</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• <strong>Lower rates:</strong> Currently 3-5% APY on average</li>
                    <li>• <strong>No checks:</strong> Must transfer to checking first</li>
                    <li>• <strong>No debit card:</strong> Transfers only via online/branch</li>
                    <li>• <strong>Low minimums:</strong> Often $0-$100 to open</li>
                    <li>• <strong>FDIC insured:</strong> Up to $250,000 protection</li>
                    <li>• <strong>Flat rates:</strong> Same rate regardless of balance</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <h4 className="font-bold text-yellow-900 mb-2">When to Choose Money Market Accounts</h4>
              <p className="text-sm text-gray-700 mb-2">
                MMAs are ideal if you:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>✓ Have $10,000+ to deposit (to maximize rates and avoid fees)</li>
                <li>✓ Want occasional check-writing ability without losing interest</li>
                <li>✓ Need slightly more liquidity than a CD but better rates than savings</li>
                <li>✓ Keep your emergency fund (6-12 months expenses) that you rarely touch</li>
                <li>✓ Are saving for a specific goal 1-3 years away (house down payment, car, wedding)</li>
              </ul>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-300">
              <h4 className="font-bold text-red-900 mb-2">⚠️ Important Considerations</h4>
              <p className="text-sm text-gray-700">
                <strong>Not a money market fund:</strong> Don't confuse MMAs with money market mutual funds (MMMFs). MMMFs are investment products that are NOT FDIC insured and can lose value (though rare). MMAs are bank deposit accounts with full FDIC protection. During the 2008 financial crisis, some MMMFs "broke the buck" (fell below $1 per share), but MMAs remained safe.
              </p>
            </div>
            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-300">
              <p className="text-sm text-gray-700">
                <strong>Current Market (2025):</strong> With interest rates elevated, high-yield savings accounts (4-5% APY) and MMAs (4.5-6% APY) are competitive options. Online banks like Marcus (Goldman Sachs), Ally, and American Express offer the highest rates. Compare rates at DepositAccounts.com or Bankrate.com before choosing.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Strategies */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="w-5 h-5" />
              How Much Should You Save? Proven Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Financial experts recommend various rules of thumb for determining how much to save. The right strategy depends on your income, expenses, goals, and life stage.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">1. The Emergency Fund Rule (3-6 Months)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Priority #1:</strong> Build an emergency fund covering 3-6 months of essential expenses. This protects against job loss, medical emergencies, car repairs, or home maintenance.
                </p>
                <div className="bg-white p-3 rounded border border-blue-200">
                  <p className="text-xs font-bold text-blue-900 mb-2">How to Calculate:</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>• Monthly rent/mortgage: $1,500</p>
                    <p>• Utilities (electric, water, internet): $200</p>
                    <p>• Food and groceries: $400</p>
                    <p>• Car payment & insurance: $400</p>
                    <p>• Minimum debt payments: $300</p>
                    <p>• Healthcare (insurance + meds): $200</p>
                    <p className="font-bold pt-2 border-t border-blue-300">= $3,000/month × 6 months = <span className="text-blue-600">$18,000 emergency fund goal</span></p>
                  </div>
                </div>
                <div className="mt-3 bg-blue-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Why 3-6 months?</strong> The Federal Reserve found the average job search takes 4-5 months. The average consumer emergency (car repair, medical bill, appliance replacement) costs $2,000-$5,000. A 6-month fund covers both scenarios comfortably.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">2. The 10% Rule (Classic Approach)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Save at least <strong>10% of every paycheck</strong> into savings. This applies whether you earn $30,000 or $300,000 per year.
                </p>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-xs font-bold text-green-900 mb-2">Example:</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>• Annual salary: $60,000</p>
                    <p>• Monthly gross: $5,000</p>
                    <p>• 10% savings: <strong>$500/month = $6,000/year</strong></p>
                    <p>• After 10 years at 4% interest: <strong>~$73,000</strong></p>
                  </div>
                </div>
                <div className="mt-3 bg-green-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Why 10%?</strong> Originated in the 1926 book "The Richest Man in Babylon." Historical data shows 10% savings rate allows most people to retire comfortably while maintaining their lifestyle. It's aggressive enough to build wealth but achievable for most income levels.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">3. The 50/30/20 Rule (Balanced Budget)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Popularized by Senator Elizabeth Warren, allocate your after-tax income as:
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="text-2xl font-bold text-purple-600 mb-1">50%</p>
                    <p className="font-bold text-xs text-purple-900 mb-1">NEEDS</p>
                    <p className="text-xs text-gray-700">Housing, utilities, groceries, insurance, minimum debt payments, transportation</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="text-2xl font-bold text-purple-600 mb-1">30%</p>
                    <p className="font-bold text-xs text-purple-900 mb-1">WANTS</p>
                    <p className="text-xs text-gray-700">Dining out, entertainment, hobbies, subscriptions, vacations, shopping</p>
                  </div>
                  <div className="bg-white p-3 rounded border border-purple-200">
                    <p className="text-2xl font-bold text-purple-600 mb-1">20%</p>
                    <p className="font-bold text-xs text-purple-900 mb-1">SAVINGS</p>
                    <p className="text-xs text-gray-700">Emergency fund, retirement (401k/IRA), debt payoff, down payments, investments</p>
                  </div>
                </div>
                <div className="mt-3 bg-purple-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Example on $4,000/month after-tax:</strong> $2,000 needs, $1,200 wants, $800 savings/debt = $9,600/year saved. This rule is easier to follow than tracking every expense and ensures balanced priorities.
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-orange-900 mb-2">4. The Pay Yourself First Method</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Automate transfers to savings <strong>immediately after payday</strong>, before you can spend it. Treat savings like a non-negotiable bill.
                </p>
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="text-xs font-bold text-orange-900 mb-2">How to Implement:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>1. Set up direct deposit to split paycheck: 80% to checking, 20% to savings</li>
                    <li>2. Or schedule automatic transfer every payday (1st and 15th)</li>
                    <li>3. Increase by 1% every 6 months until you hit 20-25%</li>
                    <li>4. Never touch savings except for true emergencies or planned goals</li>
                  </ul>
                </div>
                <div className="mt-3 bg-orange-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Why it works:</strong> Studies show people who automate savings save 2-3x more than those who manually transfer "leftover" money. Out of sight, out of mind = out of spending temptation.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2">5. The Anti-Debt Method (Aggressive)</h4>
                <p className="text-sm text-gray-700 mb-3">
                  If you have high-interest debt (credit cards, payday loans), prioritize paying it off before building large savings. Exception: Keep $1,000-$2,000 emergency fund first.
                </p>
                <div className="bg-white p-3 rounded border border-red-200">
                  <p className="text-xs font-bold text-red-900 mb-2">Strategy:</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>1. Save $1,000-$2,000 emergency fund (starter fund)</li>
                    <li>2. Pay minimum on all debts</li>
                    <li>3. Put ALL extra money toward highest-interest debt (avalanche method)</li>
                    <li>4. Once debt-free, redirect those payments to savings (builds wealth FAST)</li>
                  </ul>
                </div>
                <div className="mt-3 bg-red-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>The math:</strong> If you have $5,000 credit card debt at 22% APR, you're paying $1,100/year in interest. That same $5,000 in a 4% savings account only earns $200/year. You're losing $900/year by saving instead of paying off the debt. Debt payoff IS savings!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border-2 border-cyan-400">
              <h4 className="font-bold text-cyan-900 mb-2">📊 Recommended Savings by Life Stage</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="font-bold text-sm text-cyan-900 mb-2">Early Career (20s-30s)</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• 10-15% of income to retirement (401k + IRA)</li>
                    <li>• 5-10% to emergency fund (build to 6 months)</li>
                    <li>• 5-10% to specific goals (house, car, travel)</li>
                    <li>• <strong>Total: 20-35% savings rate</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-sm text-cyan-900 mb-2">Mid-Career (40s-50s)</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• 15-20% of income to retirement (max 401k if possible)</li>
                    <li>• Maintain 6-12 month emergency fund</li>
                    <li>• 5-10% to kids' college (529 plans)</li>
                    <li>• <strong>Total: 20-30% savings rate</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-sm text-cyan-900 mb-2">Pre-Retirement (Late 50s-60s)</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Max out all retirement accounts (catch-up contributions)</li>
                    <li>• Aggressive savings: 25-40% of income</li>
                    <li>• Pay off mortgage and all debts</li>
                    <li>• <strong>Total: 30-50% savings rate</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-sm text-cyan-900 mb-2">Retirement (65+)</p>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• Live on 4% withdrawal rate from savings</li>
                    <li>• Continue saving from Social Security surplus</li>
                    <li>• Maintain 1-2 years cash for market downturns</li>
                    <li>• <strong>Total: Spend 4%, save the rest</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compound Interest Power */}
        <Card className="border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <TrendingUp className="w-5 h-5" />
              The Power of Compound Interest
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Albert Einstein reportedly called compound interest "the eighth wonder of the world." Whether he actually said it or not, the principle holds true: <strong>compound interest is the most powerful wealth-building tool available to savers</strong>.
            </p>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
              <h4 className="font-bold text-orange-900 mb-2">What is Compound Interest?</h4>
              <p className="text-sm text-gray-700 mb-3">
                Compound interest means you earn interest on your interest. Unlike simple interest (where you only earn on the principal), compound interest creates exponential growth over time.
              </p>
              <div className="bg-white p-3 rounded border border-orange-200">
                <p className="text-xs font-bold text-orange-900 mb-2">Example: $10,000 at 5% for 30 years</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <p className="font-bold text-xs text-red-700 mb-1">Simple Interest</p>
                    <p className="text-xs text-gray-700">$10,000 × 5% = $500/year</p>
                    <p className="text-xs text-gray-700">After 30 years: $10,000 + ($500 × 30)</p>
                    <p className="text-lg font-bold text-red-600">= $25,000</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-green-700 mb-1">Compound Interest (Annual)</p>
                    <p className="text-xs text-gray-700">Year 1: $10,500 (5% on $10,000)</p>
                    <p className="text-xs text-gray-700">Year 2: $11,025 (5% on $10,500)</p>
                    <p className="text-lg font-bold text-green-600">= $43,219</p>
                  </div>
                </div>
                <p className="text-xs text-gray-700 mt-3 p-2 bg-orange-100 rounded">
                  <strong>Difference: $18,219 extra (73% more!) just from compound interest.</strong>
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <h4 className="font-bold text-blue-900 mb-2">The Rule of 72: Quick Doubling Calculation</h4>
              <p className="text-sm text-gray-700 mb-3">
                Want to know how long it takes to double your money? Divide 72 by your interest rate:
              </p>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="font-mono text-center text-lg text-blue-900 mb-3">Years to Double = 72 ÷ Interest Rate</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-700">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="font-bold">3% APY</p>
                    <p>72 ÷ 3 = 24 years</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="font-bold">5% APY</p>
                    <p>72 ÷ 5 = 14.4 years</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="font-bold">7% APY</p>
                    <p>72 ÷ 7 = 10.3 years</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="font-bold">10% APY</p>
                    <p>72 ÷ 10 = 7.2 years</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-blue-100 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>Real application:</strong> If you invest $50,000 in stocks averaging 7% annual return, you'll have $100,000 in ~10 years, $200,000 in ~20 years, $400,000 in ~30 years, and $800,000 in ~40 years—without adding a single dollar!
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-300">
              <h4 className="font-bold text-green-900 mb-2">Compound Frequency Matters (But Less Than You Think)</h4>
              <p className="text-sm text-gray-700 mb-3">
                More frequent compounding = slightly higher returns. But the difference is marginal:
              </p>
              <div className="bg-white p-3 rounded border border-green-200">
                <p className="text-xs font-bold text-green-900 mb-2">$10,000 at 5% APY for 10 years:</p>
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Annually (1x/year):</span>
                    <span className="font-bold">$16,288.95</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Semi-Annually (2x/year):</span>
                    <span className="font-bold">$16,386.16 (+$97)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Quarterly (4x/year):</span>
                    <span className="font-bold">$16,436.19 (+$147)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Monthly (12x/year):</span>
                    <span className="font-bold">$16,470.09 (+$181)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                    <span>Daily (365x/year):</span>
                    <span className="font-bold text-green-700">$16,486.65 (+$197)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-green-100 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>Takeaway:</strong> Daily compounding only earns $197 more (1.2%) than annual compounding over 10 years. Don't stress over compound frequency—focus on getting a higher interest rate instead. A 5.5% APY compounded annually beats 5% daily compounding every time.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
              <h4 className="font-bold text-purple-900 mb-2">Time is More Important Than Amount</h4>
              <p className="text-sm text-gray-700 mb-3">
                Starting early beats contributing more. This example proves it:
              </p>
              <div className="bg-white p-3 rounded border border-purple-200">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="font-bold text-sm text-gray-900 mb-2">👨 Early Bird (Age 25-35)</p>
                    <p className="text-xs text-gray-700">Invests $5,000/year for 10 years</p>
                    <p className="text-xs text-gray-700">Total invested: $50,000</p>
                    <p className="text-xs text-gray-700">Then stops, lets it grow until 65</p>
                    <p className="text-xs text-gray-700 mt-2">At 7% annual return:</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">$602,070</p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-3">
                    <p className="font-bold text-sm text-gray-900 mb-2">👨 Late Starter (Age 35-65)</p>
                    <p className="text-xs text-gray-700">Invests $5,000/year for 30 years</p>
                    <p className="text-xs text-gray-700">Total invested: $150,000</p>
                    <p className="text-xs text-gray-700">Consistent contributions to 65</p>
                    <p className="text-xs text-gray-700 mt-2">At 7% annual return:</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">$472,304</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-purple-100 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>Mind-blowing result:</strong> Early Bird invested 3x LESS ($50k vs $150k) but ended with $130,000 MORE! Those extra 10 years of compounding at the beginning were worth more than 20 years of additional contributions. Start today, even if it's just $50/month.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saving Too Much */}
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
            <CardTitle className="flex items-center gap-2 text-red-900">
              <DollarSign className="w-5 h-5" />
              Can You Save Too Much?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While saving is crucial, there's a point where keeping too much in low-interest savings accounts actually <strong>costs you money</strong> through opportunity cost and inflation.
            </p>
            <div className="bg-red-50 p-4 rounded-lg border border-red-300">
              <h4 className="font-bold text-red-900 mb-2">The FDIC Insurance Limit: $250,000</h4>
              <p className="text-sm text-gray-700 mb-3">
                The Federal Deposit Insurance Corporation insures deposits up to <strong>$250,000 per depositor, per insured bank, per ownership category</strong>. Any amount over this is uninsured and at risk if the bank fails.
              </p>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-xs font-bold text-red-900 mb-2">How to Stay Insured with More than $250k:</p>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• <strong>Multiple banks:</strong> Split across different banks (each gets $250k coverage)</li>
                  <li>• <strong>Joint accounts:</strong> $500k coverage for joint account ($250k per person)</li>
                  <li>• <strong>Different ownership:</strong> Individual, joint, retirement, trust accounts each get separate $250k</li>
                  <li>• <strong>Example:</strong> Individual account ($250k) + Joint with spouse ($250k) + IRA ($250k) = $750k insured at ONE bank</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
              <h4 className="font-bold text-yellow-900 mb-2">The Inflation Problem</h4>
              <p className="text-sm text-gray-700 mb-3">
                Even with FDIC insurance, inflation erodes purchasing power. If inflation is 3% and your savings earns 2%, you're effectively losing 1% per year in real value.
              </p>
              <div className="bg-white p-3 rounded border border-yellow-200">
                <p className="text-xs font-bold text-yellow-900 mb-2">Example: $100,000 over 20 years</p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="p-2 bg-red-50 rounded">
                    <p className="font-bold text-red-700">Scenario 1: Cash under mattress (0% return, 3% inflation)</p>
                    <p>After 20 years: Still $100,000 in dollar bills</p>
                    <p>Real purchasing power: <strong className="text-red-700">$55,368</strong> (45% loss!)</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <p className="font-bold text-yellow-700">Scenario 2: Savings account (2% return, 3% inflation)</p>
                    <p>After 20 years: $148,595</p>
                    <p>Real purchasing power: <strong className="text-yellow-700">$82,267</strong> (still losing!)</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="font-bold text-green-700">Scenario 3: High-yield savings (5% return, 3% inflation)</p>
                    <p>After 20 years: $265,330</p>
                    <p>Real purchasing power: <strong className="text-green-700">$147,034</strong> (47% real gain!)</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-bold text-blue-700">Scenario 4: Stock market (7% avg return, 3% inflation)</p>
                    <p>After 20 years: $386,968</p>
                    <p>Real purchasing power: <strong className="text-blue-700">$214,548</strong> (114% real gain!)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
              <h4 className="font-bold text-blue-900 mb-2">When to Stop Saving and Start Investing</h4>
              <p className="text-sm text-gray-700 mb-3">
                Once you've built adequate cash reserves, additional savings should go into higher-return investments:
              </p>
              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-xs font-bold text-blue-900 mb-2">Recommended Cash Reserve Amounts:</p>
                <div className="space-y-2 text-xs text-gray-700">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Emergency fund (3-6 months expenses):</span>
                    <span className="font-bold">$15,000 - $30,000</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Opportunity fund (deals, unexpected needs):</span>
                    <span className="font-bold">$5,000 - $10,000</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>Short-term goals (&lt;3 years away):</span>
                    <span className="font-bold">Goal amount</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-100 rounded">
                    <span className="font-bold">Total recommended cash reserves:</span>
                    <span className="font-bold text-blue-700">$20,000 - $40,000</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-100 rounded mt-3">
                    <span className="font-bold">Everything above this should go to:</span>
                    <span className="font-bold text-green-700">Investments</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-blue-100 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>Why?</strong> Savings accounts average 3-5% returns. Stock market averages 10% (7% after inflation) over long periods. Bonds earn 4-6%. Real estate appreciates 3-5% plus rental income. Keeping $100,000 in savings earning 4% costs you $6,000+/year in lost returns vs. a balanced investment portfolio.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-300">
              <h4 className="font-bold text-green-900 mb-2">Alternative Higher-Return Options (Still Low Risk)</h4>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">Certificates of Deposit (CDs)</p>
                  <p className="text-xs text-gray-700">Lock in rates (currently 4-5.5%) for 6 months to 5 years. FDIC insured. Best for money you won't need soon.</p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">Treasury Bills (T-Bills)</p>
                  <p className="text-xs text-gray-700">Government-backed, 4-5% returns, 4-52 week terms. State tax-exempt. Zero default risk.</p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">I Bonds (Inflation-Protected)</p>
                  <p className="text-xs text-gray-700">Earn inflation rate + 0.4-1.3% fixed. Can't lose value. $10k/year limit. Hold 1 year minimum.</p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">Bond Funds (Short-term)</p>
                  <p className="text-xs text-gray-700">4-6% yields, highly liquid. Small principal risk but lower than stocks. Good for 1-5 year goals.</p>
                </div>
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="font-bold text-sm text-green-900 mb-1">Index Funds (Long-term 5+ years)</p>
                  <p className="text-xs text-gray-700">Average 10% annual returns (7% after inflation). Higher risk but proven over decades. Best for retirement.</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-400">
              <h4 className="font-bold text-purple-900 mb-2">🎯 The Ideal Savings Strategy</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Step 1:</strong> $1,000-$2,000 starter emergency fund (high-yield savings)</p>
                <p><strong>Step 2:</strong> Pay off high-interest debt (credit cards, payday loans)</p>
                <p><strong>Step 3:</strong> 3-6 months emergency fund (high-yield savings or money market)</p>
                <p><strong>Step 4:</strong> Max employer 401(k) match (free money!)</p>
                <p><strong>Step 5:</strong> Max Roth IRA ($7,000/year in 2025, $8,000 if 50+)</p>
                <p><strong>Step 6:</strong> Save for short-term goals (&lt;3 years) in high-yield savings/CDs</p>
                <p><strong>Step 7:</strong> Max 401(k) contributions ($23,500/year, $31,000 if 50+)</p>
                <p><strong>Step 8:</strong> Invest excess in taxable brokerage accounts (index funds)</p>
                <p className="pt-3 border-t border-purple-300 mt-3 font-bold text-purple-900">
                  Once you hit Step 3, most additional "savings" should be investments, not cash in a bank account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Context */}
        <Card className="border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
            <CardTitle className="flex items-center gap-2 text-cyan-900">
              <BarChart3 className="w-5 h-5" />
              The History of Savings Rates in America
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Savings account interest rates have fluctuated dramatically over the past century, driven by Federal Reserve policy, inflation, and economic conditions. Understanding this history helps put today's rates in context.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
                <h4 className="font-bold text-blue-900 mb-2">1930s-1970s: The Golden Age of Savings</h4>
                <p className="text-sm text-gray-700 mb-3">
                  After the Great Depression, the government actively promoted savings. Savings accounts were heavily marketed as patriotic duty ("Buy War Bonds!"). Rates were regulated and stable.
                </p>
                <div className="bg-white p-3 rounded border border-blue-200 text-xs text-gray-700">
                  <p><strong>1934:</strong> FDIC created, insuring deposits up to $2,500 (now $250,000)</p>
                  <p><strong>1940s-1960s:</strong> Savings rates held steady at 2-4% while inflation averaged 2%</p>
                  <p><strong>1966:</strong> Regulation Q capped savings account rates at 5.25% to prevent bank competition</p>
                  <p><strong>Personal savings rate:</strong> Americans saved 8-12% of disposable income (2-3x today's rate)</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-300">
                <h4 className="font-bold text-orange-900 mb-2">1980s: The Peak Era</h4>
                <p className="text-sm text-gray-700 mb-3">
                  To combat runaway inflation (14% in 1980), Fed Chair Paul Volcker raised interest rates to unprecedented levels. Savings accounts became incredibly lucrative.
                </p>
                <div className="bg-white p-3 rounded border border-orange-200 text-xs text-gray-700">
                  <p><strong>1980-1981:</strong> Savings account rates hit <strong>15-20% APY</strong> (!) at some banks</p>
                  <p><strong>Money market accounts:</strong> Introduced in 1982, offering 12-18% yields</p>
                  <p><strong>CDs:</strong> 5-year CDs paid 14-16% in early 1980s</p>
                  <p><strong>The trade-off:</strong> Inflation was 12-14%, so real returns were only 2-6%</p>
                  <p><strong>Impact:</strong> Baby boomers who saved aggressively in this era built substantial wealth from interest alone</p>
                </div>
                <div className="mt-3 bg-orange-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Example:</strong> $10,000 in a 5-year CD at 14% (1982-1987) grew to $19,254—nearly doubled in 5 years with zero risk. Today's equivalent would require stock market investing.
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <h4 className="font-bold text-green-900 mb-2">1990s-2000s: The Decline Begins</h4>
                <p className="text-sm text-gray-700 mb-3">
                  As inflation came under control, interest rates declined steadily. The rise of the internet and online banking created new competition.
                </p>
                <div className="bg-white p-3 rounded border border-green-200 text-xs text-gray-700">
                  <p><strong>1990-1995:</strong> Savings rates dropped from 8% to 3%</p>
                  <p><strong>1996:</strong> ING Direct (now Capital One 360) launched online-only bank with 4.5% APY, disrupting industry</p>
                  <p><strong>2000:</strong> Dot-com bubble—people moved money from savings to stocks chasing 20%+ returns</p>
                  <p><strong>2007:</strong> Pre-recession peak—savings accounts offered 4-5% at online banks, 1-2% at traditional banks</p>
                  <p><strong>Personal savings rate:</strong> Fell to 2-4% as easy credit and home equity loans replaced saving</p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-300">
                <h4 className="font-bold text-red-900 mb-2">2008-2020: The Near-Zero Era</h4>
                <p className="text-sm text-gray-700 mb-3">
                  The Great Recession forced the Federal Reserve to cut rates to near zero, where they stayed for over a decade. Savings accounts became almost worthless for earning income.
                </p>
                <div className="bg-white p-3 rounded border border-red-200 text-xs text-gray-700">
                  <p><strong>2008-2009:</strong> Fed slashed rates from 5.25% to 0-0.25% (emergency response)</p>
                  <p><strong>2010-2015:</strong> Traditional bank savings: 0.01-0.05% APY (essentially zero)</p>
                  <p><strong>2010-2015:</strong> Online bank savings: 0.75-1.00% APY (still terrible, but 20x better)</p>
                  <p><strong>2016-2019:</strong> Gradual rate increases to 2.5%, savings accounts hit 2-2.5% at online banks</p>
                  <p><strong>March 2020:</strong> COVID-19 pandemic—Fed cuts to 0-0.25% again, savings rates crash to 0.5%</p>
                  <p><strong>Impact:</strong> Entire generation of young savers never experienced meaningful interest. $10,000 earning 0.05% for 10 years = only $50 interest earned!</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
                <h4 className="font-bold text-purple-900 mb-2">2021-2025: The Great Reset</h4>
                <p className="text-sm text-gray-700 mb-3">
                  High inflation forced the Fed to raise rates faster than any time in 40 years. Savings accounts became attractive again for the first time since 2007.
                </p>
                <div className="bg-white p-3 rounded border border-purple-200 text-xs text-gray-700">
                  <p><strong>2021:</strong> Inflation rises from 1% to 7%, savings rates still near 0.5%—massive real losses</p>
                  <p><strong>2022:</strong> Fed raises rates from 0.25% to 4.5% in fastest increase since 1980s</p>
                  <p><strong>2023:</strong> High-yield savings accounts reach 4-5% APY, first time since 2007</p>
                  <p><strong>2024-2025:</strong> Rates stabilize at 4-5.5% as inflation moderates to 3%</p>
                  <p><strong>Current landscape:</strong> Online banks (Marcus, Ally, American Express) offer 4-5% vs. traditional banks (Chase, Bank of America) at 0.01-0.5%</p>
                </div>
                <div className="mt-3 bg-purple-100 p-3 rounded">
                  <p className="text-xs text-gray-700">
                    <strong>Today's opportunity:</strong> 4-5% APY on FDIC-insured savings is historically very good when inflation is 2-3%. A $50,000 emergency fund earns $2,000-$2,500/year in passive income—enough to cover a nice vacation, just from parking cash!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border-2 border-cyan-400">
              <h4 className="font-bold text-cyan-900 mb-2">📊 Savings Rates Over 50 Years (Historical Chart)</h4>
              <div className="bg-white p-4 rounded border border-cyan-300">
                <div className="space-y-1 text-xs text-gray-700">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono">1980-1985:</span>
                    <span className="font-bold text-orange-600">12-20% APY (Peak era)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono">1990-1995:</span>
                    <span className="font-bold text-blue-600">3-8% APY (Declining)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono">2000-2007:</span>
                    <span className="font-bold text-green-600">2-5% APY (Moderate)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-mono">2008-2020:</span>
                    <span className="font-bold text-red-600">0.01-1% APY (Near zero)</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-cyan-100 rounded">
                    <span className="font-mono">2023-2025:</span>
                    <span className="font-bold text-cyan-700">4-5.5% APY (Recovery!)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-cyan-100 p-3 rounded">
                <p className="text-xs text-gray-700">
                  <strong>The lesson:</strong> Interest rates are cyclical. Today's 4-5% may seem low compared to 1980s, but it's excellent compared to 2010-2020 and likely won't last forever. Lock in high rates now with long-term CDs or max out high-yield savings while they're available. When rates drop again (they always do), you'll be glad you did.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SavingsCalculatorComponent;
