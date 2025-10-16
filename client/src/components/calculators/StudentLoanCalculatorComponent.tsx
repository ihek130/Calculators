import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, Percent, TrendingUp, GraduationCap, AlertCircle } from 'lucide-react';
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
} from 'recharts';

const COLORS = ['#3b82f6', '#ef4444'];

export default function StudentLoanCalculatorComponent() {
  const [activeTab, setActiveTab] = useState('simple');

  // Simple Calculator
  const [loanBalance, setLoanBalance] = useState('30000');
  const [termYears, setTermYears] = useState('10');
  const [interestRate, setInterestRate] = useState('6.8');

  // Repayment Calculator
  const [repayBalance, setRepayBalance] = useState('30000');
  const [repayMonthly, setRepayMonthly] = useState('350');
  const [repayRate, setRepayRate] = useState('6.8');
  const [extraMonthly, setExtraMonthly] = useState('150');
  const [extraYearly, setExtraYearly] = useState('0');
  const [extraOneTime, setExtraOneTime] = useState('0');

  // Projection Calculator
  const [yearsToGraduate, setYearsToGraduate] = useState('2');
  const [estimatedLoanPerYear, setEstimatedLoanPerYear] = useState('10000');
  const [currentBalance, setCurrentBalance] = useState('20000');
  const [projLoanTerm, setProjLoanTerm] = useState('10');
  const [gracePeriod, setGracePeriod] = useState('6');
  const [projRate, setProjRate] = useState('6.8');
  const [payInterestDuringSchool, setPayInterestDuringSchool] = useState('no');

  // Simple Calculator Results
  const simpleResults = useMemo(() => {
    const balance = parseFloat(loanBalance);
    const years = parseFloat(termYears);
    const rate = parseFloat(interestRate);

    if (!balance || balance <= 0 || !years || years <= 0 || !rate || rate < 0) {
      return { 
        isValid: false,
        monthlyPayment: 0,
        totalPayments: 0,
        totalInterest: 0,
        principal: 0,
        pieData: []
      };
    }

    const monthlyRate = rate / 100 / 12;
    const totalMonths = years * 12;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = balance / totalMonths;
    } else {
      monthlyPayment = balance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalPayments = monthlyPayment * totalMonths;
    const totalInterest = totalPayments - balance;

    const pieData = [
      { name: 'Principal', value: parseFloat(balance.toFixed(2)) },
      { name: 'Interest', value: parseFloat(totalInterest.toFixed(2)) }
    ];

    return {
      isValid: true,
      monthlyPayment,
      totalPayments,
      totalInterest,
      principal: balance,
      pieData
    };
  }, [loanBalance, termYears, interestRate]);

  // Repayment Calculator Results
  const repaymentResults = useMemo(() => {
    const balance = parseFloat(repayBalance);
    const monthly = parseFloat(repayMonthly);
    const rate = parseFloat(repayRate);
    const extraMo = parseFloat(extraMonthly) || 0;
    const extraYr = parseFloat(extraYearly) || 0;
    const extraOne = parseFloat(extraOneTime) || 0;

    if (!balance || balance <= 0 || !monthly || monthly <= 0 || !rate || rate < 0) {
      return { 
        isValid: false,
        insufficientPayment: false,
        minimumPayment: 0,
        newMonths: 0,
        newYears: 0,
        newMonthsRemainder: 0,
        newTotalPayment: 0,
        newTotalInterest: 0,
        originalMonths: 0,
        originalYears: 0,
        originalMonthsRemainder: 0,
        originalTotalPayment: 0,
        originalTotalInterest: 0,
        monthsSaved: 0,
        yearsSaved: 0,
        monthsSavedRemainder: 0,
        interestSaved: 0
      };
    }

    const monthlyRate = rate / 100 / 12;

    // Check if payment covers interest
    const firstMonthInterest = balance * monthlyRate;
    if (monthly <= firstMonthInterest) {
      return {
        isValid: false,
        insufficientPayment: true,
        minimumPayment: firstMonthInterest,
        newMonths: 0,
        newYears: 0,
        newMonthsRemainder: 0,
        newTotalPayment: 0,
        newTotalInterest: 0,
        originalMonths: 0,
        originalYears: 0,
        originalMonthsRemainder: 0,
        originalTotalPayment: 0,
        originalTotalInterest: 0,
        monthsSaved: 0,
        yearsSaved: 0,
        monthsSavedRemainder: 0,
        interestSaved: 0
      };
    }

    // Calculate original payoff (no extra payments)
    let originalBalance = balance;
    let originalMonths = 0;
    let originalTotalInterest = 0;

    while (originalBalance > 0.01 && originalMonths < 600) {
      const interest = originalBalance * monthlyRate;
      const principal = monthly - interest;
      originalBalance -= principal;
      originalTotalInterest += interest;
      originalMonths++;
    }

    const originalTotalPayment = monthly * originalMonths;

    // Calculate with extra payments
    let newBalance = balance - extraOne;
    let newMonths = 0;
    let newTotalInterest = 0;
    let totalPaid = extraOne;

    while (newBalance > 0.01 && newMonths < 600) {
      const interest = newBalance * monthlyRate;
      
      // Add yearly payment at month 12, 24, etc.
      const yearlyBonus = (newMonths > 0 && newMonths % 12 === 0) ? extraYr : 0;
      
      const totalPayment = monthly + extraMo + yearlyBonus;
      const principal = totalPayment - interest;
      
      if (newBalance < principal) {
        totalPaid += newBalance + interest;
        newBalance = 0;
      } else {
        newBalance -= principal;
        totalPaid += totalPayment;
      }
      
      newTotalInterest += interest;
      newMonths++;
    }

    const monthsSaved = originalMonths - newMonths;
    const interestSaved = originalTotalInterest - newTotalInterest;

    return {
      isValid: true,
      // With extra payments
      newMonths,
      newYears: Math.floor(newMonths / 12),
      newMonthsRemainder: newMonths % 12,
      newTotalPayment: totalPaid,
      newTotalInterest,
      // Original schedule
      originalMonths,
      originalYears: Math.floor(originalMonths / 12),
      originalMonthsRemainder: originalMonths % 12,
      originalTotalPayment,
      originalTotalInterest,
      // Savings
      monthsSaved,
      yearsSaved: Math.floor(monthsSaved / 12),
      monthsSavedRemainder: monthsSaved % 12,
      interestSaved
    };
  }, [repayBalance, repayMonthly, repayRate, extraMonthly, extraYearly, extraOneTime]);

  // Projection Calculator Results
  const projectionResults = useMemo(() => {
    const yearsToGrad = parseFloat(yearsToGraduate);
    const loanPerYear = parseFloat(estimatedLoanPerYear);
    const current = parseFloat(currentBalance);
    const term = parseFloat(projLoanTerm);
    const grace = parseFloat(gracePeriod);
    const rate = parseFloat(projRate);

    if (!yearsToGrad || yearsToGrad <= 0 || !loanPerYear || !current || current < 0 || 
        !term || term <= 0 || !grace || grace < 0 || !rate || rate < 0) {
      return { 
        isValid: false,
        monthlyPayment: 0,
        totalBorrowed: 0,
        balanceAtGrad: 0,
        balanceAfterGrace: 0,
        totalInterest: 0,
        totalPayments: 0,
        pieData: []
      };
    }

    const monthlyRate = rate / 100 / 12;
    
    // Calculate balance at graduation
    let balanceAtGrad = current;
    const totalBorrowed = current + (loanPerYear * yearsToGrad);
    
    // Accrue interest during school years
    if (payInterestDuringSchool === 'no') {
      const schoolMonths = yearsToGrad * 12;
      for (let i = 0; i < schoolMonths; i++) {
        balanceAtGrad += balanceAtGrad * monthlyRate;
        // Add new loans each year
        if (i > 0 && i % 12 === 0) {
          balanceAtGrad += loanPerYear;
        }
      }
      // Add the last year's loan at the end if not already added
      if (schoolMonths % 12 === 0) {
        balanceAtGrad += loanPerYear;
      }
    } else {
      // If paying interest during school, balance is just the borrowed amount
      balanceAtGrad = totalBorrowed;
    }

    // Accrue interest during grace period
    let balanceAfterGrace = balanceAtGrad;
    for (let i = 0; i < grace; i++) {
      balanceAfterGrace += balanceAfterGrace * monthlyRate;
    }

    // Calculate repayment after grace period
    const totalMonths = term * 12;
    let monthlyPayment: number;
    
    if (monthlyRate === 0) {
      monthlyPayment = balanceAfterGrace / totalMonths;
    } else {
      monthlyPayment = balanceAfterGrace * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                      (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalPayments = monthlyPayment * totalMonths;
    const totalInterest = totalPayments - balanceAfterGrace;

    const pieData = [
      { name: 'Principal', value: parseFloat(balanceAfterGrace.toFixed(2)) },
      { name: 'Interest', value: parseFloat(totalInterest.toFixed(2)) }
    ];

    return {
      isValid: true,
      monthlyPayment,
      totalBorrowed,
      balanceAtGrad,
      balanceAfterGrace,
      totalInterest,
      totalPayments,
      pieData
    };
  }, [yearsToGraduate, estimatedLoanPerYear, currentBalance, projLoanTerm, gracePeriod, projRate, payInterestDuringSchool]);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <Card className="shadow-xl border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
          <CardTitle className="text-xl sm:text-2xl text-blue-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            Student Loan Calculator
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Calculate student loan payments, evaluate payoff options, and project future loans
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple" className="text-xs sm:text-sm">Simple Calculator</TabsTrigger>
          <TabsTrigger value="repayment" className="text-xs sm:text-sm">Repayment Options</TabsTrigger>
          <TabsTrigger value="projection" className="text-xs sm:text-sm">Loan Projection</TabsTrigger>
        </TabsList>

        {/* Simple Calculator */}
        <TabsContent value="simple" className="space-y-6">
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
              <CardTitle className="text-lg sm:text-xl text-purple-900">Simple Student Loan Calculator</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Provide any three values to calculate monthly payment
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="loanBalance" className="text-xs sm:text-sm font-medium mb-2 block">
                    Loan Balance
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="loanBalance"
                      type="number"
                      value={loanBalance}
                      onChange={(e) => setLoanBalance(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="termYears" className="text-xs sm:text-sm font-medium mb-2 block">
                    Remaining Term
                  </Label>
                  <div className="relative">
                    <Input
                      id="termYears"
                      type="number"
                      value={termYears}
                      onChange={(e) => setTermYears(e.target.value)}
                      className="pr-16 text-sm sm:text-base"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">years</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="interestRate" className="text-xs sm:text-sm font-medium mb-2 block">
                    Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="pr-8 text-sm sm:text-base"
                      placeholder="6.8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {simpleResults.isValid && (
            <>
              <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="border-b-2 border-green-200">
                  <CardTitle className="text-xl sm:text-2xl text-green-900">Results</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Payment</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">
                        ${simpleResults.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">/month</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-red-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Interest</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-red-900">
                        ${simpleResults.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {((simpleResults.totalInterest / simpleResults.principal) * 100).toFixed(1)}% of principal
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-blue-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Payments</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                        ${simpleResults.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        over {termYears} years
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                  <CardTitle className="text-lg sm:text-xl text-purple-900">
                    Principal vs Interest Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={simpleResults.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {simpleResults.pieData.map((entry, index) => (
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
                        {((simpleResults.principal / simpleResults.totalPayments) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Interest</p>
                      <p className="text-lg font-bold text-red-900">
                        {((simpleResults.totalInterest / simpleResults.totalPayments) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Repayment Calculator */}
        <TabsContent value="repayment" className="space-y-6">
          <Card className="shadow-xl border-2 border-teal-200">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
              <CardTitle className="text-lg sm:text-xl text-teal-900">Student Loan Repayment Calculator</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Evaluate payoff options and calculate interest savings from extra payments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="repayBalance" className="text-xs sm:text-sm font-medium mb-2 block">
                    Loan Balance
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="repayBalance"
                      type="number"
                      value={repayBalance}
                      onChange={(e) => setRepayBalance(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="30000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="repayMonthly" className="text-xs sm:text-sm font-medium mb-2 block">
                    Monthly Payment
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="repayMonthly"
                      type="number"
                      value={repayMonthly}
                      onChange={(e) => setRepayMonthly(e.target.value)}
                      className="pl-10 pr-16 text-sm sm:text-base"
                      placeholder="350"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">/month</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="repayRate" className="text-xs sm:text-sm font-medium mb-2 block">
                    Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="repayRate"
                      type="number"
                      step="0.01"
                      value={repayRate}
                      onChange={(e) => setRepayRate(e.target.value)}
                      className="pr-8 text-sm sm:text-base"
                      placeholder="6.8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Repayment Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="extraMonthly" className="text-xs sm:text-sm font-medium mb-2 block">
                      Extra Per Month
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="extraMonthly"
                        type="number"
                        value={extraMonthly}
                        onChange={(e) => setExtraMonthly(e.target.value)}
                        className="pl-10 pr-20 text-sm sm:text-base"
                        placeholder="150"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-600">per month</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="extraYearly" className="text-xs sm:text-sm font-medium mb-2 block">
                      Extra Per Year
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="extraYearly"
                        type="number"
                        value={extraYearly}
                        onChange={(e) => setExtraYearly(e.target.value)}
                        className="pl-10 pr-16 text-sm sm:text-base"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-600">per year</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="extraOneTime" className="text-xs sm:text-sm font-medium mb-2 block">
                      One-Time Payment
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="extraOneTime"
                        type="number"
                        value={extraOneTime}
                        onChange={(e) => setExtraOneTime(e.target.value)}
                        className="pl-10 pr-20 text-sm sm:text-base"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-600">one time</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {repaymentResults.isValid ? (
            <>
              <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="border-b-2 border-green-200">
                  <CardTitle className="text-xl sm:text-2xl text-green-900">
                    Pay off in {repaymentResults.newYears} years and {repaymentResults.newMonthsRemainder} months
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    The remaining term of the loan is <strong>{repaymentResults.originalYears} years and {repaymentResults.originalMonthsRemainder} months</strong>. 
                    By paying an extra <strong>${parseFloat(extraMonthly).toFixed(2)} per month</strong>
                    {parseFloat(extraYearly) > 0 && `, $${parseFloat(extraYearly).toFixed(2)} per year`}
                    {parseFloat(extraOneTime) > 0 && `, and a one-time payment of $${parseFloat(extraOneTime).toFixed(2)}`}, 
                    the loan will be paid off in <strong>{repaymentResults.newYears} years and {repaymentResults.newMonthsRemainder} months</strong>. 
                    It is <strong className="text-green-700">{repaymentResults.yearsSaved} years and {repaymentResults.monthsSavedRemainder} months earlier</strong>. 
                    This results in savings of <strong className="text-green-700">${repaymentResults.interestSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> in interest payments.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                      <h3 className="text-base font-semibold text-green-900 mb-3">If Pay Extra</h3>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="font-medium">Remaining Term:</span>
                          <span className="font-semibold">{repaymentResults.newYears} years and {repaymentResults.newMonthsRemainder} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Payments:</span>
                          <span className="font-semibold">${repaymentResults.newTotalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Interest:</span>
                          <span className="font-semibold text-green-600">${repaymentResults.newTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                      <h3 className="text-base font-semibold text-red-900 mb-3">The Original Payoff Schedule</h3>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                        <div className="flex justify-between">
                          <span className="font-medium">Remaining Term:</span>
                          <span className="font-semibold">{repaymentResults.originalYears} years and {repaymentResults.originalMonthsRemainder} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Payments:</span>
                          <span className="font-semibold">${repaymentResults.originalTotalPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total Interest:</span>
                          <span className="font-semibold text-red-600">${repaymentResults.originalTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-indigo-200">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
                  <CardTitle className="text-lg sm:text-xl text-indigo-900">
                    Savings Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        {
                          name: 'With Extra Payments',
                          Interest: parseFloat(repaymentResults.newTotalInterest.toFixed(2)),
                          Principal: parseFloat(repayBalance)
                        },
                        {
                          name: 'Original Schedule',
                          Interest: parseFloat(repaymentResults.originalTotalInterest.toFixed(2)),
                          Principal: parseFloat(repayBalance)
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={0}
                        />
                        <YAxis 
                          label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10 }}
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="Principal" stackId="a" fill="#3b82f6" name="Principal" />
                        <Bar dataKey="Interest" stackId="a" fill="#ef4444" name="Interest" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : repaymentResults.insufficientPayment ? (
            <Card className="shadow-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-100">
              <CardHeader className="border-b-2 border-red-200">
                <CardTitle className="text-xl sm:text-2xl text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6" />
                  Insufficient Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm sm:text-base text-gray-700">
                  Your monthly payment (${parseFloat(repayMonthly).toLocaleString(undefined, { minimumFractionDigits: 2 })}) 
                  is less than or equal to the monthly interest charge (${repaymentResults.minimumPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}).
                </p>
                <p className="text-sm sm:text-base text-gray-700 mt-3">
                  <strong>You must increase your monthly payment to more than ${repaymentResults.minimumPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> 
                  {' '}to begin reducing the principal balance. Without this, your loan will never be paid off.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Projection Calculator */}
        <TabsContent value="projection" className="space-y-6">
          <Card className="shadow-xl border-2 border-orange-200">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
              <CardTitle className="text-lg sm:text-xl text-orange-900">Student Loan Projection Calculator</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Estimate loan balance and repayment after graduation (for current students)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearsToGraduate" className="text-xs sm:text-sm font-medium mb-2 block">
                    Years to Graduate
                  </Label>
                  <div className="relative">
                    <Input
                      id="yearsToGraduate"
                      type="number"
                      value={yearsToGraduate}
                      onChange={(e) => setYearsToGraduate(e.target.value)}
                      className="pr-16 text-sm sm:text-base"
                      placeholder="2"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">years</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedLoanPerYear" className="text-xs sm:text-sm font-medium mb-2 block">
                    Estimated Loan Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="estimatedLoanPerYear"
                      type="number"
                      value={estimatedLoanPerYear}
                      onChange={(e) => setEstimatedLoanPerYear(e.target.value)}
                      className="pl-10 pr-12 text-sm sm:text-base"
                      placeholder="10000"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">/year</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentBalance" className="text-xs sm:text-sm font-medium mb-2 block">
                    Current Balance
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="currentBalance"
                      type="number"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                      className="pl-10 text-sm sm:text-base"
                      placeholder="20000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="projLoanTerm" className="text-xs sm:text-sm font-medium mb-2 block">
                    Loan Term
                  </Label>
                  <div className="relative">
                    <Input
                      id="projLoanTerm"
                      type="number"
                      value={projLoanTerm}
                      onChange={(e) => setProjLoanTerm(e.target.value)}
                      className="pr-16 text-sm sm:text-base"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">years</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gracePeriod" className="text-xs sm:text-sm font-medium mb-2 block">
                    Grace Period
                  </Label>
                  <div className="relative">
                    <Input
                      id="gracePeriod"
                      type="number"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      className="pr-20 text-sm sm:text-base"
                      placeholder="6"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">months</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="projRate" className="text-xs sm:text-sm font-medium mb-2 block">
                    Interest Rate
                  </Label>
                  <div className="relative">
                    <Input
                      id="projRate"
                      type="number"
                      step="0.01"
                      value={projRate}
                      onChange={(e) => setProjRate(e.target.value)}
                      className="pr-8 text-sm sm:text-base"
                      placeholder="6.8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600">%</span>
                  </div>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4">
                <Label className="text-xs sm:text-sm font-medium mb-3 block">
                  Do you pay interest during school years?
                </Label>
                <RadioGroup value={payInterestDuringSchool} onValueChange={setPayInterestDuringSchool}>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="payYes" />
                      <Label htmlFor="payYes" className="text-sm cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="payNo" />
                      <Label htmlFor="payNo" className="text-sm cursor-pointer">No</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {projectionResults.isValid && (
            <>
              <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-green-100">
                <CardHeader className="border-b-2 border-green-200">
                  <CardTitle className="text-xl sm:text-2xl text-green-900">Projection Results</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Payment</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                        ${projectionResults.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">/month</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <GraduationCap className="w-6 h-6 text-blue-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Amount Borrowed</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                        ${projectionResults.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">total loans taken</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-green-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Balance After Graduation</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">
                        ${projectionResults.balanceAtGrad.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">with accrued interest</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-yellow-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-6 h-6 text-yellow-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Balance After Grace Period</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-yellow-900">
                        ${projectionResults.balanceAfterGrace.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">when repayment begins</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-6 h-6 text-red-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Interest</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-red-900">
                        ${projectionResults.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">over loan lifetime</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-indigo-300 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <DollarSign className="w-6 h-6 text-indigo-600" />
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Total Cost</p>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-indigo-900">
                        ${projectionResults.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">principal + interest</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-6">
                    <p className="text-xs sm:text-sm text-gray-700">
                      <strong>* Grace Period:</strong> The period between graduation and when repayment must begin. 
                      For Direct Subsidized Loans, you don't pay interest during school or grace period.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                  <CardTitle className="text-lg sm:text-xl text-purple-900">
                    Principal vs Interest Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectionResults.pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {projectionResults.pieData.map((entry, index) => (
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
                        {((projectionResults.balanceAfterGrace / projectionResults.totalPayments) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Interest</p>
                      <p className="text-lg font-bold text-red-900">
                        {((projectionResults.totalInterest / projectionResults.totalPayments) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                    <p>
                      <strong>*</strong> This calculator assumes loans to be repaid equally each month right after grace period.
                    </p>
                    <p>
                      <strong>*</strong> It does not take into account any loan fees or origination charges.
                    </p>
                    <p>
                      <strong>*</strong> For Direct Subsidized Loans, you typically don't need to pay interest during school years or the grace period.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Educational Content */}
      <div className="space-y-6 mt-8">
        {/* Understanding Student Loans */}
        <Card className="shadow-xl border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <CardTitle className="text-xl sm:text-2xl text-blue-900">
              📚 Understanding Student Loans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What Are Student Loans?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Student loans are borrowed money to pay for education costs including tuition, fees, books, supplies, and 
                living expenses. Unlike grants and scholarships, student loans must be repaid with interest. In the U.S., 
                over 90% of student debt is in the form of federal loans, which offer lower interest rates and more flexible 
                repayment options than private loans.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Key Statistics</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                <li>Average student loan debt for graduates: $30,000-$40,000</li>
                <li>Total U.S. student loan debt: Over $1.7 trillion</li>
                <li>Federal student loans account for 92% of all student debt</li>
                <li>Average monthly payment: $200-$400 depending on balance and term</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Why Use a Student Loan Calculator?</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Before borrowing, it's crucial to understand the long-term financial impact. These calculators help you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-gray-700 ml-4">
                <li><strong>Plan your budget:</strong> Know exactly what your monthly payments will be after graduation</li>
                <li><strong>Evaluate payoff strategies:</strong> See how extra payments can save thousands in interest</li>
                <li><strong>Project future debt:</strong> Estimate total costs before taking out additional loans</li>
                <li><strong>Compare loan options:</strong> Understand the true cost of federal vs private loans</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: The Power of Knowing</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Scenario:</strong> Student considering $40,000 in loans at 6.8% APR</p>
                <p><strong>Without calculator:</strong> Might assume payments are "manageable" without knowing specifics</p>
                <p><strong>With calculator:</strong> Discovers $460/month for 10 years = $55,189 total cost</p>
                <p className="pt-2 font-semibold text-green-800">
                  Armed with this knowledge, they reduce borrowing to $30,000 and save $11,429 in interest!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Federal vs Private Loans */}
        <Card className="shadow-xl border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
            <CardTitle className="text-xl sm:text-2xl text-purple-900">
              🏛️ Federal vs Private Student Loans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Federal Student Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Federal student loans are funded by the U.S. government and offer significant advantages over private loans. 
                They should always be your first choice when borrowing for education.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-green-900 mb-3 text-base">✅ Federal Loan Benefits</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Fixed interest rates:</strong> Rates never change (3-7% typical)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>No credit check:</strong> Available to all students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>No cosigner required:</strong> Borrow independently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Flexible repayment:</strong> Multiple income-driven plans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Deferment options:</strong> Pause payments during hardship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Forgiveness programs:</strong> Public service forgiveness available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Subsidized options:</strong> Government pays interest during school</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
                <h4 className="font-semibold text-yellow-900 mb-3 text-base">⚠️ Federal Loan Limits</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Borrowing caps:</strong> Annual and lifetime limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Dependent undergrads:</strong> $31,000 total limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Independent undergrads:</strong> $57,500 total limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>Graduate students:</strong> $138,500 total limit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span><strong>May not cover full costs:</strong> Expensive schools require other funding</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Types of Federal Student Loans</h3>
            </div>

            <div className="space-y-3">
              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-2 text-base">📘 Direct Subsidized Loans</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Best option for undergraduates with financial need.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                  <li>Government pays interest while you're in school (at least half-time)</li>
                  <li>6-month grace period after graduation before payments begin</li>
                  <li>Based on Expected Family Contribution (EFC)</li>
                  <li>Interest rate: ~4-5% (fixed)</li>
                  <li>Annual limit: $3,500-$5,500 depending on year in school</li>
                </ul>
              </div>

              <div className="border-2 border-indigo-300 rounded-lg p-4 bg-indigo-50">
                <h4 className="font-semibold text-indigo-900 mb-2 text-base">📙 Direct Unsubsidized Loans</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Available to all students regardless of financial need.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                  <li>Interest accrues from the moment loan is disbursed</li>
                  <li>Can pay interest while in school or let it capitalize</li>
                  <li>Not based on financial need</li>
                  <li>Interest rate: ~5-7% (fixed)</li>
                  <li>Higher annual limits than subsidized loans</li>
                </ul>
              </div>

              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-2 text-base">📕 Direct PLUS Loans</h4>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>For graduate students and parents of dependent undergraduates.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                  <li>Credit check required (favorable credit history needed)</li>
                  <li>Borrow up to full cost of attendance minus other aid</li>
                  <li>Interest rate: ~7-8% (higher than other federal loans)</li>
                  <li>Origination fee: ~4% of loan amount</li>
                  <li>Can apply with cosigner if credit denied</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Private Student Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Private student loans come from banks, credit unions, and online lenders. They should only be considered 
                after exhausting federal loan options, as they lack the protections and benefits of federal loans.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
                <h4 className="font-semibold text-orange-900 mb-3 text-base">📊 Private Loan Characteristics</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span><strong>Interest rates:</strong> 4-14% (variable or fixed)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span><strong>Credit-based:</strong> Better credit = lower rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span><strong>Cosigner common:</strong> Most students need a parent or guardian</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span><strong>Terms vary:</strong> 5-20 years typical</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    <span><strong>Quick approval:</strong> Funds available almost immediately</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                <h4 className="font-semibold text-red-900 mb-3 text-base">❌ Private Loan Drawbacks</h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>No income-driven repayment:</strong> Less flexible options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>No forgiveness programs:</strong> Must be paid in full</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Limited deferment:</strong> Harder to pause payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Variable rates risky:</strong> Payments can increase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Often not subsidized:</strong> Interest accrues immediately</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Borrowing Priority</h4>
              <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                <li><strong>Exhaust scholarships and grants first</strong> (free money!)</li>
                <li><strong>Federal subsidized loans</strong> (government pays interest during school)</li>
                <li><strong>Federal unsubsidized loans</strong> (still great protections)</li>
                <li><strong>Federal PLUS loans</strong> (higher rates but federal benefits)</li>
                <li><strong>Private loans</strong> (last resort, shop around for best rates)</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Repayment Plans */}
        <Card className="shadow-xl border-2 border-teal-200">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b-2 border-teal-200">
            <CardTitle className="text-xl sm:text-2xl text-teal-900">
              💳 Federal Loan Repayment Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Choosing the Right Repayment Plan</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                Federal student loans offer multiple repayment plans to fit different financial situations. The plan you 
                choose can significantly impact your monthly payment and total interest paid over the loan's lifetime.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-2 border-gray-300">
                <thead className="bg-teal-100">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-bold border-b-2 border-gray-300">Plan</th>
                    <th className="text-left p-2 sm:p-3 font-bold border-b-2 border-gray-300">Length</th>
                    <th className="text-left p-2 sm:p-3 font-bold border-b-2 border-gray-300">Payment</th>
                    <th className="text-left p-2 sm:p-3 font-bold border-b-2 border-gray-300">Forgiveness?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <strong>Standard</strong>
                      <p className="text-xs text-gray-600">All borrowers</p>
                    </td>
                    <td className="p-2 sm:p-3">10 years</td>
                    <td className="p-2 sm:p-3">Fixed amount</td>
                    <td className="p-2 sm:p-3">No</td>
                  </tr>
                  <tr className="bg-gray-50 hover:bg-gray-100">
                    <td className="p-2 sm:p-3">
                      <strong>Graduated</strong>
                      <p className="text-xs text-gray-600">All borrowers</p>
                    </td>
                    <td className="p-2 sm:p-3">10 years</td>
                    <td className="p-2 sm:p-3">Increases every 2 years</td>
                    <td className="p-2 sm:p-3">No</td>
                  </tr>
                  <tr className="bg-white hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <strong>Extended</strong>
                      <p className="text-xs text-gray-600">$30,000+ debt</p>
                    </td>
                    <td className="p-2 sm:p-3">25 years</td>
                    <td className="p-2 sm:p-3">Fixed or graduated</td>
                    <td className="p-2 sm:p-3">No</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="p-2 sm:p-3">
                      <strong>Income-Based (IBR)</strong>
                      <p className="text-xs text-gray-600">Partial hardship</p>
                    </td>
                    <td className="p-2 sm:p-3">20-25 years</td>
                    <td className="p-2 sm:p-3">10-15% of discretionary income</td>
                    <td className="p-2 sm:p-3 text-green-700 font-semibold">Yes*</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="p-2 sm:p-3">
                      <strong>Pay As You Earn (PAYE)</strong>
                      <p className="text-xs text-gray-600">After Oct 2007</p>
                    </td>
                    <td className="p-2 sm:p-3">20 years</td>
                    <td className="p-2 sm:p-3">10% of discretionary income</td>
                    <td className="p-2 sm:p-3 text-green-700 font-semibold">Yes*</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="p-2 sm:p-3">
                      <strong>Revised PAYE (REPAYE)</strong>
                      <p className="text-xs text-gray-600">All Direct Loans</p>
                    </td>
                    <td className="p-2 sm:p-3">20-25 years</td>
                    <td className="p-2 sm:p-3">10% of discretionary income</td>
                    <td className="p-2 sm:p-3 text-green-700 font-semibold">Yes*</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="p-2 sm:p-3">
                      <strong>Income-Contingent (ICR)</strong>
                      <p className="text-xs text-gray-600">All Direct Loans</p>
                    </td>
                    <td className="p-2 sm:p-3">25 years</td>
                    <td className="p-2 sm:p-3">20% of discretionary income or 12-yr fixed</td>
                    <td className="p-2 sm:p-3 text-green-700 font-semibold">Yes*</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>* Loan Forgiveness:</strong> For public service workers, remaining balance forgiven tax-free after 
                120 qualifying payments (10 years). For others, forgiven at end of term but may be taxable as income.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Standard Repayment Plan</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                The default plan if you don't choose another option. Fixed monthly payments over 10 years. Pays off loans 
                fastest and costs least in interest, but has highest monthly payment.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">✅ Example: $30,000 at 6.8%</h4>
                <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                  <p>• Monthly Payment: <strong>$345.24</strong></p>
                  <p>• Total Interest: <strong>$11,428.92</strong></p>
                  <p>• Total Paid: <strong>$41,428.92</strong></p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Graduated Repayment Plan</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Payments start low and increase every two years. Good for those expecting salary growth. Costs more in 
                interest than standard plan because you pay less principal early on.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-1">✅ Best For:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Recent graduates with low starting salary</li>
                    <li>Careers with predictable salary increases</li>
                    <li>Those who can afford higher payments later</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="font-semibold text-red-900 mb-1">❌ Avoid If:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Income growth uncertain</li>
                    <li>Want to minimize total interest</li>
                    <li>Already struggling with payments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Income-Driven Repayment Plans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Payment based on your income and family size, typically 10-20% of discretionary income. Can significantly 
                reduce monthly payments, but extends repayment to 20-25 years and increases total interest.
              </p>
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: $40,000 debt, $35,000 income</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Standard Plan:</strong> $460/month for 10 years</p>
                  <p><strong>PAYE (10% discretionary income):</strong> ~$180/month for 20 years</p>
                  <p className="pt-2">
                    <strong>Savings:</strong> $280/month reduction makes life manageable, but total interest increases significantly. 
                    After 20 years, remaining balance is forgiven (though may be taxable).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Important Considerations</h4>
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                <li>You can switch plans anytime (some restrictions apply)</li>
                <li>Income-driven plans require annual recertification of income</li>
                <li>Capitalized interest can increase your loan balance</li>
                <li>Forgiven amounts may be taxable (except for public service)</li>
                <li>Married couples may need to file taxes jointly</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Loan Forgiveness Programs */}
        <Card className="shadow-xl border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
            <CardTitle className="text-xl sm:text-2xl text-green-900">
              🎓 Student Loan Forgiveness Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Public Service Loan Forgiveness (PSLF)</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                The most popular forgiveness program. After making 120 qualifying monthly payments (10 years) while working 
                full-time for a qualifying employer, the remaining balance is forgiven tax-free.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Qualifying Employers</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                    <li>Government organizations (federal, state, local, tribal)</li>
                    <li>Non-profit 501(c)(3) organizations</li>
                    <li>AmeriCorps and Peace Corps</li>
                    <li>Public schools and colleges</li>
                    <li>Public hospitals and healthcare</li>
                    <li>Public libraries and museums</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Requirements</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                    <li>Direct Loans only (consolidate if needed)</li>
                    <li>Full-time employment (30+ hours/week)</li>
                    <li>Income-driven repayment plan</li>
                    <li>120 qualifying payments</li>
                    <li>Submit Employment Certification Form annually</li>
                    <li>Remain in qualifying employment</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ PSLF Example: Teacher Saves $60,000+</h4>
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <p><strong>Scenario:</strong> Public school teacher with $80,000 in loans, $45,000 salary</p>
                <p><strong>Under PAYE:</strong> Pays ~$280/month for 10 years = $33,600 total</p>
                <p><strong>Remaining balance after 10 years:</strong> ~$65,000</p>
                <p><strong>Forgiven tax-free through PSLF:</strong> $65,000</p>
                <p className="pt-2 font-semibold text-green-800">
                  Total savings: $65,000 + interest avoided. Without PSLF, would have paid $98,000+ over 20 years!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Teacher Loan Forgiveness</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Teachers who work full-time for five complete academic years in low-income schools can receive up to $17,500 
                in forgiveness. This is separate from PSLF but can't be combined for the same teaching service.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-2">Requirements:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-700 ml-2">
                  <li><strong>$17,500 forgiveness:</strong> Math, science, or special education teachers</li>
                  <li><strong>$5,000 forgiveness:</strong> All other eligible teachers</li>
                  <li>Must teach at low-income school (Title I school)</li>
                  <li>Direct or Stafford Loans only</li>
                  <li>Cannot have outstanding balance from pre-1998 loans</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Income-Driven Repayment Forgiveness</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                If you're on an income-driven repayment plan but don't qualify for PSLF, any remaining balance is forgiven 
                after 20-25 years of payments. However, the forgiven amount is generally taxable as income.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Tax Bomb Warning</h4>
                <p className="text-xs sm:text-sm text-gray-700">
                  If $50,000 is forgiven, you could owe $15,000 in federal taxes (at 30% tax bracket). Plan ahead and 
                  save for this potential tax liability. PSLF forgiveness is tax-free, but general IDR forgiveness is not.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Other Forgiveness Programs</h3>
              <div className="space-y-3">
                <div className="border-2 border-purple-200 rounded-lg p-3 bg-purple-50">
                  <h4 className="font-semibold text-purple-900 mb-1 text-sm">Nurse Corps Loan Repayment</h4>
                  <p className="text-xs text-gray-700">Up to 85% of student loans repaid for nurses working in underserved areas</p>
                </div>
                <div className="border-2 border-indigo-200 rounded-lg p-3 bg-indigo-50">
                  <h4 className="font-semibold text-indigo-900 mb-1 text-sm">Military Service</h4>
                  <p className="text-xs text-gray-700">Various programs for Army, Navy, Air Force members; up to $65,000 forgiveness</p>
                </div>
                <div className="border-2 border-teal-200 rounded-lg p-3 bg-teal-50">
                  <h4 className="font-semibold text-teal-900 mb-1 text-sm">State-Specific Programs</h4>
                  <p className="text-xs text-gray-700">Many states offer forgiveness for teachers, healthcare workers, lawyers serving rural areas</p>
                </div>
                <div className="border-2 border-orange-200 rounded-lg p-3 bg-orange-50">
                  <h4 className="font-semibold text-orange-900 mb-1 text-sm">Disability Discharge</h4>
                  <p className="text-xs text-gray-700">Total and permanent disability can result in complete loan discharge</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repayment Strategies */}
        <Card className="shadow-xl border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b-2 border-indigo-200">
            <CardTitle className="text-xl sm:text-2xl text-indigo-900">
              💪 Smart Repayment Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pay More Than the Minimum</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Making extra payments toward principal is the single most effective way to save money on student loans. 
                Every extra dollar directly reduces your balance and future interest charges.
              </p>
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-300 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2 text-sm sm:text-base">✅ Example: Extra $150/month</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Original:</strong> $30,000 at 6.8%, $350/month = 9 years 10 months</p>
                  <p><strong>With $150 extra:</strong> $500/month = 6 years 2 months</p>
                  <p><strong>Time saved:</strong> 3 years 8 months earlier</p>
                  <p><strong>Interest saved:</strong> $4,421.28</p>
                  <p className="pt-2 font-semibold text-indigo-800">
                    That $150/month investment saves over $4,400 and 3+ years of payments!
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Make Biweekly Payments</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                Instead of one monthly payment, split it in half and pay every two weeks. This results in 26 half-payments 
                (13 full payments) per year instead of 12, giving you one free extra payment annually.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="font-semibold text-green-900 mb-1">✅ Benefits:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Aligns with biweekly paychecks</li>
                    <li>Reduces principal faster</li>
                    <li>Saves interest automatically</li>
                    <li>Easier to budget smaller amounts</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-1">📊 Impact:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Typically saves 1-2 years of payments</li>
                    <li>Thousands in interest savings</li>
                    <li>No lifestyle change needed</li>
                    <li>Same annual amount, better results</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Target High-Interest Loans First</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                If you have multiple loans, use the <strong>Debt Avalanche</strong> method: make minimum payments on all loans, 
                then put all extra money toward the loan with the highest interest rate. Once that's paid off, move to the 
                next highest rate.
              </p>
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">✅ Example: Multiple Loans</h4>
                <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <p><strong>Loan A:</strong> $10,000 at 3.5% (subsidized)</p>
                  <p><strong>Loan B:</strong> $15,000 at 6.8% (unsubsidized)</p>
                  <p><strong>Loan C:</strong> $5,000 at 7.9% (PLUS)</p>
                  <p className="pt-2"><strong>Strategy:</strong> Pay minimums on A & B, throw extra at C first (7.9%), then B (6.8%), then A (3.5%)</p>
                  <p className="font-semibold text-green-800">
                    Saves maximum interest by eliminating expensive debt first
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Refinancing Student Loans</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">
                If you have good credit and stable income, refinancing can lower your interest rate and save thousands. 
                However, refinancing federal loans with a private lender means losing federal protections.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <h4 className="font-semibold text-green-900 mb-3 text-base">✅ When to Refinance</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>Excellent credit score (700+)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>Stable, high income</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>Don't need income-driven repayment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>Not pursuing loan forgiveness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>Can get 1-2% rate reduction</span>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
                  <h4 className="font-semibold text-red-900 mb-3 text-base">❌ Don't Refinance If:</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Pursuing PSLF or forgiveness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Need income-driven repayment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Job/income is unstable</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Want deferment/forbearance options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>Rate improvement is minimal</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
              <h4 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">⚠️ Critical Warning</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Refinancing federal loans into private loans is <strong>permanent and irreversible</strong>. You lose access 
                to income-driven repayment, forgiveness programs, deferment options, and other federal protections. Only 
                refinance if you're absolutely certain you won't need these benefits.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card className="shadow-xl border-2 border-pink-200">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b-2 border-pink-200">
            <CardTitle className="text-xl sm:text-2xl text-pink-900">
              🎯 Tips for Student Loan Success
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-green-900 mb-3 text-base flex items-center gap-2">
                  <span>✅</span> Smart Borrowing
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Borrow only what you need</strong> - not the maximum offered</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Exhaust scholarships first</strong> - free money doesn't need repayment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Consider future earnings</strong> - match loans to career potential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Work part-time</strong> - reduce borrowing needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Take summer classes</strong> - graduate faster, borrow less</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span><strong>Choose federal over private</strong> - better protections</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-900 mb-3 text-base flex items-center gap-2">
                  <span>💰</span> During School
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Pay interest while in school</strong> - prevents capitalization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Set up loan tracker</strong> - know what you owe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Understand loan terms</strong> - know your interest rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Complete exit counseling</strong> - required before graduation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Keep servicer contact info</strong> - stay connected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span><strong>Budget for future payments</strong> - plan ahead</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-3 text-base flex items-center gap-2">
                  <span>📋</span> After Graduation
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Use grace period wisely</strong> - save for first payments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Choose right repayment plan</strong> - match to income</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Set up autopay</strong> - never miss a payment, get 0.25% discount</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Start payments during grace</strong> - reduce interest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Create repayment strategy</strong> - have a plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span><strong>Track payment history</strong> - especially for PSLF</span>
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
                    <span><strong>Ignoring loans</strong> - defaults ruin credit for 7 years</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Missing payments</strong> - fees and credit damage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Not exploring options</strong> - many plans available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Losing servicer contact</strong> - update address changes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Refinancing carelessly</strong> - lose federal protections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span><strong>Forgetting recertification</strong> - for income-driven plans</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-pink-100 border-2 border-pink-300 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-pink-900 mb-3 text-base">💪 Stay Motivated</h4>
              <p className="text-sm text-gray-700 mb-3">
                Student loan repayment can take 10-25 years. Here's how to stay on track:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Celebrate milestones (25%, 50%, 75% paid)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Use loan payoff calculators regularly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Track interest saved from extra payments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Join student loan communities online</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Visualize debt-free life</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-600">✓</span>
                  <span>Reward yourself for progress</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">💡 Final Thoughts</h4>
              <p className="text-xs sm:text-sm text-gray-700">
                Student loans are an investment in your future, but they require smart management. Use these calculators 
                regularly to stay informed, explore all repayment options, and don't hesitate to seek help if you're 
                struggling. The Department of Education offers free counseling, and many non-profit organizations provide 
                assistance. Remember: there's always a solution, even if it feels overwhelming.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
