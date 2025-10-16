import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, TrendingUp, Calendar, PieChart, BarChart3, Calculator } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnnuityCalculatorComponent = () => {
  // Input States
  const [startingPrincipal, setStartingPrincipal] = useState('20000');
  const [annualAddition, setAnnualAddition] = useState('10000');
  const [monthlyAddition, setMonthlyAddition] = useState('0');
  const [additionTiming, setAdditionTiming] = useState<'beginning' | 'end'>('end');
  const [growthRate, setGrowthRate] = useState('6');
  const [years, setYears] = useState('10');

  // Calculate Annuity Growth
  const results = useMemo(() => {
    const principal = parseFloat(startingPrincipal || '0');
    const annualAdd = parseFloat(annualAddition || '0');
    const monthlyAdd = parseFloat(monthlyAddition || '0');
    const rate = parseFloat(growthRate || '0') / 100;
    const numYears = parseInt(years || '0');
    const isBeginning = additionTiming === 'beginning';

    if (numYears <= 0) {
      return {
        endBalance: principal,
        totalAdditions: 0,
        totalReturn: 0,
        yearlySchedule: [],
        monthlySchedule: [],
        pieData: [],
        chartData: [],
        principalPercent: 0,
        additionsPercent: 0,
        returnPercent: 0
      };
    }

    // Annual Schedule Calculation
    const yearlySchedule = [];
    let balance = principal;
    let totalAdditions = 0;

    for (let year = 1; year <= numYears; year++) {
      let yearStartBalance = balance;
      let yearAddition = 0;
      let yearReturn = 0;

      // Add annual addition
      if (annualAdd > 0) {
        if (isBeginning && year === 1) {
          // First year, add annual addition at beginning
          balance += annualAdd;
          yearAddition += annualAdd;
        } else if (isBeginning) {
          // Subsequent years, add at beginning
          balance += annualAdd;
          yearAddition += annualAdd;
        } else {
          // Add at end (after growth)
          yearAddition += annualAdd;
        }
      }

      // Add monthly additions throughout the year
      if (monthlyAdd > 0) {
        for (let month = 1; month <= 12; month++) {
          if (isBeginning) {
            // Add at beginning of month
            balance += monthlyAdd;
            yearAddition += monthlyAdd;
            // Growth on this month's balance
            balance *= (1 + rate / 12);
          } else {
            // Growth first
            balance *= (1 + rate / 12);
            // Then add at end of month
            balance += monthlyAdd;
            yearAddition += monthlyAdd;
          }
        }
        // Calculate year's return (growth only)
        yearReturn = balance - yearStartBalance - yearAddition;
      } else {
        // No monthly additions, just annual growth
        if (!isBeginning) {
          // Growth happens before year-end addition
          const growthOnStart = yearStartBalance * rate;
          balance = yearStartBalance * (1 + rate);
          // Add annual addition at end
          balance += annualAdd;
          yearReturn = growthOnStart;
        } else {
          // Addition already added at beginning, apply growth
          const growthOnTotal = balance * rate;
          balance = balance * (1 + rate);
          yearReturn = growthOnTotal;
        }
      }

      totalAdditions += yearAddition;

      yearlySchedule.push({
        year,
        addition: yearAddition,
        return: yearReturn,
        endingBalance: balance
      });
    }

    // Monthly Schedule Calculation (for detailed view)
    const monthlySchedule = [];
    let monthBalance = principal;
    let monthTotalAdditions = 0;

    for (let month = 1; month <= numYears * 12; month++) {
      let monthAddition = 0;
      let monthReturn = 0;
      const monthStartBalance = monthBalance;

      // Add monthly addition
      if (monthlyAdd > 0) {
        if (isBeginning) {
          monthBalance += monthlyAdd;
          monthAddition += monthlyAdd;
          monthBalance *= (1 + rate / 12);
          monthReturn = monthBalance - monthStartBalance - monthAddition;
        } else {
          monthBalance *= (1 + rate / 12);
          monthBalance += monthlyAdd;
          monthAddition += monthlyAdd;
          monthReturn = monthBalance - monthStartBalance - monthAddition;
        }
      } else {
        // Just growth
        monthBalance *= (1 + rate / 12);
        monthReturn = monthBalance - monthStartBalance;
      }

      // Add annual addition at appropriate month
      const currentMonth = month % 12 || 12;
      if (annualAdd > 0 && currentMonth === 1) {
        if (isBeginning) {
          monthBalance += annualAdd;
          monthAddition += annualAdd;
        } else {
          monthBalance += annualAdd;
          monthAddition += annualAdd;
        }
      }

      monthTotalAdditions += monthAddition;

      if (month % 3 === 0 || month === numYears * 12) {
        // Only store quarterly data for performance
        monthlySchedule.push({
          month,
          addition: monthAddition,
          return: monthReturn,
          endingBalance: monthBalance
        });
      }
    }

    const endBalance = balance;
    const totalReturn = endBalance - principal - totalAdditions;

    // Pie Chart Data
    const pieData = [
      { name: 'Starting Principal', value: principal, color: '#3b82f6' },
      { name: 'Additions', value: totalAdditions, color: '#10b981' },
      { name: 'Return/Interest', value: totalReturn, color: '#f59e0b' }
    ];

    // Line Chart Data (for visualization)
    const chartData = yearlySchedule.map((item) => ({
      year: item.year,
      'Starting Principal': principal,
      'Additions': item.addition,
      'Return/Interest': item.return,
      'Total Balance': item.endingBalance
    }));

    return {
      endBalance,
      totalAdditions,
      totalReturn,
      yearlySchedule,
      monthlySchedule,
      pieData,
      chartData,
      principalPercent: endBalance > 0 ? (principal / endBalance) * 100 : 0,
      additionsPercent: endBalance > 0 ? (totalAdditions / endBalance) * 100 : 0,
      returnPercent: endBalance > 0 ? (totalReturn / endBalance) * 100 : 0
    };
  }, [startingPrincipal, annualAddition, monthlyAddition, additionTiming, growthRate, years]);

  // Accumulated data for area chart
  const accumulatedChartData = useMemo(() => {
    return results.yearlySchedule.map((item, index) => {
      const principal = parseFloat(startingPrincipal || '0');
      let accumulatedAdditions = 0;
      let accumulatedReturn = 0;

      for (let i = 0; i <= index; i++) {
        accumulatedAdditions += results.yearlySchedule[i].addition;
        accumulatedReturn += results.yearlySchedule[i].return;
      }

      return {
        year: item.year,
        'Start Principal': principal,
        'Additions': accumulatedAdditions,
        'Return/Interest': accumulatedReturn
      };
    });
  }, [results.yearlySchedule, startingPrincipal]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="w-10 h-10 text-green-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Annuity Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          The Annuity Calculator is intended for use involving the <strong>accumulation phase</strong> of an annuity 
          and shows growth based on regular deposits. Track how your investments grow over time with compound interest.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Note:</strong> This calculator focuses on the accumulation/growth phase. For income payment calculations, 
            use our Annuity Payout Calculator.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Investment Parameters</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your investment details to see growth projections
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Starting Principal */}
            <div className="space-y-2">
              <Label htmlFor="startingPrincipal" className="text-xs sm:text-sm font-medium">
                Starting Principal
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="startingPrincipal"
                  type="number"
                  value={startingPrincipal}
                  onChange={(e) => setStartingPrincipal(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="20000"
                />
              </div>
            </div>

            {/* Annual Addition */}
            <div className="space-y-2">
              <Label htmlFor="annualAddition" className="text-xs sm:text-sm font-medium">
                Annual Addition
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="annualAddition"
                  type="number"
                  value={annualAddition}
                  onChange={(e) => setAnnualAddition(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Monthly Addition */}
            <div className="space-y-2">
              <Label htmlFor="monthlyAddition" className="text-xs sm:text-sm font-medium">
                Monthly Addition
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="monthlyAddition"
                  type="number"
                  value={monthlyAddition}
                  onChange={(e) => setMonthlyAddition(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Annual Growth Rate */}
            <div className="space-y-2">
              <Label htmlFor="growthRate" className="text-xs sm:text-sm font-medium">
                Annual Growth Rate
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="growthRate"
                  type="number"
                  step="0.1"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="6"
                />
                <span className="text-xs sm:text-sm text-gray-600">%</span>
              </div>
            </div>

            {/* Years */}
            <div className="space-y-2">
              <Label htmlFor="years" className="text-xs sm:text-sm font-medium">
                Investment Period
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="10"
                />
                <span className="text-xs sm:text-sm text-gray-600">years</span>
              </div>
            </div>

            {/* Addition Timing */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Add at each period's</Label>
              <RadioGroup value={additionTiming} onValueChange={(value: 'beginning' | 'end') => setAdditionTiming(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginning" id="beginning" />
                  <Label htmlFor="beginning" className="text-xs sm:text-sm font-normal cursor-pointer">
                    Beginning
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="end" id="end" />
                  <Label htmlFor="end" className="text-xs sm:text-sm font-normal cursor-pointer">
                    End
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
        <CardHeader className="border-b-2 border-green-200">
          <CardTitle className="text-xl sm:text-2xl text-green-900">Results Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-green-300 shadow-md">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">End Balance</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-700 break-words">
                ${results.endBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-300 shadow-md">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Starting Principal</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700 break-words">
                ${parseFloat(startingPrincipal || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-purple-300 shadow-md">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Additions</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700 break-words">
                ${results.totalAdditions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-orange-300 shadow-md">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Return/Interest Earned</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-700 break-words">
                ${results.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="shadow-xl border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
            <PieChart className="w-6 h-6" />
            Balance Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={results.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {results.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    contentStyle={{ fontSize: '12px' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with percentages */}
            <div className="flex flex-col justify-center space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Starting Principal</p>
                  <p className="text-xs text-gray-600">{results.principalPercent.toFixed(1)}%</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                  ${parseFloat(startingPrincipal || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Additions</p>
                  <p className="text-xs text-gray-600">{results.additionsPercent.toFixed(1)}%</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                  ${results.totalAdditions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Return/Interest</p>
                  <p className="text-xs text-gray-600">{results.returnPercent.toFixed(1)}%</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                  ${results.totalReturn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accumulation Schedule Chart */}
      <Card className="shadow-xl border-2 border-cyan-200">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
          <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
            <BarChart3 className="w-6 h-6" />
            Accumulation Schedule
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Visual representation of how your investment grows over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accumulatedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Start Principal" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Additions" stackId="a" fill="#10b981" />
                <Bar dataKey="Return/Interest" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Growth Line Chart */}
      <Card className="shadow-xl border-2 border-indigo-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
          <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
            <TrendingUp className="w-6 h-6" />
            Balance Growth Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results.yearlySchedule}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'Balance ($)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  contentStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="endingBalance" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Ending Balance"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Annual Schedule Table */}
      <Card className="shadow-xl border-2 border-gray-200">
        <CardHeader className="bg-gray-50 border-b-2">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
            <Calendar className="w-6 h-6" />
            Annual Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-2 sm:p-3 font-bold whitespace-nowrap">Year</th>
                  <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Addition</th>
                  <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Return</th>
                  <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="p-2 sm:p-3 whitespace-nowrap">{row.year}</td>
                    <td className="text-right p-2 sm:p-3 whitespace-nowrap">
                      ${row.addition.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-right p-2 sm:p-3 text-green-700 font-medium whitespace-nowrap">
                      ${row.return.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">
                      ${row.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <div className="space-y-8">
        {/* What is an Annuity? */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">What is an Annuity?</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              An <strong>annuity</strong> is a financial product offered by insurance companies that provides a stream of 
              payments to an individual, typically used as an income strategy during retirement. Annuities are designed to 
              help protect against the risk of outliving your savings by converting a lump sum of money into a guaranteed 
              income stream.
            </p>
            <p>
              Annuities consist of two main phases:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Accumulation Phase:</strong> The period when you make contributions to the annuity and your money 
                grows through compound interest and investment returns. This calculator focuses specifically on this phase, 
                showing how regular deposits can accumulate over time with tax-deferred growth.
              </li>
              <li>
                <strong>Distribution Phase (Annuitization):</strong> The period when the annuity begins making regular 
                payments to you. These payments can be structured in various ways depending on the type of annuity and 
                payout option selected.
              </li>
            </ul>
            <p>
              During the accumulation phase, your contributions benefit from <strong>tax-deferred growth</strong>, meaning 
              you don't pay taxes on the investment gains until you begin withdrawing funds. This allows your money to 
              compound more efficiently compared to taxable investment accounts.
            </p>
          </CardContent>
        </Card>

        {/* Types of Annuities */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Types of Annuities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">Fixed Annuities</h3>
                <p>
                  Fixed annuities provide a <strong>guaranteed rate of return</strong> during the accumulation phase, 
                  typically for a specified period (1-10 years). The insurance company guarantees both your principal and 
                  a minimum interest rate, making this the safest and most predictable type of annuity.
                </p>
                <p className="mt-2">
                  <strong>Best for:</strong> Conservative investors seeking stable, guaranteed growth with minimal risk.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">Variable Annuities</h3>
                <p>
                  Variable annuities allow you to invest your contributions in <strong>sub-accounts</strong> that function 
                  similarly to mutual funds. Your returns depend on the performance of these investments, which means your 
                  account value can fluctuate. While offering higher growth potential, they also carry market risk.
                </p>
                <p className="mt-2">
                  <strong>Best for:</strong> Growth-oriented investors comfortable with market volatility and seeking 
                  higher potential returns.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-purple-900">Indexed Annuities (Fixed-Indexed)</h3>
                <p>
                  Indexed annuities offer a <strong>middle ground</strong> between fixed and variable annuities. Your returns 
                  are linked to a market index (like the S&P 500) but with downside protection. You typically receive a 
                  percentage of the index's gains (subject to caps) while your principal is protected from market losses.
                </p>
                <p className="mt-2">
                  <strong>Best for:</strong> Moderate investors seeking market participation with principal protection.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-orange-900">Immediate vs. Deferred Annuities</h3>
                <p>
                  <strong>Immediate annuities</strong> begin paying income within one year of purchase, typically purchased 
                  with a lump sum at retirement. <strong>Deferred annuities</strong> have an accumulation phase where your 
                  money grows before payments begin, often years or decades later. This calculator models deferred annuities 
                  during their accumulation phase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Understanding Compound Growth */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Understanding Compound Growth in Annuities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              The power of annuities lies in <strong>compound growth</strong> combined with tax deferral. When your 
              investment earnings generate additional earnings, your account grows exponentially rather than linearly.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-bold text-sm sm:text-base mb-2 text-blue-900">How Compound Interest Works:</h4>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Each year, you earn interest on your original principal</li>
                <li>You also earn interest on all previously accumulated interest</li>
                <li>Your regular contributions add to the compounding base</li>
                <li>The longer your money compounds, the more dramatic the growth</li>
              </ul>
            </div>

            <p>
              <strong>Time is your greatest ally.</strong> Starting early dramatically increases your ending balance. 
              For example, investing $10,000 annually for 30 years at 6% growth yields approximately $838,000, while 
              waiting 10 years and investing the same amount for only 20 years yields just $389,000—less than half!
            </p>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-sm sm:text-base mb-2 text-green-900">Tax-Deferred Growth Advantage:</h4>
              <p>
                Unlike taxable investment accounts where you pay taxes on dividends, interest, and capital gains each year, 
                annuities allow all earnings to compound <strong>tax-deferred</strong>. You only pay taxes when you withdraw 
                funds, potentially decades later. This tax advantage can add significantly to your accumulation, especially 
                for investors in higher tax brackets.
              </p>
            </div>

            <p>
              <strong>Note:</strong> While tax deferral is beneficial during accumulation, withdrawals are taxed as 
              ordinary income (not capital gains rates), and early withdrawals before age 59½ may incur a 10% IRS penalty 
              in addition to regular income taxes.
            </p>
          </CardContent>
        </Card>

        {/* Contribution Strategies */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Contribution Strategies</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm sm:text-base mb-2 text-gray-900">Beginning vs. End of Period Contributions</h4>
                <p>
                  The timing of your contributions affects your accumulation:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>
                    <strong>Beginning of Period:</strong> Contributions made at the start of each period earn interest for 
                    the entire period, resulting in slightly higher accumulation. This is comparable to an "annuity due" 
                    in financial terms.
                  </li>
                  <li>
                    <strong>End of Period:</strong> Contributions made at the end of each period don't earn interest until 
                    the next period. This is the more common scenario and matches an "ordinary annuity" structure.
                  </li>
                </ul>
                <p className="mt-2">
                  The difference may seem small, but over decades, beginning-of-period contributions can add thousands to 
                  your final balance.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                <h4 className="font-bold text-sm sm:text-base mb-2 text-yellow-900">Consistent vs. Lump Sum Contributions</h4>
                <p>
                  <strong>Regular contributions</strong> (dollar-cost averaging) can be advantageous with variable annuities 
                  because you automatically buy more units when markets are down and fewer when they're up, potentially 
                  smoothing volatility. <strong>Lump sum contributions</strong> provide more time in the market but may 
                  expose you to timing risk if invested at market peaks.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm sm:text-base mb-2 text-gray-900">Annual vs. Monthly Contributions</h4>
                <p>
                  Monthly contributions allow for more frequent compounding opportunities and can be easier to budget. 
                  However, annual contributions may have lower administrative costs and simpler record-keeping. Our 
                  calculator allows you to model both types of contributions simultaneously to find the strategy that 
                  works best for your situation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fees and Costs */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-red-900">Fees and Costs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Annuities can carry various fees that reduce your net returns. Understanding these costs is crucial for 
              making informed decisions:
            </p>

            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-bold text-sm sm:text-base mb-2 text-red-900">Surrender Charges</h4>
                <p>
                  Most annuities impose <strong>surrender charges</strong> if you withdraw funds during the early years 
                  (typically 5-10 years). These penalties start high (often 7-10%) and decrease annually until they reach 
                  zero. Surrender periods protect insurance companies from early withdrawals but limit your liquidity.
                </p>
                <p className="mt-2 text-xs italic">
                  Example: A 7-year surrender schedule might charge 7% in year 1, 6% in year 2, decreasing to 0% by year 8.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-bold text-sm sm:text-base mb-2 text-orange-900">Mortality and Expense (M&E) Fees</h4>
                <p>
                  Variable annuities typically charge annual M&E fees (often 1-1.5% of account value) to cover insurance 
                  guarantees and administrative costs. These fees are deducted from your account value regardless of 
                  performance, reducing your net growth rate.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-bold text-sm sm:text-base mb-2 text-purple-900">Investment Management Fees</h4>
                <p>
                  Variable annuities charge fees for the sub-accounts you invest in, similar to mutual fund expense ratios 
                  (typically 0.5-2% annually). These are in addition to M&E fees.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-bold text-sm sm:text-base mb-2 text-blue-900">Rider Fees</h4>
                <p>
                  Optional benefits like guaranteed lifetime withdrawal benefits, death benefit enhancements, or income 
                  guarantees come with additional costs (typically 0.25-1.5% annually). While these riders provide valuable 
                  protection, they reduce your accumulation during the growth phase.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 mt-4">
              <p className="font-bold text-sm mb-2 text-red-900">⚠️ Important:</p>
              <p>
                Total annuity fees can range from less than 0.5% annually for simple fixed annuities to 3-4% or more for 
                variable annuities with multiple riders. <strong>Always compare the net growth rate</strong> (stated rate 
                minus all fees) when evaluating annuities. A variable annuity earning 8% with 3% in fees nets only 5%, 
                which may underperform a fixed annuity paying 4% with minimal fees.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advantages of Annuities */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Advantages of Annuities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Tax-Deferred Growth</h4>
                <p>
                  Earnings accumulate without annual taxation, allowing faster compound growth compared to taxable accounts.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Guaranteed Income Options</h4>
                <p>
                  Many annuities can be converted to guaranteed lifetime income, eliminating the risk of outliving your savings.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ No Contribution Limits</h4>
                <p>
                  Unlike IRAs and 401(k)s, non-qualified annuities have no annual contribution caps, allowing unlimited 
                  tax-deferred saving.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Death Benefit Protection</h4>
                <p>
                  Most annuities guarantee that your beneficiaries receive at least your total contributions, protecting 
                  against market losses.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Creditor Protection</h4>
                <p>
                  In many states, annuities offer protection from creditors and lawsuits, providing an additional layer 
                  of asset security.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Professional Management</h4>
                <p>
                  Variable annuities offer access to professional investment management through sub-accounts managed by 
                  experienced fund managers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disadvantages and Considerations */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Disadvantages and Considerations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Higher Fees</h4>
                <p>
                  Annuities typically have higher costs than other investment vehicles like index funds or ETFs, which can 
                  significantly reduce net returns.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Limited Liquidity</h4>
                <p>
                  Surrender charges and tax penalties make early withdrawals expensive, reducing flexibility for emergencies 
                  or opportunities.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Ordinary Income Taxation</h4>
                <p>
                  Withdrawals are taxed as ordinary income (up to 37%) rather than lower capital gains rates (0-20%), 
                  potentially increasing your lifetime tax burden.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Complexity</h4>
                <p>
                  Annuity contracts can be hundreds of pages long with complex terms, making it difficult for consumers to 
                  fully understand what they're purchasing.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Inflation Risk</h4>
                <p>
                  Fixed payment annuities may lose purchasing power over time unless they include cost-of-living adjustments 
                  (which reduce initial payments).
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h4 className="font-bold text-sm mb-2 text-orange-900">✗ Opportunity Cost</h4>
                <p>
                  Locking funds into an annuity may prevent you from taking advantage of better investment opportunities or 
                  accessing lower-cost alternatives.
                </p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 mt-4">
              <p className="font-bold text-sm mb-2 text-red-900">⚠️ Who Should Avoid Annuities:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>People who need liquidity and easy access to their money</li>
                <li>Younger investors with long time horizons (lower-cost investments may be better)</li>
                <li>Those in low tax brackets (tax deferral provides less benefit)</li>
                <li>Individuals uncomfortable with fees and complex products</li>
                <li>People with insufficient emergency funds (don't tie up all your savings)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Annuities vs. Other Retirement Vehicles */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Annuities vs. Other Retirement Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left font-bold">Feature</th>
                    <th className="border border-gray-300 p-2 text-left font-bold">Annuities</th>
                    <th className="border border-gray-300 p-2 text-left font-bold">401(k)/IRA</th>
                    <th className="border border-gray-300 p-2 text-left font-bold">Taxable Brokerage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Tax Treatment</td>
                    <td className="border border-gray-300 p-2">Tax-deferred growth, ordinary income on withdrawal</td>
                    <td className="border border-gray-300 p-2">Tax-deferred (traditional) or tax-free (Roth) growth</td>
                    <td className="border border-gray-300 p-2">Taxed annually on dividends/gains, capital gains on sale</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Contribution Limits</td>
                    <td className="border border-gray-300 p-2">None</td>
                    <td className="border border-gray-300 p-2">$23,500/yr (2025) + catch-up</td>
                    <td className="border border-gray-300 p-2">None</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Fees</td>
                    <td className="border border-gray-300 p-2">Typically higher (1-4%)</td>
                    <td className="border border-gray-300 p-2">Usually lower (0.05-1%)</td>
                    <td className="border border-gray-300 p-2">Typically lowest (0.03-1%)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Liquidity</td>
                    <td className="border border-gray-300 p-2">Limited (surrender charges)</td>
                    <td className="border border-gray-300 p-2">Limited (10% penalty before 59½)</td>
                    <td className="border border-gray-300 p-2">High (access anytime)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Guaranteed Income</td>
                    <td className="border border-gray-300 p-2">Yes (annuitization option)</td>
                    <td className="border border-gray-300 p-2">No</td>
                    <td className="border border-gray-300 p-2">No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Death Benefits</td>
                    <td className="border border-gray-300 p-2">Typically guaranteed minimum</td>
                    <td className="border border-gray-300 p-2">Full account value</td>
                    <td className="border border-gray-300 p-2">Full account value (step-up basis)</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Employer Match</td>
                    <td className="border border-gray-300 p-2">No</td>
                    <td className="border border-gray-300 p-2">Often yes (free money!)</td>
                    <td className="border border-gray-300 p-2">No</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">Best For</td>
                    <td className="border border-gray-300 p-2">Guaranteed income needs, maxed other accounts</td>
                    <td className="border border-gray-300 p-2">Primary retirement savings, employer match</td>
                    <td className="border border-gray-300 p-2">Flexibility, early retirement, tax efficiency</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500 mt-4">
              <p className="font-bold text-sm mb-2 text-indigo-900">💡 Optimal Strategy:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>First:</strong> Contribute enough to 401(k) to get full employer match (free money)</li>
                <li><strong>Second:</strong> Max out IRA contributions ($7,000 in 2025, plus catch-up if 50+)</li>
                <li><strong>Third:</strong> Max out 401(k) contributions ($23,500 in 2025, plus catch-up if 50+)</li>
                <li><strong>Fourth:</strong> Consider annuities if you've maxed other accounts and want guaranteed income or additional tax deferral</li>
                <li><strong>Fifth:</strong> Use taxable brokerage for additional savings with full liquidity</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Rolling Over 401(k) or IRA into an Annuity */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Rolling Over 401(k) or IRA into an Annuity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              You can roll funds from a 401(k), 403(b), or traditional IRA into an annuity without triggering immediate 
              taxes through a <strong>qualified rollover</strong>. This strategy is most common when:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You're retiring and want guaranteed lifetime income</li>
              <li>You're concerned about market volatility and want principal protection</li>
              <li>You've inherited an IRA and want to stretch distributions</li>
              <li>You want to simplify your retirement accounts</li>
            </ul>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-bold text-sm sm:text-base mb-2 text-yellow-900">⚠️ Important Considerations:</h4>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Fees increase:</strong> Your low-cost 401(k) index funds (0.05%) may be replaced with higher-fee 
                  annuity products (1-3%), significantly reducing returns
                </li>
                <li>
                  <strong>Liquidity decreases:</strong> Most 401(k)s allow loans and penalty-free withdrawals at 55; 
                  annuities impose surrender charges until 59½
                </li>
                <li>
                  <strong>Investment options narrow:</strong> You may have fewer investment choices in an annuity compared 
                  to a 401(k) or IRA
                </li>
                <li>
                  <strong>RMDs still apply:</strong> Required Minimum Distributions begin at age 73 (2025) for both 
                  qualified annuities and IRAs
                </li>
                <li>
                  <strong>High-pressure sales:</strong> Annuity salespeople often earn large commissions (3-8%), creating 
                  conflicts of interest
                </li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-sm sm:text-base mb-2 text-green-900">✓ When a Rollover Makes Sense:</h4>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>You have <strong>specific income needs</strong> that benefit from guaranteed payments</li>
                <li>You're age 70+ with <strong>longevity in your family</strong> (maximize lifetime income guarantee)</li>
                <li>You lack <strong>investment discipline</strong> and need forced savings with limited access</li>
                <li>You want <strong>principal protection</strong> and can't tolerate market volatility</li>
                <li>You've compared total costs and the annuity's <strong>net returns remain competitive</strong></li>
              </ul>
            </div>

            <p className="font-bold text-sm">
              Before rolling over retirement accounts into an annuity, consult with a fee-only financial advisor who 
              doesn't earn commissions on annuity sales. Get multiple quotes, read contracts carefully, and never make 
              decisions under pressure.
            </p>
          </CardContent>
        </Card>

        {/* How to Use This Calculator */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2">
            <CardTitle className="flex items-center gap-2 text-teal-900 text-lg sm:text-xl">
              <Calculator className="w-6 h-6" />
              How to Use This Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              This calculator helps you model the <strong>accumulation phase</strong> of an annuity by showing how regular 
              contributions grow over time with compound interest. Follow these steps for accurate projections:
            </p>

            <div className="space-y-4">
              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 1: Enter Your Starting Amount</h4>
                <p>
                  Input your initial lump sum contribution. This could be money you're rolling over from another account, 
                  a signing bonus, inheritance, or other windfall. If starting from zero, enter $0.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 2: Set Regular Contributions</h4>
                <p>
                  Enter annual and/or monthly contribution amounts. Many people combine both—for example, maximizing a 
                  yearly bonus contribution while also making monthly paycheck deductions. The calculator handles both 
                  simultaneously.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 3: Choose Contribution Timing</h4>
                <p>
                  Select whether contributions occur at the beginning or end of each period. Beginning-of-period provides 
                  slightly more growth since money compounds for the full period. Check your annuity contract for the 
                  actual timing.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 4: Enter Expected Growth Rate</h4>
                <p>
                  For <strong>fixed annuities</strong>, use the guaranteed rate from your contract. For <strong>variable 
                  annuities</strong>, use a conservative estimate (4-6% is reasonable for balanced portfolios). For 
                  <strong>indexed annuities</strong>, account for participation rates and caps—if the index averaged 8% 
                  with a 60% participation rate, use 4.8%.
                </p>
                <p className="mt-2 text-xs italic">
                  Important: Subtract all fees from the growth rate for accurate projections. An 8% gross return with 2% 
                  in fees means entering 6%.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 5: Set Time Horizon</h4>
                <p>
                  Enter the number of years until you plan to annuitize (begin taking payments). This is typically 
                  retirement age minus current age, though some people accumulate for decades before converting to income.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 6: Analyze Results</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Review the <strong>pie chart</strong> to see how much comes from principal, contributions, and growth</li>
                  <li>Examine the <strong>accumulation chart</strong> to visualize year-by-year growth patterns</li>
                  <li>Check the <strong>annual schedule</strong> for detailed year-by-year breakdown</li>
                  <li>Use the <strong>line graph</strong> to see how your balance compounds over time</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
              <p className="font-bold text-sm mb-2 text-blue-900">💡 Pro Tips:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Run multiple scenarios with different growth rates (optimistic, realistic, pessimistic)</li>
                <li>Compare results with and without fees to see their true impact</li>
                <li>Adjust contribution amounts to see what's needed to reach your retirement income goals</li>
                <li>Model both beginning and end of period to understand the timing advantage</li>
                <li>Consider inflation—a $200,000 balance in 30 years won't buy what it does today</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Additional Resources & Related Calculators</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Explore these related calculators to make comprehensive retirement planning decisions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Annuity Payout Calculator</h4>
                <p>
                  Calculate income payments during the distribution phase based on your accumulated balance, payout 
                  option, and life expectancy.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Pension Calculator</h4>
                <p>
                  Compare pension options including lump sum vs. monthly payments and single-life vs. joint-survivor benefits.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Social Security Calculator</h4>
                <p>
                  Determine optimal Social Security claiming age and coordinate benefits with annuity income for maximum 
                  retirement security.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Retirement Calculator</h4>
                <p>
                  Project total retirement savings from all sources (401k, IRA, annuities, Social Security) and determine 
                  if you're on track.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">401(k) Calculator</h4>
                <p>
                  Model 401(k) accumulation with employer matching to compare against annuity options and optimize 
                  contribution strategies.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">RMD Calculator</h4>
                <p>
                  Calculate Required Minimum Distributions from qualified annuities and IRAs to plan for tax obligations 
                  in retirement.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mt-4">
              <p className="font-bold text-sm mb-2 text-green-900">📚 Educational Resources:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Review your state's insurance department website for annuity consumer guides</li>
                <li>Check FINRA.org for investor alerts about annuity sales practices</li>
                <li>Read SEC.gov's "Variable Annuities: What You Should Know" publication</li>
                <li>Consult with a fee-only fiduciary financial advisor before purchasing</li>
                <li>Always read the full annuity prospectus before signing contracts</li>
              </ul>
            </div>

            <p className="text-center font-medium text-gray-800 pt-4">
              Remember: Annuities are complex financial products. This calculator provides estimates for planning purposes. 
              Always verify results with your insurance company and financial advisor before making decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnuityCalculatorComponent;
