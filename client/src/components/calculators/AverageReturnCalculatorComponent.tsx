import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Info, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  AlertCircle, 
  RefreshCw,
  Plus,
  Minus,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

type ActivityType = 'deposit' | 'withdraw';
type CalculationMode = 'cashFlow' | 'cumulative';

interface CashFlowActivity {
  id: number;
  type: ActivityType;
  amount: number;
  date: string;
}

interface InvestmentReturn {
  id: number;
  returnPercent: number;
  years: number;
  months: number;
}

interface CashFlowResults {
  averageAnnualReturn: number;
  totalDays: number;
  totalYears: number;
  netCashFlow: number;
  timeWeightedReturn: number;
}

interface CumulativeResults {
  averageReturn: number;
  cumulativeReturn: number;
  totalPeriodYears: number;
  annualizedReturn: number;
}

const AverageReturnCalculatorComponent: React.FC = () => {
  const [calculationMode, setCalculationMode] = useState<CalculationMode>('cashFlow');

  // Cash Flow Calculator State
  const [startingBalance, setStartingBalance] = useState<number>(5600);
  const [startingDate, setStartingDate] = useState<string>('2022-01-01');
  const [endingBalance, setEndingBalance] = useState<number>(18000);
  const [endingDate, setEndingDate] = useState<string>('2025-10-20');
  const [activities, setActivities] = useState<CashFlowActivity[]>([
    { id: 1, type: 'deposit', amount: 5000, date: '2023-01-15' },
    { id: 2, type: 'withdraw', amount: 1500, date: '2023-06-01' },
    { id: 3, type: 'deposit', amount: 3800, date: '2024-01-18' },
  ]);

  // Cumulative Return Calculator State
  const [investmentReturns, setInvestmentReturns] = useState<InvestmentReturn[]>([
    { id: 1, returnPercent: 10, years: 1, months: 2 },
    { id: 2, returnPercent: -2, years: 0, months: 5 },
    { id: 3, returnPercent: 15, years: 2, months: 3 },
  ]);

  const [cashFlowResults, setCashFlowResults] = useState<CashFlowResults | null>(null);
  const [cumulativeResults, setCumulativeResults] = useState<CumulativeResults | null>(null);

  useEffect(() => {
    if (calculationMode === 'cashFlow') {
      calculateCashFlowReturn();
    } else {
      calculateCumulativeReturn();
    }
  }, [
    calculationMode,
    startingBalance,
    startingDate,
    endingBalance,
    endingDate,
    activities,
    investmentReturns
  ]);

  // Cash Flow Calculation using XIRR approximation
  const calculateCashFlowReturn = () => {
    try {
      if (startingBalance <= 0 || endingBalance <= 0) {
        setCashFlowResults(null);
        return;
      }

      const start = new Date(startingDate);
      const end = new Date(endingDate);

      if (end <= start) {
        setCashFlowResults(null);
        return;
      }

      // Calculate total days and years
      const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalYears = totalDays / 365.25;

      if (totalYears <= 0) {
        setCashFlowResults(null);
        return;
      }

      // Calculate net cash flow
      let netCashFlow = 0;
      activities.forEach(activity => {
        if (activity.amount > 0) {
          if (activity.type === 'deposit') {
            netCashFlow += activity.amount;
          } else {
            netCashFlow -= activity.amount;
          }
        }
      });

      // Use Newton-Raphson method to find IRR
      const cashFlows: Array<{ date: Date; amount: number }> = [];
      
      // Starting balance (negative because it's an outflow)
      cashFlows.push({ date: start, amount: -startingBalance });
      
      // Add all activities
      activities.forEach(activity => {
        if (activity.amount > 0 && activity.date) {
          const activityDate = new Date(activity.date);
          if (activityDate >= start && activityDate <= end) {
            const amount = activity.type === 'deposit' ? -activity.amount : activity.amount;
            cashFlows.push({ date: activityDate, amount });
          }
        }
      });
      
      // Ending balance (positive because it's an inflow)
      cashFlows.push({ date: end, amount: endingBalance });

      // Calculate IRR using Newton-Raphson method
      const calculateXIRR = (flows: Array<{ date: Date; amount: number }>, guess: number = 0.1): number => {
        const maxIterations = 100;
        const tolerance = 0.0001;
        let rate = guess;

        for (let i = 0; i < maxIterations; i++) {
          let npv = 0;
          let dnpv = 0;
          const baseDate = flows[0].date.getTime();

          flows.forEach(flow => {
            const years = (flow.date.getTime() - baseDate) / (1000 * 60 * 60 * 24 * 365.25);
            const factor = Math.pow(1 + rate, years);
            npv += flow.amount / factor;
            dnpv -= flow.amount * years / (factor * (1 + rate));
          });

          const newRate = rate - npv / dnpv;

          if (Math.abs(newRate - rate) < tolerance) {
            return newRate;
          }

          rate = newRate;

          // Prevent extreme values
          if (rate < -0.99) rate = -0.99;
          if (rate > 10) rate = 10;
        }

        return rate;
      };

      let averageAnnualReturn = 0;
      try {
        averageAnnualReturn = calculateXIRR(cashFlows);
      } catch (error) {
        // Fallback to simple calculation if XIRR fails
        const totalReturn = endingBalance - startingBalance - netCashFlow;
        const avgInvestment = (startingBalance + endingBalance) / 2;
        averageAnnualReturn = (totalReturn / avgInvestment) / totalYears;
      }

      // Calculate time-weighted return (simple geometric mean)
      const totalGain = endingBalance - startingBalance - netCashFlow;
      const avgBalance = (startingBalance + endingBalance) / 2;
      const timeWeightedReturn = (totalGain / avgBalance) * 100;

      setCashFlowResults({
        averageAnnualReturn: averageAnnualReturn * 100,
        totalDays,
        totalYears,
        netCashFlow,
        timeWeightedReturn
      });
    } catch (error) {
      console.error('Error calculating cash flow return:', error);
      setCashFlowResults(null);
    }
  };

  // Cumulative Return Calculation
  const calculateCumulativeReturn = () => {
    try {
      const validReturns = investmentReturns.filter(
        ret => ret.returnPercent !== 0 || ret.years > 0 || ret.months > 0
      );

      if (validReturns.length === 0) {
        setCumulativeResults(null);
        return;
      }

      let totalPeriodYears = 0;
      let cumulativeMultiplier = 1;

      validReturns.forEach(ret => {
        const periodYears = ret.years + ret.months / 12;
        totalPeriodYears += periodYears;
        
        // Calculate cumulative return
        cumulativeMultiplier *= (1 + ret.returnPercent / 100);
      });

      // Cumulative return as percentage
      const cumulativeReturn = (cumulativeMultiplier - 1) * 100;

      // Average return (arithmetic mean)
      const sumReturns = validReturns.reduce((sum, ret) => sum + ret.returnPercent, 0);
      const averageReturn = sumReturns / validReturns.length;

      // Annualized return (geometric mean)
      let annualizedReturn = 0;
      if (totalPeriodYears > 0) {
        annualizedReturn = (Math.pow(cumulativeMultiplier, 1 / totalPeriodYears) - 1) * 100;
      }

      setCumulativeResults({
        averageReturn,
        cumulativeReturn,
        totalPeriodYears,
        annualizedReturn
      });
    } catch (error) {
      console.error('Error calculating cumulative return:', error);
      setCumulativeResults(null);
    }
  };

  // Activity Management
  const addActivity = () => {
    const newId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1;
    setActivities([...activities, { id: newId, type: 'deposit', amount: 0, date: '2023-01-01' }]);
  };

  const removeActivity = (id: number) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const updateActivity = (id: number, field: keyof CashFlowActivity, value: any) => {
    setActivities(activities.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // Investment Return Management
  const addInvestmentReturn = () => {
    const newId = investmentReturns.length > 0 ? Math.max(...investmentReturns.map(r => r.id)) + 1 : 1;
    setInvestmentReturns([...investmentReturns, { id: newId, returnPercent: 0, years: 0, months: 0 }]);
  };

  const removeInvestmentReturn = (id: number) => {
    setInvestmentReturns(investmentReturns.filter(r => r.id !== id));
  };

  const updateInvestmentReturn = (id: number, field: keyof InvestmentReturn, value: any) => {
    setInvestmentReturns(investmentReturns.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleReset = () => {
    if (calculationMode === 'cashFlow') {
      setStartingBalance(5600);
      setStartingDate('2022-01-01');
      setEndingBalance(18000);
      setEndingDate('2025-10-20');
      setActivities([
        { id: 1, type: 'deposit', amount: 5000, date: '2023-01-15' },
        { id: 2, type: 'withdraw', amount: 1500, date: '2023-06-01' },
        { id: 3, type: 'deposit', amount: 3800, date: '2024-01-18' },
      ]);
    } else {
      setInvestmentReturns([
        { id: 1, returnPercent: 10, years: 1, months: 2 },
        { id: 2, returnPercent: -2, years: 0, months: 5 },
        { id: 3, returnPercent: 15, years: 2, months: 3 },
      ]);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Prepare chart data for cash flow
  const cashFlowChartData = cashFlowResults ? [
    { name: 'Starting Balance', value: startingBalance, fill: '#3b82f6' },
    { name: 'Net Cash Flow', value: Math.abs(cashFlowResults.netCashFlow), fill: cashFlowResults.netCashFlow >= 0 ? '#10b981' : '#ef4444' },
    { name: 'Ending Balance', value: endingBalance, fill: '#8b5cf6' },
  ] : [];

  // Prepare chart data for cumulative returns
  const cumulativeChartData = investmentReturns
    .filter(ret => ret.returnPercent !== 0 || ret.years > 0 || ret.months > 0)
    .map((ret, index) => ({
      name: `Period ${index + 1}`,
      return: ret.returnPercent,
      duration: ret.years + ret.months / 12
    }));

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          Average Return Calculator
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
          Calculate average returns based on cash flows or multiple investment returns with different holding periods
        </p>
      </div>

      {/* Mode Selector */}
      <Card className="shadow-lg border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label className="text-base font-semibold whitespace-nowrap">Calculation Method:</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <Button
                onClick={() => setCalculationMode('cashFlow')}
                variant={calculationMode === 'cashFlow' ? 'default' : 'outline'}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Cash Flow Based
              </Button>
              <Button
                onClick={() => setCalculationMode('cumulative')}
                variant={calculationMode === 'cumulative' ? 'default' : 'outline'}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Cumulative Return
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Calculator */}
      {calculationMode === 'cashFlow' && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Calculator className="h-6 w-6 text-blue-600" />
                Average Return Based on Cash Flow
              </CardTitle>
              <CardDescription>
                Calculate the average annual return based on starting/ending balances and cash flow activities
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Starting and Ending Balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Starting Balance
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="startingBalance">Amount ($)</Label>
                    <Input
                      id="startingBalance"
                      type="number"
                      value={startingBalance}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStartingBalance(value === '' ? 0 : parseFloat(value));
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < 0) {
                          setStartingBalance(0);
                        }
                      }}
                      min="0"
                      step="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startingDate">Date</Label>
                    <Input
                      id="startingDate"
                      type="date"
                      value={startingDate}
                      onChange={(e) => setStartingDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Ending Balance
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="endingBalance">Amount ($)</Label>
                    <Input
                      id="endingBalance"
                      type="number"
                      value={endingBalance}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEndingBalance(value === '' ? 0 : parseFloat(value));
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < 0) {
                          setEndingBalance(0);
                        }
                      }}
                      min="0"
                      step="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endingDate">Date</Label>
                    <Input
                      id="endingDate"
                      type="date"
                      value={endingDate}
                      onChange={(e) => setEndingDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg">Cash Flow Activities</h3>
                  <Button onClick={addActivity} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Activity
                  </Button>
                </div>

                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="sm:col-span-1 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">{index + 1}.</span>
                      </div>
                      
                      <div className="sm:col-span-3">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={activity.type}
                          onValueChange={(value: ActivityType) => updateActivity(activity.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="withdraw">Withdraw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs">Amount ($)</Label>
                        <Input
                          type="number"
                          value={activity.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateActivity(activity.id, 'amount', value === '' ? 0 : parseFloat(value));
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) {
                              updateActivity(activity.id, 'amount', 0);
                            }
                          }}
                          min="0"
                          step="100"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={activity.date}
                          onChange={(e) => updateActivity(activity.id, 'date', e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-center">
                        <Button
                          onClick={() => removeActivity(activity.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>

          {/* Cash Flow Results */}
          {cashFlowResults && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Annual Return</p>
                        <p className={`text-xl sm:text-2xl font-bold ${cashFlowResults.averageAnnualReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(cashFlowResults.averageAnnualReturn)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Time Period</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {cashFlowResults.totalYears.toFixed(2)} <span className="text-base">years</span>
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Net Cash Flow</p>
                        <p className={`text-xl sm:text-2xl font-bold ${cashFlowResults.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlowResults.netCashFlow)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Days</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {cashFlowResults.totalDays.toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Balance Visualization */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Balance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cashFlowChartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      >
                        {cashFlowChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Information Box */}
              <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Understanding Your Results</p>
                      <p>
                        The <strong>average annual return</strong> is calculated using the Internal Rate of Return (IRR) method, 
                        which accounts for the time value of money. This means it considers both the timing and amount of 
                        cash flows (deposits and withdrawals) throughout the investment period.
                      </p>
                      <p>
                        A positive return indicates your investments grew faster than your contributions, while a negative 
                        return suggests the opposite. The calculation assumes all activities occurred on the specified dates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Cumulative Return Calculator */}
      {calculationMode === 'cumulative' && (
        <>
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <PieChartIcon className="h-6 w-6 text-purple-600" />
                Average and Cumulative Return
              </CardTitle>
              <CardDescription>
                Calculate average annual return and cumulative return for multiple investment periods
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg">Investment Returns</h3>
                  <Button onClick={addInvestmentReturn} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Return
                  </Button>
                </div>

                <div className="space-y-3">
                  {investmentReturns.map((ret, index) => (
                    <div key={ret.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="sm:col-span-1 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">{index + 1}.</span>
                      </div>

                      <div className="sm:col-span-4">
                        <Label className="text-xs">Return (%)</Label>
                        <Input
                          type="number"
                          value={ret.returnPercent}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateInvestmentReturn(ret.id, 'returnPercent', value === '' || value === '-' ? 0 : parseFloat(value));
                          }}
                          step="0.1"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs">Years</Label>
                        <Input
                          type="number"
                          value={ret.years}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateInvestmentReturn(ret.id, 'years', value === '' ? 0 : parseFloat(value));
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) {
                              updateInvestmentReturn(ret.id, 'years', 0);
                            }
                          }}
                          min="0"
                          step="1"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <Label className="text-xs">Months</Label>
                        <Input
                          type="number"
                          value={ret.months}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateInvestmentReturn(ret.id, 'months', value === '' ? 0 : parseFloat(value));
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 0) {
                              updateInvestmentReturn(ret.id, 'months', 0);
                            } else if (value >= 12) {
                              updateInvestmentReturn(ret.id, 'months', 11);
                            }
                          }}
                          min="0"
                          max="11"
                          step="1"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-end justify-center">
                        <Button
                          onClick={() => removeInvestmentReturn(ret.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </CardContent>
          </Card>

          {/* Cumulative Results */}
          {cumulativeResults && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-md border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Return</p>
                        <p className={`text-xl sm:text-2xl font-bold ${cumulativeResults.averageReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(cumulativeResults.averageReturn)}
                        </p>
                      </div>
                      <Calculator className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Cumulative Return</p>
                        <p className={`text-xl sm:text-2xl font-bold ${cumulativeResults.cumulativeReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(cumulativeResults.cumulativeReturn)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Annualized Return</p>
                        <p className={`text-xl sm:text-2xl font-bold ${cumulativeResults.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(cumulativeResults.annualizedReturn)}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Period</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {cumulativeResults.totalPeriodYears.toFixed(2)} <span className="text-base">yrs</span>
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Returns Visualization */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Returns by Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cumulativeChartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#666"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === 'return') return [`${value.toFixed(2)}%`, 'Return'];
                          return [`${value.toFixed(2)} years`, 'Duration'];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconSize={12}
                      />
                      <Bar 
                        dataKey="return" 
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Return (%)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Information Box */}
              <Card className="shadow-md bg-gradient-to-r from-purple-50 to-pink-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">Understanding Your Results</p>
                      <p>
                        <strong>Average Return</strong> is the arithmetic mean of all returns (sum divided by count). 
                        It provides a simple average but doesn't account for compounding effects.
                      </p>
                      <p>
                        <strong>Cumulative Return</strong> is the total return across all periods, showing the aggregate 
                        gain or loss. For example, returns of 10%, -5%, and 15% compound to a cumulative return.
                      </p>
                      <p>
                        <strong>Annualized Return</strong> (geometric mean) normalizes the cumulative return to an 
                        annual basis, accounting for compounding. This is the most accurate measure for comparing 
                        performance across different time periods.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Educational Content */}
      <div className="mt-12 space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Understanding Investment Returns
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Learn about different return metrics, how they're calculated, and which ones 
            provide the most meaningful insights for investment performance evaluation.
          </p>
        </div>

        {/* What is Average Return */}
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-blue-900">
              <Calculator className="h-6 w-6" />
              What is Average Return?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                <strong>Average return</strong> is a mathematical measure used to evaluate the performance of an 
                investment or portfolio over a period of time. It can be calculated in two primary ways, each 
                serving different purposes and providing different insights into investment performance.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Two Types of Average Return:</h4>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-semibold text-blue-800 mb-1">1. Cash Flow-Based Average Return (Time-Weighted)</h5>
                    <p className="text-sm">
                      This method calculates the rate at which a beginning balance grows to become the ending 
                      balance, accounting for all deposits and withdrawals made during the period. It uses the 
                      <strong> Internal Rate of Return (IRR)</strong> methodology, which considers the time 
                      value of money—the principle that a dollar today is worth more than a dollar tomorrow.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Best for:</strong> Evaluating your actual investment performance when you make 
                      regular contributions or withdrawals (like 401(k) accounts, savings plans, or portfolios 
                      with frequent trading).
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-blue-800 mb-1">2. Arithmetic Average Return (Multiple Periods)</h5>
                    <p className="text-sm">
                      This calculates the simple average of multiple returns over different periods by summing 
                      all returns and dividing by the number of periods. While easy to calculate, it doesn't 
                      account for compounding effects.
                    </p>
                    <p className="text-sm mt-2">
                      <strong>Best for:</strong> Quick assessments or when evaluating independent investment 
                      decisions across different time periods.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Example: Cash Flow-Based Return</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Scenario:</strong> You track your investment account over 3 years.</p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>January 1, 2022:</strong> Starting balance = $5,600</li>
                    <li>• <strong>January 15, 2023:</strong> Deposit $5,000</li>
                    <li>• <strong>June 1, 2023:</strong> Withdraw $1,500</li>
                    <li>• <strong>January 18, 2024:</strong> Deposit $3,800</li>
                    <li>• <strong>October 20, 2025:</strong> Ending balance = $18,000</li>
                  </ul>
                  <p className="mt-2">
                    The calculator determines that your investments generated an average annual return of 
                    approximately <strong>14-16%</strong> (varies based on exact timing), accounting for when 
                    each cash flow occurred. This means your money grew at this rate, separate from your 
                    contributions.
                  </p>
                </div>
              </div>

              <p>
                The time value of money is critical in these calculations. Money invested earlier has more time 
                to compound and grow, so a $1,000 deposit made at the beginning of the period has more impact 
                on returns than the same deposit made near the end. This is why the IRR method provides a more 
                accurate picture of investment performance than simple arithmetic averages.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Average Rate of Return (ARR) */}
        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-purple-900">
              <BarChart3 className="h-6 w-6" />
              Average Rate of Return (ARR)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                The <strong>Average Rate of Return (ARR)</strong>, also known as the accounting rate of return, 
                represents the average annual cash flow generated over the life of an investment, typically 
                expressed as a percentage of the initial investment. Unlike the IRR-based calculations above, 
                ARR <strong>does not account for the time value of money</strong>.
              </p>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-3">ARR Formula:</h4>
                <div className="bg-white p-4 rounded border border-purple-300 font-mono text-sm">
                  ARR = (Average Annual Profit ÷ Initial Investment) × 100%
                </div>
                <p className="text-xs text-purple-800 mt-2">
                  Where average annual profit is the total profit over the investment's life divided by the 
                  number of years.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example Calculation:</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Scenario:</strong> You invest $10,000 in equipment for your business.</p>
                  <ul className="ml-4 space-y-1">
                    <li>• Initial Investment: $10,000</li>
                    <li>• Expected Life: 5 years</li>
                    <li>• Total Profit Over 5 Years: $8,000</li>
                    <li>• Salvage Value at End: $2,000</li>
                  </ul>
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <div className="ml-4 space-y-1 font-mono text-xs">
                    <div>Average Annual Profit = $8,000 ÷ 5 years = $1,600/year</div>
                    <div>ARR = ($1,600 ÷ $10,000) × 100% = <strong>16%</strong></div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Limitations of ARR
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>
                      <strong>Ignores time value of money:</strong> $1,000 received in year 1 is treated the 
                      same as $1,000 received in year 5
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>
                      <strong>No consideration of cash flow timing:</strong> Doesn't account for when profits 
                      are actually received
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">•</span>
                    <span>
                      <strong>Risk not factored in:</strong> Two investments with the same ARR might have 
                      vastly different risk profiles
                    </span>
                  </li>
                </ul>
                <p className="text-sm mt-3 font-semibold text-amber-900">
                  Recommendation: Use ARR in conjunction with other metrics like Net Present Value (NPV) or 
                  Internal Rate of Return (IRR) for comprehensive investment analysis.
                </p>
              </div>

              <p>
                Despite its limitations, ARR is popular because it's simple to calculate and understand. It's 
                particularly useful for quick comparisons or when precise cash flow timing isn't critical to 
                the decision. Many businesses use it as a screening tool—if an investment doesn't meet a 
                minimum ARR threshold (e.g., 15%), it's eliminated from further consideration.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Return */}
        <Card className="border-l-4 border-l-green-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-green-900">
              <TrendingUp className="h-6 w-6" />
              Cumulative Return
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                <strong>Cumulative return</strong> represents the aggregate amount an investment gains or loses 
                over its entire holding period, irrespective of the time frame. It answers the simple question: 
                "How much did my investment grow (or shrink) in total?" Cumulative return can be expressed as 
                either a dollar amount or a percentage.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Cumulative Return Formula:</h4>
                <div className="bg-white p-4 rounded border border-green-300 font-mono text-sm">
                  Cumulative Return = [(Ending Value ÷ Beginning Value) - 1] × 100%
                </div>
                <p className="text-xs text-green-800 mt-2">
                  Or when multiple periods are involved: multiply all (1 + return) factors together
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example: Single Period</h4>
                <div className="space-y-2 text-sm">
                  <ul className="ml-4 space-y-1">
                    <li>• Beginning Value: $10,000</li>
                    <li>• Ending Value: $13,500</li>
                  </ul>
                  <p className="mt-2 font-mono text-xs">
                    Cumulative Return = [($13,500 ÷ $10,000) - 1] × 100% = <strong>35%</strong>
                  </p>
                  <p className="mt-2">
                    Your investment gained 35% over the entire period, regardless of whether that period was 
                    1 year or 10 years.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Example: Multiple Periods with Compounding</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Investment Returns:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Period 1: +10% over 1.17 years (1 year, 2 months)</li>
                    <li>• Period 2: -2% over 0.42 years (5 months)</li>
                    <li>• Period 3: +15% over 2.25 years (2 years, 3 months)</li>
                  </ul>
                  <p className="mt-3"><strong>Calculation:</strong></p>
                  <div className="ml-4 font-mono text-xs space-y-1">
                    <div>Cumulative Multiplier = (1 + 0.10) × (1 - 0.02) × (1 + 0.15)</div>
                    <div>Cumulative Multiplier = 1.10 × 0.98 × 1.15 = 1.2397</div>
                    <div>Cumulative Return = (1.2397 - 1) × 100% = <strong>+23.97%</strong></div>
                  </div>
                  <p className="mt-2">
                    Despite having a negative period, your overall cumulative return is nearly 24% across all 
                    three investment periods.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <h5 className="font-semibold text-green-900 mb-2 text-sm">Advantages</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Simple to understand and calculate</li>
                    <li>• Shows total performance clearly</li>
                    <li>• Useful for comparing absolute gains</li>
                    <li>• No complex mathematics required</li>
                  </ul>
                </div>
                <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                  <h5 className="font-semibold text-red-900 mb-2 text-sm">Disadvantages</h5>
                  <ul className="space-y-1 text-xs">
                    <li>• Doesn't normalize for time</li>
                    <li>• Can't compare investments with different durations</li>
                    <li>• Less useful for standardized performance metrics</li>
                    <li>• Ignores the investment timeline</li>
                  </ul>
                </div>
              </div>

              <p>
                Cumulative return is generally contrasted with <strong>annual return</strong>, which measures 
                performance for a single year only. While cumulative return tells you the total journey, annual 
                return provides year-by-year snapshots. Most financial reporting uses annualized figures for 
                standardized comparisons, making cumulative return less common in professional contexts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Annualized Return vs Average Return */}
        <Card className="border-l-4 border-l-orange-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-orange-900">
              <Calendar className="h-6 w-6" />
              Annualized Return vs. Average Return
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                Understanding the difference between <strong>annualized return</strong> (geometric mean) and 
                <strong>average return</strong> (arithmetic mean) is crucial for accurate performance evaluation. 
                These two metrics often produce different results, and using the wrong one can lead to 
                misleading conclusions.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-orange-100 border-b-2 border-orange-300">
                      <th className="text-left py-3 px-3 font-semibold text-orange-900">Metric</th>
                      <th className="text-left py-3 px-3 font-semibold text-orange-900">Formula</th>
                      <th className="text-left py-3 px-3 font-semibold text-orange-900">Accounts for Compounding</th>
                      <th className="text-left py-3 px-3 font-semibold text-orange-900">Best Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-100 bg-white">
                      <td className="py-3 px-3 font-medium">Average Return (Arithmetic)</td>
                      <td className="py-3 px-3 font-mono text-xs">Sum ÷ Count</td>
                      <td className="py-3 px-3">No</td>
                      <td className="py-3 px-3">Quick estimates, independent periods</td>
                    </tr>
                    <tr className="bg-orange-50">
                      <td className="py-3 px-3 font-medium">Annualized Return (Geometric)</td>
                      <td className="py-3 px-3 font-mono text-xs">(Product)^(1/n) - 1</td>
                      <td className="py-3 px-3">Yes</td>
                      <td className="py-3 px-3">Actual performance, long-term growth</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Example: Why They Differ</h4>
                <div className="space-y-3 text-sm">
                  <p><strong>Investment returns over 3 years:</strong> +50%, -30%, +20%</p>
                  
                  <div className="bg-white p-3 rounded border border-gray-300">
                    <p className="font-semibold text-blue-900 mb-2">Average Return (Arithmetic Mean):</p>
                    <div className="font-mono text-xs space-y-1">
                      <div>Average = (50% + (-30%) + 20%) ÷ 3 = 40% ÷ 3 = <strong>13.33%</strong></div>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-300">
                    <p className="font-semibold text-green-900 mb-2">Annualized Return (Geometric Mean):</p>
                    <div className="font-mono text-xs space-y-1">
                      <div>Start with $100:</div>
                      <div>After Year 1: $100 × 1.50 = $150</div>
                      <div>After Year 2: $150 × 0.70 = $105</div>
                      <div>After Year 3: $105 × 1.20 = $126</div>
                      <div>Total Growth: 26% over 3 years</div>
                      <div>Annualized: (1.26)^(1/3) - 1 = <strong>8.01%</strong></div>
                    </div>
                  </div>

                  <p className="font-semibold text-red-700">
                    The arithmetic average (13.33%) significantly overstates performance compared to the 
                    actual annualized return (8.01%)! This gap widens with more volatile returns.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Which Should You Use?</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>Use Annualized Return (Geometric)</strong> when evaluating actual investment 
                      performance over multiple periods, especially with volatile returns. This is the industry 
                      standard for reporting fund performance.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>Use Average Return (Arithmetic)</strong> when making forward-looking projections 
                      or when periods are independent (like evaluating different investment opportunities).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>The more volatile the returns, the greater the gap</strong> between arithmetic 
                      and geometric means. Always be aware which measure is being reported.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Value of Money */}
        <Card className="border-l-4 border-l-indigo-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-indigo-900">
              <DollarSign className="h-6 w-6" />
              The Time Value of Money
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <p>
                The <strong>time value of money (TVM)</strong> is a foundational concept in finance stating 
                that a dollar available today is worth more than a dollar available in the future. This isn't 
                about inflation alone—it's about the opportunity cost of capital. Money available now can be 
                invested to generate returns, making it inherently more valuable than the same amount received later.
              </p>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3">Why TVM Matters for Return Calculations:</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-indigo-800">Scenario 1: No TVM Consideration</p>
                    <p>You invest $10,000 and after 5 years have $15,000. Simple calculation: 50% total return, 
                    or 10% per year average. But this ignores compounding!</p>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-800">Scenario 2: With TVM (Compounding)</p>
                    <p>That same growth actually represents 8.45% annualized return: $10,000 × (1.0845)^5 ≈ $15,000. 
                    The 10% arithmetic average overstates the true performance.</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-3">Cash Flow Timing Example:</h4>
                <div className="space-y-2 text-sm">
                  <p>Two investors, each contributing $12,000 total over 3 years, ending with $15,000:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="font-semibold text-green-800 mb-1">Investor A (Early Contributions):</p>
                      <ul className="text-xs space-y-1">
                        <li>• Year 1: $10,000</li>
                        <li>• Year 2: $1,000</li>
                        <li>• Year 3: $1,000</li>
                      </ul>
                      <p className="text-xs mt-2 font-semibold">Actual Return: ~7.5% annualized</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-300">
                      <p className="font-semibold text-green-800 mb-1">Investor B (Late Contributions):</p>
                      <ul className="text-xs space-y-1">
                        <li>• Year 1: $1,000</li>
                        <li>• Year 2: $1,000</li>
                        <li>• Year 3: $10,000</li>
                      </ul>
                      <p className="text-xs mt-2 font-semibold">Actual Return: ~42% annualized</p>
                    </div>
                  </div>
                  <p className="mt-2 font-semibold text-green-900">
                    Same total contributions, same ending balance, but wildly different returns! Investor B's 
                    money grew much faster because most of it was invested near the end. This is why TVM-based 
                    calculations (like IRR) are essential.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Applications in Return Calculations:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <span>
                      <strong>Internal Rate of Return (IRR):</strong> The discount rate that makes the net 
                      present value of all cash flows equal to zero. Accounts for timing of every deposit and 
                      withdrawal.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <span>
                      <strong>Time-Weighted Return:</strong> Eliminates the impact of external cash flows, 
                      showing pure investment performance independent of contribution timing.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <span>
                      <strong>Money-Weighted Return:</strong> Considers the size and timing of cash flows, 
                      showing the actual return earned by the investor (the approach our calculator uses).
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Practical Applications and Best Practices */}
        <Card className="border-l-4 border-l-teal-500 shadow-md">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-white">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-teal-900">
              <Info className="h-6 w-6" />
              Practical Applications and Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm sm:text-base text-gray-700">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h4 className="font-semibold text-teal-900 mb-3">When to Use Each Calculation Method:</h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded border border-teal-300">
                    <h5 className="font-semibold text-teal-800 mb-1">Cash Flow-Based (IRR) Method:</h5>
                    <ul className="space-y-1 text-xs ml-4">
                      <li>• Personal investment portfolios with regular contributions (401(k), IRA)</li>
                      <li>• Real estate investments with rental income and expenses</li>
                      <li>• Business projects with multiple cash inflows and outflows</li>
                      <li>• Any scenario where timing of cash flows significantly impacts returns</li>
                    </ul>
                  </div>
                  <div className="bg-white p-3 rounded border border-teal-300">
                    <h5 className="font-semibold text-teal-800 mb-1">Cumulative/Average Return Method:</h5>
                    <ul className="space-y-1 text-xs ml-4">
                      <li>• Mutual fund or ETF performance reporting</li>
                      <li>• Comparing different investment strategies</li>
                      <li>• Historical performance analysis</li>
                      <li>• When no intermediate cash flows occur (buy and hold)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3">Common Mistakes to Avoid:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Confusing arithmetic and geometric means:</strong> Always use geometric mean 
                      (annualized return) for actual performance, not arithmetic average
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Ignoring fees and taxes:</strong> Returns should be calculated net of expenses 
                      for accurate performance measurement
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Cherry-picking time periods:</strong> Select periods that represent full market 
                      cycles, not just bull or bear markets
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Comparing apples to oranges:</strong> Ensure all investments use the same 
                      calculation method and time period
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Professional Investment Reporting Standards:</h4>
                <p className="text-sm mb-3">
                  The investment industry follows specific standards for calculating and reporting returns:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>GIPS (Global Investment Performance Standards):</strong> Requires time-weighted 
                      returns for portfolio performance to eliminate the effect of external cash flows
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>SEC regulations:</strong> Mutual funds must report standardized returns (1-year, 
                      5-year, 10-year, and since inception)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>
                      <strong>Financial advisors:</strong> Must provide both time-weighted (portfolio performance) 
                      and money-weighted (client's actual return) when reporting to clients
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Key Takeaways:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span>Use IRR-based calculations when cash flow timing matters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span>Always specify whether returns are arithmetic or geometric</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span>Account for the time value of money in long-term analyses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span>Understand that higher volatility increases the gap between average and annualized returns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 text-lg">✓</span>
                    <span>Use multiple metrics together for comprehensive performance evaluation</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AverageReturnCalculatorComponent;
