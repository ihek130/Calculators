import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, Plus, Trash2, TrendingDown, TrendingUp, Calendar, AlertCircle, CheckCircle, Percent } from 'lucide-react';
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
  Line
} from 'recharts';

interface Debt {
  id: string;
  name: string;
  balance: string;
  monthlyPayment: string;
  interestRate: string;
}

interface ConsolidationLoan {
  amount: string;
  interestRate: string;
  termYears: string;
  termMonths: string;
  feePercent: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DebtConsolidationCalculatorComponent() {
  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: '', balance: '', monthlyPayment: '', interestRate: '' }
  ]);

  const [consolidationLoan, setConsolidationLoan] = useState<ConsolidationLoan>({
    amount: '',
    interestRate: '',
    termYears: '5',
    termMonths: '0',
    feePercent: '5'
  });

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

  const updateConsolidation = (field: keyof ConsolidationLoan, value: string) => {
    setConsolidationLoan({ ...consolidationLoan, [field]: value });
  };

  const results = useMemo(() => {
    const validDebts = debts.filter(d => 
      d.name.trim() && 
      parseFloat(d.balance) > 0 && 
      parseFloat(d.monthlyPayment) > 0 && 
      parseFloat(d.interestRate) >= 0
    );

    if (validDebts.length === 0) {
      return {
        isValid: false,
        currentTotalBalance: 0,
        currentMonthlyPayment: 0,
        currentTotalInterest: 0,
        currentPayoffMonths: 0,
        currentWeightedAPR: 0,
        consolidationLoanAmount: 0,
        consolidationMonthlyPayment: 0,
        consolidationTotalInterest: 0,
        consolidationPayoffMonths: 0,
        consolidationRealAPR: 0,
        consolidationLoanFee: 0,
        isWorthIt: false,
        monthlySavings: 0,
        interestSavings: 0,
        timeSavings: 0,
        debtsBreakdown: [],
        comparisonData: []
      };
    }

    // Calculate current debts scenario
    let currentTotalBalance = 0;
    let currentMonthlyPayment = 0;
    let weightedInterestSum = 0;
    const debtsBreakdown: any[] = [];

    validDebts.forEach(debt => {
      const balance = parseFloat(debt.balance);
      const monthlyPayment = parseFloat(debt.monthlyPayment);
      const annualRate = parseFloat(debt.interestRate);
      const monthlyRate = annualRate / 100 / 12;

      currentTotalBalance += balance;
      currentMonthlyPayment += monthlyPayment;
      weightedInterestSum += (balance * annualRate);

      // Calculate payoff time for each debt
      let debtBalance = balance;
      let months = 0;
      let totalInterest = 0;
      const maxMonths = 600;

      while (debtBalance > 0.01 && months < maxMonths) {
        months++;
        const interest = debtBalance * monthlyRate;
        totalInterest += interest;
        debtBalance = debtBalance + interest - monthlyPayment;
        
        if (monthlyPayment <= interest) {
          // Payment doesn't cover interest
          months = maxMonths;
          totalInterest = balance * 10; // Arbitrary high number
          break;
        }
      }

      debtsBreakdown.push({
        name: debt.name,
        balance,
        monthlyPayment,
        interestRate: annualRate,
        months,
        totalInterest,
        totalPaid: balance + totalInterest
      });
    });

    const currentWeightedAPR = currentTotalBalance > 0 ? weightedInterestSum / currentTotalBalance : 0;
    const currentPayoffMonths = Math.max(...debtsBreakdown.map(d => d.months));
    const currentTotalInterest = debtsBreakdown.reduce((sum, d) => sum + d.totalInterest, 0);

    // Calculate consolidation loan scenario
    const loanAmount = parseFloat(consolidationLoan.amount) || currentTotalBalance;
    const loanRate = parseFloat(consolidationLoan.interestRate);
    const termYears = parseInt(consolidationLoan.termYears) || 0;
    const termMonths = parseInt(consolidationLoan.termMonths) || 0;
    const feePercent = parseFloat(consolidationLoan.feePercent) || 0;

    if (!loanRate || (termYears === 0 && termMonths === 0)) {
      return {
        isValid: false,
        currentTotalBalance,
        currentMonthlyPayment,
        currentTotalInterest,
        currentPayoffMonths,
        currentWeightedAPR,
        consolidationLoanAmount: loanAmount,
        consolidationMonthlyPayment: 0,
        consolidationTotalInterest: 0,
        consolidationPayoffMonths: 0,
        consolidationRealAPR: 0,
        consolidationLoanFee: 0,
        isWorthIt: false,
        monthlySavings: 0,
        interestSavings: 0,
        timeSavings: 0,
        debtsBreakdown,
        comparisonData: []
      };
    }

    const totalTermMonths = termYears * 12 + termMonths;
    const monthlyRate = loanRate / 100 / 12;
    const loanFee = (loanAmount * feePercent) / 100;
    const totalLoanCost = loanAmount + loanFee;

    // Calculate monthly payment using amortization formula
    const consolidationMonthlyPayment = totalLoanCost * (monthlyRate * Math.pow(1 + monthlyRate, totalTermMonths)) / 
                                        (Math.pow(1 + monthlyRate, totalTermMonths) - 1);

    const consolidationTotalPaid = consolidationMonthlyPayment * totalTermMonths;
    const consolidationTotalInterest = consolidationTotalPaid - loanAmount;

    // Calculate real APR (including fees)
    const realAPR = ((consolidationTotalInterest / loanAmount) / (totalTermMonths / 12)) * 100;

    // Determine if consolidation is worth it
    const isWorthIt = consolidationTotalInterest < currentTotalInterest && 
                      consolidationMonthlyPayment < currentMonthlyPayment;

    const monthlySavings = currentMonthlyPayment - consolidationMonthlyPayment;
    const interestSavings = currentTotalInterest - consolidationTotalInterest;
    const timeSavings = currentPayoffMonths - totalTermMonths;

    // Prepare comparison data
    const comparisonData = [
      {
        category: 'Current Debts',
        monthlyPayment: parseFloat(currentMonthlyPayment.toFixed(2)),
        totalInterest: parseFloat(currentTotalInterest.toFixed(2)),
        months: currentPayoffMonths
      },
      {
        category: 'Consolidation',
        monthlyPayment: parseFloat(consolidationMonthlyPayment.toFixed(2)),
        totalInterest: parseFloat(consolidationTotalInterest.toFixed(2)),
        months: totalTermMonths
      }
    ];

    return {
      isValid: true,
      currentTotalBalance,
      currentMonthlyPayment,
      currentTotalInterest,
      currentPayoffMonths,
      currentWeightedAPR,
      consolidationLoanAmount: loanAmount,
      consolidationMonthlyPayment,
      consolidationTotalInterest,
      consolidationPayoffMonths: totalTermMonths,
      consolidationRealAPR: realAPR,
      consolidationLoanFee: loanFee,
      isWorthIt,
      monthlySavings,
      interestSavings,
      timeSavings,
      debtsBreakdown,
      comparisonData
    };
  }, [debts, consolidationLoan]);

  // Auto-fill loan amount with total balance
  useMemo(() => {
    if (!consolidationLoan.amount && results.currentTotalBalance > 0) {
      setConsolidationLoan(prev => ({
        ...prev,
        amount: results.currentTotalBalance.toString()
      }));
    }
  }, [results.currentTotalBalance]);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Current Debts Input */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Current Debts</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter information for each debt you want to consolidate
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
                      placeholder="e.g., Credit card, Personal loan"
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

      {/* Consolidation Loan Details */}
      <Card className="shadow-xl border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
          <CardTitle className="text-xl sm:text-2xl text-purple-900">Consolidation Loan</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter the terms of the consolidation loan you're considering
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loanAmount" className="text-xs sm:text-sm font-medium mb-2 block">
                Loan Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="loanAmount"
                  type="number"
                  value={consolidationLoan.amount}
                  onChange={(e) => updateConsolidation('amount', e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                  placeholder="Total debt amount"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="loanRate" className="text-xs sm:text-sm font-medium mb-2 block">
                Interest Rate
              </Label>
              <div className="relative">
                <Input
                  id="loanRate"
                  type="number"
                  step="0.01"
                  value={consolidationLoan.interestRate}
                  onChange={(e) => updateConsolidation('interestRate', e.target.value)}
                  className="pr-8 text-sm sm:text-base"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 block">
              Loan Term
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="termYears" className="text-xs mb-1.5 block text-gray-600">
                  Years
                </Label>
                <Input
                  id="termYears"
                  type="number"
                  min="0"
                  value={consolidationLoan.termYears}
                  onChange={(e) => updateConsolidation('termYears', e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="termMonths" className="text-xs mb-1.5 block text-gray-600">
                  Months
                </Label>
                <Input
                  id="termMonths"
                  type="number"
                  min="0"
                  max="11"
                  value={consolidationLoan.termMonths}
                  onChange={(e) => updateConsolidation('termMonths', e.target.value)}
                  className="text-sm sm:text-base"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="loanFee" className="text-xs sm:text-sm font-medium mb-2 block">
              Loan Fee/Points
            </Label>
            <div className="relative">
              <Input
                id="loanFee"
                type="number"
                step="0.01"
                value={consolidationLoan.feePercent}
                onChange={(e) => updateConsolidation('feePercent', e.target.value)}
                className="pr-8 text-sm sm:text-base"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              Upfront fee as percentage of loan amount (e.g., origination fee, points)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.isValid && (
        <>
          {/* Decision Card */}
          <Card className={`shadow-xl border-2 ${results.isWorthIt ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100' : 'border-red-200 bg-gradient-to-r from-red-50 to-red-100'}`}>
            <CardHeader className={`border-b-2 ${results.isWorthIt ? 'border-green-200' : 'border-red-200'}`}>
              <CardTitle className={`text-xl sm:text-2xl ${results.isWorthIt ? 'text-green-900' : 'text-red-900'} flex items-center gap-3`}>
                {results.isWorthIt ? (
                  <>
                    <CheckCircle className="w-8 h-8" />
                    Consolidation is Worth It!
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8" />
                    Consolidation May Not Be Worth It
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Savings</p>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold ${results.monthlySavings > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {results.monthlySavings > 0 ? '+' : ''}{results.monthlySavings >= 0 ? '$' : '-$'}{Math.abs(results.monthlySavings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    per month
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Interest Savings</p>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold ${results.interestSavings > 0 ? 'text-green-900' : 'text-red-900'}`}>
                    {results.interestSavings > 0 ? '+' : ''}{results.interestSavings >= 0 ? '$' : '-$'}{Math.abs(results.interestSavings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    over loan life
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Time Difference</p>
                  </div>
                  <p className={`text-2xl sm:text-3xl font-bold ${results.timeSavings > 0 ? 'text-green-900' : results.timeSavings < 0 ? 'text-red-900' : 'text-gray-900'}`}>
                    {results.timeSavings > 0 ? '-' : results.timeSavings < 0 ? '+' : ''}{Math.abs(results.timeSavings)} months
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {results.timeSavings > 0 ? 'faster payoff' : results.timeSavings < 0 ? 'longer term' : 'same time'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Debts */}
            <Card className="shadow-xl border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                <CardTitle className="text-lg sm:text-xl text-blue-900">
                  Current Debts Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Total Balance:</span>
                    <span className="text-base font-bold text-blue-900">
                      ${results.currentTotalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Monthly Payment:</span>
                    <span className="text-base font-bold text-blue-900">
                      ${results.currentMonthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Weighted APR:</span>
                    <span className="text-base font-bold text-blue-900">
                      {results.currentWeightedAPR.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Payoff Time:</span>
                    <span className="text-base font-bold text-blue-900">
                      {Math.floor(results.currentPayoffMonths / 12)} years {results.currentPayoffMonths % 12} months
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">Total Interest:</span>
                    <span className="text-base font-bold text-red-600">
                      ${results.currentTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consolidation Loan */}
            <Card className="shadow-xl border-2 border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                <CardTitle className="text-lg sm:text-xl text-purple-900">
                  Consolidation Loan Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Loan Amount:</span>
                    <span className="text-base font-bold text-purple-900">
                      ${results.consolidationLoanAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Monthly Payment:</span>
                    <span className="text-base font-bold text-purple-900">
                      ${results.consolidationMonthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Interest Rate:</span>
                    <span className="text-base font-bold text-purple-900">
                      {parseFloat(consolidationLoan.interestRate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b bg-yellow-50">
                    <span className="text-sm font-medium text-gray-700">Real APR (with fees):</span>
                    <span className="text-base font-bold text-orange-600">
                      {results.consolidationRealAPR.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Loan Fee:</span>
                    <span className="text-base font-bold text-orange-600">
                      ${results.consolidationLoanFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium text-gray-700">Payoff Time:</span>
                    <span className="text-base font-bold text-purple-900">
                      {Math.floor(results.consolidationPayoffMonths / 12)} years {results.consolidationPayoffMonths % 12} months
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700">Total Interest:</span>
                    <span className="text-base font-bold text-red-600">
                      ${results.consolidationTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comparison Bar Chart */}
            <Card className="shadow-xl border-2 border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
                <CardTitle className="text-lg sm:text-xl text-indigo-900">
                  Monthly Payment Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis 
                        label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd', fontSize: '12px' }}
                      />
                      <Bar dataKey="monthlyPayment" fill="#6366f1" name="Monthly Payment" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Interest Comparison */}
            <Card className="shadow-xl border-2 border-rose-200">
              <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100 border-b-2 border-rose-200">
                <CardTitle className="text-lg sm:text-xl text-rose-900">
                  Total Interest Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis 
                        label={{ value: 'Interest ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        contentStyle={{ backgroundColor: '#fff', border: '2px solid #ddd', fontSize: '12px' }}
                      />
                      <Bar dataKey="totalInterest" fill="#f43f5e" name="Total Interest" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Debts Breakdown */}
          <Card className="shadow-xl border-2 border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
              <CardTitle className="text-lg sm:text-xl text-teal-900">
                Current Debts Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {results.debtsBreakdown.map((debt: any, index: number) => (
                  <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900">{debt.name}</h3>
                      <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-900 rounded">
                        {debt.interestRate.toFixed(2)}% APR
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Balance</p>
                        <p className="font-semibold text-sm text-gray-900">
                          ${debt.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Monthly Payment</p>
                        <p className="font-semibold text-sm text-gray-900">
                          ${debt.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Payoff Time</p>
                        <p className="font-semibold text-sm text-gray-900">
                          {debt.months} months
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Interest</p>
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
        </>
      )}

      {/* Educational Content */}
      <Card className="shadow-xl border-2 border-slate-200 mt-8">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <CardTitle className="text-xl sm:text-2xl text-slate-900">
            📚 Understanding Debt Consolidation
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comprehensive guide to consolidating and managing multiple debts effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Section 1: What is Debt Consolidation */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">💡</span>
              What is Debt Consolidation?
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                <strong>Debt consolidation</strong> is a financial strategy that involves combining multiple loans 
                or debts into a single new loan. This debt restructuring approach aims to achieve one or more of 
                the following goals:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Lower Interest Rate:</strong> Replace high-interest debts (especially credit cards at 
                  15-25% APR) with a single loan at a lower rate, reducing the cost of borrowing.
                </li>
                <li>
                  <strong>Lower Monthly Payment:</strong> Extend the repayment term to reduce the monthly payment 
                  amount, freeing up cash flow for other expenses or savings.
                </li>
                <li>
                  <strong>Simplify Finances:</strong> Replace multiple payment due dates, amounts, and creditors 
                  with one straightforward monthly payment, reducing complexity and the risk of missed payments.
                </li>
                <li>
                  <strong>Fixed Repayment Schedule:</strong> Convert variable-rate debts (like credit cards) into 
                  a fixed-rate loan with a clear payoff date, providing payment stability and predictability.
                </li>
              </ul>
              <p>
                With an effective consolidation loan, it's possible to achieve multiple benefits simultaneously—
                lower interest rates, reduced monthly payments, and simplified management. However, not all 
                consolidation loans are created equal, and understanding the true cost (including fees) is 
                essential for making an informed decision.
              </p>
              <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <strong>💡 Key Insight:</strong> This calculator determines whether debt consolidation is 
                financially rewarding by comparing the <strong>real APR</strong> (Annual Percentage Rate) of 
                your combined current debts with the real APR of the consolidation loan. The real APR accounts 
                for upfront fees, providing a more accurate basis for comparison than the advertised interest 
                rate alone.
              </p>
            </div>
          </div>

          {/* Section 2: Understanding APR vs Interest Rate */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-purple-600">📊</span>
              APR vs. Interest Rate: The Real Cost of Borrowing
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Many borrowers focus solely on the interest rate when evaluating loans, but this doesn't tell the 
                complete story. Understanding the difference between interest rate and APR is crucial for accurate 
                cost comparisons:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2">Interest Rate</h4>
                  <p className="text-sm text-blue-900 mb-2">
                    The percentage charged on the principal loan amount, typically expressed annually.
                  </p>
                  <p className="text-xs text-blue-800 italic">
                    Example: A $10,000 loan at 10% interest rate charges $1,000 in interest annually (before 
                    compounding effects).
                  </p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-2">APR (Annual Percentage Rate)</h4>
                  <p className="text-sm text-purple-900 mb-2">
                    The total cost of borrowing, including the interest rate PLUS all fees, points, and charges.
                  </p>
                  <p className="text-xs text-purple-800 italic">
                    Example: The same $10,000 loan at 10% interest with a $500 origination fee has a real APR 
                    closer to 11-12%, depending on the loan term.
                  </p>
                </div>
              </div>
              <p>
                Most loans require upfront fees such as origination fees, application fees, or "points" (each point 
                equals 1% of the loan amount). These fees increase the real cost of the loan beyond the advertised 
                interest rate. The APR calculation incorporates these costs, making it a more accurate and 
                comparable indicator of the financial burden.
              </p>
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-orange-900 mb-2">📈 Example: The Impact of Fees</h4>
                <p className="text-sm text-orange-900 mb-2">
                  Consider consolidating $25,000 in debt at 10.99% interest for 5 years:
                </p>
                <ul className="text-sm text-orange-900 space-y-1.5 list-disc pl-5">
                  <li><strong>With 5% fee ($1,250):</strong> Real APR ≈ 12.5% - Still potentially worth it</li>
                  <li><strong>With 15% fee ($3,750):</strong> Real APR ≈ 16% - Likely not worth it</li>
                </ul>
                <p className="text-sm text-orange-900 mt-2">
                  The difference in fees can completely change whether consolidation makes financial sense.
                </p>
              </div>
              <p className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <strong>⚠️ Important:</strong> Always compare APR to APR, not interest rate to interest rate. 
                This calculator automatically calculates the real APR including fees to ensure accurate comparison.
              </p>
            </div>
          </div>

          {/* Section 3: Common Sources of Consolidation Loans */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">🏦</span>
              Common Sources of Consolidation Loans
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Several types of loans can be used for debt consolidation, each with distinct characteristics, 
                advantages, and risks:
              </p>

              {/* Secured Loans */}
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-green-900 mb-3">🔐 Secured Loans (Collateral-Based)</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-3">
                    <h5 className="font-semibold text-green-900 mb-1">Home Equity Loans</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Borrow against the equity in your home (difference between home value and mortgage balance).
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-green-700">✅ Advantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Lower interest rates (typically 5-8%)</li>
                          <li>Fixed rates and payments</li>
                          <li>Interest may be tax-deductible</li>
                          <li>Larger loan amounts available</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-700">❌ Risks:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Your home is collateral—risk foreclosure</li>
                          <li>Closing costs can be high</li>
                          <li>Converts unsecured to secured debt</li>
                          <li>Reduces home equity</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3">
                    <h5 className="font-semibold text-green-900 mb-1">Home Equity Line of Credit (HELOC)</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Revolving credit line secured by home equity, similar to a credit card but with lower rates.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-green-700">✅ Advantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Low rates (similar to home equity loans)</li>
                          <li>Flexible borrowing (draw as needed)</li>
                          <li>Interest-only payments initially</li>
                          <li>Reusable credit line</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-700">❌ Risks:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Variable rates (can increase)</li>
                          <li>Home at risk if you default</li>
                          <li>Temptation to re-borrow</li>
                          <li>Balloon payment possible</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3">
                    <h5 className="font-semibold text-green-900 mb-1">Cash-Out Refinance</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Replace your current mortgage with a larger one, taking the difference in cash to pay off debts.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-green-700">✅ Advantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Lowest rates (mortgage rates)</li>
                          <li>Single consolidated payment</li>
                          <li>Long repayment terms (15-30 years)</li>
                          <li>Tax-deductible interest possible</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-700">❌ Risks:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>High closing costs (2-5% of loan)</li>
                          <li>Extends short-term debt to 30 years</li>
                          <li>Home at risk</li>
                          <li>May cost more long-term</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unsecured Loans */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-blue-900 mb-3">🔓 Unsecured Loans (No Collateral)</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h5 className="font-semibold text-blue-900 mb-1">Personal Consolidation Loans</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Unsecured installment loans specifically designed for debt consolidation.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-green-700">✅ Advantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>No collateral required</li>
                          <li>Fixed rates and payments</li>
                          <li>Fast approval (days, not weeks)</li>
                          <li>Clear payoff date</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-700">❌ Disadvantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Higher rates (6-36% based on credit)</li>
                          <li>Lower loan limits ($50k typical max)</li>
                          <li>Origination fees common (1-8%)</li>
                          <li>Credit score dependent</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-3">
                    <h5 className="font-semibold text-blue-900 mb-1">Balance Transfer Credit Cards</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Transfer high-interest credit card balances to a new card with promotional 0% APR period.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <strong className="text-green-700">✅ Advantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>0% interest (12-21 months typically)</li>
                          <li>Can save significant interest</li>
                          <li>No collateral needed</li>
                          <li>Fast approval process</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-red-700">❌ Disadvantages:</strong>
                        <ul className="list-disc pl-4 mt-1">
                          <li>Balance transfer fee (3-5%)</li>
                          <li>High rate after promo ends (18-25%)</li>
                          <li>Must pay off during promo period</li>
                          <li>Credit limit may not cover all debt</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                <strong>🚫 Generally Not Recommended:</strong> Borrowing from 401(k) or retirement accounts. 
                While rates may seem attractive, you'll face opportunity cost from lost investment growth, 
                potential tax penalties, and risk of loan default if you change jobs. Retirement savings should 
                typically be a last resort.
              </p>
            </div>
          </div>

          {/* Section 4: Important Considerations */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-orange-600">⚠️</span>
              Critical Considerations Before Consolidating
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Before committing to debt consolidation, carefully evaluate these important factors that can make 
                the difference between a smart financial move and a costly mistake:
              </p>

              <div className="space-y-4">
                {/* Loan Fees */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    1. Loan Fees and Points Matter Significantly
                  </h4>
                  <p className="text-sm mb-2">
                    The primary goal of debt consolidation is to reduce costs, so additional fees can undermine 
                    this purpose. Common fees include:
                  </p>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li><strong>Origination fees:</strong> 1-8% of loan amount for personal loans</li>
                    <li><strong>Balance transfer fees:</strong> 3-5% for credit card transfers</li>
                    <li><strong>Closing costs:</strong> 2-5% for home equity loans and refinances</li>
                    <li><strong>Application/processing fees:</strong> $25-$500</li>
                    <li><strong>Annual fees:</strong> $0-$500 for some credit cards</li>
                  </ul>
                  <p className="text-sm mt-2 bg-yellow-100 p-2 rounded">
                    <strong>Calculator Example:</strong> Using default figures, a 5% loan fee makes consolidation 
                    viable. However, increasing the fee to 15% causes the calculator to show consolidation is NOT 
                    worth it due to excessive upfront costs. Always shop for the lowest fees possible.
                  </p>
                </div>

                {/* Process Time */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    2. The Process Takes Time and Effort
                  </h4>
                  <p className="text-sm mb-2">
                    Debt consolidation is not a quick fix. The process typically involves:
                  </p>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    <li>Gathering financial documentation (2-4 weeks)</li>
                    <li>Shopping for and comparing lenders (1-2 weeks)</li>
                    <li>Completing applications and underwriting (1-4 weeks)</li>
                    <li>Closing and funding (1-2 weeks)</li>
                    <li>Paying off existing debts and confirming closure (1-2 weeks)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Total timeline: <strong>6-12 weeks</strong> from start to finish. During this time, continue 
                    making all required payments to avoid late fees and credit damage.
                  </p>
                </div>

                {/* Extended Terms */}
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    3. Extended Terms Can Increase Total Interest
                  </h4>
                  <p className="text-sm mb-2">
                    Longer repayment terms lower monthly payments but may increase total interest paid:
                  </p>
                  <div className="bg-white border border-purple-200 rounded p-3 text-sm">
                    <p className="font-semibold mb-2">Example: $20,000 at 10% interest</p>
                    <ul className="space-y-1">
                      <li>• <strong>3-year term:</strong> $645/month, $3,220 total interest</li>
                      <li>• <strong>5-year term:</strong> $424/month, $5,460 total interest</li>
                      <li>• <strong>7-year term:</strong> $325/month, $7,300 total interest</li>
                    </ul>
                    <p className="mt-2 text-xs text-purple-800">
                      Lower monthly payment costs $4,080 more in interest over the 7-year vs 3-year term.
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    This calculator helps evaluate whether more favorable loan conditions (lower interest rate) 
                    offset the cost of a longer term.
                  </p>
                </div>

                {/* Credit Score Impact */}
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                  <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    4. Credit Score Implications
                  </h4>
                  <p className="text-sm mb-2">
                    Debt consolidation affects your credit score in multiple ways:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <strong className="text-red-700 text-sm">⬇️ Potential Negative Impacts:</strong>
                      <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                        <li>Hard inquiry from loan application (-5 to -10 points temporarily)</li>
                        <li>New account lowers average account age</li>
                        <li>Closing paid-off accounts reduces available credit</li>
                        <li>Missing payments during transition damages score significantly</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-green-700 text-sm">⬆️ Potential Positive Impacts:</strong>
                      <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                        <li>Lower credit utilization ratio (if paying off credit cards)</li>
                        <li>On-time payments build positive history</li>
                        <li>Fixed installment loan diversifies credit mix</li>
                        <li>Reduced debt-to-income ratio over time</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm mt-2 bg-indigo-100 p-2 rounded">
                    <strong>Typical Pattern:</strong> Temporary dip (5-20 points) for 3-6 months, then gradual 
                    improvement if payments are made on time. Most people recover and exceed their previous score 
                    within 6-12 months.
                  </p>
                </div>

                {/* Risk Assessment */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    5. Collateral Risk Assessment
                  </h4>
                  <p className="text-sm mb-2">
                    Converting unsecured debt to secured debt introduces serious risk:
                  </p>
                  <div className="bg-white border border-red-200 rounded p-3">
                    <p className="text-sm font-semibold text-red-900 mb-2">⚠️ Critical Risk:</p>
                    <p className="text-sm mb-2">
                      Credit card debt is unsecured—defaulting damages your credit but doesn't cost you property. 
                      Using a home equity loan or cash-out refinance to pay off credit cards converts that 
                      unsecured debt into secured debt backed by your home.
                    </p>
                    <p className="text-sm font-semibold text-red-900">
                      Result: If you default on the consolidated loan, you could lose your home to foreclosure.
                    </p>
                  </div>
                  <p className="text-sm mt-2">
                    <strong>Only use secured consolidation loans if:</strong>
                  </p>
                  <ul className="list-disc pl-6 text-sm space-y-1 mt-1">
                    <li>You have stable income and job security</li>
                    <li>You've addressed spending habits causing the debt</li>
                    <li>You have adequate emergency savings (6+ months expenses)</li>
                    <li>The interest savings substantially justify the risk</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: When Consolidation Makes Sense */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">✅</span>
              When Debt Consolidation Makes Sense
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                Debt consolidation can be an excellent strategy in the right circumstances. Consider consolidation 
                when you meet most or all of these criteria:
              </p>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>You have good to excellent credit (680+):</strong> Qualifies you for better interest 
                      rates that make consolidation worthwhile. Poor credit may result in rates too high to be 
                      beneficial.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>The consolidation APR (with fees) is significantly lower:</strong> Aim for at least 
                      3-5 percentage points lower than your weighted average current APR to justify the effort and 
                      fees.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>You have multiple high-interest debts:</strong> Consolidation is most effective when 
                      combining several high-rate debts (15-25% APR credit cards) into one lower-rate loan (6-12% APR).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>Managing multiple payments is overwhelming:</strong> If you're struggling to track 
                      multiple due dates and have missed payments, simplification alone may justify consolidation.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>You've addressed the root cause of debt:</strong> Consolidation works when you've 
                      changed spending habits. Without behavioral changes, you'll likely accumulate new debt on top 
                      of the consolidated loan.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>You have stable income:</strong> Can comfortably afford the new consolidated payment 
                      each month with room for unexpected expenses.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">✓</span>
                    <div>
                      <strong>You're committed to not accumulating new debt:</strong> Will close or avoid using 
                      paid-off credit cards to prevent cycling back into debt.
                    </div>
                  </li>
                </ul>
              </div>
              <p className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
                <strong>💡 Ideal Scenario:</strong> Consolidating $25,000 in credit card debt at 19% APR into a 
                personal loan at 10% APR (12% real APR with fees) saves approximately $4,000-$6,000 in interest 
                over 5 years while simplifying to one monthly payment. This is a clear win.
              </p>
            </div>
          </div>

          {/* Section 6: When to Avoid Consolidation */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-red-600">❌</span>
              When to Avoid Debt Consolidation
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                In some situations, debt consolidation can worsen your financial situation rather than improve it. 
                Avoid consolidation in these scenarios:
              </p>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>The real APR isn't meaningfully lower:</strong> If the new loan's APR (including all 
                      fees) is only marginally lower or even higher than your current weighted average, you'll lose 
                      money.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>You haven't changed spending habits:</strong> Consolidation without addressing the 
                      root cause of overspending typically results in accumulating new debt while still owing the 
                      consolidated loan—doubling your debt problem.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>High fees offset interest savings:</strong> If upfront fees are 10%+ of the loan 
                      amount, the costs may exceed any interest savings, especially on shorter loan terms.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>You're consolidating to afford more purchases:</strong> Using consolidation to free 
                      up credit limits for additional spending creates a dangerous debt spiral. Consolidate to 
                      eliminate debt, not to enable more borrowing.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>The extended term significantly increases total cost:</strong> A 7-year consolidation 
                      loan at 12% APR may have lower monthly payments than your current debts, but you could end up 
                      paying more in total interest despite the lower rate.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>You're putting up collateral for unsecured debt:</strong> Using your home to pay off 
                      credit cards introduces foreclosure risk where none existed before. The interest savings must 
                      be substantial to justify this risk.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-lg">✗</span>
                    <div>
                      <strong>You're nearing debt payoff already:</strong> If you'll pay off your current debts 
                      within 12-18 months anyway, consolidation fees and effort may not be worthwhile.
                    </div>
                  </li>
                </ul>
              </div>
              <p className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded mt-3">
                <strong>⚠️ Warning Sign:</strong> If you're considering consolidation primarily to lower monthly 
                payments so you can afford new purchases or loans, this is a red flag. Address spending habits 
                first through budgeting and financial counseling.
              </p>
            </div>
          </div>

          {/* Section 7: Fix the Real Problem First */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-indigo-600">🎯</span>
              Fix the Real Problem First
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                While effective debt consolidation can reduce financial burden, it's crucial to address the 
                underlying causes of debt accumulation first. Consolidation treats the symptom (multiple high-interest 
                debts) but not the disease (spending more than you earn).
              </p>
              <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4 my-3">
                <h4 className="font-bold text-indigo-900 mb-3">🔍 Root Causes to Address:</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-indigo-900">1. Spending Habits:</strong>
                    <p className="text-gray-700 mt-1">
                      Track every expense for 30 days to identify where money goes. Common problem areas: dining 
                      out, subscription services, impulse purchases, lifestyle inflation. Create a realistic budget 
                      and commit to living within it.
                    </p>
                  </div>
                  <div>
                    <strong className="text-indigo-900">2. Emergency Fund Absence:</strong>
                    <p className="text-gray-700 mt-1">
                      Without savings, unexpected expenses (car repairs, medical bills, job loss) force reliance 
                      on credit cards. Build at least $1,000 emergency fund, then work toward 3-6 months of 
                      expenses.
                    </p>
                  </div>
                  <div>
                    <strong className="text-indigo-900">3. Income Limitations:</strong>
                    <p className="text-gray-700 mt-1">
                      If expenses exceed income even after cutting discretionary spending, focus on increasing 
                      income through career advancement, side hustles, or job changes. Consolidation can't solve 
                      an income problem.
                    </p>
                  </div>
                  <div>
                    <strong className="text-indigo-900">4. Financial Literacy Gaps:</strong>
                    <p className="text-gray-700 mt-1">
                      Lack of understanding about interest rates, compound growth, and money management leads to 
                      poor decisions. Invest time in financial education through books, courses, or counseling.
                    </p>
                  </div>
                  <div>
                    <strong className="text-indigo-900">5. Emotional Spending:</strong>
                    <p className="text-gray-700 mt-1">
                      Using shopping or spending as stress relief, reward, or social activity creates debt cycles. 
                      Identify emotional triggers and develop healthier coping mechanisms.
                    </p>
                  </div>
                </div>
              </div>
              <p className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <strong>⚠️ Critical Reality:</strong> Studies show that approximately 70% of people who consolidate 
                debt without changing underlying behaviors end up with more debt within 2-3 years. They pay off 
                credit cards with consolidation loans, then accumulate new credit card debt while still owing the 
                consolidated loan. Don't let this be you.
              </p>
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mt-3">
                <h4 className="font-bold text-green-900 mb-2">✅ Action Plan Before Consolidating:</h4>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                  <li>Create a comprehensive budget tracking all income and expenses</li>
                  <li>Identify and eliminate or reduce discretionary spending</li>
                  <li>Build a small emergency fund ($500-$1,000 minimum)</li>
                  <li>Stop using credit cards and commit to cash/debit only</li>
                  <li>Practice living on the new budget for 2-3 months before consolidating</li>
                  <li>Consider financial counseling if you're unsure how to proceed</li>
                  <li>Only then, if consolidation makes financial sense, move forward with it</li>
                </ol>
              </div>
              <p className="mt-3">
                Budgets are practical, powerful tools for organizing finances before even considering consolidation. 
                A written budget provides clarity on where money goes, highlights areas for improvement, and creates 
                accountability. Many people discover they can pay off debt faster with a solid budget than they 
                could through consolidation alone.
              </p>
            </div>
          </div>

          {/* Section 8: How to Use This Calculator */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📱</span>
              How to Use This Calculator Effectively
            </h3>
            <div className="text-sm sm:text-base text-gray-700 space-y-3 leading-relaxed">
              <p>
                This calculator helps you make an informed decision about debt consolidation by comparing the real 
                cost (APR) of your current debts versus a potential consolidation loan. Follow these steps:
              </p>
              <ol className="list-decimal pl-6 space-y-3">
                <li>
                  <strong>Enter Your Current Debts:</strong> List each debt you're considering consolidating with 
                  accurate information:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Debt name (for identification)</li>
                    <li>Remaining balance (check recent statements)</li>
                    <li>Monthly or minimum payment amount</li>
                    <li>Interest rate (APR from your statement)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Add all debts you want to consolidate. The calculator will automatically compute your total 
                    balance, combined monthly payments, weighted average APR, and total interest costs under the 
                    current scenario.
                  </p>
                </li>
                <li>
                  <strong>Enter Consolidation Loan Terms:</strong> Input the details of the consolidation loan 
                  you're considering:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li><strong>Loan Amount:</strong> Auto-fills with your total debt balance, but you can adjust</li>
                    <li><strong>Interest Rate:</strong> The annual interest rate offered by the lender</li>
                    <li><strong>Loan Term:</strong> Repayment period in years and months</li>
                    <li><strong>Loan Fee:</strong> Upfront costs as a percentage (origination fees, points, etc.)</li>
                  </ul>
                  <p className="text-sm mt-2 bg-yellow-50 p-2 rounded border-l-4 border-yellow-500">
                    <strong>Important:</strong> Be sure to include ALL fees. Review the loan agreement carefully 
                    for origination fees, processing fees, points, and any other upfront costs. These significantly 
                    impact the real APR.
                  </p>
                </li>
                <li>
                  <strong>Review the Decision Indicator:</strong> The calculator displays a clear verdict:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li><strong className="text-green-600">Green "Worth It" Card:</strong> Consolidation saves 
                    money on interest AND lowers monthly payment</li>
                    <li><strong className="text-red-600">Red "May Not Be Worth It" Card:</strong> Consolidation 
                    costs more in interest OR increases monthly payment</li>
                  </ul>
                </li>
                <li>
                  <strong>Analyze the Comparison:</strong> Review key metrics side-by-side:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Monthly savings (positive = you save money each month)</li>
                    <li>Interest savings (positive = you save money over loan life)</li>
                    <li>Time difference (negative months = faster payoff with consolidation)</li>
                  </ul>
                </li>
                <li>
                  <strong>Examine Detailed Comparisons:</strong> Look at the side-by-side scenario cards showing:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Current debts: Weighted APR, total interest, payoff timeline</li>
                    <li>Consolidation loan: Real APR (with fees), total interest, payoff timeline, loan fee amount</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Pay special attention to the <strong>Real APR</strong> shown for the consolidation loan—this 
                    is the true cost including all fees, and it's what you should compare to your current weighted 
                    APR.
                  </p>
                </li>
                <li>
                  <strong>Study the Visual Comparisons:</strong> Charts provide quick visual understanding:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Monthly payment comparison bar chart</li>
                    <li>Total interest comparison bar chart</li>
                  </ul>
                </li>
                <li>
                  <strong>Experiment with Different Scenarios:</strong> Try various options:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Different loan terms (shorter terms = less interest but higher payments)</li>
                    <li>Various interest rates (shop multiple lenders)</li>
                    <li>Different fee percentages (negotiate or find lenders with lower fees)</li>
                  </ul>
                </li>
                <li>
                  <strong>Make an Informed Decision:</strong> Consider both the math and your situation:
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Is the interest savings significant enough to justify the effort?</li>
                    <li>Can you comfortably afford the new monthly payment?</li>
                    <li>Are you prepared to avoid accumulating new debt?</li>
                    <li>Have you addressed the spending habits that created the debt?</li>
                  </ul>
                </li>
              </ol>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mt-4">
                <h4 className="font-bold text-blue-900 mb-2">💡 Pro Tips:</h4>
                <ul className="list-disc pl-6 space-y-1.5 text-sm">
                  <li>Get quotes from at least 3-5 lenders to find the best rate and lowest fees</li>
                  <li>Check for prepayment penalties on both current debts and new loan</li>
                  <li>Online lenders often offer better rates than traditional banks for personal loans</li>
                  <li>Credit unions typically have lower fees than banks</li>
                  <li>Consider automating the new loan payment to ensure you never miss one</li>
                  <li>Close or freeze paid-off credit cards to avoid re-accumulating debt</li>
                  <li>Use any monthly savings to build an emergency fund or accelerate debt payoff</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final Note */}
          <div className="border-t pt-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">💎</span>
                The Bottom Line
              </h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Debt consolidation is a tool, not a solution. When used correctly—with lower interest rates, 
                manageable fees, and coupled with improved financial habits—it can accelerate your journey to 
                debt freedom while simplifying your finances. However, without addressing the root causes of debt 
                accumulation, consolidation merely rearranges your financial problems rather than solving them.
              </p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mt-3">
                Use this calculator to make data-driven decisions, shop aggressively for the best terms, read all 
                fine print carefully, and most importantly, commit to the behavioral changes necessary for lasting 
                financial health. Your future debt-free self will thank you for taking the time to do it right! 🎯
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
