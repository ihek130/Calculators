import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, CreditCard, Calendar, TrendingDown, PieChart as PieChartIcon, BarChart3, Calculator, Plus, Trash2 } from 'lucide-react';
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

interface CreditCard {
  id: string;
  name: string;
  balance: string;
  minimumPayment: string;
  interestRate: string;
}

interface WorkingCard {
  name: string;
  balance: number;
  minimumPayment: number;
  monthlyRate: number;
  originalBalance: number;
  interestRate: number;
  totalPaid: number;
  totalInterest: number;
  paidOffMonth: number;
}

const CreditCardsPayoffCalculatorComponent = () => {
  const [monthlyBudget, setMonthlyBudget] = useState('500');
  const [cards, setCards] = useState<CreditCard[]>([
    { id: '1', name: 'Card 1', balance: '4600', minimumPayment: '100', interestRate: '18.99' },
    { id: '2', name: 'Card 2', balance: '3900', minimumPayment: '90', interestRate: '19.99' },
    { id: '3', name: 'Card 3', balance: '6000', minimumPayment: '120', interestRate: '15.99' }
  ]);

  const addCard = () => {
    const newId = (Math.max(...cards.map(c => parseInt(c.id)), 0) + 1).toString();
    setCards([...cards, { 
      id: newId, 
      name: `Card ${newId}`, 
      balance: '', 
      minimumPayment: '', 
      interestRate: '' 
    }]);
  };

  const removeCard = (id: string) => {
    if (cards.length > 1) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const updateCard = (id: string, field: keyof CreditCard, value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Calculate payoff using Debt Avalanche method
  const results = useMemo(() => {
    const budget = parseFloat(monthlyBudget || '0');
    
    // Filter and validate cards
    const validCards = cards.filter(c => 
      parseFloat(c.balance || '0') > 0 && 
      parseFloat(c.minimumPayment || '0') > 0 && 
      parseFloat(c.interestRate || '0') > 0
    );

    if (validCards.length === 0 || budget <= 0) {
      return {
        totalMonths: 0,
        totalPaid: 0,
        totalInterest: 0,
        cardPayoffs: [],
        monthlySchedule: [],
        insufficientBudget: false,
        pieData: []
      };
    }

    // Calculate minimum payments
    const totalMinimumPayments = validCards.reduce((sum, card) => 
      sum + parseFloat(card.minimumPayment), 0
    );

    if (budget < totalMinimumPayments) {
      return {
        totalMonths: 0,
        totalPaid: 0,
        totalInterest: 0,
        cardPayoffs: [],
        monthlySchedule: [],
        insufficientBudget: true,
        minimumNeeded: totalMinimumPayments,
        pieData: []
      };
    }

    // Sort cards by interest rate (highest first) - Debt Avalanche
    const sortedCards: WorkingCard[] = [...validCards].sort((a, b) => 
      parseFloat(b.interestRate) - parseFloat(a.interestRate)
    ).map(card => ({
      name: card.name,
      balance: parseFloat(card.balance),
      minimumPayment: parseFloat(card.minimumPayment),
      monthlyRate: parseFloat(card.interestRate) / 100 / 12,
      originalBalance: parseFloat(card.balance),
      interestRate: parseFloat(card.interestRate),
      totalPaid: 0,
      totalInterest: 0,
      paidOffMonth: 0
    }));

    // Initialize card balances
    let activeCards: WorkingCard[] = [...sortedCards];

    const monthlySchedule = [];
    let month = 0;
    const maxMonths = 600; // 50 years safety cap

    while (activeCards.length > 0 && month < maxMonths) {
      month++;
      let remainingBudget = budget;
      const monthData: any = { month };

      // Apply interest and minimum payments
      activeCards.forEach(card => {
        // Apply interest
        const interestCharge = card.balance * card.monthlyRate;
        card.balance += interestCharge;
        card.totalInterest += interestCharge;

        // Pay minimum payment
        const payment = Math.min(card.minimumPayment, card.balance);
        card.balance -= payment;
        card.totalPaid += payment;
        remainingBudget -= payment;

        monthData[card.name] = card.balance;
      });

      // Use remaining budget on highest interest card (Debt Avalanche)
      if (remainingBudget > 0 && activeCards.length > 0) {
        const targetCard = activeCards[0]; // Highest interest rate
        const extraPayment = Math.min(remainingBudget, targetCard.balance);
        targetCard.balance -= extraPayment;
        targetCard.totalPaid += extraPayment;
      }

      // Remove paid-off cards
      activeCards = activeCards.filter(card => {
        if (card.balance <= 0.01) { // Small threshold for rounding
          card.balance = 0;
          card.paidOffMonth = month;
          return false;
        }
        return true;
      });

      monthlySchedule.push(monthData);
    }

    // Calculate totals
    const cardPayoffs = sortedCards.map(card => {
      const paidCard = sortedCards.find(c => c.name === card.name);
      return {
        name: card.name,
        originalBalance: card.originalBalance,
        interestRate: card.interestRate,
        totalPaid: paidCard ? activeCards.find(ac => ac.name === card.name)?.totalPaid || 
                   sortedCards.find(sc => sc.name === card.name)?.totalPaid || 0 : 0,
        totalInterest: paidCard ? activeCards.find(ac => ac.name === card.name)?.totalInterest || 
                       sortedCards.find(sc => sc.name === card.name)?.totalInterest || 0 : 0,
        paidOffMonth: sortedCards.find(sc => sc.name === card.name)?.paidOffMonth || month
      };
    });

    // Recalculate with final data
    const finalCards: WorkingCard[] = sortedCards.map(card => ({
      name: card.name,
      balance: card.originalBalance,
      minimumPayment: card.minimumPayment,
      monthlyRate: card.monthlyRate,
      originalBalance: card.originalBalance,
      interestRate: card.interestRate,
      totalPaid: 0,
      totalInterest: 0,
      paidOffMonth: 0
    }));

    // Run simulation again to get accurate totals
    let simMonth = 0;
    while (finalCards.some(c => c.balance > 0.01) && simMonth < maxMonths) {
      simMonth++;
      let simBudget = budget;

      // Apply interest and minimum payments
      finalCards.forEach(card => {
        if (card.balance > 0.01) {
          const interestCharge = card.balance * card.monthlyRate;
          card.balance += interestCharge;
          card.totalInterest += interestCharge;

          const payment = Math.min(card.minimumPayment, card.balance);
          card.balance -= payment;
          card.totalPaid += payment;
          simBudget -= payment;
        }
      });

      // Extra payment to highest interest card
      if (simBudget > 0) {
        const activeCard = finalCards.filter(c => c.balance > 0.01)
          .sort((a, b) => b.interestRate - a.interestRate)[0];
        
        if (activeCard) {
          const extraPayment = Math.min(simBudget, activeCard.balance);
          activeCard.balance -= extraPayment;
          activeCard.totalPaid += extraPayment;
        }
      }

      // Mark paid-off cards
      finalCards.forEach(card => {
        if (card.balance <= 0.01 && card.paidOffMonth === 0) {
          card.balance = 0;
          card.paidOffMonth = simMonth;
        }
      });
    }

    const totalPaid = finalCards.reduce((sum, card) => sum + card.totalPaid, 0);
    const totalInterest = finalCards.reduce((sum, card) => sum + card.totalInterest, 0);
    const totalPrincipal = finalCards.reduce((sum, card) => sum + card.originalBalance, 0);

    // Pie chart data
    const pieData = finalCards.map((card, index) => ({
      name: card.name,
      value: card.originalBalance,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    }));

    return {
      totalMonths: simMonth,
      totalPaid,
      totalInterest,
      totalPrincipal,
      cardPayoffs: finalCards.map(card => ({
        name: card.name,
        originalBalance: card.originalBalance,
        interestRate: card.interestRate,
        totalPaid: card.totalPaid,
        totalInterest: card.totalInterest,
        paidOffMonth: card.paidOffMonth
      })),
      monthlySchedule,
      insufficientBudget: false,
      pieData
    };
  }, [monthlyBudget, cards]);

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <CreditCard className="w-10 h-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Credit Cards Payoff Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Create a cost-efficient payoff schedule for multiple credit cards using the <strong>Debt Avalanche method</strong>. 
          This strategy prioritizes paying off high-interest cards first to minimize total interest paid.
        </p>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 max-w-3xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-700">
            <strong>Note:</strong> For a single credit card analysis, visit our Credit Card Calculator. 
            This calculator assumes no additional charges on cards, static interest rates, and unchanged minimum payments.
          </p>
        </div>
      </div>

      {/* Budget Input */}
      <Card className="shadow-xl border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
          <CardTitle className="text-xl sm:text-2xl text-green-900">Monthly Budget</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Set aside a total monthly amount for all credit card payments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="max-w-md">
            <Label htmlFor="budget" className="text-xs sm:text-sm font-medium mb-2 block">
              Monthly Budget for Credit Cards
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="budget"
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                className="pl-10 text-sm sm:text-base"
                placeholder="500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credit Cards Input */}
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900">Your Credit Cards</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Enter information for each credit card
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            {cards.map((card, index) => (
              <div key={card.id} className="border-2 border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-sm sm:text-base text-gray-700">Card #{index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCard(card.id)}
                    disabled={cards.length === 1}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Card Name</Label>
                    <Input
                      value={card.name}
                      onChange={(e) => updateCard(card.id, 'name', e.target.value)}
                      className="text-sm"
                      placeholder="e.g., Visa, Mastercard"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Balance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={card.balance}
                        onChange={(e) => updateCard(card.id, 'balance', e.target.value)}
                        className="pl-10 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Minimum Payment</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="number"
                        value={card.minimumPayment}
                        onChange={(e) => updateCard(card.id, 'minimumPayment', e.target.value)}
                        className="pl-10 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium mb-1.5 block">Interest Rate (APR)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        value={card.interestRate}
                        onChange={(e) => updateCard(card.id, 'interestRate', e.target.value)}
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
            onClick={addCard}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Card
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.insufficientBudget ? (
        <Card className="shadow-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
          <CardHeader className="border-b-2 border-red-200">
            <CardTitle className="text-xl sm:text-2xl text-red-900">⚠️ Insufficient Budget</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm sm:text-base text-gray-700">
              Your monthly budget (${parseFloat(monthlyBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}) 
              is less than the total minimum payments required (${results.minimumNeeded?.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
            </p>
            <p className="text-sm sm:text-base text-gray-700 mt-3">
              <strong>You must increase your budget to at least ${results.minimumNeeded?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to make the minimum payments on all cards. 
              Without this, your debt will continue to grow due to interest charges.
            </p>
          </CardContent>
        </Card>
      ) : results.totalMonths > 0 ? (
        <>
          {/* Summary Card */}
          <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
            <CardHeader className="border-b-2 border-green-200">
              <CardTitle className="text-xl sm:text-2xl text-green-900">Debt-Free Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-300 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">Time to Debt-Free</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-700 break-words">
                    {results.totalMonths} months
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ({Math.floor(results.totalMonths / 12)} years, {results.totalMonths % 12} months)
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
            </CardContent>
          </Card>

          {/* Individual Card Payoff Details */}
          <Card className="shadow-xl border-2 border-indigo-200">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
              <CardTitle className="text-lg sm:text-xl text-indigo-900">Individual Card Payoff Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[700px]">
                  <thead className="bg-gray-100 border-b-2 border-gray-300">
                    <tr>
                      <th className="text-left p-2 sm:p-3 font-bold whitespace-nowrap">Card</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Original Balance</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Interest Rate</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Total Paid</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Interest Paid</th>
                      <th className="text-right p-2 sm:p-3 font-bold whitespace-nowrap">Paid Off</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results.cardPayoffs.map((card, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-2 sm:p-3 font-medium">{card.name}</td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap">
                          ${card.originalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap">
                          {card.interestRate.toFixed(2)}%
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap font-bold">
                          ${card.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap text-red-700 font-medium">
                          ${card.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right p-2 sm:p-3 whitespace-nowrap text-green-700 font-medium">
                          Month {card.paidOffMonth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <CardTitle className="flex items-center gap-2 text-purple-900 text-lg sm:text-xl">
                <PieChartIcon className="w-6 h-6" />
                Debt Distribution by Card
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={results.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
            </CardContent>
          </Card>

          {/* Balance Over Time Chart */}
          {results.monthlySchedule.length > 0 && (
            <Card className="shadow-xl border-2 border-cyan-200">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b-2 border-cyan-200">
                <CardTitle className="flex items-center gap-2 text-cyan-900 text-lg sm:text-xl">
                  <TrendingDown className="w-6 h-6" />
                  Debt Payoff Timeline
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Watch your debt disappear month by month
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.monthlySchedule.filter((_, i) => i % Math.max(1, Math.floor(results.monthlySchedule.length / 50)) === 0)}>
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
                      {results.cardPayoffs.map((card, index) => (
                        <Line
                          key={card.name}
                          type="monotone"
                          dataKey={card.name}
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <strong>Debt Avalanche Strategy:</strong> Notice how the highest interest rate cards (shown in the payoff order) 
                    are paid off first, minimizing total interest paid.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}

      {/* Educational Content will be added in Step 2 */}
    </div>
  );
};

export default CreditCardsPayoffCalculatorComponent;
