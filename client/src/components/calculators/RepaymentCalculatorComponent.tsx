import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Calendar, Percent, TrendingDown, FileText } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444'];

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function RepaymentCalculatorComponent() {
  const [loanBalance, setLoanBalance] = useState('10000');
  const [interestRate, setInterestRate] = useState('10');
  const [compoundFrequency, setCompoundFrequency] = useState('monthly');
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');
  const [calculationMode, setCalculationMode] = useState<'fixedTerm' | 'fixedPayment'>('fixedTerm');
  const [termYears, setTermYears] = useState('5');
  const [termMonths, setTermMonths] = useState('0');
  const [fixedPayment, setFixedPayment] = useState('');

  const results = useMemo(() => {
    const balance = parseFloat(loanBalance);
    const rate = parseFloat(interestRate);
    
    if (!balance || balance <= 0 || !rate || rate < 0) {
      return {
        isValid: false,
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        totalMonths: 0,
        principal: 0,
        pieData: [],
        amortizationSchedule: [],
        balanceOverTime: []
      };
    }

    const principal = balance;
    let monthlyRate: number;
    
    // Convert annual rate to monthly rate based on compound frequency
    if (compoundFrequency === 'monthly') {
      monthlyRate = rate / 100 / 12;
    } else if (compoundFrequency === 'daily') {
      // Daily compounding: (1 + r/365)^(365/12) - 1
      const dailyRate = rate / 100 / 365;
      monthlyRate = Math.pow(1 + dailyRate, 365/12) - 1;
    } else { // annually
      // Annual compounding: (1 + r)^(1/12) - 1
      const annualRate = rate / 100;
      monthlyRate = Math.pow(1 + annualRate, 1/12) - 1;
    }

    let monthlyPayment: number;
    let totalMonths: number;
    const amortizationSchedule: AmortizationRow[] = [];

    if (calculationMode === 'fixedTerm') {
      // Fixed term: Calculate payment amount
      const years = parseInt(termYears) || 0;
      const months = parseInt(termMonths) || 0;
      totalMonths = years * 12 + months;

      if (totalMonths <= 0) {
        return {
          isValid: false,
          monthlyPayment: 0,
          totalPayments: 0,
          totalInterest: 0,
          totalMonths: 0,
          principal: 0,
          pieData: [],
          amortizationSchedule: [],
          balanceOverTime: []
        };
      }

      // Calculate monthly payment using amortization formula
      if (monthlyRate === 0) {
        monthlyPayment = principal / totalMonths;
      } else {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      }
    } else {
      // Fixed payment: Calculate loan term
      const payment = parseFloat(fixedPayment);
      
      if (!payment || payment <= 0) {
        return {
          isValid: false,
          monthlyPayment: 0,
          totalPayments: 0,
          totalInterest: 0,
          totalMonths: 0,
          principal: 0,
          pieData: [],
          amortizationSchedule: [],
          balanceOverTime: []
        };
      }

      monthlyPayment = payment;

      // Check if payment covers interest
      const firstMonthInterest = principal * monthlyRate;
      if (monthlyPayment <= firstMonthInterest) {
        return {
          isValid: false,
          monthlyPayment: 0,
          totalPayments: 0,
          totalInterest: 0,
          totalMonths: 0,
          principal: 0,
          pieData: [],
          amortizationSchedule: [],
          balanceOverTime: [],
          insufficientPayment: true,
          minimumPayment: firstMonthInterest
        };
      }

      // Calculate number of months needed
      if (monthlyRate === 0) {
        totalMonths = Math.ceil(principal / monthlyPayment);
      } else {
        totalMonths = Math.ceil(Math.log(monthlyPayment / (monthlyPayment - principal * monthlyRate)) / Math.log(1 + monthlyRate));
      }
    }

    // Generate amortization schedule
    let remainingBalance = principal;
    let totalInterestPaid = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = remainingBalance * monthlyRate;
      let principalPayment = monthlyPayment - interestPayment;
      
      // Last payment adjustment
      if (remainingBalance < principalPayment) {
        principalPayment = remainingBalance;
        monthlyPayment = principalPayment + interestPayment;
      }

      remainingBalance -= principalPayment;
      totalInterestPaid += interestPayment;

      amortizationSchedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, remainingBalance)
      });

      if (remainingBalance <= 0.01) break;
    }

    const totalPayments = monthlyPayment * totalMonths;
    const totalInterest = totalInterestPaid;

    const pieData = [
      { name: 'Principal', value: parseFloat(principal.toFixed(2)) },
      { name: 'Interest', value: parseFloat(totalInterest.toFixed(2)) }
    ];

    // Prepare balance over time data (sample every month or subset for large loans)
    const sampleRate = Math.max(1, Math.floor(totalMonths / 50));
    const balanceOverTime = amortizationSchedule
      .filter((_, index) => index % sampleRate === 0 || index === amortizationSchedule.length - 1)
      .map(row => ({
        month: row.month,
        balance: parseFloat(row.balance.toFixed(2)),
        principal: parseFloat((principal - row.balance).toFixed(2)),
        interest: parseFloat(amortizationSchedule.slice(0, row.month).reduce((sum, r) => sum + r.interest, 0).toFixed(2))
      }));

    return {
      isValid: true,
      monthlyPayment,
      totalPayments,
      totalInterest,
      totalMonths,
      principal,
      pieData,
      amortizationSchedule,
      balanceOverTime
    };
  }, [loanBalance, interestRate, compoundFrequency, paymentFrequency, calculationMode, termYears, termMonths, fixedPayment]);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Input Section */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Loan Details</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter your loan information to calculate repayment schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balance" className="text-xs sm:text-sm font-medium mb-2 block">
                Loan Balance
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="balance"
                  type="number"
                  value={loanBalance}
                  onChange={(e) => setLoanBalance(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rate" className="text-xs sm:text-sm font-medium mb-2 block">
                Interest Rate
              </Label>
              <div className="relative">
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="pr-8 text-sm sm:text-base"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="compound" className="text-xs sm:text-sm font-medium mb-2 block">
                Compound Frequency
              </Label>
              <Select value={compoundFrequency} onValueChange={setCompoundFrequency}>
                <SelectTrigger id="compound" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly (APR)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentFreq" className="text-xs sm:text-sm font-medium mb-2 block">
                Payment Frequency
              </Label>
              <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                <SelectTrigger id="paymentFreq" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Every Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Mode */}
      <Card className="shadow-xl border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
          <CardTitle className="text-xl sm:text-2xl text-purple-900">Repayment Schedule</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose how you want to calculate your repayment
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <RadioGroup value={calculationMode} onValueChange={(value: any) => setCalculationMode(value)} className="space-y-4">
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="fixedTerm" id="fixedTerm" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fixedTerm" className="text-sm font-semibold cursor-pointer mb-2 block">
                    Fixed Loan Term
                  </Label>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter a fixed loan term and calculate the required monthly payment
                  </p>
                  {calculationMode === 'fixedTerm' && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label htmlFor="years" className="text-xs mb-1.5 block text-gray-600">
                          Years
                        </Label>
                        <Input
                          id="years"
                          type="number"
                          min="0"
                          value={termYears}
                          onChange={(e) => setTermYears(e.target.value)}
                          className="text-sm"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="months" className="text-xs mb-1.5 block text-gray-600">
                          Months
                        </Label>
                        <Input
                          id="months"
                          type="number"
                          min="0"
                          max="11"
                          value={termMonths}
                          onChange={(e) => setTermMonths(e.target.value)}
                          className="text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="fixedPayment" id="fixedPayment" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="fixedPayment" className="text-sm font-semibold cursor-pointer mb-2 block">
                    Fixed Installments
                  </Label>
                  <p className="text-xs text-gray-600 mb-3">
                    Enter a fixed payment amount and calculate how long it will take to pay off
                  </p>
                  {calculationMode === 'fixedPayment' && (
                    <div className="mt-3">
                      <Label htmlFor="payment" className="text-xs mb-1.5 block text-gray-600">
                        Monthly Payment Amount
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="payment"
                          type="number"
                          value={fixedPayment}
                          onChange={(e) => setFixedPayment(e.target.value)}
                          className="pl-10 text-sm"
                          placeholder="500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Results */}
      {results.isValid ? (
        <>
          {/* Summary Card */}
          <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="border-b-2 border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-900">Repayment Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-green-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                      {calculationMode === 'fixedTerm' ? 'Monthly Payment' : 'Payoff Time'}
                    </p>
                  </div>
                  {calculationMode === 'fixedTerm' ? (
                    <>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">
                        ${results.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        per month
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">
                        {Math.floor(results.totalMonths / 12)} years {results.totalMonths % 12} months
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        ({results.totalMonths} months)
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Payments</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                    ${results.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {results.totalMonths} payments
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Interest</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-red-900">
                    ${results.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {((results.totalInterest / results.principal) * 100).toFixed(1)}% of principal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card className="shadow-xl border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                <CardTitle className="text-lg sm:text-xl text-purple-900">
                  Principal vs Interest
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={results.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {results.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                      <Legend 
                        wrapperStyle={{ fontSize: '14px' }}
                        iconSize={12}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Principal</p>
                    <p className="text-lg font-bold text-blue-900">
                      {((results.principal / results.totalPayments) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Interest</p>
                    <p className="text-lg font-bold text-red-900">
                      {((results.totalInterest / results.totalPayments) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balance Over Time */}
            <Card className="shadow-xl border-2 border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
                <CardTitle className="text-lg sm:text-xl text-indigo-900">
                  Balance Over Time
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={results.balanceOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stackId="1"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        name="Remaining Balance"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="principal" 
                        stackId="2"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        name="Principal Paid"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cumulative Interest */}
          <Card className="shadow-xl border-2 border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
              <CardTitle className="text-lg sm:text-xl text-teal-900">
                Cumulative Interest Paid
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Track how interest accumulates over the loan term
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.balanceOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      label={{ value: 'Interest ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd', fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="interest" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={false}
                      name="Cumulative Interest"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Amortization Table */}
          <Card className="shadow-xl border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
              <CardTitle className="text-lg sm:text-xl text-orange-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Amortization Schedule
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Detailed monthly breakdown of payments (showing first 12 months)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-bold">Month</th>
                      <th className="text-right p-2 sm:p-3 font-bold">Payment</th>
                      <th className="text-right p-2 sm:p-3 font-bold">Principal</th>
                      <th className="text-right p-2 sm:p-3 font-bold">Interest</th>
                      <th className="text-right p-2 sm:p-3 font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.amortizationSchedule.slice(0, 12).map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="p-2 sm:p-3">{row.month}</td>
                        <td className="p-2 sm:p-3 text-right font-semibold">
                          ${row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-blue-600">
                          ${row.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 sm:p-3 text-right text-red-600">
                          ${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 sm:p-3 text-right font-semibold">
                          ${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {results.amortizationSchedule.length > 12 && (
                <p className="text-xs text-gray-600 mt-3 text-center">
                  Showing first 12 months of {results.totalMonths} month schedule
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : results.insufficientPayment ? (
        <Card className="shadow-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardHeader className="border-b-2 border-red-200">
            <CardTitle className="text-xl sm:text-2xl text-red-900">⚠️ Insufficient Payment</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-gray-700">
              Your monthly payment (${parseFloat(fixedPayment).toLocaleString(undefined, { minimumFractionDigits: 2 })}) 
              is less than the monthly interest charge (${results.minimumPayment?.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
            </p>
            <p className="text-sm sm:text-base text-gray-700 mt-3">
              <strong>You must increase your monthly payment to at least ${results.minimumPayment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> 
              {' '}to cover the interest and begin reducing the principal balance. Without this, your debt will continue to grow.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Educational Content */}
      <div className="space-y-6 mt-8">
        {/* Understanding Loan Repayment */}
        <Card className="shadow-xl border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="text-xl sm:text-2xl text-blue-900">
              📚 Understanding Loan Repayment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What is a Repayment Calculator?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                A repayment calculator helps you understand the financial implications of borrowing money. Whether you're 
                taking out a mortgage, auto loan, student loan, or personal loan, this calculator shows you exactly how 
                much you'll pay over time, how much goes toward interest versus principal, and how different payment 
                strategies affect your total cost.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Key Insight</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                The total interest you pay on a loan can sometimes equal or exceed the original principal amount, 
                especially for long-term loans. Understanding your repayment schedule helps you make informed decisions 
                about borrowing and can save you thousands of dollars.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How Loan Repayment Works</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Most loans use <strong>amortization</strong>, meaning your monthly payment stays the same throughout 
                the loan term, but the split between principal and interest changes over time:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-gray-700 ml-4">
                <li><strong>Early payments:</strong> Most of your payment goes toward interest, with only a small amount reducing the principal</li>
                <li><strong>Mid-term payments:</strong> The split becomes more balanced as your principal decreases</li>
                <li><strong>Late payments:</strong> Most of your payment goes toward principal since less interest accrues on the smaller balance</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: $10,000 Loan at 10% APR</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Scenario:</strong> 5-year loan with monthly payments</p>
                <p><strong>Monthly Payment:</strong> $212.47</p>
                <p><strong>First Payment Split:</strong> $129.14 principal + $83.33 interest</p>
                <p><strong>Final Payment Split:</strong> $210.71 principal + $1.76 interest</p>
                <p><strong>Total Interest Paid:</strong> $2,748.23 (27.5% of loan amount)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fixed Term vs Fixed Payment */}
        <Card className="shadow-xl border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <CardTitle className="text-xl sm:text-2xl text-purple-900">
              🎯 Fixed Term vs Fixed Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Choosing Your Calculation Method</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                This calculator offers two approaches to planning your loan repayment. Each serves different purposes:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-3 text-base">🗓️ Fixed Loan Term</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Set a specific time period and let the calculator determine your required monthly payment.
                </p>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Best for:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Planning budget around a deadline</li>
                    <li>Standard mortgage or auto loans</li>
                    <li>Comparing loan term options</li>
                    <li>When you need a specific payoff date</li>
                  </ul>
                </div>
              </div>

              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-3 text-base">💰 Fixed Installments</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Set a specific payment amount and see how long it will take to pay off the loan.
                </p>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Best for:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Working within a fixed budget</li>
                    <li>Credit card debt payoff planning</li>
                    <li>Testing extra payment scenarios</li>
                    <li>When cash flow is the priority</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Important Warning</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                With fixed installments, your payment must be higher than the monthly interest charge. If your payment 
                only covers (or is less than) the interest, your principal will never decrease, and you'll be trapped 
                in debt indefinitely. This is a common trap with credit card minimum payments.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">❌ Real-World Trap Example</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Scenario:</strong> $5,000 credit card balance at 24% APR</p>
                <p><strong>Monthly Interest:</strong> $100</p>
                <p><strong>If you pay only $100/month:</strong> Your balance never decreases!</p>
                <p><strong>If you pay $150/month:</strong> Takes 58 months, costs $3,620 in interest</p>
                <p><strong>If you pay $250/month:</strong> Takes 26 months, costs $1,455 in interest</p>
                <p className="pt-2 font-semibold text-red-800">
                  Paying just $100 more per month saves you $2,165 and 32 months of debt!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Common Loan Types */}
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="text-xl sm:text-2xl text-green-900">
              🏠 Common Loan Types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mortgages (Home Loans)</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Mortgages are typically the largest loans most people will take out in their lifetime. They're secured 
                by the property itself and usually have terms of 15-30 years.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-1">Typical Terms:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>15, 20, or 30-year terms</li>
                    <li>3-7% interest rates (varies by market)</li>
                    <li>Fixed or adjustable rates</li>
                    <li>20% down payment traditional</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Key Considerations:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Property taxes and insurance add to monthly cost</li>
                    <li>Shorter terms = higher payment, less interest</li>
                    <li>15-year can save $100,000+ vs 30-year</li>
                    <li>Extra payments dramatically reduce interest</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: $300,000 Mortgage at 6% APR</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-green-200">
                    <tr>
                      <th className="text-left p-2 font-bold">Term</th>
                      <th className="text-right p-2 font-bold">Monthly Payment</th>
                      <th className="text-right p-2 font-bold">Total Interest</th>
                      <th className="text-right p-2 font-bold">Total Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-200">
                    <tr>
                      <td className="p-2">30 years</td>
                      <td className="p-2 text-right">$1,799</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$347,515</td>
                      <td className="p-2 text-right">$647,515</td>
                    </tr>
                    <tr>
                      <td className="p-2">20 years</td>
                      <td className="p-2 text-right">$2,149</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$215,838</td>
                      <td className="p-2 text-right">$515,838</td>
                    </tr>
                    <tr className="bg-green-100">
                      <td className="p-2">15 years</td>
                      <td className="p-2 text-right">$2,532</td>
                      <td className="p-2 text-right text-green-600 font-semibold">$155,683</td>
                      <td className="p-2 text-right">$455,683</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center font-semibold">
                Choosing 15 years saves $191,832 in interest but increases monthly payment by $733
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">🚗 Auto Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Auto loans are secured by the vehicle and typically have shorter terms than mortgages. The vehicle 
                depreciates over time, so it's important not to be "underwater" (owing more than the car's value).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">Typical Terms:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>3-7 year terms most common</li>
                    <li>4-10% interest rates (varies by credit)</li>
                    <li>New cars get better rates than used</li>
                    <li>10-20% down payment recommended</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-1">⚠️ Warnings:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Avoid 72+ month loans</li>
                    <li>Car value drops faster than loan balance</li>
                    <li>Gap insurance important for long terms</li>
                    <li>Refinancing possible if rates drop</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">✅ Example: $30,000 Auto Loan at 7% APR</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-blue-200">
                    <tr>
                      <th className="text-left p-2 font-bold">Term</th>
                      <th className="text-right p-2 font-bold">Monthly Payment</th>
                      <th className="text-right p-2 font-bold">Total Interest</th>
                      <th className="text-right p-2 font-bold">Car Value at Payoff*</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200">
                    <tr className="bg-green-100">
                      <td className="p-2">3 years</td>
                      <td className="p-2 text-right">$927</td>
                      <td className="p-2 text-right text-green-600 font-semibold">$3,361</td>
                      <td className="p-2 text-right">~$18,000</td>
                    </tr>
                    <tr>
                      <td className="p-2">5 years</td>
                      <td className="p-2 text-right">$594</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$5,642</td>
                      <td className="p-2 text-right">~$12,000</td>
                    </tr>
                    <tr className="bg-red-100">
                      <td className="p-2">7 years</td>
                      <td className="p-2 text-right">$450</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$7,900</td>
                      <td className="p-2 text-right text-red-600">~$7,000 ⚠️</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                *Estimated value assuming 15% depreciation per year. 7-year loan leaves you underwater for most of the term.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">🎓 Student Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Student loans can be federal (government) or private, with different terms, interest rates, and repayment 
                options. Federal loans often offer more flexibility and borrower protections.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <p className="font-semibold text-purple-900 mb-1">Federal Student Loans:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Fixed interest rates (3-7%)</li>
                    <li>10-25 year standard repayment</li>
                    <li>Income-driven repayment options</li>
                    <li>Forbearance and deferment available</li>
                    <li>Possible loan forgiveness programs</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-3 rounded border border-orange-200">
                  <p className="font-semibold text-orange-900 mb-1">Private Student Loans:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Variable or fixed rates (4-14%)</li>
                    <li>5-20 year terms typical</li>
                    <li>Credit-based approval</li>
                    <li>Less flexible repayment options</li>
                    <li>May require cosigner</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm sm:text-base">✅ Example: $50,000 Student Loan at 5% APR</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Standard 10-year repayment:</strong></p>
                <p>• Monthly Payment: $530.33</p>
                <p>• Total Interest: $13,639.46</p>
                <p>• Total Paid: $63,639.46</p>
                <p className="pt-2"><strong>Extended 20-year repayment:</strong></p>
                <p>• Monthly Payment: $329.98</p>
                <p>• Total Interest: $29,195.55</p>
                <p>• Total Paid: $79,195.55</p>
                <p className="pt-2 font-semibold text-purple-800">
                  Extending the loan term reduces monthly payment by $200 but costs an extra $15,556 in interest!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">💳 Credit Cards</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Credit cards are revolving credit with no fixed repayment term. They typically have much higher interest 
                rates than other loan types, making them expensive for carrying balances long-term.
              </p>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">⚠️ The Minimum Payment Trap</h4>
                <p className="text-xs sm:text-sm text-gray-700 mb-2">
                  Credit card minimum payments are designed to keep you in debt as long as possible. They typically 
                  only cover interest plus 1-3% of the balance, meaning you barely make progress on the principal.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">❌ Example: $3,000 Credit Card at 18% APR</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-red-200">
                    <tr>
                      <th className="text-left p-2 font-bold">Payment Strategy</th>
                      <th className="text-right p-2 font-bold">Time to Payoff</th>
                      <th className="text-right p-2 font-bold">Total Interest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-200">
                    <tr className="bg-red-100">
                      <td className="p-2">Minimum ($60/month, 2%)</td>
                      <td className="p-2 text-right text-red-600 font-semibold">186 months (15.5 years)</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$4,931</td>
                    </tr>
                    <tr>
                      <td className="p-2">$100/month</td>
                      <td className="p-2 text-right">38 months</td>
                      <td className="p-2 text-right">$804</td>
                    </tr>
                    <tr className="bg-green-100">
                      <td className="p-2">$200/month</td>
                      <td className="p-2 text-right text-green-600 font-semibold">17 months</td>
                      <td className="p-2 text-right text-green-600 font-semibold">$423</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-red-800 mt-2 font-semibold">
                Paying only minimums costs you more in interest than the original balance and takes over 15 years!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Repayment Strategies */}
        <Card className="shadow-xl border-2 border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
            <CardTitle className="text-xl sm:text-2xl text-teal-900">
              💪 Accelerated Repayment Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Pay Extra?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Making extra payments toward your loan principal can save you thousands in interest and free you from 
                debt years earlier. Every extra dollar goes directly toward reducing your principal balance, which 
                reduces future interest charges.
              </p>
            </div>

            <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded">
              <h4 className="font-semibold text-teal-900 mb-2 text-sm sm:text-base">💡 The Power of Extra Payments</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Because loans front-load interest, extra payments have a compounding effect. Reducing your principal 
                early means less interest accrues over the entire loan term, creating exponential savings.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Strategy 1: Pay Extra Every Month</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Add a consistent amount to your regular payment each month. Even an extra $50-100 can make a significant 
                difference over time.
              </p>
              <div className="bg-gradient-to-r from-teal-50 to-teal-100 border-2 border-teal-300 p-4 rounded-lg">
                <h4 className="font-semibold text-teal-900 mb-2 text-sm sm:text-base">✅ Example: $200,000 Mortgage at 6% APR, 30 Years</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-teal-200">
                      <tr>
                        <th className="text-left p-2 font-bold">Extra Payment</th>
                        <th className="text-right p-2 font-bold">Time Saved</th>
                        <th className="text-right p-2 font-bold">Interest Saved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-200">
                      <tr>
                        <td className="p-2">$0 (Standard)</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">$0</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="p-2">$50/month</td>
                        <td className="p-2 text-right text-green-600 font-semibold">2.9 years</td>
                        <td className="p-2 text-right text-green-600 font-semibold">$25,813</td>
                      </tr>
                      <tr className="bg-green-100">
                        <td className="p-2">$100/month</td>
                        <td className="p-2 text-right text-green-600 font-semibold">5.4 years</td>
                        <td className="p-2 text-right text-green-600 font-semibold">$46,204</td>
                      </tr>
                      <tr className="bg-green-200">
                        <td className="p-2">$200/month</td>
                        <td className="p-2 text-right text-green-600 font-semibold">9.2 years</td>
                        <td className="p-2 text-right text-green-600 font-semibold">$75,669</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Strategy 2: Biweekly Payments</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Instead of making 12 monthly payments per year, make half-payments every two weeks. This results in 
                26 half-payments (13 full payments) per year, giving you one extra payment annually.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-1">✅ Benefits:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Easier to budget with biweekly paychecks</li>
                    <li>One extra payment per year automatically</li>
                    <li>Reduces principal faster</li>
                    <li>Can save years off loan term</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-1">⚠️ Considerations:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Not all lenders allow biweekly setup</li>
                    <li>Some charge fees for biweekly plans</li>
                    <li>Can achieve same result with extra payment</li>
                    <li>Requires consistent biweekly income</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: $250,000 Mortgage at 5.5% APR, 30 Years</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Monthly Payments ($1,419.47 × 12):</strong></p>
                <p>• Total Interest: $260,807</p>
                <p>• Payoff Time: 30 years</p>
                <p className="pt-2"><strong>Biweekly Payments ($709.74 × 26):</strong></p>
                <p>• Total Interest: $218,324</p>
                <p>• Payoff Time: 25.5 years</p>
                <p className="pt-2 font-semibold text-green-800">
                  Biweekly payments save $42,483 and 4.5 years with minimal lifestyle change!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Strategy 3: Lump Sum Payments</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Apply windfalls like tax refunds, bonuses, or inheritance directly to your loan principal. These 
                large payments have an outsized impact on interest savings.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">✅ Example: $150,000 Mortgage, Year 5</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Scenario:</strong> You receive a $10,000 bonus in year 5 of your 30-year mortgage at 6% APR</p>
                  <p><strong>If you apply it to principal:</strong></p>
                  <p>• Saves approximately $23,000 in future interest</p>
                  <p>• Reduces loan term by about 3 years</p>
                  <p>• Return on investment: 230% over loan life</p>
                  <p className="pt-2 font-semibold text-blue-800">
                    That $10,000 becomes $23,000 in savings - better than most investments!
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Strategy 4: Refinancing</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                If interest rates have dropped or your credit has improved, refinancing can lower your rate and 
                save money. However, consider closing costs and whether you'll stay in the loan long enough to benefit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-1">✅ When to Refinance:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Rates dropped 0.5-1% or more</li>
                    <li>Credit score improved significantly</li>
                    <li>Want to switch from ARM to fixed rate</li>
                    <li>Can shorten loan term affordably</li>
                    <li>Break-even point within 2-3 years</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="font-semibold text-red-900 mb-1">❌ When NOT to Refinance:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Planning to move within 2-3 years</li>
                    <li>Near end of loan term</li>
                    <li>Closing costs too high</li>
                    <li>Rate improvement too small</li>
                    <li>Extending term for lower payment only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Important: Specify "Principal Only"</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                When making extra payments, always specify that the payment should go toward principal only. Otherwise, 
                some lenders may apply it to future payments, which doesn't reduce your interest. Send a separate 
                check or make a clear notation on your payment.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interest Rate Compounding */}
        <Card className="shadow-xl border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="text-xl sm:text-2xl text-indigo-900">
              📊 Understanding Interest Rate Compounding
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What is Compounding?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Compounding refers to how often interest is calculated and added to your loan balance. The more 
                frequently interest compounds, the more you'll pay over time. Most loans use monthly compounding, 
                but some use daily or annual compounding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-indigo-300 rounded-lg p-4 bg-indigo-50">
                <h4 className="font-semibold text-indigo-900 mb-3 text-base">📅 Monthly Compounding</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Most Common</strong>
                </p>
                <p className="text-xs text-gray-700 mb-2">
                  Interest calculated once per month based on current balance. This is the standard for mortgages and most loans.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Also called "Monthly APR" or simply "APR"
                </p>
              </div>

              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-3 text-base">☀️ Daily Compounding</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Slightly Higher Cost</strong>
                </p>
                <p className="text-xs text-gray-700 mb-2">
                  Interest calculated every day. Common for credit cards and some personal loans.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Results in slightly more interest than monthly compounding
                </p>
              </div>

              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-3 text-base">📆 Annual Compounding</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Least Common</strong>
                </p>
                <p className="text-xs text-gray-700 mb-2">
                  Interest calculated once per year. Rare for loans, but sometimes used for bonds or savings.
                </p>
                <p className="text-xs text-gray-600 italic">
                  Results in less interest than monthly or daily
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">✅ Example: $10,000 Loan at 10% Annual Rate, 5 Years</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-indigo-200">
                    <tr>
                      <th className="text-left p-2 font-bold">Compounding Frequency</th>
                      <th className="text-right p-2 font-bold">Monthly Payment</th>
                      <th className="text-right p-2 font-bold">Total Interest</th>
                      <th className="text-right p-2 font-bold">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-200">
                    <tr className="bg-green-50">
                      <td className="p-2">Annually</td>
                      <td className="p-2 text-right">$210.61</td>
                      <td className="p-2 text-right text-green-600 font-semibold">$2,636.46</td>
                      <td className="p-2 text-right">-</td>
                    </tr>
                    <tr>
                      <td className="p-2">Monthly (APR)</td>
                      <td className="p-2 text-right">$212.47</td>
                      <td className="p-2 text-right">$2,748.23</td>
                      <td className="p-2 text-right">+$111.77</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="p-2">Daily</td>
                      <td className="p-2 text-right">$212.77</td>
                      <td className="p-2 text-right text-red-600 font-semibold">$2,766.18</td>
                      <td className="p-2 text-right">+$129.72</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                On a $10,000 loan, daily compounding costs about $130 more than annual compounding over 5 years.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Important Note</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                When comparing loans, make sure you're comparing the same compounding frequency. A 10% APR with monthly 
                compounding is not the same as 10% with daily compounding. Always ask your lender about the compounding 
                frequency to accurately calculate your true cost.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Debt vs Savings */}
        <Card className="shadow-xl border-2 border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
            <CardTitle className="text-xl sm:text-2xl text-orange-900">
              ⚖️ Pay Down Debt vs Build Savings?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">The Classic Financial Dilemma</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                One of the most common questions in personal finance: Should I pay extra on debt or invest/save that money? 
                The answer depends on interest rates, risk tolerance, and your overall financial situation.
              </p>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">💡 The General Rule</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Compare your loan interest rate to potential investment returns. If your loan rate is higher than what 
                you can safely earn investing, paying down debt is often the better "investment." However, this isn't 
                the complete picture—you need to consider taxes, risk, and liquidity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Decision Framework</h3>
              <div className="space-y-3">
                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-2 text-base">🔴 Always Prioritize Paying Down:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                    <li><strong>Credit card debt (15-25% APR):</strong> Nearly impossible to beat these returns investing</li>
                    <li><strong>Payday loans (400%+ APR):</strong> Pay these off immediately at any cost</li>
                    <li><strong>High-interest personal loans (10%+ APR):</strong> Usually better to pay down first</li>
                    <li><strong>Any debt causing financial stress:</strong> Mental health matters!</li>
                  </ul>
                </div>

                <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-semibold text-yellow-900 mb-2 text-base">🟡 Situational Decisions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                    <li><strong>Auto loans (4-8% APR):</strong> Depends on market conditions and employer 401(k) match</li>
                    <li><strong>Student loans (4-7% APR):</strong> Federal loans have special benefits, private loans less so</li>
                    <li><strong>Moderate mortgages (4-6% APR):</strong> Tax deductibility and long-term investing may favor investing</li>
                  </ul>
                </div>

                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-2 text-base">🟢 Often Better to Invest:</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                    <li><strong>Low-rate mortgages (2-4% APR):</strong> Historical stock market returns ~10% annually</li>
                    <li><strong>0% financing:</strong> No-brainer to invest instead (but don't miss the payoff deadline!)</li>
                    <li><strong>Tax-deductible debt below 4%:</strong> After tax benefit, real rate is very low</li>
                    <li><strong>Employer 401(k) match:</strong> Always get the full match first (50-100% instant return)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-orange-900 mb-2 text-sm sm:text-base">✅ Example: $500 Extra Per Month</h4>
              <div className="space-y-3 text-xs sm:text-sm text-gray-700">
                <p><strong>Scenario 1: Pay Extra on 18% Credit Card ($5,000 balance)</strong></p>
                <p>• Saves ~$1,800 in interest over 2 years</p>
                <p>• Guaranteed 18% "return" on your money</p>
                <p>• No risk, no taxes owed on the "gain"</p>
                
                <p className="pt-2"><strong>Scenario 2: Invest in Stock Market Instead</strong></p>
                <p>• Historical average: 10% annual return</p>
                <p>• After taxes (~15% capital gains): ~8.5% net return</p>
                <p>• Risk of losses during market downturns</p>
                <p>• Potential for better returns, but not guaranteed</p>
                
                <p className="pt-2 font-semibold text-orange-800">
                  Clear winner: Pay off the 18% debt first. It's a guaranteed 18% return with zero risk!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">The Balanced Approach</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Financial experts often recommend a hybrid strategy:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="pl-2">
                    <strong>Build $1,000-$2,000 emergency fund</strong> (prevents new debt when emergencies happen)
                  </li>
                  <li className="pl-2">
                    <strong>Get full employer 401(k) match</strong> (instant 50-100% return, don't leave free money)
                  </li>
                  <li className="pl-2">
                    <strong>Pay off high-interest debt (8%+)</strong> (guaranteed high "return" with no risk)
                  </li>
                  <li className="pl-2">
                    <strong>Build 3-6 months expenses emergency fund</strong> (prevents financial catastrophe)
                  </li>
                  <li className="pl-2">
                    <strong>Split extra money:</strong> Pay down moderate debt + invest for retirement
                  </li>
                  <li className="pl-2">
                    <strong>Don't rush low-rate debt</strong> (under 4%) if you have better investing opportunities
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Don't Forget About Liquidity</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Money paid toward debt is locked away—you can't easily access it in an emergency. Before aggressively 
                paying down debt, make sure you have an adequate emergency fund. Otherwise, you might need to take on 
                new (expensive) debt when unexpected costs arise.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card className="shadow-xl border-2 border-pink-200">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-2 border-pink-200">
            <CardTitle className="text-xl sm:text-2xl text-pink-900">
              🎯 Tips for Successful Loan Repayment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-green-900 mb-3 text-base flex items-center gap-2">
                  <span>✅</span> Do These Things
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Set up automatic payments</strong> to never miss a due date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Pay more than the minimum</strong> whenever possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Apply windfalls</strong> (bonuses, tax refunds) to principal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Round up payments</strong> to the nearest $50 or $100</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Review your loan annually</strong> for refinancing opportunities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Keep track of amortization</strong> to stay motivated</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Maintain good credit</strong> for better refinancing terms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Understand prepayment penalties</strong> before paying extra</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                <h4 className="font-semibold text-red-900 mb-3 text-base flex items-center gap-2">
                  <span>❌</span> Avoid These Mistakes
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Skipping payments</strong> damages credit and adds fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Paying only minimums</strong> on high-interest debt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Taking out new debt</strong> while trying to pay off old debt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Extending loan terms</strong> just for lower payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Ignoring compound frequency</strong> when comparing loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Forgetting about prepayment penalties</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Aggressively paying debt</strong> without emergency fund</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Refinancing too often</strong> (closing costs add up)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-pink-900 mb-3 text-base">💪 Stay Motivated</h4>
              <p className="text-sm text-gray-700 mb-3">
                Paying off debt is a marathon, not a sprint. Here are strategies to stay motivated:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Track your progress with charts and graphs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Celebrate milestones (25%, 50%, 75% paid off)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Calculate total interest saved from extra payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Join debt payoff communities for support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Visualize what you'll do when debt-free</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Track how much interest you save each month</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Final Thought</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                The best repayment strategy is the one you'll stick to consistently. Whether you choose aggressive paydown 
                or a balanced approach with investing, the key is making informed decisions and maintaining discipline. 
                Use this calculator regularly to see how different strategies impact your financial future, and remember: 
                every extra dollar toward principal is a dollar that won't cost you interest.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
