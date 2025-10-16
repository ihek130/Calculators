import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, CreditCard, Calendar, TrendingDown, PieChart, BarChart3, Calculator } from 'lucide-react';
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

const CreditCardCalculatorComponent = () => {
  // Input States
  const [balance, setBalance] = useState('8000');
  const [interestRate, setInterestRate] = useState('18');
  const [payoffMethod, setPayoffMethod] = useState<'fixed' | 'percentage'>('fixed');
  const [fixedPayment, setFixedPayment] = useState('200');
  const [percentageMethod, setPercentageMethod] = useState<'interest-plus-1' | 'interest-plus-2' | 'interest-plus-3' | 'interest-plus-4' | 'interest-plus-5'>('interest-plus-1');

  // Calculate payoff schedule
  const results = useMemo(() => {
    const principal = parseFloat(balance || '0');
    const annualRate = parseFloat(interestRate || '0') / 100;
    const monthlyRate = annualRate / 12;

    if (principal <= 0) {
      return {
        monthsToPayoff: 0,
        totalPaid: 0,
        totalInterest: 0,
        monthlyPayment: 0,
        schedule: [],
        pieData: [],
        principalPercent: 0,
        interestPercent: 0
      };
    }

    let monthlyPayment: number;
    
    if (payoffMethod === 'fixed') {
      monthlyPayment = parseFloat(fixedPayment || '0');
    } else {
      // Calculate percentage-based payment
      const interestPayment = principal * monthlyRate;
      let percentageAmount: number;
      
      switch (percentageMethod) {
        case 'interest-plus-1':
          percentageAmount = 0.01;
          break;
        case 'interest-plus-2':
          percentageAmount = 0.02;
          break;
        case 'interest-plus-3':
          percentageAmount = 0.03;
          break;
        case 'interest-plus-4':
          percentageAmount = 0.04;
          break;
        case 'interest-plus-5':
          percentageAmount = 0.05;
          break;
      }
      
      monthlyPayment = interestPayment + (principal * percentageAmount);
    }

    // Check if payment is sufficient
    const minimumPayment = principal * monthlyRate;
    if (monthlyPayment <= minimumPayment) {
      return {
        monthsToPayoff: Infinity,
        totalPaid: Infinity,
        totalInterest: Infinity,
        monthlyPayment,
        schedule: [],
        pieData: [],
        principalPercent: 0,
        interestPercent: 0,
        insufficientPayment: true
      };
    }

    // Generate payment schedule
    const schedule = [];
    let remainingBalance = principal;
    let totalInterestPaid = 0;
    let month = 0;

    while (remainingBalance > 0 && month < 600) { // Cap at 50 years for safety
      month++;
      const interestCharge = remainingBalance * monthlyRate;
      let principalPayment: number;
      let payment: number;

      // Recalculate payment for percentage method
      if (payoffMethod === 'percentage') {
        const interestPayment = remainingBalance * monthlyRate;
        let percentageAmount: number;
        
        switch (percentageMethod) {
          case 'interest-plus-1':
            percentageAmount = 0.01;
            break;
          case 'interest-plus-2':
            percentageAmount = 0.02;
            break;
          case 'interest-plus-3':
            percentageAmount = 0.03;
            break;
          case 'interest-plus-4':
            percentageAmount = 0.04;
            break;
          case 'interest-plus-5':
            percentageAmount = 0.05;
            break;
        }
        
        payment = interestPayment + (remainingBalance * percentageAmount);
      } else {
        payment = monthlyPayment;
      }

      // Final payment adjustment
      if (remainingBalance + interestCharge <= payment) {
        payment = remainingBalance + interestCharge;
        principalPayment = remainingBalance;
        totalInterestPaid += interestCharge;
        
        schedule.push({
          month,
          payment,
          principalPayment,
          interestPayment: interestCharge,
          remainingBalance: 0
        });
        
        remainingBalance = 0;
      } else {
        principalPayment = payment - interestCharge;
        totalInterestPaid += interestCharge;
        remainingBalance -= principalPayment;
        
        schedule.push({
          month,
          payment,
          principalPayment,
          interestPayment: interestCharge,
          remainingBalance
        });
      }
    }

    const totalPaid = principal + totalInterestPaid;

    // Pie chart data
    const pieData = [
      { name: 'Principal', value: principal, color: '#3b82f6' },
      { name: 'Interest', value: totalInterestPaid, color: '#ef4444' }
    ];

    return {
      monthsToPayoff: month,
      totalPaid,
      totalInterest: totalInterestPaid,
      monthlyPayment: payoffMethod === 'fixed' ? monthlyPayment : schedule[0]?.payment || 0,
      schedule,
      pieData,
      principalPercent: (principal / totalPaid) * 100,
      interestPercent: (totalInterestPaid / totalPaid) * 100,
      insufficientPayment: false
    };
  }, [balance, interestRate, payoffMethod, fixedPayment, percentageMethod]);

  // Chart data for balance over time
  const chartData = useMemo(() => {
    if (results.schedule.length === 0) return [];
    
    // Sample every few months for performance
    const sampleRate = Math.max(1, Math.floor(results.schedule.length / 50));
    return results.schedule.filter((_, index) => index % sampleRate === 0 || index === results.schedule.length - 1);
  }, [results.schedule]);

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <CreditCard className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Credit Card Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Calculate how long it will take to pay off your credit card balance or determine the monthly payment 
          needed to become debt-free within a specific timeframe.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Tip:</strong> To evaluate and compare the repayment of multiple credit cards, use our 
            Credit Card Payoff Calculator for a comprehensive debt elimination strategy.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Credit Card Details</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your current balance and interest rate
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Credit Card Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance" className="text-xs sm:text-sm font-medium">
                Credit Card Balance
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="balance"
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="8000"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-xs sm:text-sm font-medium">
                Annual Interest Rate (APR)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="18"
                />
                <span className="text-xs sm:text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>

          {/* Payoff Method */}
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm font-medium">How do you plan to pay off?</Label>
            <RadioGroup value={payoffMethod} onValueChange={(value: 'fixed' | 'percentage') => setPayoffMethod(value)}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="fixed" className="text-xs sm:text-sm font-normal cursor-pointer">
                    Pay fixed amount per month
                  </Label>
                  {payoffMethod === 'fixed' && (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={fixedPayment}
                        onChange={(e) => setFixedPayment(e.target.value)}
                        className="pl-10 text-sm sm:text-base max-w-xs"
                        placeholder="200"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <RadioGroupItem value="percentage" id="percentage" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="percentage" className="text-xs sm:text-sm font-normal cursor-pointer">
                    Pay percentage of balance
                  </Label>
                  {payoffMethod === 'percentage' && (
                    <Select value={percentageMethod} onValueChange={(value: any) => setPercentageMethod(value)}>
                      <SelectTrigger className="text-xs sm:text-sm max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interest-plus-1">Interest + 1% of Balance</SelectItem>
                        <SelectItem value="interest-plus-2">Interest + 2% of Balance</SelectItem>
                        <SelectItem value="interest-plus-3">Interest + 3% of Balance</SelectItem>
                        <SelectItem value="interest-plus-4">Interest + 4% of Balance</SelectItem>
                        <SelectItem value="interest-plus-5">Interest + 5% of Balance</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results.insufficientPayment ? (
        <Card className="shadow-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardHeader className="border-b-2 border-red-200">
            <CardTitle className="text-xl sm:text-2xl text-red-900">⚠️ Payment Too Low</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-gray-700">
              Your monthly payment (${results.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) 
              is less than the monthly interest charge (${(parseFloat(balance) * parseFloat(interestRate) / 100 / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).
            </p>
            <p className="text-sm sm:text-base text-gray-700 mt-3">
              <strong>Your balance will never be paid off</strong> because the interest charges exceed your payment. 
              You need to increase your monthly payment to at least ${((parseFloat(balance) * parseFloat(interestRate) / 100 / 12) + 1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              to make progress on reducing the balance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="border-b-2 border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-900">Payoff Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Time to Pay Off</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700 break-words">
                    {results.monthsToPayoff} {results.monthsToPayoff === 1 ? 'month' : 'months'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ({Math.floor(results.monthsToPayoff / 12)} years, {results.monthsToPayoff % 12} months)
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-purple-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Amount Paid</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700 break-words">
                    ${results.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-red-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Total Interest Paid</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-700 break-words">
                    ${results.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {payoffMethod === 'percentage' && (
                <div className="mt-4 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>First Payment:</strong> ${results.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs ml-2">(Payment decreases as balance reduces)</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
                <PieChart className="w-6 h-6" />
                Total Payment Breakdown
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

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Principal</p>
                      <p className="text-xs text-gray-600">{results.principalPercent.toFixed(1)}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${parseFloat(balance || '0').toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Interest</p>
                      <p className="text-xs text-gray-600">{results.interestPercent.toFixed(1)}%</p>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 whitespace-nowrap">
                      ${results.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs font-medium text-yellow-900">
                      💡 You'll pay <strong>{results.interestPercent.toFixed(1)}%</strong> more than your original balance in interest charges!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Over Time Chart */}
          <Card className="shadow-xl border-2 border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
              <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
                <TrendingDown className="w-6 h-6" />
                Balance Reduction Over Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
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
                      dataKey="remainingBalance" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      name="Remaining Balance"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown Chart */}
          <Card className="shadow-xl border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
              <CardTitle className="flex items-center gap-2 text-indigo-900 text-lg sm:text-xl">
                <BarChart3 className="w-6 h-6" />
                Principal vs Interest in Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="principalPayment" stackId="a" fill="#3b82f6" name="Principal Payment" />
                    <Bar dataKey="interestPayment" stackId="a" fill="#ef4444" name="Interest Payment" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm text-gray-700">
                  <strong>Notice:</strong> Early payments have more interest (red) and less principal (blue). 
                  As you pay down the balance, more of each payment goes toward reducing the principal.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Schedule Table */}
          <Card className="shadow-xl border-2 border-gray-200">
            <CardHeader className="bg-gray-50 border-b-2">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                <Calendar className="w-6 h-6" />
                Payment Schedule
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Showing first 12 months (scroll table to see more)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-bold whitespace-nowrap">Month</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Payment</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Principal</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Interest</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.schedule.slice(0, 12).map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="p-2 sm:p-3 whitespace-nowrap">{row.month}</td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap font-medium">
                          ${row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap text-blue-700">
                          ${row.principalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap text-red-700">
                          ${row.interestPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap font-bold">
                          ${row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.schedule.length > 12 && (
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Showing 12 of {results.schedule.length} total payments
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content */}
      <div className="space-y-8">
        {/* Understanding Credit Cards */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Understanding Credit Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              A <strong>credit card</strong> is a small plastic (or metal) card issued by financial institutions that 
              allows you to make purchases or withdrawals on credit—essentially an unsecured loan from the issuer. When 
              you use a credit card, you're borrowing money with the promise to pay it back.
            </p>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Key Components:</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Credit Limit:</strong> Maximum amount you can borrow (typically $500-$50,000+)</li>
                  <li><strong>APR (Annual Percentage Rate):</strong> Interest rate charged on unpaid balances</li>
                  <li><strong>Minimum Payment:</strong> Smallest amount you must pay monthly (usually interest + 1-3% of balance)</li>
                  <li><strong>Grace Period:</strong> Time to pay in full without interest (typically 21-25 days)</li>
                  <li><strong>Statement Balance:</strong> Total amount owed at the end of your billing cycle</li>
                </ul>
              </div>
            </div>

            <p>
              At the end of each billing cycle (usually monthly), you receive a statement showing all transactions, 
              fees, and the total balance. You have three choices:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Pay in full:</strong> Avoid interest charges entirely (recommended!)</li>
              <li><strong>Pay the minimum:</strong> Keep the account in good standing but accrue interest on remaining balance</li>
              <li><strong>Pay something in between:</strong> Reduce balance faster than minimum but still pay some interest</li>
            </ul>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 mt-4">
              <p className="font-bold text-sm mb-2 text-red-900">⚠️ Critical Warning:</p>
              <p>
                Credit card interest rates typically range from <strong>15-25% APR</strong>, much higher than mortgages 
                (3-7%), car loans (4-10%), or student loans (3-8%). Carrying a balance month-to-month can lead to 
                paying far more than the original purchase price. A $1,000 laptop financed at 18% APR with minimum 
                payments could end up costing $1,500+ over several years!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Credit Card Networks & Issuers */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Credit Card Networks & Issuers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Understanding the distinction between card <strong>networks</strong> and <strong>issuers</strong> helps 
              clarify how credit cards work:
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">Card Networks (Payment Processors)</h3>
                <p>
                  Networks facilitate transactions between merchants and banks. They don't issue cards or extend credit 
                  directly to consumers.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li><strong>Visa:</strong> World's largest network, accepted in 200+ countries</li>
                  <li><strong>Mastercard:</strong> Second largest, similar global reach to Visa</li>
                  <li><strong>American Express:</strong> Both issuer and network (unique dual role)</li>
                  <li><strong>Discover:</strong> Both issuer and network (primarily U.S.-focused)</li>
                </ul>
                <p className="mt-2 text-xs bg-green-50 p-2 rounded">
                  <strong>Revenue:</strong> Networks charge merchants a small fee (typically 1.5-3%) for processing 
                  transactions, called interchange fees.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">Card Issuers (Banks & Financial Institutions)</h3>
                <p>
                  Issuers are the banks or financial institutions that actually extend credit to consumers and manage 
                  the accounts.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li><strong>Major banks:</strong> Chase, Bank of America, Citi, Capital One, Wells Fargo</li>
                  <li><strong>Credit unions:</strong> Navy Federal, PenFed, Alliant</li>
                  <li><strong>Retailers:</strong> Target, Amazon, Walmart (partnered with banks)</li>
                  <li><strong>Fintechs:</strong> Apple Card (Goldman Sachs), Credit Karma (MVB Bank)</li>
                </ul>
                <p className="mt-2 text-xs bg-blue-50 p-2 rounded">
                  <strong>Revenue:</strong> Issuers profit from interest on unpaid balances, annual fees, late fees, 
                  cash advance fees, foreign transaction fees, and a portion of interchange fees.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-bold text-sm mb-2 text-purple-900">Example Breakdown:</h4>
              <p className="text-xs">
                When you use a "Chase Sapphire Reserve Visa," <strong>Chase</strong> is the issuer (extends you credit, 
                manages your account, collects payments), and <strong>Visa</strong> is the network (processes the 
                transaction when you swipe at a merchant).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* APR Explained */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Understanding APR (Annual Percentage Rate)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              The <strong>Annual Percentage Rate (APR)</strong> is the yearly interest rate charged on unpaid credit 
              card balances. However, interest is calculated and charged <strong>monthly</strong>, not annually.
            </p>

            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="font-bold text-sm mb-2 text-orange-900">How Monthly Interest is Calculated:</h4>
              <div className="space-y-2 text-xs">
                <p><strong>Step 1:</strong> Convert APR to Daily Periodic Rate (DPR)</p>
                <p className="ml-4 font-mono bg-white p-2 rounded">DPR = APR ÷ 365</p>
                <p className="ml-4">Example: 18% APR ÷ 365 = 0.0493% per day</p>

                <p className="mt-3"><strong>Step 2:</strong> Calculate Average Daily Balance (ADB)</p>
                <p className="ml-4 font-mono bg-white p-2 rounded">ADB = Sum of daily balances ÷ Days in billing cycle</p>

                <p className="mt-3"><strong>Step 3:</strong> Calculate Monthly Interest</p>
                <p className="ml-4 font-mono bg-white p-2 rounded">Interest = DPR × ADB × Days in billing cycle</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-blue-900">Real-World Example:</h4>
              <p className="text-xs">
                <strong>Scenario:</strong> You have a $5,000 balance on a card with 18% APR for a 30-day billing cycle.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-xs mt-2">
                <li>DPR = 18% ÷ 365 = 0.0493%</li>
                <li>Average Daily Balance = $5,000 (assuming constant balance)</li>
                <li>Monthly Interest = 0.000493 × $5,000 × 30 = <strong>$73.95</strong></li>
              </ul>
              <p className="text-xs mt-2">
                That's nearly $900 in interest per year if you maintain that $5,000 balance!
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <h4 className="font-bold text-base">Types of APRs:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <p className="font-bold text-sm">Purchase APR</p>
                  <p className="text-xs mt-1">Standard rate for regular purchases (15-25% typical)</p>
                </div>

                <div className="bg-red-50 p-3 rounded border-l-4 border-red-500">
                  <p className="font-bold text-sm">Cash Advance APR</p>
                  <p className="text-xs mt-1">Higher rate for cash withdrawals (20-30% typical, no grace period!)</p>
                </div>

                <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-500">
                  <p className="font-bold text-sm">Balance Transfer APR</p>
                  <p className="text-xs mt-1">Rate for transferred balances (often 0% intro, then 15-25%)</p>
                </div>

                <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                  <p className="font-bold text-sm">Penalty APR</p>
                  <p className="text-xs mt-1">Punitive rate for late payments (up to 29.99%)</p>
                </div>
              </div>
            </div>

            <div className="border-l-4 border-indigo-500 pl-4 mt-4">
              <h4 className="font-bold text-sm mb-2 text-indigo-900">Variable vs Fixed APR:</h4>
              <p>
                <strong>Variable APR:</strong> Most common. Rate fluctuates with the Prime Rate (set by Federal Reserve). 
                When the Fed raises rates, your credit card rate increases automatically.
              </p>
              <p className="mt-2">
                <strong>Fixed APR:</strong> Rare nowadays. Rate stays constant unless you miss payments or issuer gives 
                45 days notice of change.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mt-4">
              <h4 className="font-bold text-sm mb-2 text-blue-900">Zero or Introductory APR:</h4>
              <p>
                Some cards offer <strong>0% APR</strong> for an introductory period (typically 6-21 months) on purchases 
                and/or balance transfers. This can be valuable for:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>Large purchases you need to pay off over time</li>
                <li>Consolidating high-interest debt from other cards</li>
                <li>Avoiding interest during financial hardship</li>
              </ul>
              <p className="mt-2 text-xs font-bold text-red-700">
                ⚠️ Warning: After the intro period expires, any remaining balance is charged the regular APR (often 18-25%). 
                Make sure you can pay off the balance before the promotional period ends!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cash Advances */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-red-900">Cash Advances: Why to Avoid Them</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              A <strong>cash advance</strong> allows you to withdraw cash using your credit card from ATMs or banks. 
              While convenient in emergencies, cash advances are extremely expensive and should be avoided whenever possible.
            </p>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
              <h4 className="font-bold text-sm mb-2 text-red-900">Why Cash Advances Are Costly:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Higher APR:</strong> Often 5-10% higher than purchase APR (25-30% typical)</li>
                <li><strong>No grace period:</strong> Interest starts accruing immediately from day one</li>
                <li><strong>Cash advance fee:</strong> Typically 3-5% of the amount withdrawn (minimum $5-10)</li>
                <li><strong>ATM fees:</strong> The ATM operator charges an additional fee ($2-5)</li>
                <li><strong>No rewards:</strong> Cash advances don't earn points, miles, or cashback</li>
                <li><strong>Payment priority:</strong> Payments go to lower-APR balances first, leaving cash advances for last</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500 mt-4">
              <h4 className="font-bold text-sm mb-2 text-yellow-900">Real Cost Example:</h4>
              <p className="text-xs">You need $500 cash urgently and use your credit card:</p>
              <ul className="list-disc list-inside ml-4 space-y-1 text-xs mt-2">
                <li>Cash advance fee: $500 × 5% = <strong>$25</strong></li>
                <li>ATM fee: <strong>$3</strong></li>
                <li>Interest for one month (25% APR): $500 × (0.25/12) = <strong>$10.42</strong></li>
                <li><strong>Total cost for one month: $38.42</strong> (7.7% of the withdrawal!)</li>
              </ul>
              <p className="text-xs mt-2 font-bold">
                If you can't pay it back for 6 months, you'll pay over $85 in interest and fees on that $500!
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 mt-4">
              <h4 className="font-bold text-sm mb-2 text-blue-900">Better Alternatives:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Debit card:</strong> Withdraw from your checking account (small ATM fee only)</li>
                <li><strong>Personal loan:</strong> Lower interest rates (6-15%) and fixed payments</li>
                <li><strong>Borrow from family/friends:</strong> Interest-free or low-cost</li>
                <li><strong>Emergency fund:</strong> Build one to avoid future cash crunches</li>
                <li><strong>Paycheck advance apps:</strong> Earnin, Dave (minimal fees compared to cash advances)</li>
              </ul>
            </div>

            <p className="font-bold text-sm text-red-700 mt-4">
              Reserve cash advances for true emergencies only, and pay them off as quickly as possible!
            </p>
          </CardContent>
        </Card>

        {/* Balance Transfers */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Balance Transfers: Strategic Debt Management</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              A <strong>balance transfer</strong> moves debt from one or more high-interest credit cards to a card with 
              a lower rate—ideally one offering 0% APR for an introductory period. This can save significant money on 
              interest and help you pay down debt faster.
            </p>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h4 className="font-bold text-sm mb-2 text-green-900">✓ When Balance Transfers Make Sense:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You have high-interest credit card debt you can't pay off immediately</li>
                <li>You can qualify for a 0% or low-interest balance transfer offer</li>
                <li>You have a realistic plan to pay off the balance during the promotional period</li>
                <li>The transfer fee (typically 3-5%) is less than the interest you'll save</li>
                <li>You're disciplined enough not to rack up new debt on the old cards</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-blue-900">Savings Example:</h4>
              <div className="text-xs space-y-2">
                <p><strong>Current Situation:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>$10,000 balance at 22% APR</li>
                  <li>Paying $300/month</li>
                  <li>Result: 47 months to pay off, $3,823 in interest</li>
                </ul>
                
                <p className="mt-3"><strong>After Balance Transfer:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  <li>$10,000 transferred to 0% APR card (18-month intro)</li>
                  <li>3% transfer fee = $300</li>
                  <li>Paying $300/month</li>
                  <li>Result: Pay off in 34 months, $300 in fees + $900 interest (after promo) = $1,200 total</li>
                </ul>
                
                <p className="font-bold text-green-700 mt-3">Savings: $2,623!</p>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-red-900">⚠️ Balance Transfer Pitfalls:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Transfer fees:</strong> 3-5% of transferred amount (can negate savings on small balances)</li>
                <li><strong>Promo period ends:</strong> Remaining balance jumps to regular APR (15-25%)</li>
                <li><strong>New spending temptation:</strong> Old cards now have available credit—resist using them!</li>
                <li><strong>Missed payments:</strong> One late payment can void the 0% rate and trigger penalty APR</li>
                <li><strong>No rewards:</strong> Balance transfers don't earn cashback or points</li>
                <li><strong>Hard credit inquiry:</strong> Applying for new card temporarily lowers credit score</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 mt-4">
              <h4 className="font-bold text-sm mb-2 text-purple-900">Best Practices:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Calculate whether savings exceed transfer fees</li>
                <li>Create a payment plan to eliminate debt before promo expires</li>
                <li>Set up automatic payments to avoid missing due dates</li>
                <li>Close or freeze old credit cards to avoid new charges</li>
                <li>Don't make purchases on the balance transfer card (new purchases may not have 0% APR)</li>
                <li>Consider consolidating multiple cards into one transfer</li>
              </ol>
            </div>

            <p className="text-xs italic mt-4 text-gray-600">
              Note: Balance transfers work best as part of a comprehensive debt elimination strategy, not as a way to 
              perpetually shuffle debt between cards.
            </p>
          </CardContent>
        </Card>

        {/* Advantages of Credit Cards */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Advantages of Using Credit Cards Responsibly</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              When used responsibly (paying in full each month), credit cards offer significant benefits over cash and 
              debit cards:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Build Credit History</h4>
                <p>
                  Responsible use improves your credit score, leading to better rates on mortgages, auto loans, and 
                  future credit cards. Good credit can save tens of thousands over a lifetime.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Rewards & Cashback</h4>
                <p>
                  Earn 1-5% back on purchases. Using a 2% cashback card for $3,000/month expenses saves $720/year—
                  essentially a discount on everything you buy.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Fraud Protection</h4>
                <p>
                  Zero liability for fraudulent charges. With debit cards, stolen money comes directly from your bank 
                  account and may take weeks to recover. Credit cards offer instant protection.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Purchase Protection</h4>
                <p>
                  Extended warranties, price protection (refunds if price drops), damage/theft coverage, and return 
                  protection for items merchants won't take back.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Dispute Resolution</h4>
                <p>
                  Easy to dispute charges for defective products, billing errors, or merchant fraud. Credit card companies 
                  handle disputes on your behalf under the Fair Credit Billing Act.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Travel Benefits</h4>
                <p>
                  Travel insurance, rental car coverage, trip cancellation protection, lost luggage reimbursement, 
                  no foreign transaction fees (select cards), and airport lounge access.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Emergency Liquidity</h4>
                <p>
                  Access to funds during emergencies without depleting savings. Pay it back over time if needed, though 
                  interest-free is always preferable.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Grace Period</h4>
                <p>
                  21-25 days to pay without interest. Essentially an interest-free short-term loan if you pay the 
                  statement balance in full.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Safety & Convenience</h4>
                <p>
                  Safer than carrying cash (can't be stolen permanently), easier than checks, widely accepted worldwide, 
                  and transactions are tracked for budgeting.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-sm mb-2 text-green-900">✓ Cell Phone Protection</h4>
                <p>
                  Many cards offer cell phone insurance if you pay your monthly bill with that card (typically $600-800 
                  coverage with small deductible).
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-4">
              <p className="font-bold text-sm mb-2 text-blue-900">💡 Maximizing Benefits:</p>
              <p>
                To enjoy these advantages without downsides, follow the golden rule: <strong>Pay your statement balance 
                in full every month.</strong> This avoids all interest charges while reaping all the benefits. Treat your 
                credit card like a debit card—only spend what you can immediately afford.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disadvantages & Risks */}
        <Card className="shadow-lg border-2 border-red-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-red-900">Disadvantages & Risks of Credit Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Despite their benefits, credit cards pose significant risks when misused. Understanding these dangers is 
              crucial to avoiding debt traps:
            </p>

            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ Impulsive Spending</h4>
                <p>
                  Credit cards psychologically disconnect spending from payment, making it easier to overspend. Studies 
                  show people spend 12-18% more when using credit cards versus cash because it doesn't "feel" like real 
                  money leaving your possession.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ High Interest Rates</h4>
                <p>
                  Average credit card APR is around 20%, with some reaching 30%. This is 3-10x higher than most other 
                  loan types. A $5,000 balance at 20% APR with minimum payments takes 15+ years to pay off and costs 
                  over $6,000 in interest!
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ Minimum Payment Trap</h4>
                <p>
                  Paying only the minimum feels manageable but keeps you in debt for decades. Issuers design minimum 
                  payments (usually 1-3% of balance) to maximize their interest income while keeping you barely afloat.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ Credit Score Damage</h4>
                <p>
                  Late or missed payments severely damage credit scores (impact lasts 7 years). High balances relative 
                  to limits (high utilization) also harm scores. Bad credit leads to loan denials or higher interest rates.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ Fees Upon Fees</h4>
                <p>
                  Late fees ($29-40), over-limit fees ($25-35), annual fees ($0-550+), balance transfer fees (3-5%), 
                  cash advance fees (3-5%), foreign transaction fees (1-3%), and returned payment fees ($25-40) add up quickly.
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <h4 className="font-bold text-sm mb-2 text-red-900">✗ Debt Spiral</h4>
                <p>
                  Once behind, it's hard to catch up. You charge necessities, pay minimums, incur interest, repeat. The 
                  balance grows faster than you can pay it down, creating a vicious cycle requiring dramatic lifestyle 
                  changes or debt consolidation to escape.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-yellow-900">⚠️ Who Should Avoid Credit Cards:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>People with history of overspending or impulse buying</li>
                <li>Those already struggling with debt</li>
                <li>Anyone who can't commit to paying in full monthly</li>
                <li>Individuals with no emergency fund (credit shouldn't replace savings)</li>
                <li>Young adults without financial literacy or budgeting skills</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500 mt-4">
              <h4 className="font-bold text-sm mb-2 text-orange-900">If You're Already in Debt:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>Stop using the cards immediately</strong> (freeze them, don't close—hurts credit)</li>
                <li><strong>List all debts</strong> with balances, APRs, and minimum payments</li>
                <li><strong>Choose a payoff method:</strong> Avalanche (highest APR first) or Snowball (smallest balance first)</li>
                <li><strong>Pay more than minimums</strong> on at least one card while paying minimums on others</li>
                <li><strong>Consider balance transfers</strong> to 0% APR cards if you qualify</li>
                <li><strong>Explore debt consolidation</strong> loans for lower rates and single payment</li>
                <li><strong>Seek credit counseling</strong> (non-profit agencies like NFCC) if overwhelmed</li>
                <li><strong>Avoid payday loans</strong> or high-fee debt solutions—they make things worse</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Types of Credit Cards */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Types of Credit Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Different credit cards serve different purposes. Understanding each type helps you choose cards that align 
              with your financial goals:
            </p>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-blue-900">Cashback Cards</h3>
                <p>
                  Earn cash back on purchases, typically 1-2% on everything, or up to 5% on specific categories (gas, 
                  groceries, dining, etc.) that may rotate quarterly.
                </p>
                <p className="mt-2 text-xs bg-blue-50 p-2 rounded">
                  <strong>Best for:</strong> People who want simple, automatic rewards and pay in full monthly. Great 
                  for everyday spending with no mental effort to maximize value.
                </p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-green-900">Rewards Cards (Travel, Points)</h3>
                <p>
                  Earn airline miles, hotel points, or flexible points redeemable for travel, merchandise, or gift cards. 
                  Often provide 1-5x points per dollar, with bonuses in specific categories.
                </p>
                <p className="mt-2 text-xs bg-green-50 p-2 rounded">
                  <strong>Best for:</strong> Frequent travelers who can maximize redemption value (often 1.5-2.5 cents 
                  per point for travel). Requires more strategy than cashback but higher potential value.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-purple-900">Balance Transfer Cards</h3>
                <p>
                  Offer 0% introductory APR (typically 12-21 months) specifically for transferred balances. Designed 
                  to help pay down high-interest debt without accruing additional interest.
                </p>
                <p className="mt-2 text-xs bg-purple-50 p-2 rounded">
                  <strong>Best for:</strong> People with existing credit card debt who need time to pay it off. Must 
                  have discipline to avoid new charges and pay off before promo expires.
                </p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-orange-900">Secured Cards</h3>
                <p>
                  Require a cash deposit (typically $200-500) that becomes your credit limit. Designed for people with 
                  no credit history or bad credit looking to build/rebuild.
                </p>
                <p className="mt-2 text-xs bg-orange-50 p-2 rounded">
                  <strong>Best for:</strong> Credit-building. After 6-12 months of responsible use, you can often 
                  graduate to an unsecured card and get your deposit back.
                </p>
              </div>

              <div className="border-l-4 border-pink-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-pink-900">Store Credit Cards</h3>
                <p>
                  Issued by retailers, offer discounts and perks at specific stores (often 5-20% off). Usually have 
                  higher APRs (25-30%) and limited acceptance.
                </p>
                <p className="mt-2 text-xs bg-pink-50 p-2 rounded">
                  <strong>Best for:</strong> Frequent shoppers at specific retailers who pay in full monthly. Not 
                  recommended as your only card due to limited use.
                </p>
              </div>

              <div className="border-l-4 border-cyan-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-cyan-900">Business Cards</h3>
                <p>
                  Designed for business expenses with features like employee cards, expense tracking, higher limits, 
                  and business-specific rewards (office supplies, shipping, advertising).
                </p>
                <p className="mt-2 text-xs bg-cyan-50 p-2 rounded">
                  <strong>Best for:</strong> Business owners and freelancers who want to separate personal and business 
                  expenses for tax purposes and better accounting.
                </p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-indigo-900">Charge Cards</h3>
                <p>
                  No preset spending limit, but balance must be paid in full each month. Can't carry a balance, so no 
                  interest charges. Often have high annual fees ($500+) with premium benefits.
                </p>
                <p className="mt-2 text-xs bg-indigo-50 p-2 rounded">
                  <strong>Best for:</strong> High spenders with excellent payment discipline. Primarily American Express 
                  (Platinum, Centurion/Black Card).
                </p>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-bold text-base sm:text-lg mb-2 text-red-900">Prepaid Cards</h3>
                <p>
                  Preloaded with money, function like debit cards. Not true credit cards—don't build credit, no borrowing. 
                  Can be reloadable or single-use (gift cards).
                </p>
                <p className="mt-2 text-xs bg-red-50 p-2 rounded">
                  <strong>Best for:</strong> Gifts, budgeting tools for teens, people who can't qualify for credit cards. 
                  Safer than cash but offers no credit-building benefits.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mt-6">
              <h4 className="font-bold text-sm mb-2 text-blue-900">💡 Choosing the Right Card(s):</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Start with one card that matches your spending habits (cashback for simplicity, travel if you fly often)</li>
                <li>Consider a no-annual-fee card for your first card to minimize costs while learning</li>
                <li>Once responsible, add specialized cards for category bonuses (gas, groceries, dining)</li>
                <li>Avoid opening multiple cards quickly—space applications 3-6 months apart to protect credit score</li>
                <li>Don't get cards just for sign-up bonuses unless you can meet spending requirements without overspending</li>
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
              This calculator helps you understand the true cost of credit card debt and how long it will take to pay 
              off your balance with different payment strategies.
            </p>

            <div className="space-y-6">
              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 1: Enter Your Credit Card Balance</h4>
                <p>
                  Input your current outstanding balance. This should match the "Current Balance" shown on your most 
                  recent credit card statement. If you have multiple cards, start by calculating each one individually.
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 2: Enter Your Interest Rate (APR)</h4>
                <p>
                  Find this on your statement, usually labeled "Annual Percentage Rate" or "Purchase APR." If you have 
                  different rates for purchases, cash advances, and balance transfers, use the rate that applies to most 
                  of your balance (typically the purchase APR).
                </p>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 3: Choose Your Payment Method</h4>
                <p><strong>Option A: Fixed Payment</strong></p>
                <p className="text-xs mt-1">
                  Select this if you plan to pay a specific dollar amount each month (e.g., $200). This is the most 
                  common approach and provides predictable monthly budgeting.
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs mt-2">
                  <li>Enter an amount higher than your minimum payment for faster payoff</li>
                  <li>The higher your payment, the less interest you'll pay overall</li>
                  <li>Most efficient: pay as much as your budget allows</li>
                </ul>
                
                <p className="mt-3"><strong>Option B: Percentage of Balance</strong></p>
                <p className="text-xs mt-1">
                  Select this to pay interest plus a percentage of your remaining balance (1-5%). This method starts 
                  with higher payments that decrease as your balance drops—similar to how minimum payments work but more 
                  aggressive.
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs mt-2">
                  <li><strong>Interest + 1%:</strong> Similar to minimum payment (slow, expensive)</li>
                  <li><strong>Interest + 2%:</strong> Moderate approach, decent balance between speed and affordability</li>
                  <li><strong>Interest + 3-5%:</strong> Aggressive payoff, saves significant interest</li>
                </ul>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                <h4 className="font-bold text-sm mb-2">Step 4: Analyze Your Results</h4>
                <p>The calculator shows:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Time to pay off:</strong> How many months until you're debt-free</li>
                  <li><strong>Total amount paid:</strong> Original balance + all interest charges</li>
                  <li><strong>Total interest:</strong> Extra cost beyond your purchases</li>
                  <li><strong>Visual breakdown:</strong> Pie chart showing principal vs interest</li>
                  <li><strong>Payment schedule:</strong> Month-by-month breakdown of how payments are applied</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-yellow-900">⚠️ Important Assumptions:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>No new charges:</strong> Calculator assumes you stop using the card during payoff</li>
                <li><strong>Fixed APR:</strong> Assumes interest rate remains constant (variable APRs can change)</li>
                <li><strong>No fees:</strong> Doesn't include late fees, annual fees, or other charges</li>
                <li><strong>On-time payments:</strong> Assumes you never miss a payment (which would trigger penalty APR)</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 mt-4">
              <h4 className="font-bold text-sm mb-2 text-purple-900">💡 Pro Tips:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Compare different payment amounts to see how much faster you can pay off debt</li>
                <li>Even $25-50 extra per month makes a huge difference in total interest</li>
                <li>Focus extra payments on your highest APR card first (avalanche method)</li>
                <li>Use windfalls (tax refunds, bonuses) to make lump-sum payments</li>
                <li>Set up automatic payments to avoid late fees and maintain consistency</li>
                <li>Track your progress monthly—watching the balance drop is motivating!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Related Resources */}
        <Card className="shadow-lg border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
            <CardTitle className="text-lg sm:text-xl text-gray-900">Related Calculators & Resources</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
            <p>
              Explore these related tools for comprehensive debt management and financial planning:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Credit Card Payoff Calculator</h4>
                <p>
                  Compare and optimize repayment strategies for multiple credit cards simultaneously. Determine whether 
                  avalanche (highest rate first) or snowball (smallest balance first) method works best for you.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Debt Consolidation Calculator</h4>
                <p>
                  Evaluate whether consolidating multiple debts into a single loan saves money. Compare current payments 
                  and interest against consolidation loan options.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Personal Loan Calculator</h4>
                <p>
                  Calculate payments for personal loans that might offer lower rates than credit cards (typically 6-15% 
                  vs 18-25%). Good alternative for debt consolidation.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Interest Rate Calculator</h4>
                <p>
                  Understand how different APRs affect total cost and payoff time. Visualize the impact of rate changes 
                  or balance transfer opportunities.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Budget Calculator</h4>
                <p>
                  Create a comprehensive budget to identify how much you can realistically put toward credit card debt 
                  each month while covering necessities.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-bold text-sm mb-2">Savings Calculator</h4>
                <p>
                  Build an emergency fund to prevent future credit card debt. Calculate how regular deposits grow to 
                  create a financial safety net.
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 mt-4">
              <h4 className="font-bold text-sm mb-2 text-green-900">📚 Additional Resources:</h4>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>National Foundation for Credit Counseling (NFCC.org) - Free nonprofit credit counseling</li>
                <li>Consumer Financial Protection Bureau (ConsumerFinance.gov) - Credit card rights and regulations</li>
                <li>AnnualCreditReport.com - Free annual credit reports from all three bureaus</li>
                <li>MyFICO.com - Credit score education and monitoring</li>
                <li>Federal Trade Commission (FTC.gov) - Consumer protection and fraud prevention</li>
              </ul>
            </div>

            <p className="text-center font-medium text-gray-800 pt-4 border-t-2">
              <strong>Remember:</strong> This calculator provides estimates based on assumptions of no new charges and 
              consistent payments. Actual results may vary based on your specific card terms, payment timing, and usage. 
              Always refer to your credit card statement and issuer for exact calculations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreditCardCalculatorComponent;
