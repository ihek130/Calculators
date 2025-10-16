import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Calendar, TrendingDown, PieChart, BarChart3, Calculator } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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

const AnnuityPayoutCalculatorComponent = () => {
  // Common States
  const [startingPrincipal, setStartingPrincipal] = useState('500000');
  const [interestRate, setInterestRate] = useState('6');
  const [payoutFrequency, setPayoutFrequency] = useState<'monthly' | 'quarterly' | 'semiannually' | 'annually'>('monthly');

  // Fixed Length States
  const [yearsToPayout, setYearsToPayout] = useState('10');

  // Fixed Payment States
  const [fixedPaymentAmount, setFixedPaymentAmount] = useState('5511.20');

  // Calculate Fixed Length (calculate payment amount)
  const fixedLengthResults = useMemo(() => {
    const principal = parseFloat(startingPrincipal || '0');
    const annualRate = parseFloat(interestRate || '0') / 100;
    const years = parseInt(yearsToPayout || '0');

    if (principal <= 0 || years <= 0) {
      return {
        paymentAmount: 0,
        totalPayments: 0,
        totalPaid: 0,
        totalInterest: 0,
        schedule: [],
        pieData: [],
        principalPercent: 0,
        interestPercent: 0
      };
    }

    // Calculate number of periods and rate per period
    let periodsPerYear: number;
    switch (payoutFrequency) {
      case 'monthly':
        periodsPerYear = 12;
        break;
      case 'quarterly':
        periodsPerYear = 4;
        break;
      case 'semiannually':
        periodsPerYear = 2;
        break;
      case 'annually':
        periodsPerYear = 1;
        break;
    }

    const totalPeriods = years * periodsPerYear;
    const ratePerPeriod = annualRate / periodsPerYear;

    // Calculate payment amount using annuity formula
    // PMT = PV * (r * (1 + r)^n) / ((1 + r)^n - 1)
    let paymentAmount: number;
    if (ratePerPeriod === 0) {
      paymentAmount = principal / totalPeriods;
    } else {
      const numerator = principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, totalPeriods);
      const denominator = Math.pow(1 + ratePerPeriod, totalPeriods) - 1;
      paymentAmount = numerator / denominator;
    }

    // Generate schedule
    const schedule = [];
    let balance = principal;
    let totalInterest = 0;

    for (let year = 1; year <= years; year++) {
      let yearInterest = 0;
      let yearBeginBalance = balance;

      for (let period = 1; period <= periodsPerYear; period++) {
        const periodInterest = balance * ratePerPeriod;
        yearInterest += periodInterest;
        totalInterest += periodInterest;
        balance = balance * (1 + ratePerPeriod) - paymentAmount;

        // Prevent negative balance due to rounding
        if (balance < 0) balance = 0;
      }

      schedule.push({
        year,
        beginningBalance: yearBeginBalance,
        interest: yearInterest,
        endingBalance: balance
      });

      if (balance === 0) break;
    }

    const totalPaid = paymentAmount * totalPeriods;

    // Pie chart data
    const pieData = [
      { name: 'Starting Principal', value: principal, color: '#3b82f6' },
      { name: 'Interest/Return', value: totalInterest, color: '#f59e0b' }
    ];

    return {
      paymentAmount,
      totalPayments: totalPeriods,
      totalPaid,
      totalInterest,
      schedule,
      pieData,
      principalPercent: (principal / totalPaid) * 100,
      interestPercent: (totalInterest / totalPaid) * 100
    };
  }, [startingPrincipal, interestRate, yearsToPayout, payoutFrequency]);

  // Calculate Fixed Payment (calculate how long it will last)
  const fixedPaymentResults = useMemo(() => {
    const principal = parseFloat(startingPrincipal || '0');
    const annualRate = parseFloat(interestRate || '0') / 100;
    const payment = parseFloat(fixedPaymentAmount || '0');

    if (principal <= 0 || payment <= 0) {
      return {
        totalYears: 0,
        totalPeriods: 0,
        totalPaid: 0,
        totalInterest: 0,
        schedule: [],
        pieData: [],
        principalPercent: 0,
        interestPercent: 0,
        exhausted: false
      };
    }

    // Calculate number of periods
    let periodsPerYear: number;
    switch (payoutFrequency) {
      case 'monthly':
        periodsPerYear = 12;
        break;
      case 'quarterly':
        periodsPerYear = 4;
        break;
      case 'semiannually':
        periodsPerYear = 2;
        break;
      case 'annually':
        periodsPerYear = 1;
        break;
    }

    const ratePerPeriod = annualRate / periodsPerYear;

    // Check if payment is too small to ever deplete the principal
    if (ratePerPeriod > 0 && payment <= principal * ratePerPeriod) {
      return {
        totalYears: Infinity,
        totalPeriods: Infinity,
        totalPaid: Infinity,
        totalInterest: Infinity,
        schedule: [],
        pieData: [],
        principalPercent: 0,
        interestPercent: 0,
        exhausted: false
      };
    }

    // Generate schedule until balance reaches 0
    const schedule = [];
    let balance = principal;
    let totalInterest = 0;
    let totalPeriods = 0;
    let year = 1;
    let exhausted = false;

    while (balance > 0 && year <= 100) {
      // Cap at 100 years for safety
      let yearInterest = 0;
      let yearBeginBalance = balance;

      for (let period = 1; period <= periodsPerYear && balance > 0; period++) {
        const periodInterest = balance * ratePerPeriod;
        yearInterest += periodInterest;
        totalInterest += periodInterest;
        balance = balance * (1 + ratePerPeriod) - payment;
        totalPeriods++;

        if (balance <= 0) {
          balance = 0;
          exhausted = true;
          break;
        }
      }

      schedule.push({
        year,
        beginningBalance: yearBeginBalance,
        interest: yearInterest,
        endingBalance: balance
      });

      if (exhausted) break;
      year++;
    }

    const totalYears = year;
    const totalPaid = payment * totalPeriods;

    // Pie chart data
    const pieData = [
      { name: 'Starting Principal', value: principal, color: '#3b82f6' },
      { name: 'Interest/Return', value: totalInterest, color: '#f59e0b' }
    ];

    return {
      totalYears,
      totalPeriods,
      totalPaid,
      totalInterest,
      schedule,
      pieData,
      principalPercent: (principal / totalPaid) * 100,
      interestPercent: (totalInterest / totalPaid) * 100,
      exhausted
    };
  }, [startingPrincipal, interestRate, fixedPaymentAmount, payoutFrequency]);

  const COLORS = ['#3b82f6', '#f59e0b'];

  const frequencyLabels = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiannually: 'Semi-Annually',
    annually: 'Annually'
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <TrendingDown className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Annuity Payout Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Calculate your annuity payout amount for a fixed period or determine how long your annuity will last 
          with a fixed payment amount. This calculator focuses on the <strong>distribution phase</strong> of an annuity.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Note:</strong> For the accumulation phase, use our Annuity Calculator to estimate growth 
            from regular contributions.
          </p>
        </div>
      </div>

      {/* Tabs for Fixed Length vs Fixed Payment */}
      <Tabs defaultValue="fixed-length" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="fixed-length" className="text-xs sm:text-sm">
            Fixed Length
          </TabsTrigger>
          <TabsTrigger value="fixed-payment" className="text-xs sm:text-sm">
            Fixed Payment
          </TabsTrigger>
        </TabsList>

        {/* Fixed Length Tab */}
        <TabsContent value="fixed-length" className="space-y-8">
          {/* Input Section */}
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl sm:text-2xl text-blue-900">Fixed Length Parameters</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Calculate your periodic payment amount based on a fixed payout period
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starting Principal */}
                <div className="space-y-2">
                  <Label htmlFor="principal-fl" className="text-xs sm:text-sm font-medium">
                    Starting Principal
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="principal-fl"
                      type="number"
                      value={startingPrincipal}
                      onChange={(e) => setStartingPrincipal(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="500000"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label htmlFor="rate-fl" className="text-xs sm:text-sm font-medium">
                    Interest/Return Rate
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rate-fl"
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="6"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">%</span>
                  </div>
                </div>

                {/* Years to Payout */}
                <div className="space-y-2">
                  <Label htmlFor="years-fl" className="text-xs sm:text-sm font-medium">
                    Years to Payout
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="years-fl"
                      type="number"
                      value={yearsToPayout}
                      onChange={(e) => setYearsToPayout(e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="10"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">years</span>
                  </div>
                </div>

                {/* Payout Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency-fl" className="text-xs sm:text-sm font-medium">
                    Payout Frequency
                  </Label>
                  <Select value={payoutFrequency} onValueChange={(value: any) => setPayoutFrequency(value)}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semiannually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="border-b-2 border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-900">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-green-300 shadow-md mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">You can withdraw</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-700 break-words">
                  ${fixedLengthResults.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">{frequencyLabels[payoutFrequency].toLowerCase()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Total of {fixedLengthResults.totalPayments} payments</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-700 break-words">
                    ${fixedLengthResults.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-orange-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Interest/Return</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-700 break-words">
                    ${fixedLengthResults.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                Payment Composition
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={fixedLengthResults.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fixedLengthResults.pieData.map((entry, index) => (
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

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Starting Principal</p>
                      <p className="text-xs text-gray-600">{fixedLengthResults.principalPercent.toFixed(1)}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${parseFloat(startingPrincipal || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Interest/Return</p>
                      <p className="text-xs text-gray-600">{fixedLengthResults.interestPercent.toFixed(1)}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${fixedLengthResults.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Chart */}
          <Card className="shadow-xl border-2 border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
              <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
                <BarChart3 className="w-6 h-6" />
                Annuity Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fixedLengthResults.schedule}>
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
                    <Area 
                      type="monotone" 
                      dataKey="endingBalance" 
                      stackId="1"
                      stroke="#3b82f6" 
                      fill="#3b82f6"
                      name="Balance"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="interest" 
                      stackId="2"
                      stroke="#f59e0b" 
                      fill="#f59e0b"
                      name="Interest/Return"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Table */}
          <Card className="shadow-xl border-2 border-gray-200">
            <CardHeader className="bg-gray-50 border-b-2">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                <Calendar className="w-6 h-6" />
                Annual Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[550px]">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-bold whitespace-nowrap">Year</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Beginning Balance</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Interest/Return</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {fixedLengthResults.schedule.map((row) => (
                      <tr key={row.year} className="hover:bg-gray-50">
                        <td className="p-2 sm:p-3 whitespace-nowrap">{row.year}</td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap">
                          ${row.beginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 text-green-700 font-medium whitespace-nowrap">
                          ${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        </TabsContent>

        {/* Fixed Payment Tab */}
        <TabsContent value="fixed-payment" className="space-y-8">
          {/* Input Section */}
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl sm:text-2xl text-blue-900">Fixed Payment Parameters</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Calculate how long your annuity will last with a fixed payment amount
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starting Principal */}
                <div className="space-y-2">
                  <Label htmlFor="principal-fp" className="text-xs sm:text-sm font-medium">
                    Starting Principal
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="principal-fp"
                      type="number"
                      value={startingPrincipal}
                      onChange={(e) => setStartingPrincipal(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="500000"
                    />
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label htmlFor="rate-fp" className="text-xs sm:text-sm font-medium">
                    Interest/Return Rate
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="rate-fp"
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="text-sm sm:text-base"
                      placeholder="6"
                    />
                    <span className="text-xs sm:text-sm text-gray-600">%</span>
                  </div>
                </div>

                {/* Fixed Payment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="payment-fp" className="text-xs sm:text-sm font-medium">
                    Payment Amount per Period
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="payment-fp"
                      type="number"
                      step="0.01"
                      value={fixedPaymentAmount}
                      onChange={(e) => setFixedPaymentAmount(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="5511.20"
                    />
                  </div>
                </div>

                {/* Payout Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency-fp" className="text-xs sm:text-sm font-medium">
                    Payout Frequency
                  </Label>
                  <Select value={payoutFrequency} onValueChange={(value: any) => setPayoutFrequency(value)}>
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semiannually">Semi-Annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          {fixedPaymentResults.totalYears === Infinity ? (
            <Card className="shadow-xl border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
              <CardHeader className="border-b-2 border-yellow-200">
                <CardTitle className="text-xl sm:text-2xl text-yellow-900">⚠️ Payment Too Small</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm sm:text-base text-gray-700">
                  Your payment amount (${parseFloat(fixedPaymentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}) 
                  is too small to deplete the principal. The interest earned (${(parseFloat(startingPrincipal) * parseFloat(interestRate) / 100 / (payoutFrequency === 'monthly' ? 12 : payoutFrequency === 'quarterly' ? 4 : payoutFrequency === 'semiannually' ? 2 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} per period) 
                  exceeds your withdrawal amount. <strong>Your annuity will last forever!</strong>
                </p>
                <p className="text-sm sm:text-base text-gray-700 mt-3">
                  Increase your payment amount to see how long the annuity will last before being exhausted.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="border-b-2 border-green-200">
                  <CardTitle className="text-xl sm:text-2xl text-green-900">Results</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-green-300 shadow-md mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">Your annuity will last</p>
                    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-green-700 break-words">
                      {fixedPaymentResults.totalYears} {fixedPaymentResults.totalYears === 1 ? 'year' : 'years'}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      ({fixedPaymentResults.totalPeriods} {frequencyLabels[payoutFrequency].toLowerCase()} payments)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-300 shadow-md">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Paid Out</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-700 break-words">
                        ${fixedPaymentResults.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-orange-300 shadow-md">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Interest/Return</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-700 break-words">
                        ${fixedPaymentResults.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    Payment Composition
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={fixedPaymentResults.pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {fixedPaymentResults.pieData.map((entry, index) => (
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

                    {/* Legend */}
                    <div className="flex flex-col justify-center space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Starting Principal</p>
                          <p className="text-xs text-gray-600">{fixedPaymentResults.principalPercent.toFixed(1)}%</p>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                          ${parseFloat(startingPrincipal || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Interest/Return</p>
                          <p className="text-xs text-gray-600">{fixedPaymentResults.interestPercent.toFixed(1)}%</p>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                          ${fixedPaymentResults.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Chart */}
              <Card className="shadow-xl border-2 border-cyan-200">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
                  <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
                    <BarChart3 className="w-6 h-6" />
                    Annuity Balances
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-80 sm:h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={fixedPaymentResults.schedule}>
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
                        <Area 
                          type="monotone" 
                          dataKey="endingBalance" 
                          stackId="1"
                          stroke="#3b82f6" 
                          fill="#3b82f6"
                          name="Balance"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="interest" 
                          stackId="2"
                          stroke="#f59e0b" 
                          fill="#f59e0b"
                          name="Interest/Return"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Table */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gray-50 border-b-2">
                  <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                    <Calendar className="w-6 h-6" />
                    Annual Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm min-w-[550px]">
                      <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                          <th className="text-left p-2 sm:p-3 font-bold whitespace-nowrap">Year</th>
                          <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Beginning Balance</th>
                          <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Interest/Return</th>
                          <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {fixedPaymentResults.schedule.map((row) => (
                          <tr key={row.year} className="hover:bg-gray-50">
                            <td className="p-2 sm:p-3 whitespace-nowrap">{row.year}</td>
                            <td className="text-right p-2 sm:p-3 whitespace-nowrap">
                              ${row.beginningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right p-2 sm:p-3 text-green-700 font-medium whitespace-nowrap">
                              ${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Educational Content */}
      <div className="space-y-8">
        {/* Understanding Annuity Payouts */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Understanding Annuity Payouts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              An annuity payout, also called the <strong>distribution phase</strong> or <strong>annuitization phase</strong>, 
              is when you begin receiving regular payments from your accumulated annuity balance. This marks the transition 
              from saving and accumulating wealth to converting that wealth into a steady income stream, typically during 
              retirement.
            </p>
            <p>
              During the payout phase, your annuity balance is systematically drawn down through periodic payments while 
              the remaining balance continues to earn interest or investment returns. The insurance company calculates 
              payment amounts based on several factors:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your total accumulated balance at the time of annuitization</li>
              <li>The expected rate of return on the remaining balance</li>
              <li>The payout period or payment amount you select</li>
              <li>Your age and life expectancy (for lifetime payout options)</li>
              <li>Whether you choose single-life or joint-survivor payments</li>
              <li>Any guaranteed period certain provisions</li>
            </ul>
            <p>
              <strong>Important:</strong> Once you annuitize (begin the payout phase), you typically cannot change 
              your payout option or access the remaining principal as a lump sum. This decision is usually 
              <strong> irrevocable</strong>, making it crucial to carefully evaluate your options before annuitizing.
            </p>
          </CardContent>
        </Card>

        {/* Qualified vs Non-Qualified Annuities */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Qualified vs. Non-Qualified Annuities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">Qualified Annuities</h3>
                <p>
                  In the U.S., a <strong>tax-qualified annuity</strong> is used for qualified, tax-advantaged retirement 
                  plans such as IRAs, 401(k)s, 403(b)s, Keogh Plans, Thrift Savings Plans (TSPs), SEPs, and defined 
                  benefit pension plans.
                </p>
                <div className="mt-3 space-y-2">
                  <p><strong>Tax Treatment:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Contributions made with <strong>pretax dollars</strong> (tax-deductible in contribution year)</li>
                    <li>Earnings grow <strong>tax-deferred</strong> during accumulation</li>
                    <li>All distributions taxed as <strong>ordinary income</strong> when withdrawn</li>
                    <li>Subject to <strong>Required Minimum Distributions (RMDs)</strong> starting at age 73 (as of 2025)</li>
                  </ul>
                </div>
                <div className="mt-3 bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-xs font-medium">
                    <strong>Note:</strong> While qualified annuities must follow the tax rules of their retirement plan, 
                    they may still offer unique annuity features like guaranteed death benefits that protect beneficiaries 
                    even if markets decline.
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">Non-Qualified Annuities</h3>
                <p>
                  <strong>Non-qualified annuities</strong> are purchased with after-tax dollars (money you've already paid 
                  income tax on). This creates different tax treatment during the payout phase.
                </p>
                <div className="mt-3 space-y-2">
                  <p><strong>Tax Treatment:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Contributions made with <strong>after-tax dollars</strong> (not tax-deductible)</li>
                    <li>Earnings grow <strong>tax-deferred</strong> during accumulation</li>
                    <li>Only the <strong>earnings portion</strong> of distributions is taxed as ordinary income</li>
                    <li>Principal portion returns tax-free (you already paid taxes on it)</li>
                    <li><strong>Not subject to RMDs</strong> at age 73 (more flexibility)</li>
                    <li><strong>No contribution limits</strong> (unlike 401k/IRA annual caps)</li>
                  </ul>
                </div>
                <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-xs">
                    <strong>Taxation Method:</strong> Non-qualified annuity withdrawals use "last in, first out" (LIFO) 
                    accounting for annuities purchased after August 13, 1982. This means earnings come out first and are 
                    fully taxable until you've withdrawn all gains, then remaining withdrawals are tax-free principal.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-4">
              <p className="font-bold text-sm mb-2 text-yellow-900">💡 Key Difference in Payouts:</p>
              <p>
                For <strong>qualified annuities</strong>, 100% of each payment is taxable. For <strong>non-qualified 
                annuities</strong>, each payment includes both taxable earnings and tax-free principal return. The IRS 
                uses an "exclusion ratio" to determine what portion of each payment is taxable versus tax-free based on 
                your original investment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Phases of an Annuity */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">The Three Phases of an Annuity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Every annuity progresses through distinct phases, each with its own characteristics and rules:
            </p>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">1. Accumulation Phase</h3>
                <p>
                  The <strong>accumulation phase</strong> is the period when you contribute money and build your annuity's 
                  value. This phase always comes first and begins after the initial investment.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li><strong>Contributions:</strong> Can be a lump sum or series of payments over time</li>
                  <li><strong>Growth:</strong> Assets grow tax-deferred through interest or investment returns</li>
                  <li><strong>Duration:</strong> Can last decades for younger investors or be very short for immediate annuities</li>
                  <li><strong>Flexibility:</strong> Some contracts allow additional contributions; others are closed after initial deposit</li>
                </ul>
                <p className="mt-2 text-xs italic">
                  <strong>Example:</strong> A 40-year-old invests $50,000 and adds $500 monthly for 25 years. This entire 
                  25-year period is the accumulation phase, building wealth for eventual retirement income.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">2. Annuitization Phase</h3>
                <p>
                  The <strong>annuitization phase</strong> is a single, critical event—not an extended period. It's the 
                  moment you convert your accumulated balance into a guaranteed income stream.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li><strong>Decision point:</strong> You select your payout option (fixed length, fixed payment, lifetime, etc.)</li>
                  <li><strong>Conversion:</strong> For variable annuities, accumulation units convert to annuity units</li>
                  <li><strong>Irrevocable:</strong> Once annuitized, you typically cannot change your mind or access the lump sum</li>
                  <li><strong>Calculation:</strong> Insurance company calculates payments based on your age, balance, and chosen option</li>
                </ul>
                <p className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                  ⚠️ <strong>Important:</strong> Not all annuities require annuitization. Some allow systematic withdrawals 
                  without converting to a fixed payout structure, preserving access to your principal.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-orange-900">3. Payout Phase (Distribution Phase)</h3>
                <p>
                  The <strong>payout phase</strong> is when you receive regular payments from your annuity. This calculator 
                  helps you model this phase.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li><strong>Frequency:</strong> Payments can be monthly, quarterly, semi-annual, or annual</li>
                  <li><strong>Duration:</strong> Depends on option chosen (fixed period, lifetime, or until balance exhausted)</li>
                  <li><strong>Taxation:</strong> Each payment may be partially or fully taxable depending on annuity type</li>
                  <li><strong>Adjustments:</strong> Some annuities offer cost-of-living adjustments (COLAs) to combat inflation</li>
                </ul>
                <p className="mt-2 text-xs italic">
                  <strong>Example:</strong> At age 65, you annuitize your $500,000 balance choosing a 10-year fixed period 
                  with monthly payments. For the next 10 years, you'll receive $5,511.20 monthly (assuming 6% return), 
                  systematically drawing down the balance to $0.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout Options Explained */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Annuity Payout Options</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              When you're ready to begin receiving income, you must choose a payout option. Each option has unique 
              advantages and risks. <strong>This choice is usually irrevocable</strong>, so understanding your options 
              is critical.
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">1. Fixed Length (Period Certain)</h3>
                <p>
                  Payments are guaranteed for a specific time period you select (e.g., 10, 15, or 20 years), regardless 
                  of how long you live.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Predictable income for a known duration</li>
                    <li>Higher payments than lifetime options (shorter guaranteed period)</li>
                    <li>If you die early, remaining payments go to beneficiaries</li>
                    <li>Not dependent on life expectancy calculations</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Payments stop after the period ends, even if you're still alive</li>
                    <li>Risk of outliving your income if you live longer than expected</li>
                    <li>No protection against longevity risk</li>
                  </ul>
                </div>
                <div className="mt-2 bg-blue-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Retirees who have other income sources (Social Security, 
                  pension) and want guaranteed income for a specific period, such as bridging to Social Security or covering 
                  a mortgage payoff.</p>
                </div>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">2. Fixed Payment Amount</h3>
                <p>
                  You select the dollar amount you want to receive each period, and payments continue until your annuity 
                  balance is depleted.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Control over your monthly budget and cash flow</li>
                    <li>Flexibility to adjust to your spending needs</li>
                    <li>Can calculate exactly how long your money will last</li>
                    <li>Remaining balance goes to beneficiaries if you die early</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Easy to choose payments that are too high or too low</li>
                    <li>Risk of depleting the account if you live longer than expected</li>
                    <li>No guaranteed lifetime income protection</li>
                    <li>Must actively manage to avoid running out</li>
                  </ul>
                </div>
                <div className="mt-2 bg-green-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Retirees who want control over their monthly income and 
                  have the discipline to manage withdrawal rates responsibly. Works well when combined with other guaranteed 
                  income sources.</p>
                </div>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-purple-900">3. Lump-Sum</h3>
                <p>
                  Withdraw the entire account value in a single payment, giving you complete access to your money immediately.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Maximum flexibility—use money however you want</li>
                    <li>Can invest elsewhere or pay off debts</li>
                    <li>Useful for major expenses or emergencies</li>
                    <li>Full control over asset management</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Huge tax hit—entire taxable portion due in one year</li>
                    <li>No guaranteed lifetime income</li>
                    <li>Easy to spend too quickly</li>
                    <li>Lose insurance company guarantees and longevity protection</li>
                  </ul>
                </div>
                <div className="mt-2 bg-purple-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Generally <strong>not recommended</strong> for retirement 
                  income due to severe tax consequences. May be appropriate for emergencies, major medical expenses, or if 
                  you have terminal illness.</p>
                </div>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-orange-900">4. Life Only</h3>
                <p>
                  Receive payments for as long as you live, regardless of how long that is. Payments stop when you die, 
                  with nothing left for beneficiaries.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Highest monthly payment of all lifetime options</li>
                    <li>Complete protection against longevity risk (outliving your money)</li>
                    <li>Simple to understand—guaranteed income for life</li>
                    <li>Can live to 110 and still receive payments</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>If you die early, all remaining value is lost (kept by insurance company)</li>
                    <li>No legacy for heirs—nothing passes to beneficiaries</li>
                    <li>Payment amount fixed by life expectancy—can't control amount</li>
                    <li>Can't change your mind once annuitized</li>
                  </ul>
                </div>
                <div className="mt-2 bg-orange-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Single retirees with no dependents or heirs, who want 
                  maximum monthly income and are primarily concerned with not outliving their savings. Not ideal if leaving 
                  a legacy is important.</p>
                </div>
              </div>

              <div className="border-l-4 border-pink-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-pink-900">5. Joint and Survivor</h3>
                <p>
                  Payments continue for as long as either you or your spouse lives. Often pays 100% to the survivor, but 
                  can be structured for 50%, 66%, or 75% to the survivor.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Protects both spouses from outliving savings</li>
                    <li>Surviving spouse maintains income for life</li>
                    <li>Can extend to more than two people (e.g., dependent child)</li>
                    <li>Peace of mind for married couples</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Lower monthly payments than single-life (covers two lives)</li>
                    <li>If both die early, remaining value lost</li>
                    <li>Nothing left for non-spouse beneficiaries</li>
                    <li>More complex if spouse has significantly different age/health</li>
                  </ul>
                </div>
                <div className="mt-2 bg-pink-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Married couples who want to ensure the surviving spouse 
                  has guaranteed income for life. Essential when the annuity represents a significant portion of retirement 
                  income and both spouses depend on it.</p>
                </div>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-indigo-900">6. Life with Period Certain</h3>
                <p>
                  Combines lifetime payments with a guaranteed minimum period (e.g., 10 or 20 years). If you die during 
                  the certain period, beneficiaries receive the remaining guaranteed payments.
                </p>
                <div className="mt-2 space-y-2">
                  <p><strong>✓ Advantages:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Lifetime income protection (won't outlive payments)</li>
                    <li>Guarantees some legacy if you die early (period certain)</li>
                    <li>Balances longevity protection with legacy goals</li>
                    <li>Beneficiaries protected during certain period</li>
                  </ul>
                  <p className="mt-2"><strong>✗ Risks:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Lower payments than straight life only (paying for the guarantee)</li>
                    <li>If you die after the certain period, nothing remains for heirs</li>
                    <li>More expensive than life-only due to minimum guarantee</li>
                  </ul>
                </div>
                <div className="mt-2 bg-indigo-50 p-3 rounded">
                  <p className="text-xs"><strong>Best For:</strong> Retirees who want lifetime income security but also want 
                  to ensure heirs receive something if they die prematurely. Good middle-ground option balancing longevity 
                  protection and legacy planning.</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-6">
              <p className="font-bold text-sm mb-2 text-yellow-900">⚠️ Important Note About This Calculator:</p>
              <p>
                This calculator models <strong>Fixed Length</strong> and <strong>Fixed Payment Amount</strong> options only. 
                These are period-certain options where the duration is defined or calculable. For <strong>lifetime options</strong> 
                (Life Only, Joint and Survivor, Life with Period Certain), you'll need actuarial tables and mortality assumptions 
                that depend on your specific age, health, and the insurance company's calculations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Early Withdrawals and Penalties */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-red-900">Early Withdrawals and Penalties</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Withdrawing money from an annuity before the age of 59½ can result in significant penalties on top of 
              regular income taxes. Understanding these rules is crucial to avoid costly mistakes.
            </p>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h3 className="font-bold text-base mb-2 text-red-900">Standard Early Withdrawal Penalty</h3>
              <p>
                If you withdraw funds before age 59½, you'll face a <strong>10% IRS early withdrawal penalty</strong> on 
                the taxable portion (earnings), plus regular income taxes on those earnings. This applies to both qualified 
                and non-qualified annuities.
              </p>
              <div className="mt-3 bg-white p-3 rounded border border-red-200">
                <p className="text-xs font-medium">Example Calculation:</p>
                <ul className="list-disc list-inside ml-2 space-y-1 text-xs mt-2">
                  <li>Withdraw $50,000 from non-qualified annuity at age 55</li>
                  <li>$30,000 is taxable earnings, $20,000 is tax-free principal</li>
                  <li>10% penalty: $30,000 × 10% = <strong>$3,000 penalty</strong></li>
                  <li>Income tax (assume 24%): $30,000 × 24% = <strong>$7,200 tax</strong></li>
                  <li><strong>Total cost: $10,200 in penalties and taxes on $50,000 withdrawal</strong></li>
                </ul>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <h3 className="font-bold text-base text-gray-900">Exceptions to the 10% Penalty</h3>
              <p>The IRS provides several exceptions where you can withdraw before 59½ without the 10% penalty (though income taxes still apply):</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Disability</p>
                  <p className="text-xs">If you become totally and permanently disabled as defined by the IRS.</p>
                </div>

                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Death</p>
                  <p className="text-xs">Beneficiaries can withdraw without the 10% penalty after the annuitant's death.</p>
                </div>

                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Series of Equal Payments (72(t))</p>
                  <p className="text-xs">Structured withdrawals under IRS Rule 72(t) for at least 5 years or until age 59½, whichever is longer.</p>
                </div>

                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Terminal Illness</p>
                  <p className="text-xs">Many contracts waive penalties for withdrawals due to diagnosed terminal illness.</p>
                </div>

                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Medical Expenses</p>
                  <p className="text-xs">Unreimbursed medical expenses exceeding 7.5% of your adjusted gross income.</p>
                </div>

                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm mb-1">✓ Long-Term Care</p>
                  <p className="text-xs">Some contracts allow penalty-free withdrawals for qualified long-term care expenses.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
              <h3 className="font-bold text-base mb-2 text-blue-900">Free Withdrawal Provisions</h3>
              <p>
                Most annuity contracts allow you to withdraw a portion of your account value each year without incurring 
                <strong> surrender charges</strong> (typically 10% of account value). However, this doesn't protect you 
                from the IRS 10% early withdrawal penalty if you're under 59½.
              </p>
              <p className="mt-2 text-xs">
                <strong>Example:</strong> Your $100,000 annuity allows 10% free withdrawals annually. You can withdraw 
                $10,000 without a surrender charge from the insurance company, but if you're 55 years old, you'll still 
                owe the IRS 10% penalty plus income taxes on the earnings portion.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 mt-4">
              <h3 className="font-bold text-base mb-2 text-purple-900">Gains-Only Withdrawal Option</h3>
              <p>
                Some annuity contracts allow you to withdraw only the <strong>gains (not principal)</strong> without 
                incurring surrender charges, even outside the free withdrawal provision. This can be useful for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>Rebalancing your portfolio without penalties</li>
                <li>Taking required minimum distributions from qualified annuities</li>
                <li>Accessing growth while preserving principal</li>
              </ul>
              <p className="mt-2 text-xs italic">
                Note: The IRS 10% penalty and income taxes still apply if you're under 59½.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 1035 Exchange */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">1035 Exchange: Tax-Free Annuity Transfers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              A <strong>1035 Exchange</strong>, named after Section 1035 of the Internal Revenue Code, allows you to 
              transfer funds from one annuity to another (or from certain life insurance policies to annuities) without 
              triggering immediate taxation. This is a powerful tool for updating outdated contracts without tax consequences.
            </p>

            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <h3 className="font-bold text-base mb-2 text-indigo-900">Why Use a 1035 Exchange?</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Better rates:</strong> Move to an annuity with higher guaranteed rates or better return potential</li>
                <li><strong>Lower fees:</strong> Escape high-fee variable annuities for lower-cost options</li>
                <li><strong>Improved benefits:</strong> Access better death benefits, living benefits, or payout options</li>
                <li><strong>Changing needs:</strong> Your situation has changed and you need different features</li>
                <li><strong>Company strength:</strong> Move to an insurance company with better financial ratings</li>
                <li><strong>Lifestyle changes:</strong> Convert life insurance to annuity income if you no longer need coverage</li>
              </ul>
            </div>

            <div className="space-y-4 mt-4">
              <h3 className="font-bold text-base text-gray-900">IRS-Approved 1035 Exchanges</h3>
              <p>Only these transfers qualify as tax-free 1035 exchanges:</p>
              
              <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                <p className="font-bold text-sm mb-2">✓ Valid Exchanges</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Annuity → Annuity</li>
                  <li>Annuity → Annuity with long-term care benefits</li>
                  <li>Life insurance → Another life insurance policy</li>
                  <li>Life insurance → Annuity (cannot reverse)</li>
                  <li>Life insurance → Endowment contract</li>
                  <li>Endowment → Annuity</li>
                  <li>Endowment → Another endowment (with same or earlier payout date)</li>
                </ul>
              </div>

              <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                <p className="font-bold text-sm mb-2">✗ Invalid Exchanges (Taxable)</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Annuity → Life insurance (not allowed)</li>
                  <li>Changing ownership (owner, insured, or annuitant must stay the same)</li>
                  <li>Exchanging to different people's contracts</li>
                  <li>Cashing out one policy and buying another (must be direct transfer)</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-4">
              <h3 className="font-bold text-base mb-2 text-yellow-900">⚠️ Important 1035 Exchange Rules</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Direct transfer:</strong> Funds must transfer directly from one insurance company to another; don't take possession of the money</li>
                <li><strong>Same owner/annuitant:</strong> The owner, insured, and annuitant must be identical on both contracts</li>
                <li><strong>Full replacement:</strong> Can't cherry-pick beneficiaries or split ownership</li>
                <li><strong>Timing matters:</strong> Process must complete within 60 days to avoid tax consequences</li>
                <li><strong>Surrender charges still apply:</strong> The old contract may impose surrender penalties even though it's a tax-free exchange</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 mt-4">
              <h3 className="font-bold text-base mb-2 text-purple-900">Partial 1035 Exchanges</h3>
              <p>
                You can exchange <strong>part of an annuity</strong> to another annuity contract while keeping the rest 
                in the original contract. The basis (your original investment) is split proportionally between the two 
                contracts.
              </p>
              <div className="mt-3 bg-purple-50 p-3 rounded">
                <p className="text-xs font-medium mb-2">Example:</p>
                <p className="text-xs">
                  You have a $50,000 non-qualified annuity with a $40,000 basis (you contributed $40,000, it grew to $50,000). 
                  You do a partial 1035 exchange of $25,000 (half) to a new annuity:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs mt-2">
                  <li><strong>Old annuity:</strong> Now has $25,000 value with $20,000 basis</li>
                  <li><strong>New annuity:</strong> Has $25,000 value with $20,000 basis</li>
                  <li>If you later withdraw $10,000 from either contract, only $5,000 would be taxable (the growth portion)</li>
                </ul>
              </div>
              <div className="mt-3 bg-red-50 p-3 rounded border border-red-200">
                <p className="text-xs">
                  <strong>180-Day Rule:</strong> You cannot take distributions from either the old or new contract within 
                  180 days of a partial 1035 exchange, or the IRS may treat it as a taxable distribution rather than an 
                  exchange.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
              <p className="font-bold text-sm mb-2 text-blue-900">💡 Before Doing a 1035 Exchange:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Compare total costs including surrender charges on the old contract vs. benefits of the new one</li>
                <li>Verify the new contract actually offers better features, not just higher commissions for the agent</li>
                <li>Check the financial strength ratings of both insurance companies</li>
                <li>Understand you're starting a new surrender period (typically 5-10 years)</li>
                <li>Consult with a fee-only financial advisor or tax professional</li>
                <li>Get everything in writing from both insurance companies</li>
              </ul>
            </div>
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
              This calculator helps you model two common annuity payout scenarios: <strong>fixed length</strong> (calculating 
              payment amounts) and <strong>fixed payment</strong> (calculating duration). Choose the tab that matches your 
              situation.
            </p>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-bold text-base mb-2 text-blue-900">Fixed Length Tab</h3>
                <p className="mb-3">
                  Use this when you know how long you want payments to last and want to calculate the payment amount.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Step 1: Enter Starting Principal</p>
                    <p className="text-xs mt-1">
                      This is your accumulated annuity balance at the time you begin taking distributions. This should be 
                      the value shown in your most recent statement or projected value at retirement.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 2: Enter Interest/Return Rate</p>
                    <p className="text-xs mt-1">
                      For <strong>fixed annuities</strong>, use the guaranteed rate from your contract. For <strong>variable 
                      annuities</strong>, use a conservative growth estimate (4-6% is typical). Remember that your remaining 
                      balance continues earning returns during the payout phase.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 3: Set Years to Payout</p>
                    <p className="text-xs mt-1">
                      Choose how many years you want guaranteed payments. Common choices: 10 years (bridge to Social Security), 
                      20 years (general retirement income), or 30 years (longer retirement horizon).
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 4: Select Payout Frequency</p>
                    <p className="text-xs mt-1">
                      Choose how often you want payments: monthly (most common, matches typical expenses), quarterly, 
                      semi-annually, or annually.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 5: Review Results</p>
                    <p className="text-xs mt-1">
                      The calculator shows your payment amount, total you'll receive, and how much comes from interest vs. 
                      principal. Review the annual schedule to see year-by-year balance reduction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h3 className="font-bold text-base mb-2 text-green-900">Fixed Payment Tab</h3>
                <p className="mb-3">
                  Use this when you know how much income you need each period and want to calculate how long it will last.
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Step 1: Enter Starting Principal</p>
                    <p className="text-xs mt-1">
                      Same as fixed length—your current or projected annuity balance when distributions begin.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 2: Enter Interest/Return Rate</p>
                    <p className="text-xs mt-1">
                      Expected return on your remaining balance during payout phase. Be conservative—overestimating can lead 
                      to running out of money sooner than expected.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 3: Enter Payment Amount</p>
                    <p className="text-xs mt-1">
                      The dollar amount you want to receive each period. Base this on your budget needs, but be aware that 
                      larger payments deplete the balance faster.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 4: Select Payout Frequency</p>
                    <p className="text-xs mt-1">
                      Match this to your budgeting needs and how often you want to receive payments.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Step 5: Analyze Duration</p>
                    <p className="text-xs mt-1">
                      The calculator shows how many years your annuity will last at this payment rate. If it says "forever," 
                      your payment is too small—the interest earned exceeds your withdrawals, so the balance never depletes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-4">
              <p className="font-bold text-sm mb-2 text-yellow-900">⚠️ Important Assumptions & Limitations:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Fixed returns:</strong> This calculator assumes a constant rate of return. Actual variable annuity 
                  returns fluctuate with market performance.
                </li>
                <li>
                  <strong>No fees included:</strong> Results don't account for management fees, M&E charges, or other costs. 
                  Subtract fees from your return rate for more accurate projections.
                </li>
                <li>
                  <strong>No inflation adjustment:</strong> Payments shown are nominal dollars. A $5,000 monthly payment 
                  today won't buy as much in 20 years due to inflation.
                </li>
                <li>
                  <strong>Tax implications ignored:</strong> Results show gross amounts before taxes. Your net spendable 
                  income will be lower after income taxes.
                </li>
                <li>
                  <strong>Period-certain only:</strong> This calculator doesn't model lifetime payouts, which require 
                  actuarial mortality tables.
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 mt-4">
              <p className="font-bold text-sm mb-2 text-purple-900">💡 Pro Tips:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Run multiple scenarios with different interest rates (optimistic, realistic, pessimistic)</li>
                <li>For fixed payment mode, try various payment amounts to find the sweet spot between comfort and longevity</li>
                <li>Consider inflation—build in 2-3% annual payment increases to maintain purchasing power</li>
                <li>Coordinate with Social Security timing—annuity payouts can bridge the gap until you claim SS benefits</li>
                <li>Don't rely solely on period-certain payouts—consider adding a lifetime income option for longevity protection</li>
                <li>Compare calculator results with actual quotes from your insurance company (they may differ due to fees)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Related Calculators */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Related Calculators & Resources</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Explore these related calculators for comprehensive retirement income planning:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Annuity Calculator (Accumulation)</h4>
                <p>
                  Model the growth phase of your annuity with regular contributions and compound interest. Essential for 
                  planning how much you'll have available when you're ready to begin distributions.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Retirement Calculator</h4>
                <p>
                  Project total retirement savings from all sources including 401(k), IRA, Social Security, pensions, and 
                  annuities. Determine if you're on track for your retirement goals.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Social Security Calculator</h4>
                <p>
                  Calculate optimal Social Security claiming age and coordinate SS benefits with annuity income for maximum 
                  lifetime income security.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Pension Calculator</h4>
                <p>
                  Compare pension options including lump sum vs. monthly payments, single-life vs. joint-survivor benefits, 
                  and coordinate with annuity payouts.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">401(k) Calculator</h4>
                <p>
                  Model 401(k) accumulation with employer matching, compare against annuity options, and plan rollovers 
                  from 401(k) to annuities.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">RMD Calculator</h4>
                <p>
                  Calculate Required Minimum Distributions from qualified annuities and coordinate with other retirement 
                  account RMDs starting at age 73.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mt-4">
              <p className="font-bold text-sm mb-2 text-green-900">📚 Educational Resources:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your state insurance department website for annuity consumer guides</li>
                <li>Visit FINRA.org for investor education on annuity products and sales practices</li>
                <li>Read SEC.gov's investor publications on variable annuities</li>
                <li>Consult with a fee-only fiduciary financial advisor before annuitizing</li>
                <li>Review your annuity contract's payout options section carefully</li>
                <li>Request illustrations from your insurance company showing different payout scenarios</li>
              </ul>
            </div>

            <p className="text-center font-medium text-gray-800 pt-4 border-t-2">
              <strong>Disclaimer:</strong> This calculator provides estimates for planning purposes only. Actual annuity 
              payouts depend on your specific contract terms, insurance company calculations, fees, and market performance 
              (for variable annuities). Always verify results with your insurance company and consult with qualified 
              financial and tax professionals before making annuitization decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnnuityPayoutCalculatorComponent;
