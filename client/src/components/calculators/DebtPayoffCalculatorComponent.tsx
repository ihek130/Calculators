import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Plus, Trash2, TrendingDown, Calendar, CreditCard, Percent } from 'lucide-react';
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

interface Debt {
  id: string;
  name: string;
  balance: string;
  monthlyPayment: string;
  interestRate: string;
}

interface WorkingDebt {
  name: string;
  balance: number;
  monthlyPayment: number;
  monthlyRate: number;
  originalBalance: number;
  interestRate: number;
  totalPaid: number;
  totalInterest: number;
  paidOffMonth: number;
}

interface PayoffSchedule {
  month: number;
  totalBalance: number;
  totalPaid: number;
  totalInterest: number;
  debts: {
    name: string;
    balance: number;
    payment: number;
    interest: number;
  }[];
}

interface CalculationResults {
  totalMonths: number;
  totalPaid: number;
  totalInterest: number;
  debtPayoffs: {
    name: string;
    originalBalance: number;
    interestRate: number;
    totalPaid: number;
    totalInterest: number;
    paidOffMonth: number;
  }[];
  monthlySchedule: PayoffSchedule[];
  pieData: { name: string; value: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DebtPayoffCalculatorComponent() {
  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: '', balance: '', monthlyPayment: '', interestRate: '' }
  ]);

  const [extraMonthly, setExtraMonthly] = useState('100');
  const [extraYearly, setExtraYearly] = useState('0');
  const [oneTimeAmount, setOneTimeAmount] = useState('0');
  const [oneTimeMonth, setOneTimeMonth] = useState('5');
  const [fixedTotal, setFixedTotal] = useState('yes');

  const addDebt = () => {
    const newId = (Math.max(...debts.map(d => parseInt(d.id)), 0) + 1).toString();
    setDebts([...debts, {
      id: newId,
      name: '',
      balance: '',
      monthlyPayment: '',
      interestRate: ''
    }]);
  };

  const removeDebt = (id: string) => {
    if (debts.length > 1) {
      setDebts(debts.filter(d => d.id !== id));
    }
  };

  const updateDebt = (id: string, field: keyof Debt, value: string) => {
    setDebts(debts.map(debt => 
      debt.id === id ? { ...debt, [field]: value } : debt
    ));
  };

  const results: CalculationResults = useMemo(() => {
    const validDebts = debts.filter(d => 
      d.name.trim() && 
      parseFloat(d.balance) > 0 && 
      parseFloat(d.monthlyPayment) > 0 && 
      parseFloat(d.interestRate) >= 0
    );

    if (validDebts.length === 0) {
      return {
        totalMonths: 0,
        totalPaid: 0,
        totalInterest: 0,
        debtPayoffs: [],
        monthlySchedule: [],
        pieData: []
      };
    }

    const extra = parseFloat(extraMonthly) || 0;
    const extraYear = parseFloat(extraYearly) || 0;
    const oneTime = parseFloat(oneTimeAmount) || 0;
    const oneTimeMonthNum = parseInt(oneTimeMonth) || 1;
    const useFixedTotal = fixedTotal === 'yes';

    // Sort debts by interest rate (highest first) - Debt Avalanche
    const sortedDebts: WorkingDebt[] = [...validDebts].sort((a, b) => 
      parseFloat(b.interestRate) - parseFloat(a.interestRate)
    ).map(debt => ({
      name: debt.name,
      balance: parseFloat(debt.balance),
      monthlyPayment: parseFloat(debt.monthlyPayment),
      monthlyRate: parseFloat(debt.interestRate) / 100 / 12,
      originalBalance: parseFloat(debt.balance),
      interestRate: parseFloat(debt.interestRate),
      totalPaid: 0,
      totalInterest: 0,
      paidOffMonth: 0
    }));

    // Initialize working debts
    let activeDebts: WorkingDebt[] = [...sortedDebts];
    const schedule: PayoffSchedule[] = [];
    const maxMonths = 600; // 50 years maximum
    let month = 0;
    let totalPaymentBudget = sortedDebts.reduce((sum, d) => sum + d.monthlyPayment, 0) + extra;

    while (activeDebts.some(d => d.balance > 0.01) && month < maxMonths) {
      month++;

      // Apply interest to all active debts
      activeDebts.forEach(debt => {
        if (debt.balance > 0) {
          const interest = debt.balance * debt.monthlyRate;
          debt.balance += interest;
          debt.totalInterest += interest;
        }
      });

      // Calculate available payment
      let availablePayment = useFixedTotal ? totalPaymentBudget : 
        activeDebts.filter(d => d.balance > 0).reduce((sum, d) => sum + d.monthlyPayment, 0) + extra;

      // Add yearly extra payment if applicable
      if (month % 12 === 0) {
        availablePayment += extraYear;
      }

      // Add one-time payment if applicable
      if (month === oneTimeMonthNum) {
        availablePayment += oneTime;
      }

      // Pay minimum on all debts first
      const paymentsThisMonth: { name: string; payment: number; interest: number }[] = [];
      
      activeDebts.forEach(debt => {
        if (debt.balance > 0) {
          const minPayment = Math.min(debt.monthlyPayment, debt.balance, availablePayment);
          debt.balance -= minPayment;
          debt.totalPaid += minPayment;
          availablePayment -= minPayment;
          
          paymentsThisMonth.push({
            name: debt.name,
            payment: minPayment,
            interest: debt.balance * debt.monthlyRate
          });

          if (debt.balance <= 0.01) {
            debt.balance = 0;
            debt.paidOffMonth = month;
          }
        }
      });

      // Apply extra payment to highest interest rate debt
      if (availablePayment > 0.01) {
        for (const debt of activeDebts) {
          if (debt.balance > 0) {
            const extraPayment = Math.min(availablePayment, debt.balance);
            debt.balance -= extraPayment;
            debt.totalPaid += extraPayment;
            availablePayment -= extraPayment;

            const existingPayment = paymentsThisMonth.find(p => p.name === debt.name);
            if (existingPayment) {
              existingPayment.payment += extraPayment;
            }

            if (debt.balance <= 0.01) {
              debt.balance = 0;
              debt.paidOffMonth = month;
            }

            if (availablePayment <= 0.01) break;
          }
        }
      }

      // Record schedule
      schedule.push({
        month,
        totalBalance: activeDebts.reduce((sum, d) => sum + d.balance, 0),
        totalPaid: sortedDebts.reduce((sum, d) => sum + d.totalPaid, 0),
        totalInterest: sortedDebts.reduce((sum, d) => sum + d.totalInterest, 0),
        debts: activeDebts.map(d => ({
          name: d.name,
          balance: d.balance,
          payment: paymentsThisMonth.find(p => p.name === d.name)?.payment || 0,
          interest: paymentsThisMonth.find(p => p.name === d.name)?.interest || 0
        }))
      });

      // Check if all debts are paid off
      if (activeDebts.every(d => d.balance <= 0.01)) {
        break;
      }
    }

    // Calculate final totals
    const debtPayoffs = sortedDebts.map(debt => ({
      name: debt.name,
      originalBalance: debt.originalBalance,
      interestRate: debt.interestRate,
      totalPaid: debt.totalPaid,
      totalInterest: debt.totalInterest,
      paidOffMonth: debt.paidOffMonth
    }));

    const totalPaid = sortedDebts.reduce((sum, d) => sum + d.totalPaid, 0);
    const totalInterest = sortedDebts.reduce((sum, d) => sum + d.totalInterest, 0);

    // Prepare pie chart data
    const pieData = sortedDebts.map(debt => ({
      name: debt.name,
      value: parseFloat(debt.totalInterest.toFixed(2))
    }));

    return {
      totalMonths: month,
      totalPaid,
      totalInterest,
      debtPayoffs,
      monthlySchedule: schedule,
      pieData
    };
  }, [debts, extraMonthly, extraYearly, oneTimeAmount, oneTimeMonth, fixedTotal]);

  // Prepare chart data
  const balanceOverTimeData = results.monthlySchedule
    .filter((_, index) => index % Math.max(1, Math.floor(results.monthlySchedule.length / 50)) === 0)
    .map(s => ({
      month: s.month,
      balance: parseFloat(s.totalBalance.toFixed(2)),
      paid: parseFloat(s.totalPaid.toFixed(2))
    }));

  const payoffOrderData = results.debtPayoffs.map((debt, index) => ({
    name: debt.name,
    order: index + 1,
    months: debt.paidOffMonth,
    interest: parseFloat(debt.totalInterest.toFixed(2)),
    total: parseFloat(debt.totalPaid.toFixed(2))
  }));

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Input Section */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Your Debts</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter information for each debt
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            {debts.map((debt, index) => (
              <div key={debt.id} className="border-2 border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm sm:text-base text-gray-700">Debt #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDebt(debt.id)}
                    disabled={debts.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Debt Name</Label>
                    <Input
                      value={debt.name}
                      onChange={(e) => updateDebt(debt.id, 'name', e.target.value)}
                      className="text-sm"
                      placeholder="e.g., Auto loan, Credit card"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Remaining Balance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={debt.balance}
                        onChange={(e) => updateDebt(debt.id, 'balance', e.target.value)}
                        className="pl-10 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Monthly/Minimum Payment</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={debt.monthlyPayment}
                        onChange={(e) => updateDebt(debt.id, 'monthlyPayment', e.target.value)}
                        className="pl-10 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Interest Rate</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={debt.interestRate}
                        onChange={(e) => updateDebt(debt.id, 'interestRate', e.target.value)}
                        className="pr-8 text-sm"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button
            onClick={addDebt}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Debt
          </Button>
        </CardContent>
      </Card>

      {/* Extra Payments Section */}
      <Card className="shadow-xl border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
          <CardTitle className="text-xl sm:text-2xl text-purple-900">Extra Payments</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Optional additional payments to accelerate debt payoff
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="extraMonthly" className="text-xs sm:text-sm font-medium mb-2 block">
                Extra Monthly Payment
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="extraMonthly"
                  type="number"
                  value={extraMonthly}
                  onChange={(e) => setExtraMonthly(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="extraYearly" className="text-xs sm:text-sm font-medium mb-2 block">
                Extra Yearly Payment
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="extraYearly"
                  type="number"
                  value={extraYearly}
                  onChange={(e) => setExtraYearly(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-xs sm:text-sm font-medium mb-3 block">One-Time Payment</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="oneTimeAmount" className="text-xs sm:text-sm mb-2 block text-gray-600">
                  Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="oneTimeAmount"
                    type="number"
                    value={oneTimeAmount}
                    onChange={(e) => setOneTimeAmount(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="oneTimeMonth" className="text-xs sm:text-sm mb-2 block text-gray-600">
                  Made During Month
                </Label>
                <Input
                  id="oneTimeMonth"
                  type="number"
                  min="1"
                  value={oneTimeMonth}
                  onChange={(e) => setOneTimeMonth(e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Strategy */}
      <Card className="shadow-xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
          <CardTitle className="text-xl sm:text-2xl text-green-900">Payment Strategy</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div>
            <Label className="text-sm sm:text-base font-medium mb-3 block">
              Fixed total amount towards monthly payment?
            </Label>
            <RadioGroup value={fixedTotal} onValueChange={setFixedTotal} className="space-y-3">
              <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                <RadioGroupItem value="yes" id="yes" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="yes" className="text-sm font-medium cursor-pointer">
                    Yes - Fixed Total Amount
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    After a debt is paid off, that payment amount will be redirected to remaining debts (Debt Avalanche strategy)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                <RadioGroupItem value="no" id="no" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="no" className="text-sm font-medium cursor-pointer">
                    No - Decreasing Total
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    After a debt is paid off, the total monthly payment decreases
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.totalMonths > 0 && (
        <>
          {/* Summary Card */}
          <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="border-b-2 border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-900">Debt-Free Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-green-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Time to Debt-Free</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900">
                    {Math.floor(results.totalMonths / 12)} years {results.totalMonths % 12} months
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    ({results.totalMonths} months total)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Amount Paid</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                    ${results.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Principal + Interest
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Interest Paid</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-red-900">
                    ${results.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Cost of borrowing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debt Payoff Order */}
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
              <CardTitle className="text-xl sm:text-2xl text-blue-900">
                📋 Payoff Order (Debt Avalanche)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Debts are prioritized by highest interest rate first
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {results.debtPayoffs.map((debt, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-gray-900">{debt.name}</h3>
                          <p className="text-xs text-gray-600">
                            {debt.interestRate.toFixed(2)}% APR
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Paid off in</p>
                        <p className="font-bold text-sm text-blue-900">Month {debt.paidOffMonth}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-600">Original Balance</p>
                        <p className="font-semibold text-sm text-gray-900">
                          ${debt.originalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Paid</p>
                        <p className="font-semibold text-sm text-gray-900">
                          ${debt.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Interest Paid</p>
                        <p className="font-semibold text-sm text-red-600">
                          ${debt.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Interest Distribution Pie Chart */}
            <Card className="shadow-xl border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                <CardTitle className="text-lg sm:text-xl text-purple-900">
                  Interest Distribution by Debt
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {results.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px' }}
                        iconSize={10}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payoff Timeline Bar Chart */}
            <Card className="shadow-xl border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
                <CardTitle className="text-lg sm:text-xl text-orange-900">
                  Payoff Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payoffOrderData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={80}
                        tick={{ fontSize: 11 }}
                        interval={0}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value} months`}
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd', fontSize: '12px' }}
                      />
                      <Bar dataKey="months" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Over Time */}
          <Card className="shadow-xl border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
              <CardTitle className="text-lg sm:text-xl text-indigo-900">
                Debt Reduction Progress
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Watch your total debt decrease over time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd' }}
                    />
                    <Legend />
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
                      dataKey="paid" 
                      stackId="2"
                      stroke="#10b981" 
                      fill="#10b981" 
                      name="Amount Paid"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment vs Interest Over Time */}
          <Card className="shadow-xl border-2 border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
              <CardTitle className="text-lg sm:text-xl text-teal-900">
                Cumulative Payments
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Total amount paid vs. interest accumulated
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      label={{ value: 'Month', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="paid" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={false}
                      name="Total Paid"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Educational Content */}
      <Card className="shadow-xl border-2 border-slate-200 mt-8">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <CardTitle className="text-xl sm:text-2xl text-slate-900">
            📚 Understanding Debt Payoff
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comprehensive guide to managing and eliminating debt effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Section 1: Overview */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              What is Debt Payoff?
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Debt payoff refers to the process of systematically eliminating outstanding financial obligations 
                through regular payments. This calculator helps you create an optimized repayment strategy using the 
                <strong> Debt Avalanche method</strong>, which prioritizes high-interest debts to minimize the total 
                cost of borrowing.
              </p>
              <p>
                Loans and debts are fundamental components of modern economic life. Companies, individuals, and even 
                governments assume debts to maintain operations and achieve goals. Most people will take on various 
                loans throughout their lifetime, including mortgages, student loans, auto loans, credit card debt, 
                and personal loans.
              </p>
              <p>
                When used responsibly, debts can help people achieve important milestones like homeownership, 
                education, and transportation. However, excessive debt can lead to financial stress, high interest 
                costs, reduced credit scores, and interference with long-term financial planning. Understanding 
                effective debt management strategies is crucial for financial health.
              </p>
            </div>
          </div>

          {/* Section 2: Pay Off Debts Early */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">🎯</span>
              Benefits of Paying Off Debts Early
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Most people value the peace of mind that comes with being debt-free. When possible, paying off 
                debts earlier than required can provide significant financial and emotional benefits:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Interest Savings:</strong> Extra payments directly reduce the principal balance, which 
                  decreases the amount of interest charged over the life of the debt. This can save thousands or 
                  even tens of thousands of dollars.
                </li>
                <li>
                  <strong>Faster Freedom:</strong> Accelerated payments move the payoff date forward, allowing you 
                  to become debt-free sooner and redirect funds toward savings, investments, or other goals.
                </li>
                <li>
                  <strong>Improved Credit Score:</strong> Lower debt balances and consistent payments positively 
                  impact your credit utilization ratio and payment history, two major factors in credit scoring.
                </li>
                <li>
                  <strong>Reduced Financial Stress:</strong> Eliminating debt obligations creates financial flexibility 
                  and reduces the anxiety associated with monthly payment requirements.
                </li>
                <li>
                  <strong>Increased Cash Flow:</strong> Once debts are paid off, the money previously allocated to 
                  payments becomes available for other purposes like emergency funds, retirement savings, or 
                  discretionary spending.
                </li>
              </ul>
              <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <strong>💡 Tip:</strong> This calculator accommodates one-time extra payments, monthly extra payments, 
                and annual extra payments. You can combine these strategies to maximize your debt reduction efforts 
                while maintaining flexibility in your budget.
              </p>
            </div>
          </div>

          {/* Section 3: When to Pay Off Debt Early */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-orange-600">⚖️</span>
              When to Prioritize Debt Payoff
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                While paying off debt early offers many benefits, it's important to evaluate your overall financial 
                situation before committing extra resources to debt elimination:
              </p>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-green-900 mb-2">✅ Good Reasons to Pay Off Debt Early:</h4>
                <ul className="list-disc pl-6 space-y-1.5 text-green-900">
                  <li>The debt has a high interest rate (typically above 7-8%)</li>
                  <li>You have a solid emergency fund (3-6 months of expenses)</li>
                  <li>You're meeting employer retirement plan matches</li>
                  <li>The debt causes significant emotional stress</li>
                  <li>You have stable income and job security</li>
                  <li>The debt has no prepayment penalties</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Consider Alternatives When:</h4>
                <ul className="list-disc pl-6 space-y-1.5 text-yellow-900">
                  <li>You lack an adequate emergency fund</li>
                  <li>The debt has a very low interest rate (under 4%)</li>
                  <li>You're not maximizing employer retirement contributions</li>
                  <li>Investment returns significantly exceed debt interest rates</li>
                  <li>You have immediate large expenses coming (medical, home repairs, etc.)</li>
                  <li>The loan has prepayment penalties that offset savings</li>
                </ul>
              </div>
              <p>
                Conventional wisdom suggests prioritizing high-interest debts like credit cards (often 15-25% APR) 
                over low-interest debts like mortgages (often 3-5% APR). The opportunity cost of extra payments 
                deserves consideration—money used for debt payoff cannot simultaneously build emergency savings or 
                generate investment returns.
              </p>
            </div>
          </div>

          {/* Section 4: Debt Avalanche Method */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">🏔️</span>
              Debt Avalanche Method (Used by This Calculator)
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                The <strong>Debt Avalanche method</strong> is a mathematically optimal debt repayment strategy that 
                minimizes the total interest paid over the life of your debts. This calculator implements this method 
                by default.
              </p>
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-purple-900 mb-3">How the Debt Avalanche Works:</h4>
                <ol className="list-decimal pl-6 space-y-2 text-purple-900">
                  <li>
                    <strong>List all debts</strong> with their balances, minimum payments, and interest rates
                  </li>
                  <li>
                    <strong>Sort debts by interest rate</strong> from highest to lowest (regardless of balance)
                  </li>
                  <li>
                    <strong>Make minimum payments</strong> on all debts to stay current
                  </li>
                  <li>
                    <strong>Apply all extra funds</strong> to the debt with the highest interest rate
                  </li>
                  <li>
                    <strong>When the highest-rate debt is eliminated</strong>, redirect its full payment amount 
                    (minimum + extra) to the next highest-rate debt
                  </li>
                  <li>
                    <strong>Continue this process</strong> until all debts are paid off, like an avalanche gaining 
                    momentum as it tumbles down
                  </li>
                </ol>
              </div>
              <p>
                <strong>Example:</strong> If you have a credit card at 18% APR, a personal loan at 12% APR, and a 
                mortgage at 4% APR, the avalanche method directs extra payments to the credit card first (highest 
                rate), then the personal loan, and finally the mortgage—regardless of the balance amounts.
              </p>
              <p className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                <strong>✅ Advantages:</strong> This method results in the lowest total interest cost and fastest 
                overall debt elimination from a purely mathematical perspective. It's ideal for people motivated by 
                financial optimization and savings.
              </p>
            </div>
          </div>

          {/* Section 5: Debt Snowball Method */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-cyan-600">⛄</span>
              Debt Snowball Method (Alternative Approach)
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                The <strong>Debt Snowball method</strong> is an alternative strategy that prioritizes psychological 
                wins over mathematical optimization. This calculator does not use this method, but understanding it 
                can help you choose the right approach for your situation.
              </p>
              <div className="bg-cyan-50 border-2 border-cyan-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-cyan-900 mb-3">How the Debt Snowball Works:</h4>
                <ol className="list-decimal pl-6 space-y-2 text-cyan-900">
                  <li>
                    <strong>List all debts</strong> with their balances, minimum payments, and interest rates
                  </li>
                  <li>
                    <strong>Sort debts by balance</strong> from smallest to largest (regardless of interest rate)
                  </li>
                  <li>
                    <strong>Make minimum payments</strong> on all debts
                  </li>
                  <li>
                    <strong>Apply all extra funds</strong> to the debt with the smallest balance
                  </li>
                  <li>
                    <strong>When the smallest debt is eliminated</strong>, celebrate the victory and roll that 
                    payment to the next smallest debt
                  </li>
                  <li>
                    <strong>Continue this process</strong>, building momentum like a snowball rolling downhill
                  </li>
                </ol>
              </div>
              <p>
                <strong>Example:</strong> If you have a $500 store card, a $3,000 personal loan, and a $15,000 
                auto loan, the snowball method targets the $500 balance first, regardless of interest rates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <strong className="text-green-900">✅ Advantages:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Quick wins build motivation and confidence</li>
                    <li>Reduces number of accounts faster</li>
                    <li>Provides emotional satisfaction</li>
                    <li>Simplifies monthly obligations sooner</li>
                  </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <strong className="text-red-900">❌ Disadvantages:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Typically costs more in total interest</li>
                    <li>Takes longer to become debt-free</li>
                    <li>May keep high-rate debts longer</li>
                    <li>Less financially optimal</li>
                  </ul>
                </div>
              </div>
              <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <strong>🤔 Which Method is Better?</strong> The avalanche method saves more money, but the snowball 
                method may be more sustainable for people who need quick psychological wins to stay motivated. Choose 
                based on your personality—the best method is the one you'll actually stick with.
              </p>
            </div>
          </div>

          {/* Section 6: Debt Consolidation */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-indigo-600">🔄</span>
              Debt Consolidation Strategy
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                <strong>Debt consolidation</strong> involves combining multiple debts into a single new loan, 
                typically with a lower interest rate. This strategy can simplify repayment and reduce costs, 
                but requires careful evaluation.
              </p>
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-indigo-900 mb-2">Common Consolidation Methods:</h4>
                <ul className="list-disc pl-6 space-y-2 text-indigo-900">
                  <li>
                    <strong>Balance Transfer Credit Cards:</strong> Transfer high-interest credit card balances to 
                    a new card with 0% introductory APR (typically 12-21 months). Watch for balance transfer fees 
                    (usually 3-5% of transferred amount).
                  </li>
                  <li>
                    <strong>Personal Consolidation Loans:</strong> Unsecured loans used to pay off multiple debts, 
                    leaving one monthly payment. Rates typically range from 6-36% based on creditworthiness.
                  </li>
                  <li>
                    <strong>Home Equity Loans or HELOCs:</strong> Borrow against home equity at lower rates (often 
                    5-8%). Risk: Your home becomes collateral for previously unsecured debt.
                  </li>
                  <li>
                    <strong>401(k) Loans:</strong> Borrow from retirement savings. Generally not recommended due to 
                    opportunity cost, potential penalties, and risk if employment changes.
                  </li>
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <strong className="text-green-900">✅ When Consolidation Makes Sense:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>New rate is significantly lower</li>
                    <li>You qualify for favorable terms</li>
                    <li>Multiple payments are hard to manage</li>
                    <li>You won't accumulate new debt</li>
                    <li>Total cost (including fees) is lower</li>
                  </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                  <strong className="text-red-900">❌ When to Avoid Consolidation:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>Rates aren't significantly better</li>
                    <li>High fees offset interest savings</li>
                    <li>You haven't addressed spending habits</li>
                    <li>Collateral risk is unacceptable</li>
                    <li>Extended term increases total cost</li>
                  </ul>
                </div>
              </div>
              <p className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <strong>⚠️ Warning:</strong> Consolidation is not debt elimination—it's debt reorganization. Without 
                changing the spending behaviors that created the debt, consolidation may simply free up credit limits 
                for additional borrowing, worsening the situation. Address the root causes before consolidating.
              </p>
            </div>
          </div>

          {/* Section 7: Fixed vs Decreasing Payment Strategy */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-teal-600">⚙️</span>
              Fixed vs. Decreasing Payment Strategy
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                This calculator offers two payment strategies that significantly impact your debt payoff timeline 
                and total interest costs:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <span>📌</span> Fixed Total Amount (Recommended)
                  </h4>
                  <p className="text-sm text-blue-900 mb-3">
                    After paying off a debt, its payment amount is <strong>redirected</strong> to remaining debts, 
                    keeping your total monthly payment constant.
                  </p>
                  <p className="text-sm font-semibold text-blue-900 mb-2">Example:</p>
                  <ul className="text-sm text-blue-900 space-y-1 list-disc pl-5">
                    <li>Total monthly payment: $1,000</li>
                    <li>Pay off $200/month credit card</li>
                    <li>That $200 goes to next highest-rate debt</li>
                    <li>Total payment stays $1,000 until all debts are gone</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <strong className="text-blue-900">Benefits:</strong>
                    <p className="text-xs text-blue-800 mt-1">
                      ✅ Fastest debt elimination<br/>
                      ✅ Lowest total interest cost<br/>
                      ✅ Maximum momentum effect<br/>
                      ✅ Best for aggressive payoff
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <span>📉</span> Decreasing Total
                  </h4>
                  <p className="text-sm text-orange-900 mb-3">
                    After paying off a debt, that payment amount is <strong>freed up</strong> for other uses, 
                    decreasing your total monthly payment.
                  </p>
                  <p className="text-sm font-semibold text-orange-900 mb-2">Example:</p>
                  <ul className="text-sm text-orange-900 space-y-1 list-disc pl-5">
                    <li>Total monthly payment: $1,000</li>
                    <li>Pay off $200/month credit card</li>
                    <li>Total payment drops to $800/month</li>
                    <li>Payment continues decreasing as debts are eliminated</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-orange-200">
                    <strong className="text-orange-900">Benefits:</strong>
                    <p className="text-xs text-orange-800 mt-1">
                      ✅ Increases cash flow over time<br/>
                      ✅ More flexibility as you progress<br/>
                      ✅ Easier to sustain long-term<br/>
                      ✅ Good for tight budgets
                    </p>
                  </div>
                </div>
              </div>
              <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <strong>💡 Recommendation:</strong> The fixed total strategy is more aggressive and financially 
                optimal. However, if you need increasing financial flexibility as debts are eliminated, the 
                decreasing strategy may be more sustainable for your situation.
              </p>
            </div>
          </div>

          {/* Section 8: Alternative Methods for Managing Debt */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-red-600">🆘</span>
              When Standard Payoff Isn't Enough
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Sometimes borrowers face situations where they cannot repay mounting debts through standard methods. 
                Financial hardship, medical emergencies, job loss, or poor financial decisions can create 
                insurmountable debt burdens. In these cases, alternative solutions exist:
              </p>

              {/* Debt Management */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-blue-900 mb-2">📋 Debt Management Plans (DMP)</h4>
                <p className="text-sm mb-2">
                  Debt management involves working with a credit counseling agency to negotiate with creditors 
                  and create a structured repayment plan.
                </p>
                <p className="text-sm font-semibold mb-1">How It Works:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm mb-2">
                  <li>Consult with an approved credit counseling agency (U.S. Dept. of Justice maintains a list)</li>
                  <li>Counselor reviews your financial situation and negotiates with creditors</li>
                  <li>May reduce interest rates or monthly payments</li>
                  <li>You make one payment to the agency, which distributes to creditors</li>
                  <li>Typically requires closing credit cards to prevent new debt</li>
                  <li>Plans usually last 3-5 years</li>
                </ul>
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div>
                    <strong className="text-green-700">✅ Pros:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      <li>Lower interest rates possible</li>
                      <li>One simplified payment</li>
                      <li>Stops creditor harassment</li>
                      <li>Professional guidance</li>
                    </ul>
                  </div>
                  <div>
                    <strong className="text-red-700">❌ Cons:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      <li>Fees for agency services</li>
                      <li>Temporary credit score impact</li>
                      <li>Must close credit accounts</li>
                      <li>Requires strict discipline</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Debt Settlement */}
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 my-3">
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Debt Settlement</h4>
                <p className="text-sm mb-2">
                  Debt settlement involves negotiating with creditors to accept less than the full amount owed 
                  as payment in full.
                </p>
                <p className="text-sm font-semibold mb-1">How It Works:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm mb-2">
                  <li>Negotiate directly or through a debt settlement company</li>
                  <li>Typically results in 45-50% debt reduction</li>
                  <li>Additional 20% of outstanding balance goes to settlement company fees</li>
                  <li>Must have lump sum available or saved up</li>
                  <li>Creditors must agree (not guaranteed)</li>
                </ul>
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-3">
                  <strong className="text-red-900">⚠️ Serious Consequences:</strong>
                  <ul className="list-disc pl-5 text-sm mt-2 text-red-900 space-y-1">
                    <li><strong>Major credit score damage</strong> (often 100+ points, lasting 7 years)</li>
                    <li><strong>Tax implications:</strong> Forgiven debt is treated as taxable income by the IRS</li>
                    <li><strong>Collection actions:</strong> Creditors may sue during negotiation</li>
                    <li><strong>High fees:</strong> Settlement companies charge 15-25% of enrolled debt</li>
                    <li><strong>No guarantee:</strong> Creditors aren't required to settle</li>
                  </ul>
                </div>
              </div>

              {/* Bankruptcy */}
              <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 my-3">
                <h4 className="font-bold text-red-900 mb-2">🚨 Bankruptcy (Last Resort)</h4>
                <p className="text-sm mb-3">
                  Bankruptcy is a legal process that provides relief from overwhelming debt but comes with severe 
                  long-term consequences. Six types exist, but only two typically apply to individuals:
                </p>
                
                <div className="space-y-3">
                  <div className="bg-white border-2 border-red-300 rounded p-3">
                    <h5 className="font-bold text-red-900 mb-1">Chapter 7 Bankruptcy (Liquidation)</h5>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Discharges most unsecured debts (credit cards, medical bills, personal loans)</li>
                      <li>May require selling assets to pay creditors</li>
                      <li>Cannot discharge student loans, taxes, child support, alimony</li>
                      <li>Process takes 4-6 months</li>
                      <li>Means test determines eligibility (income-based)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white border-2 border-red-300 rounded p-3">
                    <h5 className="font-bold text-red-900 mb-1">Chapter 13 Bankruptcy (Reorganization)</h5>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Creates 3-5 year court-approved repayment plan</li>
                      <li>Allows keeping valuable assets (home, car)</li>
                      <li>Remaining eligible debt discharged after plan completion</li>
                      <li>Must have regular income to qualify</li>
                      <li>More expensive due to longer attorney and court involvement</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-100 border-l-4 border-red-600 p-3 mt-3">
                  <strong className="text-red-900">💥 Long-Term Consequences:</strong>
                  <ul className="list-disc pl-5 text-sm mt-2 text-red-900 space-y-1">
                    <li><strong>Credit report damage:</strong> Remains 7-10 years</li>
                    <li><strong>Difficulty obtaining credit:</strong> Higher rates, lower limits, or denials</li>
                    <li><strong>Employment challenges:</strong> Some employers check bankruptcy history</li>
                    <li><strong>Housing difficulties:</strong> Landlords may deny rental applications</li>
                    <li><strong>Professional licenses:</strong> Some professions view bankruptcy unfavorably</li>
                    <li><strong>Public record:</strong> Bankruptcy filings are public information</li>
                  </ul>
                </div>
              </div>

              <p className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
                <strong>⚖️ Important:</strong> These alternatives should be considered only after exhausting 
                standard repayment methods. Each carries significant consequences that can affect your financial 
                life for years. Consult with a qualified financial advisor, credit counselor, or bankruptcy 
                attorney before pursuing these options. Many financial advisors recommend avoiding these methods 
                unless absolutely necessary.
              </p>
            </div>
          </div>

          {/* Section 9: Tips for Successful Debt Payoff */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">💪</span>
              Strategies for Successful Debt Elimination
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Successfully eliminating debt requires both financial strategy and behavioral change. Here are 
                proven tactics to help you achieve debt freedom:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <h4 className="font-bold text-green-900 mb-3">📊 Financial Strategies</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">1.</span>
                      <span><strong>Create a realistic budget:</strong> Track every dollar to find money for 
                      extra payments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">2.</span>
                      <span><strong>Build a mini emergency fund:</strong> Save $1,000-$2,000 to avoid new debt 
                      when surprises happen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">3.</span>
                      <span><strong>Negotiate interest rates:</strong> Call creditors and request lower rates, 
                      especially if you have good payment history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">4.</span>
                      <span><strong>Use windfalls wisely:</strong> Apply tax refunds, bonuses, and gifts to 
                      debt reduction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">5.</span>
                      <span><strong>Automate payments:</strong> Set up automatic payments to ensure consistency 
                      and avoid late fees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">6.</span>
                      <span><strong>Round up payments:</strong> Pay $550 instead of $523, for example—it adds 
                      up over time</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-3">🧠 Behavioral Strategies</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span><strong>Stop creating new debt:</strong> Commit to using cash or debit for purchases 
                      while paying off debt</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span><strong>Find extra income:</strong> Consider a side hustle, freelancing, or selling 
                      unused items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span><strong>Cut unnecessary expenses:</strong> Temporarily reduce dining out, 
                      subscriptions, and entertainment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span><strong>Celebrate milestones:</strong> Reward progress with inexpensive treats to 
                      maintain motivation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">5.</span>
                      <span><strong>Visualize success:</strong> Use this calculator regularly to see your 
                      progress and stay motivated</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">6.</span>
                      <span><strong>Get accountability:</strong> Share goals with a trusted friend or join a 
                      debt payoff community</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <strong>🎯 The Best Method is the One You'll Follow:</strong> Whether you choose avalanche or 
                snowball, fixed or decreasing payments, the most important factor is consistency. Pick a strategy 
                that fits your personality and financial situation, then commit to it. Small progress is better 
                than no progress.
              </p>
            </div>
          </div>

          {/* Section 10: How to Use This Calculator */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📱</span>
              How to Use This Debt Payoff Calculator
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                This calculator helps you create an optimized debt elimination plan using the Debt Avalanche method. 
                Follow these steps to maximize its effectiveness:
              </p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Enter Your Debts:</strong> For each debt, provide the debt name, remaining balance, 
                  monthly/minimum payment, and interest rate (APR). Be accurate with these numbers—check recent 
                  statements if needed. You can add or remove debts using the buttons provided.
                </li>
                <li>
                  <strong>Add Extra Payments (Optional):</strong> Enter any additional funds you can allocate 
                  toward debt elimination:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Extra monthly payment: Consistent amount added each month</li>
                    <li>Extra yearly payment: Once-per-year bonus (tax refund, annual bonus, etc.)</li>
                    <li>One-time payment: Single windfall applied in a specific month</li>
                  </ul>
                </li>
                <li>
                  <strong>Choose Payment Strategy:</strong> Select whether you want a fixed total payment (recommended 
                  for fastest payoff) or decreasing total as debts are eliminated (better for flexibility).
                </li>
                <li>
                  <strong>Review Results:</strong> The calculator instantly displays:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Total time to become debt-free</li>
                    <li>Total amount paid (principal + interest)</li>
                    <li>Total interest costs</li>
                    <li>Payoff order by priority (highest interest rate first)</li>
                    <li>Interactive visualizations showing your progress over time</li>
                  </ul>
                </li>
                <li>
                  <strong>Experiment with Scenarios:</strong> Try different extra payment amounts to see how they 
                  affect your timeline and total cost. Even small additional payments can make a significant 
                  difference over time.
                </li>
                <li>
                  <strong>Create Your Action Plan:</strong> Use the payoff order shown in the results to know 
                  exactly which debt to focus on each month. Make minimum payments on all debts, then apply all 
                  extra funds to the highest-interest debt.
                </li>
                <li>
                  <strong>Track Your Progress:</strong> Return to this calculator monthly to update balances and 
                  celebrate your progress. Adjust your extra payments as your financial situation changes.
                </li>
              </ol>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
                <h4 className="font-bold text-blue-900 mb-2">💡 Pro Tips:</h4>
                <ul className="list-disc pl-6 space-y-1.5 text-sm">
                  <li>Update interest rates regularly—they may change, especially on credit cards</li>
                  <li>If you get a raise, immediately allocate some or all of it to extra debt payments</li>
                  <li>Review your budget monthly to find additional funds for debt elimination</li>
                  <li>Consider temporarily reducing retirement contributions (but keep employer match) to 
                  accelerate high-interest debt payoff</li>
                  <li>Once you pay off a debt, immediately redirect that payment to the next debt—don't let 
                  lifestyle inflation consume it</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final Note */}
          <div className="border-t pt-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🌟</span>
                Your Path to Financial Freedom
              </h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Becoming debt-free is one of the most empowering financial achievements you can accomplish. While 
                the journey may seem daunting when you start, remember that every payment brings you closer to 
                freedom. The Debt Avalanche method used by this calculator represents the most mathematically 
                efficient path forward, but the most important factor is your commitment to the process.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
                Stay focused on your goal, celebrate small victories along the way, and don't hesitate to adjust 
                your strategy if circumstances change. Financial freedom is worth the discipline and sacrifice. 
                You've got this! 💪
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
