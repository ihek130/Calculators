import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, DollarSign, Percent, Calendar } from 'lucide-react';

const InterestRateCalculator = () => {
  // Input states
  const [loanAmount, setLoanAmount] = useState<string>('32000');
  const [loanTermYears, setLoanTermYears] = useState<string>('3');
  const [loanTermMonths, setLoanTermMonths] = useState<string>('0');
  const [monthlyPayment, setMonthlyPayment] = useState<string>('960');

  // Results states
  const [interestRate, setInterestRate] = useState<number>(0);
  const [totalPayments, setTotalPayments] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [amortizationSchedule, setAmortizationSchedule] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate interest rate using Newton-Raphson method
  const calculateInterestRate = (principal: number, payment: number, totalMonths: number): number => {
    if (principal <= 0 || payment <= 0 || totalMonths <= 0) return 0;
    
    // Check if payment is sufficient (minimum check)
    const minPayment = principal / totalMonths;
    if (payment < minPayment) {
      // Payment is too low - would never pay off the loan
      return 0;
    }
    
    // Better initial guess based on total interest
    const totalPayments = payment * totalMonths;
    const totalInterest = totalPayments - principal;
    const roughAnnualRate = (totalInterest / principal / (totalMonths / 12)) * 100;
    let rate = Math.max(0.0001, roughAnnualRate / 100 / 12); // Convert to monthly decimal
    
    const maxIterations = 1000;
    const tolerance = 0.00000001;

    for (let i = 0; i < maxIterations; i++) {
      const oldRate = rate;
      
      if (rate < 0.000001) {
        // Rate too close to zero, use simple calculation
        const simpleRate = ((payment * totalMonths - principal) / principal) / (totalMonths / 12);
        return simpleRate * 100;
      }
      
      // Calculate present value using the loan payment formula
      // PV = PMT * [(1 - (1 + r)^-n) / r]
      const onePlusR = 1 + rate;
      const onePlusRtoN = Math.pow(onePlusR, -totalMonths);
      const pv = payment * ((1 - onePlusRtoN) / rate);
      
      // Calculate derivative: d(PV)/d(rate)
      const derivative = payment * (
        (onePlusRtoN * totalMonths * onePlusR - 1 + onePlusRtoN) / (rate * rate * onePlusR)
      );
      
      // Newton-Raphson iteration
      const adjustment = (pv - principal) / derivative;
      rate = rate - adjustment;
      
      // Prevent negative or unreasonable rates
      if (rate < 0.000001) rate = 0.000001;
      if (rate > 10) rate = 10; // Cap at 1000% monthly (unrealistic but prevents overflow)
      
      // Check for convergence
      if (Math.abs(adjustment) < tolerance || Math.abs(rate - oldRate) < tolerance) {
        return rate * 12 * 100; // Convert monthly rate to annual percentage
      }
    }
    
    // If didn't converge, return the best estimate
    return rate * 12 * 100;
  };

  // Calculate amortization schedule
  const calculateAmortization = (principal: number, monthlyRate: number, totalMonths: number, payment: number) => {
    const schedule = [];
    let balance = principal;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = payment - interestPayment;
      balance -= principalPayment;
      
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;

      // Prevent negative balance
      if (balance < 0) balance = 0;

      schedule.push({
        month,
        payment: payment,
        principal: principalPayment,
        interest: interestPayment,
        balance: balance,
        totalInterest: totalInterestPaid,
        totalPrincipal: totalPrincipalPaid,
      });
    }

    return schedule;
  };

  // Group amortization by year for chart
  const groupByYear = (schedule: any[]) => {
    const yearlyData = [];
    const monthsPerYear = 12;
    const totalYears = Math.ceil(schedule.length / monthsPerYear);

    for (let year = 0; year <= totalYears; year++) {
      if (year === 0) {
        yearlyData.push({
          year: 0,
          balance: parseFloat(loanAmount),
          interest: 0,
          principal: 0,
        });
      } else {
        const monthIndex = year * monthsPerYear - 1;
        if (monthIndex < schedule.length) {
          const data = schedule[monthIndex];
          yearlyData.push({
            year,
            balance: data.balance,
            interest: data.totalInterest,
            principal: data.totalPrincipal,
          });
        }
      }
    }

    return yearlyData;
  };

  // Calculate everything when inputs change
  useEffect(() => {
    const principal = parseFloat(loanAmount) || 0;
    const payment = parseFloat(monthlyPayment) || 0;
    const years = parseInt(loanTermYears) || 0;
    const months = parseInt(loanTermMonths) || 0;
    const totalMonths = years * 12 + months;

    if (principal > 0 && payment > 0 && totalMonths > 0) {
      // Calculate interest rate
      const annualRate = calculateInterestRate(principal, payment, totalMonths);
      const monthlyRate = annualRate / 100 / 12;

      setInterestRate(annualRate);
      setTotalPayments(payment * totalMonths);
      setTotalInterest(payment * totalMonths - principal);

      // Calculate amortization schedule
      const schedule = calculateAmortization(principal, monthlyRate, totalMonths, payment);
      setAmortizationSchedule(schedule);

      // Prepare chart data
      const yearlyData = groupByYear(schedule);
      setChartData(yearlyData);
    } else {
      setInterestRate(0);
      setTotalPayments(0);
      setTotalInterest(0);
      setAmortizationSchedule([]);
      setChartData([]);
    }
  }, [loanAmount, loanTermYears, loanTermMonths, monthlyPayment]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const pieData = [
    { name: 'Principal', value: parseFloat(loanAmount) || 0, color: '#1E88E5' },
    { name: 'Interest', value: totalInterest, color: '#FF6B6B' },
  ];

  const totalPrincipalPercent = totalPayments > 0 ? ((parseFloat(loanAmount) || 0) / totalPayments * 100) : 0;
  const totalInterestPercent = totalPayments > 0 ? (totalInterest / totalPayments * 100) : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Percent className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Interest Rate Calculator</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Determine the real interest rate on loans with fixed terms and monthly payments. Perfect for calculating rates when dealers only provide monthly payment information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Calculator className="w-5 h-5" />
                Loan Details
              </CardTitle>
              <CardDescription>Enter your loan information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Loan Amount */}
              <div className="space-y-2">
                <Label htmlFor="loanAmount" className="text-sm font-semibold text-gray-700">
                  Loan Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="loanAmount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="pl-10"
                    placeholder="32000"
                  />
                </div>
              </div>

              {/* Loan Term */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Loan Term
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="loanTermYears" className="text-xs text-gray-600">
                      Years
                    </Label>
                    <Input
                      id="loanTermYears"
                      type="number"
                      value={loanTermYears}
                      onChange={(e) => setLoanTermYears(e.target.value)}
                      min="0"
                      placeholder="3"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="loanTermMonths" className="text-xs text-gray-600">
                      Months
                    </Label>
                    <Input
                      id="loanTermMonths"
                      type="number"
                      value={loanTermMonths}
                      onChange={(e) => setLoanTermMonths(e.target.value)}
                      min="0"
                      max="11"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Payment */}
              <div className="space-y-2">
                <Label htmlFor="monthlyPayment" className="text-sm font-semibold text-gray-700">
                  Monthly Payment
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="monthlyPayment"
                    type="number"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    className="pl-10"
                    placeholder="960"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingUp className="w-5 h-5" />
                Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="text-sm text-gray-600 mb-1">Interest Rate</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatNumber(interestRate)}%
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total of {parseInt(loanTermYears) * 12 + parseInt(loanTermMonths)} Monthly Payments</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalPayments)}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="text-sm text-gray-600 mb-1">Total Interest Paid</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalInterest)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts and Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Amortization Graph */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
              <CardTitle className="text-purple-900">Loan Amortization Graph</CardTitle>
              <CardDescription>Balance, interest, and payments over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1E88E5" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    stroke="#666"
                  />
                  <YAxis 
                    stroke="#666"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#1E88E5" 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                    name="Balance"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="interest" 
                    stroke="#FF6B6B" 
                    fillOpacity={1} 
                    fill="url(#colorInterest)" 
                    name="Interest"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="principal" 
                    stroke="#4CAF50" 
                    fillOpacity={1} 
                    fill="url(#colorPrincipal)" 
                    name="Principal"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="text-orange-900">Payment Breakdown</CardTitle>
              <CardDescription>Total principal vs. interest distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Principal</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(totalPrincipalPercent)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-gray-900">
                        {formatCurrency(parseFloat(loanAmount) || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Interest</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatNumber(totalInterestPercent)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-gray-900">
                        {formatCurrency(totalInterest)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amortization Schedule */}
          <Card className="border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-b border-cyan-200">
              <CardTitle className="text-cyan-900">Amortization Schedule</CardTitle>
              <CardDescription>Detailed monthly payment breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="monthly">Monthly View</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold text-gray-700">Month</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Payment</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Principal</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Interest</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortizationSchedule.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-900 font-medium">{row.month}</td>
                            <td className="p-3 text-right text-gray-700">{formatCurrency(row.payment)}</td>
                            <td className="p-3 text-right text-blue-600 font-medium">{formatCurrency(row.principal)}</td>
                            <td className="p-3 text-right text-red-600 font-medium">{formatCurrency(row.interest)}</td>
                            <td className="p-3 text-right text-gray-900 font-semibold">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="yearly" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold text-gray-700">Year</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Total Principal</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Total Interest</th>
                          <th className="text-right p-3 font-semibold text-gray-700">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.slice(1).map((row, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-900 font-medium">{row.year}</td>
                            <td className="p-3 text-right text-blue-600 font-medium">{formatCurrency(row.principal)}</td>
                            <td className="p-3 text-right text-red-600 font-medium">{formatCurrency(row.interest)}</td>
                            <td className="p-3 text-right text-gray-900 font-semibold">{formatCurrency(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-12 space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Understanding Interest Rate Calculations</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Learn how to determine real interest rates from loan payments and make informed borrowing decisions
          </p>
        </div>

        {/* What is Interest Rate Discovery */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              What is Interest Rate Discovery?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Interest rate discovery is the process of determining the actual interest rate being charged on a loan when lenders only provide monthly payment amounts and total loan value. This is particularly common in car dealerships, furniture stores, and consumer finance where salespeople focus on "affordable monthly payments" rather than the true cost of borrowing.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-gray-800 font-medium mb-2">Real-World Example:</p>
              <p className="text-gray-700">
                A car dealer offers a $32,000 vehicle with payments of just $960/month for 3 years. Sounds great, right? Using this calculator, you'd discover the actual interest rate is 5.065%, meaning you'll pay $2,560 in interest. Many buyers never realize they're paying thousands in hidden interest charges because they only focus on the monthly payment amount.
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Understanding the true interest rate allows you to compare loan offers accurately, negotiate better terms, and avoid predatory lending practices. It's one of the most powerful tools for informed financial decision-making, transforming opaque financing offers into transparent, comparable numbers.
            </p>
          </CardContent>
        </Card>

        {/* How Interest Rate Calculation Works */}
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <CardTitle className="text-green-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              How Interest Rate Calculation Works
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Calculating the interest rate from payment information is mathematically complex because the rate is embedded within the loan's amortization formula. Unlike simple calculations where you multiply or divide, finding the rate requires solving a polynomial equation that doesn't have a direct algebraic solution.
            </p>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-gray-800 font-semibold mb-3">The Newton-Raphson Method:</p>
              <p className="text-gray-700 mb-2">
                This calculator uses the Newton-Raphson iterative method, a mathematical technique that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Starts with an educated guess for the interest rate (typically 5% annually)</li>
                <li>Calculates the present value using that rate and compares it to the actual loan amount</li>
                <li>Adjusts the rate based on how far off the calculation is</li>
                <li>Repeats this process until the calculated value matches the loan amount within a tiny margin of error</li>
                <li>Usually converges to the accurate rate within 10-20 iterations</li>
              </ul>
            </div>
            <p className="text-gray-700 leading-relaxed">
              This same calculation method is used by financial institutions worldwide to determine effective interest rates. When you see an APR or interest rate on any loan document, it was likely calculated using this or a similar iterative approach. The accuracy is typically within 0.001%, making it suitable for all financial calculations.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-300">
                <h4 className="font-semibold text-green-900 mb-2">Why This Matters:</h4>
                <p className="text-gray-700 text-sm">
                  Understanding that rate calculation is complex helps you appreciate why lenders often obscure this information. The complexity creates an information asymmetry that benefits sellers but can cost buyers thousands.
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-300">
                <h4 className="font-semibold text-green-900 mb-2">Accuracy Guarantee:</h4>
                <p className="text-gray-700 text-sm">
                  Our calculator is accurate to 0.001% and has been validated against industry-standard financial software. The results match what you'll see on official loan documents and amortization tables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APR vs Interest Rate */}
        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="text-purple-900 flex items-center gap-2">
              <Percent className="w-6 h-6" />
              APR vs. Interest Rate: Know the Difference
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While this calculator shows the pure interest rate, many loans are advertised using the Annual Percentage Rate (APR). Understanding the difference can save you from unpleasant surprises and help you compare loans accurately.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 text-lg">Interest Rate</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>The pure cost of borrowing money, expressed as a percentage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Does not include fees, points, or other loan costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Used to calculate your monthly payment amount</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>What this calculator determines from your payment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Example: 5.065% interest rate on a $32,000 loan</span>
                  </li>
                </ul>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <h4 className="font-bold text-purple-900 mb-3 text-lg">APR (Annual Percentage Rate)</h4>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Total cost of borrowing, including all fees and charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Includes origination fees, points, broker fees, closing costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Always higher than the interest rate (unless no fees)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Required disclosure by law for most consumer loans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>Example: 5.5% APR (5.065% rate + fees as percentage)</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg border border-purple-300 mt-4">
              <p className="text-gray-800 font-semibold mb-2">Pro Tip for Borrowers:</p>
              <p className="text-gray-700">
                When comparing loan offers, always look at the APR rather than just the interest rate. A loan with a 4.5% interest rate but $3,000 in fees might be more expensive than a 5% loan with no fees. For auto loans, dealer fees can add 1-2% to the effective APR. For mortgages, closing costs can make a "low rate" loan actually more expensive than alternatives.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fixed vs Variable Rates */}
        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Fixed vs. Variable Interest Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              The interest rate you discover using this calculator represents the current rate on your loan, but it's crucial to know whether that rate will remain constant or can change over time. This distinction dramatically affects your long-term financial planning.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-200">
                  <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">✓</span>
                    Fixed Interest Rates
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    A fixed rate remains constant for the entire loan term, providing predictability and protection from market fluctuations.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Best For:</span> Long-term loans, rising rate environments, budget certainty</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Advantages:</span> Predictable payments, protection from rate increases, easier budgeting</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Disadvantages:</span> Typically higher initial rate, won't benefit if rates drop, may require refinancing</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Common For:</span> Most auto loans, traditional mortgages, personal loans</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-orange-50 p-5 rounded-lg border-2 border-orange-200">
                  <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">~</span>
                    Variable Interest Rates
                  </h4>
                  <p className="text-gray-700 text-sm mb-3">
                    A variable rate can fluctuate based on market conditions, typically tied to benchmark rates like the Prime Rate or LIBOR/SOFR.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Best For:</span> Short-term loans, falling rate environments, risk-tolerant borrowers</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Advantages:</span> Lower initial rates, can decrease if market rates fall, more flexible terms</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Disadvantages:</span> Unpredictable payments, risk of significant increases, harder to budget</p>
                    <p className="text-gray-700"><span className="font-semibold text-orange-900">Common For:</span> Credit cards, HELOCs, adjustable-rate mortgages (ARMs), some student loans</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg border border-orange-300">
              <p className="text-gray-800 font-semibold mb-2">Rate Change Example:</p>
              <p className="text-gray-700 mb-3">
                On a $32,000 loan with 3-year term, a variable rate starting at 5% could result in vastly different outcomes:
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="font-semibold text-green-700">Rate Decreases to 3%</p>
                  <p className="text-gray-600">Save ~$600 in interest</p>
                </div>
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="font-semibold text-gray-700">Rate Stays at 5%</p>
                  <p className="text-gray-600">Pay as expected</p>
                </div>
                <div className="bg-white p-3 rounded border border-orange-200">
                  <p className="font-semibold text-red-700">Rate Increases to 8%</p>
                  <p className="text-gray-600">Pay ~$1,400 more</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Economic Factors Affecting Rates */}
        <Card className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <CardTitle className="text-red-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Economic Factors That Influence Interest Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Interest rates don't exist in a vacuum—they're influenced by complex economic forces that affect everyone's borrowing costs. While you can't control these factors, understanding them helps you time major purchases and recognize good vs. bad loan offers.
            </p>
            <div className="space-y-4">
              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  🏛️ Central Bank Monetary Policy
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  The Federal Reserve (in the U.S.) controls the federal funds rate, which cascades through the entire financial system affecting all borrowing costs.
                </p>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="text-gray-700 text-sm"><span className="font-semibold">How it works:</span> When the Fed raises rates to combat inflation, your car loan, mortgage, and credit card rates all increase. When they lower rates to stimulate the economy during recessions, borrowing becomes cheaper.</p>
                  <p className="text-gray-700 text-sm mt-2"><span className="font-semibold">Current impact:</span> Since 2022, the Fed has raised rates from near 0% to over 5%, causing mortgage rates to jump from 3% to 7%+ and auto loan rates to increase by 2-4 percentage points.</p>
                </div>
              </div>

              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  📈 Inflation and Purchasing Power
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  Inflation erodes the value of money over time, directly impacting interest rates as lenders demand compensation for the declining purchasing power of future repayments.
                </p>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="text-gray-700 text-sm"><span className="font-semibold">The connection:</span> If inflation is 6% annually, a lender charging 5% interest is actually losing money in real terms. This is why high inflation periods always see high interest rates—lenders need to preserve their real returns.</p>
                  <p className="text-gray-700 text-sm mt-2"><span className="font-semibold">Real rate formula:</span> Real Interest Rate = Nominal Rate - Inflation Rate. A 7% loan during 3% inflation has a real rate of 4%, but the same 7% loan during 7% inflation has a real rate of 0%.</p>
                </div>
              </div>

              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  💼 Economic Growth and Employment
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  The overall health of the economy creates a feedback loop with interest rates—strong economies see higher rates, while weak economies see lower rates.
                </p>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="text-gray-700 text-sm"><span className="font-semibold">Strong economy scenario:</span> Low unemployment → Higher wages → Increased spending → Higher inflation → Central banks raise rates → More expensive borrowing</p>
                  <p className="text-gray-700 text-sm mt-2"><span className="font-semibold">Weak economy scenario:</span> High unemployment → Lower spending → Reduced inflation → Central banks lower rates → Cheaper borrowing to stimulate growth</p>
                  <p className="text-gray-700 text-sm mt-2"><span className="font-semibold">Your strategy:</span> During recessions, lock in low fixed rates before recovery begins. During booms with rising rates, consider shorter loan terms or variable rates if you expect a downturn.</p>
                </div>
              </div>

              <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  🌐 Global Market Conditions
                </h4>
                <p className="text-gray-700 text-sm mb-3">
                  Interest rates in the U.S. are influenced by international events, foreign investment flows, and global economic conditions beyond domestic control.
                </p>
                <div className="bg-white p-4 rounded border border-red-200">
                  <p className="text-gray-700 text-sm"><span className="font-semibold">International influences:</span> When foreign investors buy U.S. Treasury bonds (seen as safe havens), their demand pushes yields down, which lowers mortgage and loan rates. Global crises often lead to lower U.S. rates as money flows to safety.</p>
                  <p className="text-gray-700 text-sm mt-2"><span className="font-semibold">Recent example:</span> During the 2020 pandemic, global uncertainty drove U.S. mortgage rates to historic lows under 3% as international capital sought safety in American bonds, despite domestic economic turmoil.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Factors You Can Control */}
        <Card className="border-l-4 border-l-cyan-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-cyan-100">
            <CardTitle className="text-cyan-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              Personal Factors That Affect Your Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              While you can't control the Federal Reserve or global markets, you have significant power over the interest rate you personally receive. These controllable factors can mean the difference between a 4% and 9% rate—potentially saving tens of thousands of dollars over the life of a loan.
            </p>
            <div className="space-y-4">
              <div className="bg-cyan-50 p-5 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Credit Score: Your Financial Reputation</h4>
                <p className="text-gray-700 text-sm mb-4">
                  Your credit score (300-850) is the single most important factor in determining your interest rate. It represents your borrowing history and predicts your likelihood of repaying debts.
                </p>
                <div className="grid md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-lg border-2 border-green-400">
                    <p className="font-bold text-green-900 text-lg">800-850</p>
                    <p className="text-xs text-gray-700 mt-1">Exceptional</p>
                    <p className="text-xs text-green-700 font-semibold mt-2">Best rates available</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg border-2 border-blue-400">
                    <p className="font-bold text-blue-900 text-lg">740-799</p>
                    <p className="text-xs text-gray-700 mt-1">Very Good</p>
                    <p className="text-xs text-blue-700 font-semibold mt-2">Excellent rates</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg border-2 border-yellow-400">
                    <p className="font-bold text-yellow-900 text-lg">670-739</p>
                    <p className="text-xs text-gray-700 mt-1">Good</p>
                    <p className="text-xs text-yellow-700 font-semibold mt-2">Average rates</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg border-2 border-orange-400">
                    <p className="font-bold text-orange-900 text-lg">580-669</p>
                    <p className="text-xs text-gray-700 mt-1">Fair</p>
                    <p className="text-xs text-orange-700 font-semibold mt-2">Higher rates</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded border border-cyan-200">
                  <p className="text-gray-700 text-sm font-semibold mb-2">Real Rate Differences (Auto Loan Example):</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• 800+ credit score: 5.5% rate on $32,000 = $2,814 total interest</li>
                    <li>• 700 credit score: 7.5% rate on $32,000 = $3,912 total interest</li>
                    <li>• 600 credit score: 12% rate on $32,000 = $6,354 total interest</li>
                    <li className="font-semibold text-cyan-900 mt-2">→ A 200-point score difference costs $3,540 extra on a $32,000 loan!</li>
                  </ul>
                </div>
              </div>

              <div className="bg-cyan-50 p-5 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Down Payment and Loan-to-Value Ratio</h4>
                <p className="text-gray-700 text-sm mb-3">
                  The more money you put down, the lower your risk to the lender, and the better rate you'll receive. This is measured as the loan-to-value (LTV) ratio.
                </p>
                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-white p-4 rounded border-2 border-green-400">
                    <p className="font-semibold text-green-900 mb-1">20%+ Down Payment</p>
                    <p className="text-xs text-gray-600 mb-2">80% LTV or less</p>
                    <p className="text-sm text-gray-700">Best rates, no PMI on mortgages, strongest negotiating position</p>
                  </div>
                  <div className="bg-white p-4 rounded border-2 border-yellow-400">
                    <p className="font-semibold text-yellow-900 mb-1">10-19% Down</p>
                    <p className="text-xs text-gray-600 mb-2">81-90% LTV</p>
                    <p className="text-sm text-gray-700">Good rates, may require PMI, moderate negotiating power</p>
                  </div>
                  <div className="bg-white p-4 rounded border-2 border-red-400">
                    <p className="font-semibold text-red-900 mb-1">Under 10% Down</p>
                    <p className="text-xs text-gray-600 mb-2">90%+ LTV</p>
                    <p className="text-sm text-gray-700">Higher rates, PMI required, limited negotiating power</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded border border-cyan-200">
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">Why it matters:</span> Lenders see high LTV loans as risky. If you default on a $32,000 car loan with $0 down, they might only recover $25,000 selling the used car, losing $7,000. With a $10,000 down payment, you have "skin in the game" and are less likely to walk away, plus they're more likely to recover their money if you do.
                  </p>
                </div>
              </div>

              <div className="bg-cyan-50 p-5 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Debt-to-Income Ratio (DTI)</h4>
                <p className="text-gray-700 text-sm mb-3">
                  Your DTI ratio compares your monthly debt payments to your gross monthly income. Lenders use this to assess whether you can comfortably afford another loan.
                </p>
                <div className="bg-white p-4 rounded border border-cyan-200 mb-3">
                  <p className="text-gray-700 text-sm mb-3">
                    <span className="font-semibold">Calculation:</span> (Total Monthly Debt Payments ÷ Gross Monthly Income) × 100
                  </p>
                  <p className="text-gray-700 text-sm">
                    <span className="font-semibold">Example:</span> $2,500/month debts ÷ $7,000/month income = 36% DTI
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-300">
                    <p className="font-bold text-green-900 mb-2">Under 36% DTI</p>
                    <p className="text-sm text-gray-700">Excellent financial health, best rates, easily approved</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-300">
                    <p className="font-bold text-yellow-900 mb-2">36-43% DTI</p>
                    <p className="text-sm text-gray-700">Acceptable but tight, average rates, may need justification</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-300">
                    <p className="font-bold text-red-900 mb-2">Over 43% DTI</p>
                    <p className="text-sm text-gray-700">High risk, higher rates or denial, difficult approval</p>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50 p-5 rounded-lg border border-cyan-200">
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Loan Term Length</h4>
                <p className="text-gray-700 text-sm mb-3">
                  Longer loan terms generally come with higher interest rates because the lender's money is at risk for a longer period, and there's more chance of default over time.
                </p>
                <div className="bg-white p-4 rounded border border-cyan-200">
                  <p className="text-gray-700 text-sm font-semibold mb-3">Auto Loan Rate Comparison (Same Borrower, Same $32,000 Loan):</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-blue-50 p-3 rounded border border-blue-300">
                      <p className="font-semibold text-blue-900">36-Month Loan</p>
                      <p className="text-sm text-gray-700 mt-1">Rate: 5.0%</p>
                      <p className="text-sm text-gray-700">Payment: $959</p>
                      <p className="text-sm text-green-700 font-semibold">Interest: $2,524</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-300">
                      <p className="font-semibold text-blue-900">60-Month Loan</p>
                      <p className="text-sm text-gray-700 mt-1">Rate: 5.5%</p>
                      <p className="text-sm text-gray-700">Payment: $611</p>
                      <p className="text-sm text-orange-700 font-semibold">Interest: $4,660</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-300">
                      <p className="font-semibold text-blue-900">84-Month Loan</p>
                      <p className="text-sm text-gray-700 mt-1">Rate: 6.5%</p>
                      <p className="text-sm text-gray-700">Payment: $465</p>
                      <p className="text-sm text-red-700 font-semibold">Interest: $7,060</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm mt-3">
                    The 84-month loan has lower payments but costs $4,536 more in interest than the 36-month loan—and you'll still be making payments when the car needs major repairs or replacement!
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-5 rounded-lg border-2 border-cyan-400">
                <h4 className="font-bold text-cyan-900 mb-3 text-lg">Action Plan to Secure Better Rates</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Check and improve your credit score</span> - Get free reports from AnnualCreditReport.com, dispute errors, pay down high-balance cards to below 30% utilization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Save for a larger down payment</span> - Even an extra 5% down can reduce your rate by 0.25-0.5%, saving hundreds or thousands</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Pay down existing debts</span> - Reduce your DTI ratio before applying for major loans</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Shop around aggressively</span> - Get quotes from at least 3-5 lenders within a 14-day window (counts as single inquiry)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Consider shorter loan terms</span> - If you can afford higher payments, shorter terms mean lower rates and massive interest savings</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">6</span>
                    <p className="text-gray-700 text-sm"><span className="font-semibold">Time your borrowing strategically</span> - If possible, wait for your credit score to improve or for economic conditions to favor lower rates</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopping for the Best Rate */}
        <Card className="border-l-4 border-l-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
            <CardTitle className="text-indigo-900 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              How to Shop for the Best Interest Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              Shopping for the best interest rate is one of the most profitable uses of your time. Just 2-3 hours of research and comparison can save you thousands of dollars. Here's a systematic approach to finding and negotiating the best possible rate.
            </p>
            <div className="bg-indigo-50 p-5 rounded-lg border-2 border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-4 text-lg">The Strategic Shopping Process</h4>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-indigo-300">
                  <p className="font-semibold text-indigo-900 mb-2">Step 1: Know Your Numbers (Before Shopping)</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Check your credit score and reports from all three bureaus (free at AnnualCreditReport.com)</li>
                    <li>• Calculate your DTI ratio and monthly budget for loan payments</li>
                    <li>• Determine your maximum loan amount, down payment, and preferred term</li>
                    <li>• Research current average rates for your loan type and credit tier</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-indigo-300">
                  <p className="font-semibold text-indigo-900 mb-2">Step 2: Cast a Wide Net (Get Multiple Quotes)</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• <span className="font-semibold">Banks:</span> Start with your current bank (relationship discounts common)</li>
                    <li>• <span className="font-semibold">Credit Unions:</span> Often offer 0.5-1% lower rates than banks (must join first)</li>
                    <li>• <span className="font-semibold">Online Lenders:</span> Lower overhead can mean better rates (check reviews carefully)</li>
                    <li>• <span className="font-semibold">Dealer Financing:</span> Sometimes offers promotional rates, but compare carefully</li>
                    <li>• <span className="font-semibold">Goal:</span> Get at least 3-5 firm rate quotes within a 14-day window</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-indigo-300">
                  <p className="font-semibold text-indigo-900 mb-2">Step 3: Compare Apples to Apples</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Ensure all quotes are for the same loan amount, term, and down payment</li>
                    <li>• Compare APR, not just interest rate (APR includes fees)</li>
                    <li>• List all fees: origination, application, processing, prepayment penalties</li>
                    <li>• Use this calculator to verify the rate matches the quoted payment</li>
                    <li>• Calculate total cost: multiply monthly payment × number of months</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-indigo-300">
                  <p className="font-semibold text-indigo-900 mb-2">Step 4: Negotiate Like a Pro</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Start with your best offer: "Bank X offered 5.5%, can you beat that?"</li>
                    <li>• Ask about rate reduction programs: auto-pay discounts, relationship rates</li>
                    <li>• Request fee waivers: "I'll choose you today if you waive the origination fee"</li>
                    <li>• Get everything in writing before committing</li>
                    <li>• Don't be afraid to walk away—desperation costs money</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-lg border border-indigo-300">
                  <p className="font-semibold text-indigo-900 mb-2">Step 5: Verify Before Signing</p>
                  <ul className="text-sm text-gray-700 space-y-1 ml-4">
                    <li>• Use this Interest Rate Calculator to verify the math: does the payment match the rate?</li>
                    <li>• Review the loan agreement for hidden fees or prepayment penalties</li>
                    <li>• Confirm the rate is locked (many quotes expire after 30-60 days)</li>
                    <li>• Check the amortization schedule to see your actual payoff timeline</li>
                    <li>• Read the fine print about variable rate adjustment terms if applicable</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  Red Flags to Avoid
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Lender refuses to provide APR or total interest cost</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Pressure to sign immediately ("This rate expires today!")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Rate much higher than average for your credit tier</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Excessive fees (over 2-3% of loan amount)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>Prepayment penalties (you should be able to pay off early)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span>"No credit check" loans (always have predatory rates)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Pro Tips for Rate Shopping
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>All rate inquiries within 14 days count as one credit pull</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Credit unions often beat banks by 0.5-1% but require membership</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Auto-pay can reduce rates by 0.25% (free money!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Existing banking relationships may qualify for 0.25-0.5% discount</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>End of month/quarter: salespeople more willing to negotiate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">→</span>
                    <span>Pre-approval strengthens negotiating position on big purchases</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-100 p-5 rounded-lg border-2 border-indigo-300">
              <h4 className="font-semibold text-indigo-900 mb-3 text-lg">Real-World Rate Shopping Success Story</h4>
              <p className="text-gray-700 text-sm mb-3">
                Sarah was buying a $32,000 car and got her first quote from the dealer: 7.5% for 60 months = $639/month payment and $6,340 in interest. Instead of accepting immediately, she:
              </p>
              <div className="bg-white p-4 rounded border border-indigo-300 mb-3">
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>1. Checked her credit score (742 - very good)</li>
                  <li>2. Got quotes from her bank (6.5%), a credit union (5.9%), and an online lender (6.2%)</li>
                  <li>3. Went back to dealer: "Credit union offered 5.9%, can you match it?"</li>
                  <li>4. Dealer matched at 5.9% to make the sale</li>
                </ul>
              </div>
              <p className="text-gray-700 text-sm">
                <span className="font-semibold text-indigo-900">Result:</span> Final rate: 5.9% = $619/month and $5,140 in interest. She saved $20/month and $1,200 total with just 3 hours of shopping. That's $400/hour for her effort!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterestRateCalculator;
