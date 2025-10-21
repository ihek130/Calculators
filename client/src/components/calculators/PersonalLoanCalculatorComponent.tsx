import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Area, AreaChart } from 'recharts';

const PersonalLoanCalculatorComponent = () => {
  // Loan Details
  const [loanAmount, setLoanAmount] = useState<string>('20000');
  const [interestRate, setInterestRate] = useState<string>('10');
  const [loanTermYears, setLoanTermYears] = useState<string>('5');
  const [loanTermMonths, setLoanTermMonths] = useState<string>('0');
  const [startMonth, setStartMonth] = useState<string>('10');
  const [startYear, setStartYear] = useState<string>('2025');

  // Parse values
  const principal = parseFloat(loanAmount) || 0;
  const annualRate = parseFloat(interestRate) || 0;
  const years = parseInt(loanTermYears) || 0;
  const months = parseInt(loanTermMonths) || 0;
  const totalMonths = (years * 12) + months;
  const monthlyRate = annualRate / 100 / 12;

  // Calculate monthly payment using amortization formula
  const monthlyPayment = totalMonths > 0 && monthlyRate > 0
    ? principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    : totalMonths > 0 ? principal / totalMonths : 0;

  // Calculate totals
  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = totalPayment - principal;

  // Calculate payoff date
  const startMonthNum = parseInt(startMonth);
  const startYearNum = parseInt(startYear);
  const payoffDate = new Date(startYearNum, startMonthNum - 1);
  payoffDate.setMonth(payoffDate.getMonth() + totalMonths);
  const payoffMonthName = payoffDate.toLocaleString('en-US', { month: 'short' });
  const payoffYear = payoffDate.getFullYear();

  // Calculate percentages for pie chart
  const principalPercentage = totalPayment > 0 ? (principal / totalPayment) * 100 : 0;
  const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  // Generate amortization schedule
  const generateAmortizationSchedule = () => {
    const schedule: Array<{
      year: number;
      month: number;
      date: string;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }> = [];

    let balance = principal;
    
    for (let i = 1; i <= totalMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      const paymentDate = new Date(startYearNum, startMonthNum - 1 + i);
      const monthName = paymentDate.toLocaleString('en-US', { month: 'short' });
      const year = paymentDate.getFullYear();

      schedule.push({
        year: Math.ceil(i / 12),
        month: i,
        date: `${monthName} ${year}`,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }

    return schedule;
  };

  const amortizationSchedule = generateAmortizationSchedule();

  // Generate annual schedule
  const generateAnnualSchedule = () => {
    const annualData: Array<{
      year: number;
      dateRange: string;
      interest: number;
      principal: number;
      endingBalance: number;
    }> = [];

    let currentYear = 1;
    let yearInterest = 0;
    let yearPrincipal = 0;
    let firstMonthDate = '';
    let lastMonthDate = '';

    amortizationSchedule.forEach((payment, index) => {
      if (payment.year !== currentYear && yearInterest > 0) {
        annualData.push({
          year: currentYear,
          dateRange: `${firstMonthDate}-${lastMonthDate}`,
          interest: yearInterest,
          principal: yearPrincipal,
          endingBalance: payment.balance + payment.principal
        });
        currentYear = payment.year;
        yearInterest = 0;
        yearPrincipal = 0;
        firstMonthDate = '';
      }

      if (firstMonthDate === '') {
        firstMonthDate = payment.date.replace(' ', '/');
      }
      lastMonthDate = payment.date.replace(' ', '/');

      yearInterest += payment.interest;
      yearPrincipal += payment.principal;

      if (index === amortizationSchedule.length - 1) {
        annualData.push({
          year: currentYear,
          dateRange: `${firstMonthDate}-${lastMonthDate}`,
          interest: yearInterest,
          principal: yearPrincipal,
          endingBalance: payment.balance
        });
      }
    });

    return annualData;
  };

  const annualSchedule = generateAnnualSchedule();

  // Pie chart data
  const pieData = [
    { name: 'Loan Amount', value: principal, color: '#3b82f6' },
    { name: 'Interest', value: totalInterest, color: '#ef4444' }
  ];

  // Bar chart data for annual schedule
  const barChartData = annualSchedule.map(item => ({
    year: `Year ${item.year}`,
    Balance: item.endingBalance,
    Interest: item.interest,
    Payment: item.principal + item.interest
  }));

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format currency without decimals
  const formatCurrencyShort = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Month names for select
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            Personal Loan Calculator
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-4">
          Calculate monthly payments, total costs, and view detailed amortization schedules for personal loans with accurate real-time results.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Loan Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Loan Amount */}
            <div className="space-y-2">
              <Label htmlFor="loanAmount" className="text-sm font-medium">
                Loan Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <Input
                  id="loanAmount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="pl-7 text-sm"
                  placeholder="20000"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-sm font-medium">
                Interest Rate (%)
              </Label>
              <div className="relative">
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="text-sm"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
              </div>
            </div>

            {/* Loan Term Years */}
            <div className="space-y-2">
              <Label htmlFor="loanTermYears" className="text-sm font-medium">
                Loan Term (Years)
              </Label>
              <Input
                id="loanTermYears"
                type="number"
                min="0"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(e.target.value)}
                className="text-sm"
                placeholder="5"
              />
            </div>

            {/* Loan Term Months */}
            <div className="space-y-2">
              <Label htmlFor="loanTermMonths" className="text-sm font-medium">
                Additional Months
              </Label>
              <Input
                id="loanTermMonths"
                type="number"
                min="0"
                max="11"
                value={loanTermMonths}
                onChange={(e) => setLoanTermMonths(e.target.value)}
                className="text-sm"
                placeholder="0"
              />
            </div>

            {/* Start Month */}
            <div className="space-y-2">
              <Label htmlFor="startMonth" className="text-sm font-medium">
                Start Month
              </Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger id="startMonth" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Year */}
            <div className="space-y-2">
              <Label htmlFor="startYear" className="text-sm font-medium">
                Start Year
              </Label>
              <Input
                id="startYear"
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="text-sm"
                placeholder="2025"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Loan Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Primary Result - Monthly Payment */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6 mb-6 text-center">
            <div className="text-sm text-blue-600 font-medium mb-2">Monthly Payment</div>
            <div className="text-4xl sm:text-5xl font-bold text-blue-900">{formatCurrency(monthlyPayment)}</div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">Total of {totalMonths} Payments</div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalPayment)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="text-sm text-red-600 font-medium mb-1">Total Interest</div>
                <div className="text-2xl font-bold text-red-900">{formatCurrency(totalInterest)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-sm text-green-600 font-medium mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Payoff Date
                </div>
                <div className="text-2xl font-bold text-green-900">{payoffMonthName}. {payoffYear}</div>
              </CardContent>
            </Card>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-900 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Payment Breakdown
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium">Loan Amount</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(principal)} ({principalPercentage.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">Interest</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(totalInterest)} ({interestPercentage.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amortization Chart */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="text-lg sm:text-xl">Amortization Schedule Visualization</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrencyShort(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="Balance" stackId="1" stroke="#3b82f6" fill="#93c5fd" />
                <Area type="monotone" dataKey="Interest" stackId="2" stroke="#ef4444" fill="#fca5a5" />
                <Area type="monotone" dataKey="Payment" stackId="3" stroke="#10b981" fill="#86efac" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Annual Amortization Schedule Table */}
      <Card className="mb-6 sm:mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <CardTitle className="text-lg sm:text-xl">Annual Amortization Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 font-semibold">Year</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-right p-3 font-semibold">Interest</th>
                  <th className="text-right p-3 font-semibold">Principal</th>
                  <th className="text-right p-3 font-semibold">Ending Balance</th>
                </tr>
              </thead>
              <tbody>
                {annualSchedule.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-medium">{row.year}</td>
                    <td className="p-3">{row.dateRange}</td>
                    <td className="p-3 text-right">{formatCurrency(row.interest)}</td>
                    <td className="p-3 text-right">{formatCurrency(row.principal)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(row.endingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Amortization Schedule Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
          <CardTitle className="text-lg sm:text-xl">Monthly Amortization Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="text-left p-3 font-semibold">Month</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-right p-3 font-semibold">Payment</th>
                  <th className="text-right p-3 font-semibold">Principal</th>
                  <th className="text-right p-3 font-semibold">Interest</th>
                  <th className="text-right p-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {amortizationSchedule.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-medium">{row.month}</td>
                    <td className="p-3">{row.date}</td>
                    <td className="p-3 text-right">{formatCurrency(row.payment)}</td>
                    <td className="p-3 text-right">{formatCurrency(row.principal)}</td>
                    <td className="p-3 text-right">{formatCurrency(row.interest)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Educational Content */}
      <div className="mt-8 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Understanding Personal Loans</h2>
        
        {/* What are Personal Loans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="mb-4 leading-relaxed text-gray-700">
            Personal loans are loans with fixed amounts, interest rates, and monthly payback amounts over defined periods of time. Typical personal loans range from $5,000 to $35,000 with terms of 3 or 5 years in the U.S. Unlike mortgages or auto loans, they are not backed by collateral (such as a car or home), making them unsecured loans. Instead, lenders evaluate your credit score, income, debt level, and many other factors to determine whether to grant the personal loan and at what interest rate.
          </p>
          <p className="mb-4 leading-relaxed text-gray-700">
            Due to their unsecured nature, personal loans typically come with higher interest rates than secured loans—ranging from 6% for borrowers with excellent credit to 25% or more for those with poor credit. This reflects the higher risk lenders take when they have no collateral to repossess if you default. The average personal loan interest rate in 2025 is approximately 11-12% for borrowers with good credit scores (700+).
          </p>
          <p className="leading-relaxed text-gray-700">
            Personal loans offer predictable monthly payments that never change throughout the loan term, making budgeting easier compared to credit cards with variable rates. The fixed nature of these loans means you'll know exactly when your loan will be paid off and how much you'll pay in total interest from day one. This calculator helps you visualize these costs and compare different loan scenarios before committing.
          </p>
        </div>

        {/* Types of Personal Loans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Types of Personal Loans</h3>
          
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Secured Personal Loans</h4>
            <p className="leading-relaxed text-gray-700">
              Although uncommon, secured personal loans do exist. They are usually offered at banks and credit unions backed by collateral such as a car, personal savings, or certificates of deposits (CDs). Like mortgages and auto loans, borrowers risk losing the collateral if timely repayments are not made. Generally, the maximum loan limit is based on the collateral value the borrower is willing to pledge. The advantage of secured personal loans is significantly lower interest rates—often 3-7 percentage points less than unsecured loans—because the lender's risk is reduced.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Traditional Personal Loans</h4>
            <p className="leading-relaxed text-gray-700">
              Before the arrival of the internet, personal loans were generally provided by banks, credit unions, and other financial institutions. These institutions profit by taking in money through savings accounts, checking accounts, money market accounts, or certificates of deposit (CDs), and lending it back out at higher interest rates. Traditional lenders typically require in-person applications, credit checks, income verification, and several days to weeks for approval. While this process is slower, established banks often offer relationship discounts for existing customers.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Loans from P2P Lenders</h4>
            <p className="leading-relaxed text-gray-700">
              The advent of the internet introduced peer-to-peer (P2P) lending, transforming the personal loan industry. Instead of going to traditional lending institutions, borrowers can now use online financial service companies that match them directly with individual lenders. These lenders are regular people with extra money to invest. P2P borrowers often receive loans with more favorable terms because of the relatively low risk and low operating costs for P2P platforms. Since P2P providers operate primarily online rather than maintaining expensive brick-and-mortar locations, they pass savings to borrowers through lower rates and fees. Popular P2P platforms include LendingClub, Prosper, and Upstart, with approval often happening within 24-48 hours.
            </p>
          </div>
        </div>

        {/* Why Use Personal Loans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Why Use Personal Loans?</h3>
          
          <p className="leading-relaxed text-gray-700 mb-6">
            About half of all personal loans are used for debt consolidation. Personal loan interest rates are normally lower than credit cards, making them an excellent vehicle for consolidating credit card debt or other high-interest debts. For example, if you're carrying $15,000 in credit card debt at 22% APR and consolidate it with a personal loan at 12% APR, you could save thousands in interest and pay off your debt faster with a fixed end date.
          </p>
          
          <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Common Uses for Personal Loans</h4>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Debt Consolidation:</strong> Combining multiple high-interest debts into one lower-rate payment. A person with an $8,000 balance at 19.99% APR on one credit card and $7,000 at 24.99% APR on another could consolidate with a $16,000 personal loan at 12% APR, saving significantly on interest.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Home Improvements:</strong> Renovations that increase home value or necessary repairs when home equity isn't available or desirable to tap.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Medical Bills:</strong> Unexpected medical expenses that insurance doesn't cover, often offering better terms than medical payment plans.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Small Business Expenses:</strong> Funding for equipment, inventory, or expansion when traditional business loans aren't available or practical.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Major Life Events:</strong> Weddings (average cost $30,000), moving expenses, or adoption fees.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700"><strong>Emergency Expenses:</strong> Car repairs, home repairs, or other urgent needs when emergency funds are insufficient.</span>
            </li>
          </ul>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4 rounded">
            <p className="text-sm font-semibold text-yellow-900">
              Important: When considering a personal loan for debt consolidation, fully evaluate all fees. The fee-included APR is a better reference than the interest rate alone for accurate comparisons between loan offers.
            </p>
          </div>
        </div>

        {/* Personal Loan Fees */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Understanding Personal Loan Fees</h3>
          
          <p className="leading-relaxed text-gray-700 mb-6">
            Aside from principal and interest payments, personal loans often come with several fees that can significantly impact the true cost. Understanding these fees is crucial for accurate loan comparisons and budgeting.
          </p>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Origination Fee</h4>
            <p className="leading-relaxed text-gray-700">
              Sometimes called an application fee or processing fee, this covers costs associated with processing applications. It typically ranges from 1% to 5% of the loan amount, though some lenders charge flat fees of $50-$500. Some lenders deduct this fee upfront while others add it to the loan balance. For example, a $10,000 loan with a 3% origination fee means you'll only receive $9,700 (or owe $10,300 if added to the balance), but your repayment is still based on the full $10,000 plus interest. This fee alone can increase your APR by 0.5% to 2%, so always factor it into comparisons.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Prepayment Penalty</h4>
            <p className="leading-relaxed text-gray-700">
              This fee applies when you pay off your loan early or make extra payments ahead of schedule. While less common today (only about 2% of personal loans include this fee), it's crucial to check before borrowing if you plan to pay off your loan early. Prepayment penalties can be 2-5% of the outstanding balance or several months' worth of interest. For instance, paying off a $20,000 loan early with a 3% prepayment penalty would cost you $600. Many modern lenders, especially online P2P platforms, have eliminated this fee to remain competitive.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Late Payment Fee</h4>
            <p className="leading-relaxed text-gray-700">
              Charged when you miss a payment deadline, late fees typically range from $25 to $50 or 5% of the payment amount, whichever is greater. Some lenders offer a grace period of 10-15 days before assessing the fee. Beyond the fee itself, late payments can damage your credit score (dropping it 50-100 points) and may trigger an increased interest rate on variable-rate loans. If you anticipate difficulty making a payment, contact your lender immediately—many are willing to work out payment arrangements or extend deadlines to avoid defaults.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Insufficient Funds Fee</h4>
            <p className="leading-relaxed text-gray-700">
              Also called a returned payment fee or NSF fee, this is charged when your bank account doesn't have sufficient funds for automatic payments. Fees typically range from $20 to $35 per occurrence. You may face charges from both your lender and your bank, potentially totaling $60-$70 for a single failed payment.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Optional Insurance</h4>
            <p className="leading-relaxed text-gray-700">
              Some lenders offer or require personal loan insurance covering events like death, disability, or job loss. While potentially beneficial, this insurance can add 1-3% to your loan's APR and is not legally required. Credit life insurance on a $20,000 5-year loan might cost $1,500-$3,000 over the loan term. Evaluate whether existing life insurance or disability coverage already protects you before purchasing these add-ons.
            </p>
          </div>
        </div>

        {/* Creditworthiness and Application */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Loans and Creditworthiness</h3>
          
          <p className="leading-relaxed text-gray-700 mb-4">
            Your creditworthiness is the primary factor affecting personal loan approval and interest rates. Lenders typically categorize borrowers as follows: Excellent credit (750+) may qualify for rates as low as 6-8%, Good credit (700-749) typically sees rates of 9-12%, Fair credit (650-699) faces rates of 13-18%, Poor credit (600-649) encounters rates of 19-25%, and Bad credit (below 600) often struggles to qualify or faces rates above 25%.
          </p>
          <p className="leading-relaxed text-gray-700 mb-6">
            Good or excellent credit scores are crucial for securing personal loans at favorable rates. A 100-point difference in credit score can mean a 5-10 percentage point difference in interest rate, which translates to thousands of dollars over a 5-year loan. For example, a $20,000 5-year loan at 10% APR costs $5,496 in interest, while the same loan at 20% APR costs $12,273—more than double. People with lower credit scores have fewer options and face loans with unfavorable terms. However, lenders that look beyond credit scores do exist; they consider factors like debt-to-income ratio (preferably under 36%), stable employment history (2+ years), sufficient income (typically requiring 3x the monthly payment), and verifiable assets.
          </p>

          <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">The Application Process</h4>
          <p className="leading-relaxed text-gray-700 mb-4">
            The application process is usually straightforward. Lenders typically request basic personal information (name, address, SSN), employment details (employer name, position, length of employment), income information (pay stubs, tax returns, W-2 forms), and credit report authorization. Many lenders today allow online applications that take just 10-15 minutes to complete. After submission, lenders verify the information through credit bureaus and may request additional documentation.
          </p>
          <p className="leading-relaxed text-gray-700">
            Decision timelines vary by lender: online P2P lenders often decide within 24-48 hours, traditional banks may take 3-7 business days, and credit unions typically require 5-10 days. Applicants receive one of three outcomes: approved (ready to fund), rejected (with reasons provided), or conditionally approved (requiring additional documentation like bank statements or proof of assets). If approved, personal loans can be funded within 24 hours for online lenders or 3-5 days for traditional institutions, with funds deposited directly into your checking account via ACH transfer.
          </p>
        </div>

        {/* Avoiding Predatory Loans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Avoiding Fraudulent or Predatory Loans</h3>
          
          <p className="leading-relaxed text-gray-700 mb-6">
            Unfortunately, fraudulent and predatory lenders exist, targeting desperate borrowers with unfair terms. It's unusual for a legitimate lender to extend an offer without first checking credit history—lenders doing so are red flags. Loans advertised through unsolicited physical mail, phone calls, or email have a high chance of being predatory. Be especially cautious of auto title loans, payday loans, no-credit-check loans, and cash advances, which often come with APRs exceeding 100-400%.
          </p>

          <h4 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Red Flags to Watch For</h4>
          <ul className="space-y-3 mb-4">
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl flex-shrink-0">⚠</span>
              <span className="text-gray-700"><strong>Guaranteed Approval:</strong> No legitimate lender can guarantee approval without reviewing your credit and finances first.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl flex-shrink-0">⚠</span>
              <span className="text-gray-700"><strong>Upfront Fees:</strong> Legitimate lenders deduct fees from loan proceeds or add them to the balance—never demand payment before funding.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl flex-shrink-0">⚠</span>
              <span className="text-gray-700"><strong>Vague Terms:</strong> Predatory lenders avoid clear disclosure of interest rates, fees, and payment terms.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl flex-shrink-0">⚠</span>
              <span className="text-gray-700"><strong>Pressure Tactics:</strong> Legitimate lenders give you time to review and compare offers; predatory lenders pressure immediate decisions.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-600 font-bold text-xl flex-shrink-0">⚠</span>
              <span className="text-gray-700"><strong>Unlicensed Lenders:</strong> Verify lenders are licensed in your state through your state's financial regulator website.</span>
            </li>
          </ul>

          <p className="leading-relaxed text-gray-700">
            Generally, payday loans and cash advances come with exorbitant interest rates (300-400% APR), excessive fees ($15-$30 per $100 borrowed), and very short payback terms (2-4 weeks). A typical $500 payday loan might cost $575 to repay in two weeks—equivalent to 391% APR. These loans trap borrowers in debt cycles where they continuously roll over loans, paying fees each time without reducing principal.
          </p>
        </div>

        {/* Personal Loan Alternatives */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Loan Alternatives</h3>
          
          <p className="leading-relaxed text-gray-700 mb-6">
            Before taking out an unsecured personal loan, especially at high interest rates, consider these alternatives that may offer better terms or lower costs.
          </p>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Borrow from Family or Friends</h4>
            <p className="leading-relaxed text-gray-700">
              Family or friends willing to help often lend at zero or very low interest rates. To maintain relationships, treat this formally: create a written agreement specifying loan amount, interest rate (if any), payment schedule, and consequences of default. Making on-time payments preserves trust and may be reported to credit bureaus to help build your credit.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Get a Cosigner</h4>
            <p className="leading-relaxed text-gray-700">
              A cosigner with good credit (700+ score), stable employment, and sufficient income can help you qualify for better rates or higher loan amounts. The cosigner is equally responsible for repayment—if you default, it damages their credit and they must pay. This serious commitment means cosigners should be close family members or trusted friends who thoroughly understand the risks.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Zero or Low Introductory Rate Credit Cards</h4>
            <p className="leading-relaxed text-gray-700">
              Many credit cards offer 0% APR for 12-21 months on purchases or balance transfers. These are excellent for carrying debt interest-free if you can pay it off before the promotional period ends. Just be aware of balance transfer fees (typically 3-5%) and mark your calendar for when the promotional rate expires—remaining balances then face regular APRs of 18-25%.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Secured Loans Using Collateral</h4>
            <p className="leading-relaxed text-gray-700">
              If you own assets like a home, car, or valuable jewelry, secured loans offer significantly lower rates than unsecured personal loans. A home equity line of credit (HELOC) allows borrowing against home equity at rates of 6-9%, often with interest tax-deductibility. However, defaulting on secured loans can result in foreclosure (for homes) or repossession (for vehicles), so only use this option if you're confident in your ability to repay.
            </p>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Community and Nonprofit Organizations</h4>
            <p className="leading-relaxed text-gray-700">
              Religious organizations, community groups, and nonprofits often provide emergency financial assistance to people struggling financially. Programs like Catholic Charities, Salvation Army, United Way, and local community action agencies may offer grants (not loans) or interest-free loans for emergencies. Many cities also have financial empowerment centers offering free financial counseling.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Crowdfunding</h4>
            <p className="leading-relaxed text-gray-700">
              Platforms like GoFundMe, Kickstarter, and Indiegogo allow raising money without repayment obligations. While crowdfunding success isn't guaranteed, people starting promising businesses, requesting disaster relief, facing medical emergencies, or dealing with financial hardships beyond their control often receive community support. The key is telling a compelling, honest story and actively promoting your campaign through social media. Average successful campaigns raise $500-$5,000, though exceptional cases can reach much higher.
            </p>
          </div>
        </div>

        {/* Improving Credit for Better Rates */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Improving Your Credit Score for Better Loan Terms</h3>
          
          <p className="leading-relaxed text-gray-700 mb-4">
            If you're not facing an immediate emergency, taking 3-6 months to improve your credit score before applying for a personal loan can save thousands of dollars. Even modest improvements—raising your score from 680 to 720—can reduce your interest rate by 3-5 percentage points. On a $20,000 5-year loan, this translates to savings of $1,500-$3,000 in total interest. The five factors affecting your credit score are: payment history (35%), credit utilization (30%), length of credit history (15%), new credit inquiries (10%), and credit mix (10%).
          </p>
          <p className="leading-relaxed text-gray-700">
            To quickly boost your score, focus on paying all bills on time (set up automatic payments to never miss due dates), reducing credit card balances below 30% of limits (ideally below 10% for optimal scores), avoiding new credit applications for 6 months before your loan application, disputing any errors on your credit reports (25% of reports contain mistakes), and becoming an authorized user on a family member's card with excellent payment history. If you have delinquent accounts, consider negotiating "pay for delete" agreements where creditors remove negative marks in exchange for payment. Each positive change can increase your score by 20-50 points within 30-90 days, potentially qualifying you for significantly better loan terms.
          </p>
        </div>

        {/* Key Takeaways */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Key Takeaways</h3>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Personal loans range from $5,000 to $35,000 with fixed interest rates and 3-5 year terms, offering predictable monthly payments</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Interest rates vary dramatically based on credit score: 6-8% for excellent credit (750+) vs. 19-25% for poor credit (600-649)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">About 50% of personal loans are used for debt consolidation, offering lower rates than credit cards (typically 12% vs. 22%)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Origination fees (1-5% of loan amount) can significantly impact total cost—always compare APR including fees, not just interest rates</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">P2P lenders offer faster approval (24-48 hours) and often better rates than traditional banks due to lower operating costs</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Avoid predatory loans with guaranteed approval, upfront fees, vague terms, or pressure tactics—verify lender licensing in your state</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Consider alternatives like 0% APR credit cards, family loans, cosigners, or HELOCs before committing to high-interest personal loans</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold text-xl flex-shrink-0">•</span>
              <span className="text-gray-700">Improving your credit score by 100 points can reduce your interest rate by 5-10%, saving thousands over the loan term</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PersonalLoanCalculatorComponent;
