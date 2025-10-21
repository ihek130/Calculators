import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, Home, CreditCard, DollarSign, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type Frequency = 'month' | 'year';

interface IncomeInputs {
  salary: number;
  salaryFrequency: Frequency;
  pension: number;
  pensionFrequency: Frequency;
  investment: number;
  investmentFrequency: Frequency;
  otherIncome: number;
  otherIncomeFrequency: Frequency;
}

interface DebtInputs {
  rental: number;
  rentalFrequency: Frequency;
  mortgage: number;
  mortgageFrequency: Frequency;
  propertyTax: number;
  propertyTaxFrequency: Frequency;
  hoaFees: number;
  hoaFeesFrequency: Frequency;
  homeInsurance: number;
  homeInsuranceFrequency: Frequency;
  creditCards: number;
  creditCardsFrequency: Frequency;
  studentLoan: number;
  studentLoanFrequency: Frequency;
  autoLoan: number;
  autoLoanFrequency: Frequency;
  otherLoans: number;
  otherLoansFrequency: Frequency;
}

const MONTHS_PER_YEAR = 12;

const DebtToIncomeRatioCalculatorComponent = () => {
  const [incomes, setIncomes] = useState<IncomeInputs>({
    salary: 60000,
    salaryFrequency: 'year',
    pension: 0,
    pensionFrequency: 'year',
    investment: 0,
    investmentFrequency: 'year',
    otherIncome: 0,
    otherIncomeFrequency: 'year',
  });

  const [debts, setDebts] = useState<DebtInputs>({
    rental: 1200,
    rentalFrequency: 'month',
    mortgage: 0,
    mortgageFrequency: 'month',
    propertyTax: 0,
    propertyTaxFrequency: 'year',
    hoaFees: 0,
    hoaFeesFrequency: 'month',
    homeInsurance: 0,
    homeInsuranceFrequency: 'year',
    creditCards: 200,
    creditCardsFrequency: 'month',
    studentLoan: 0,
    studentLoanFrequency: 'month',
    autoLoan: 250,
    autoLoanFrequency: 'month',
    otherLoans: 0,
    otherLoansFrequency: 'month',
  });

  const handleIncomeChange = (field: keyof IncomeInputs, value: string | number | Frequency) => {
    if (field.endsWith('Frequency')) {
      setIncomes({ ...incomes, [field]: value as Frequency });
    } else {
      setIncomes({ ...incomes, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value });
    }
  };

  const handleDebtChange = (field: keyof DebtInputs, value: string | number | Frequency) => {
    if (field.endsWith('Frequency')) {
      setDebts({ ...debts, [field]: value as Frequency });
    } else {
      setDebts({ ...debts, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value });
    }
  };

  const toMonthly = (amount: number, frequency: Frequency): number => {
    return frequency === 'year' ? amount / MONTHS_PER_YEAR : amount;
  };

  // Real-time calculations
  const monthlySalary = toMonthly(incomes.salary, incomes.salaryFrequency);
  const monthlyPension = toMonthly(incomes.pension, incomes.pensionFrequency);
  const monthlyInvestment = toMonthly(incomes.investment, incomes.investmentFrequency);
  const monthlyOtherIncome = toMonthly(incomes.otherIncome, incomes.otherIncomeFrequency);
  
  const totalMonthlyIncome = monthlySalary + monthlyPension + monthlyInvestment + monthlyOtherIncome;
  const totalAnnualIncome = totalMonthlyIncome * MONTHS_PER_YEAR;

  const monthlyRental = toMonthly(debts.rental, debts.rentalFrequency);
  const monthlyMortgage = toMonthly(debts.mortgage, debts.mortgageFrequency);
  const monthlyPropertyTax = toMonthly(debts.propertyTax, debts.propertyTaxFrequency);
  const monthlyHoaFees = toMonthly(debts.hoaFees, debts.hoaFeesFrequency);
  const monthlyHomeInsurance = toMonthly(debts.homeInsurance, debts.homeInsuranceFrequency);
  const monthlyCreditCards = toMonthly(debts.creditCards, debts.creditCardsFrequency);
  const monthlyStudentLoan = toMonthly(debts.studentLoan, debts.studentLoanFrequency);
  const monthlyAutoLoan = toMonthly(debts.autoLoan, debts.autoLoanFrequency);
  const monthlyOtherLoans = toMonthly(debts.otherLoans, debts.otherLoansFrequency);

  const totalMonthlyHousing = monthlyRental + monthlyMortgage + monthlyPropertyTax + monthlyHoaFees + monthlyHomeInsurance;
  const totalMonthlyDebt = totalMonthlyHousing + monthlyCreditCards + monthlyStudentLoan + monthlyAutoLoan + monthlyOtherLoans;
  const totalAnnualDebt = totalMonthlyDebt * MONTHS_PER_YEAR;

  const frontEndRatio = totalMonthlyIncome > 0 ? (totalMonthlyHousing / totalMonthlyIncome) * 100 : 0;
  const backEndRatio = totalMonthlyIncome > 0 ? (totalMonthlyDebt / totalMonthlyIncome) * 100 : 0;

  const results = {
    monthlyIncome: totalMonthlyIncome,
    monthlyDebt: totalMonthlyDebt,
    monthlyHousing: totalMonthlyHousing,
    frontEndRatio,
    backEndRatio,
    annualIncome: totalAnnualIncome,
    annualDebt: totalAnnualDebt,
  };

  const getRatioStatus = (ratio: number): { text: string; color: string; bgColor: string } => {
    if (ratio <= 28) {
      return { text: 'Excellent', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' };
    } else if (ratio <= 36) {
      return { text: 'Good', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' };
    } else if (ratio <= 43) {
      return { text: 'Fair', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' };
    } else {
      return { text: 'High Risk', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
    }
  };

  const chartData = [
    { name: 'Income Left', value: Math.max(0, results.monthlyIncome - results.monthlyDebt), color: '#10b981' },
    { name: 'Debt Payments', value: results.monthlyDebt, color: '#ef4444' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-2 flex-wrap">
          <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          Debt-to-Income (DTI) Ratio Calculator
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          Modify the values and click the calculate button to use
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <DollarSign className="h-5 w-5 text-green-600" />
              Incomes (Before Tax)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter all sources of income</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Salary & Earned Income */}
            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-semibold text-gray-700">
                Salary & Earned Income
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="salary"
                  type="number"
                  value={incomes.salary}
                  onChange={(e) => handleIncomeChange('salary', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleIncomeChange('salary', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={incomes.salaryFrequency}
                  onValueChange={(value) => handleIncomeChange('salaryFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pension & Social Security */}
            <div className="space-y-2">
              <Label htmlFor="pension" className="text-sm font-semibold text-gray-700">
                Pension & Social Security
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="pension"
                  type="number"
                  value={incomes.pension}
                  onChange={(e) => handleIncomeChange('pension', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleIncomeChange('pension', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={incomes.pensionFrequency}
                  onValueChange={(value) => handleIncomeChange('pensionFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Investment & Savings */}
            <div className="space-y-2">
              <Label htmlFor="investment" className="text-sm font-semibold text-gray-700">
                Investment & Savings
              </Label>
              <p className="text-xs text-gray-500 italic">interest, capital gain, dividend, rental income...</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="investment"
                  type="number"
                  value={incomes.investment}
                  onChange={(e) => handleIncomeChange('investment', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleIncomeChange('investment', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={incomes.investmentFrequency}
                  onValueChange={(value) => handleIncomeChange('investmentFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Other Income */}
            <div className="space-y-2">
              <Label htmlFor="otherIncome" className="text-sm font-semibold text-gray-700">
                Other Income
              </Label>
              <p className="text-xs text-gray-500 italic">gift, alimony, child support...</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="otherIncome"
                  type="number"
                  value={incomes.otherIncome}
                  onChange={(e) => handleIncomeChange('otherIncome', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleIncomeChange('otherIncome', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={incomes.otherIncomeFrequency}
                  onValueChange={(value) => handleIncomeChange('otherIncomeFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debts Section */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-5 w-5 text-red-600" />
              Debts / Expenses
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Enter all monthly debt obligations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Rental Cost */}
            <div className="space-y-2">
              <Label htmlFor="rental" className="text-sm font-semibold text-gray-700">
                Rental Cost
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="rental"
                  type="number"
                  value={debts.rental}
                  onChange={(e) => handleDebtChange('rental', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('rental', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.rentalFrequency}
                  onValueChange={(value) => handleDebtChange('rentalFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mortgage */}
            <div className="space-y-2">
              <Label htmlFor="mortgage" className="text-sm font-semibold text-gray-700">
                Mortgage
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="mortgage"
                  type="number"
                  value={debts.mortgage}
                  onChange={(e) => handleDebtChange('mortgage', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('mortgage', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.mortgageFrequency}
                  onValueChange={(value) => handleDebtChange('mortgageFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Tax */}
            <div className="space-y-2">
              <Label htmlFor="propertyTax" className="text-sm font-semibold text-gray-700">
                Property Tax
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="propertyTax"
                  type="number"
                  value={debts.propertyTax}
                  onChange={(e) => handleDebtChange('propertyTax', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('propertyTax', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.propertyTaxFrequency}
                  onValueChange={(value) => handleDebtChange('propertyTaxFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* HOA Fees */}
            <div className="space-y-2">
              <Label htmlFor="hoaFees" className="text-sm font-semibold text-gray-700">
                HOA Fees
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="hoaFees"
                  type="number"
                  value={debts.hoaFees}
                  onChange={(e) => handleDebtChange('hoaFees', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('hoaFees', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.hoaFeesFrequency}
                  onValueChange={(value) => handleDebtChange('hoaFeesFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Homeowner Insurance */}
            <div className="space-y-2">
              <Label htmlFor="homeInsurance" className="text-sm font-semibold text-gray-700">
                Homeowner Insurance
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="homeInsurance"
                  type="number"
                  value={debts.homeInsurance}
                  onChange={(e) => handleDebtChange('homeInsurance', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('homeInsurance', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.homeInsuranceFrequency}
                  onValueChange={(value) => handleDebtChange('homeInsuranceFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Credit Cards */}
            <div className="space-y-2">
              <Label htmlFor="creditCards" className="text-sm font-semibold text-gray-700">
                Credit Cards
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="creditCards"
                  type="number"
                  value={debts.creditCards}
                  onChange={(e) => handleDebtChange('creditCards', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('creditCards', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.creditCardsFrequency}
                  onValueChange={(value) => handleDebtChange('creditCardsFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Loan */}
            <div className="space-y-2">
              <Label htmlFor="studentLoan" className="text-sm font-semibold text-gray-700">
                Student Loan
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="studentLoan"
                  type="number"
                  value={debts.studentLoan}
                  onChange={(e) => handleDebtChange('studentLoan', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('studentLoan', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.studentLoanFrequency}
                  onValueChange={(value) => handleDebtChange('studentLoanFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto Loan */}
            <div className="space-y-2">
              <Label htmlFor="autoLoan" className="text-sm font-semibold text-gray-700">
                Auto Loan
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="autoLoan"
                  type="number"
                  value={debts.autoLoan}
                  onChange={(e) => handleDebtChange('autoLoan', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('autoLoan', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.autoLoanFrequency}
                  onValueChange={(value) => handleDebtChange('autoLoanFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Other Loans */}
            <div className="space-y-2">
              <Label htmlFor="otherLoans" className="text-sm font-semibold text-gray-700">
                Other Loans and Liabilities
              </Label>
              <p className="text-xs text-gray-500 italic">personal loan, child support, alimony, etc.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  id="otherLoans"
                  type="number"
                  value={debts.otherLoans}
                  onChange={(e) => handleDebtChange('otherLoans', e.target.value)}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleDebtChange('otherLoans', Math.max(0, val));
                  }}
                  className="text-sm"
                />
                <Select
                  value={debts.otherLoansFrequency}
                  onValueChange={(value) => handleDebtChange('otherLoansFrequency', value as Frequency)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">/ Month</SelectItem>
                    <SelectItem value="year">/ Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      {(
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-md border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Income</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    ${results.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${results.annualIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">Monthly Debt</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    ${results.monthlyDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    ${results.annualDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / year
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={`shadow-md border-l-4 ${getRatioStatus(results.frontEndRatio).bgColor}`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    Front-End Ratio
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${getRatioStatus(results.frontEndRatio).color}`}>
                    {results.frontEndRatio.toFixed(2)}%
                  </p>
                  <p className={`text-xs font-semibold ${getRatioStatus(results.frontEndRatio).color}`}>
                    {getRatioStatus(results.frontEndRatio).text}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={`shadow-md border-l-4 ${getRatioStatus(results.backEndRatio).bgColor}`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-600 font-medium flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Back-End Ratio
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold ${getRatioStatus(results.backEndRatio).color}`}>
                    {results.backEndRatio.toFixed(2)}%
                  </p>
                  <p className={`text-xs font-semibold ${getRatioStatus(results.backEndRatio).color}`}>
                    {getRatioStatus(results.backEndRatio).text}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualization */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Income vs. Debt Breakdown</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Monthly distribution of income and debt payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const percent = ((entry.value / totalMonthlyIncome) * 100).toFixed(1);
                        return window.innerWidth < 640 ? `${percent}%` : `${entry.name}: ${percent}%`;
                      }}
                      outerRadius="60%"
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        ''
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* DTI Guidelines */}
              <div className="mt-6 space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">DTI Ratio Guidelines</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-800 text-sm">≤ 28% (Excellent)</p>
                    <p className="text-xs text-green-700 mt-1">Conventional loan front-end limit. Ideal for home buying.</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-800 text-sm">≤ 36% (Good)</p>
                    <p className="text-xs text-blue-700 mt-1">Conventional loan back-end limit. Healthy debt level.</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-800 text-sm">≤ 43% (Fair)</p>
                    <p className="text-xs text-yellow-700 mt-1">FHA loan limit. Manageable with careful budgeting.</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-800 text-sm">&gt; 43% (High Risk)</p>
                    <p className="text-xs text-red-700 mt-1">Consider debt reduction strategies immediately.</p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="mt-6 space-y-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Detailed Monthly Breakdown</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-gray-700">Housing Costs (Front-End)</span>
                    <span className="font-bold text-gray-900">
                      ${results.monthlyHousing.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-gray-700">Other Debts</span>
                    <span className="font-bold text-gray-900">
                      ${(results.monthlyDebt - results.monthlyHousing).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-gray-700">Total Monthly Debt</span>
                    <span className="font-bold text-red-600">
                      ${results.monthlyDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-gray-700">Income Remaining</span>
                    <span className="font-bold text-green-600">
                      ${(results.monthlyIncome - results.monthlyDebt).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              {backEndRatio > 43 && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 text-sm">High Debt-to-Income Ratio</h4>
                      <p className="text-xs text-red-700 mt-1">
                        Your DTI ratio exceeds recommended levels. Consider strategies to reduce debt or increase income 
                        to improve financial health and loan eligibility.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Educational Content */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl sm:text-2xl">Understanding Debt-to-Income Ratio</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                A comprehensive guide to DTI ratios and their impact on your financial health
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none space-y-6 pt-6">
              
              {/* What is DTI */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  What is a Debt-to-Income Ratio?
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Debt-to-income ratio (DTI) is the ratio of total debt payments divided by gross income (before tax) 
                  expressed as a percentage, usually on either a monthly or annual basis. As a quick example, if someone's 
                  monthly income is $1,000 and they spend $480 on debt each month, their DTI ratio is 48%. If they had no 
                  debt, their ratio is 0%. This metric is crucial for lenders when assessing loan applications and for 
                  individuals monitoring their financial health.
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <h3 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">DTI vs. Credit Utilization</h3>
                  <p className="text-xs sm:text-sm text-blue-800">
                    There is a separate ratio called the credit utilization ratio (sometimes called debt-to-credit ratio) 
                    that is often discussed along with DTI but works differently. The debt-to-credit ratio is the percentage 
                    of how much a borrower owes compared to their credit limit and has an impact on their credit score—the 
                    higher the percentage, the lower the credit score. DTI focuses on income, while credit utilization 
                    focuses on available credit limits.
                  </p>
                </div>
              </section>

              {/* Why is it Important */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Why is DTI Important?
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  DTI is an important indicator of a person's or a family's debt level. Lenders use this figure to assess 
                  the risk of lending to them. Credit card issuers, loan companies, and car dealers can all use DTI to 
                  assess their risk of doing business with different people. A person with a high ratio is seen by lenders 
                  as someone that might not be able to repay what they owe.
                </p>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Different lenders have different standards for what an acceptable DTI is; a credit card issuer might view 
                  a person with a 45% ratio as acceptable and issue them a credit card, but someone who provides personal 
                  loans may view it as too high and not extend an offer. It is just one indicator used by lenders to assess 
                  the risk of each borrower to determine whether to extend an offer or not, and if so, the characteristics 
                  of the loan. Theoretically, the lower the ratio, the better.
                </p>
              </section>

              {/* Types of DTI */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Home className="h-5 w-5 text-teal-600" />
                  Two Main Types of DTI Ratios
                </h2>

                <div className="space-y-4">
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h3 className="text-lg font-semibold text-teal-900 mb-2">Front-End Ratio (Housing Ratio)</h3>
                    <p className="text-xs sm:text-sm text-teal-800 mb-3">
                      Front-end debt ratio, sometimes called mortgage-to-income ratio in the context of home-buying, is 
                      computed by dividing total monthly housing costs by monthly gross income. The front-end ratio includes 
                      not only rental or mortgage payment, but also other costs associated with housing like insurance, 
                      property taxes, HOA/Co-Op fees, etc.
                    </p>
                    <div className="bg-white p-3 rounded border border-teal-300">
                      <p className="text-xs font-mono text-gray-800">
                        Front-End Ratio = (Total Monthly Housing Costs / Gross Monthly Income) × 100
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-teal-800 mt-3">
                      <strong>In the U.S., the standard maximum front-end limit used by conventional home mortgage lenders 
                      is 28%.</strong> This means your housing costs should not exceed 28% of your gross monthly income to 
                      qualify for most conventional mortgages.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">Back-End Ratio (Total DTI)</h3>
                    <p className="text-xs sm:text-sm text-purple-800 mb-3">
                      Back-end debt ratio is the more all-encompassing debt associated with an individual or household. 
                      It includes everything in the front-end ratio dealing with housing costs, along with any accrued 
                      monthly debt like car loans, student loans, credit cards, personal loans, and other liabilities. 
                      This ratio is commonly defined as the well-known debt-to-income ratio, and is more widely used than 
                      the front-end ratio.
                    </p>
                    <div className="bg-white p-3 rounded border border-purple-300">
                      <p className="text-xs font-mono text-gray-800">
                        Back-End Ratio = (Total Monthly Debt Payments / Gross Monthly Income) × 100
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-purple-800 mt-3">
                      <strong>In the U.S., the standard maximum limit for the back-end ratio is 36% on conventional home 
                      mortgage loans.</strong> This is the ratio most lenders refer to when discussing "debt-to-income ratio."
                    </p>
                  </div>
                </div>
              </section>

              {/* DTI Thresholds */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">DTI Ratio Thresholds and Guidelines</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-300 text-xs sm:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 border-b text-left font-semibold text-gray-700">DTI Range</th>
                        <th className="px-4 py-2 border-b text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-2 border-b text-left font-semibold text-gray-700">Loan Eligibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-green-50">
                        <td className="px-4 py-2 border-b font-semibold text-green-800">≤ 28%</td>
                        <td className="px-4 py-2 border-b text-green-700">Excellent</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          Conventional loan front-end limit. Ideal for all loan types.
                        </td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td className="px-4 py-2 border-b font-semibold text-blue-800">29-36%</td>
                        <td className="px-4 py-2 border-b text-blue-700">Good</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          Conventional loan back-end limit. Healthy debt level, good loan approval odds.
                        </td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-2 border-b font-semibold text-yellow-800">37-43%</td>
                        <td className="px-4 py-2 border-b text-yellow-700">Fair</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          FHA loan limit. May qualify but with higher rates or additional requirements.
                        </td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="px-4 py-2 border-b font-semibold text-orange-800">44-49%</td>
                        <td className="px-4 py-2 border-b text-orange-700">Poor</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          Limited options. High interest rates, difficult approval process.
                        </td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-4 py-2 border-b font-semibold text-red-800">≥ 50%</td>
                        <td className="px-4 py-2 border-b text-red-700">High Risk</td>
                        <td className="px-4 py-2 border-b text-gray-700">
                          Very difficult to obtain loans. Immediate debt reduction needed.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* House Affordability */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Home className="h-5 w-5 text-indigo-600" />
                  DTI Requirements for Home Buying
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  In the United States, lenders use DTI to qualify home-buyers. Different loan programs have different 
                  DTI requirements, which are typically expressed as front-end/back-end ratios:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 text-sm mb-2">Conventional Loans</h3>
                    <p className="text-2xl font-bold text-blue-700 mb-2">28/36</p>
                    <p className="text-xs text-blue-800">
                      Most common for borrowers with good credit. Typically requires 20% down payment for best rates.
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 text-sm mb-2">FHA Loans</h3>
                    <p className="text-2xl font-bold text-green-700 mb-2">31/43</p>
                    <p className="text-xs text-green-800">
                      Federal Housing Administration loans for first-time buyers or those with lower credit scores.
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="font-semibold text-purple-900 text-sm mb-2">VA Loans</h3>
                    <p className="text-2xl font-bold text-purple-700 mb-2">41/41</p>
                    <p className="text-xs text-purple-800">
                      Veterans Affairs loans for military service members, veterans, and eligible spouses.
                    </p>
                  </div>
                </div>
              </section>

              {/* Financial Health */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  DTI and Your Financial Health
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  While DTI ratios are widely used as technical tools by lenders, they can also be used to evaluate 
                  personal financial health. Understanding where you stand can help you make better financial decisions:
                </p>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Healthy DTI (≤ 33%)</h3>
                  <p className="text-xs sm:text-sm text-green-800">
                    In the United States, normally, a DTI of 1/3 (33%) or less is considered to be manageable. At this 
                    level, you have adequate income remaining after debt payments to cover living expenses, build savings, 
                    and handle unexpected costs. This is the sweet spot for financial flexibility and peace of mind.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Risky DTI (≥ 50%)</h3>
                  <p className="text-xs sm:text-sm text-red-800">
                    A DTI of 1/2 (50%) or more is generally considered too high, as it means at least half of income is 
                    spent solely on debt. At this level, you're financially vulnerable—any unexpected expense, job loss, 
                    or income reduction can lead to serious financial hardship or inability to meet debt obligations.
                  </p>
                </div>
              </section>

              {/* How to Lower DTI */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                  How to Lower Your Debt-to-Income Ratio
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  If your DTI is higher than you'd like, there are proven strategies to bring it down. The formula is 
                  simple: increase income, decrease debt, or both. Here are actionable steps:
                </p>

                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                    <h3 className="font-semibold text-blue-900 text-sm sm:text-base mb-2">1. Increase Your Income</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      This can be done through working overtime, taking on a second job, asking for a salary increase, 
                      or generating money from a hobby. If debt level stays the same, a higher income will result in a 
                      lower DTI.
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-2">
                      <li>Negotiate a raise at your current job</li>
                      <li>Take on freelance or consulting work in your spare time</li>
                      <li>Start a side business or monetize a hobby</li>
                      <li>Rent out a spare room or parking space</li>
                      <li>Pursue career advancement or professional certifications</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                    <h3 className="font-semibold text-green-900 text-sm sm:text-base mb-2">2. Create and Follow a Budget</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      By tracking spending through a budget, it is possible to find areas where expenses can be cut to 
                      reduce debt, whether it's vacations, dining, or shopping. Most budgets also make it possible to 
                      track the amount of debt compared to income on a monthly basis, which can help budgeteers work 
                      towards the DTI goals they set for themselves.
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-2">
                      <li>Track all expenses for 30 days to identify spending patterns</li>
                      <li>Cut unnecessary subscriptions and memberships</li>
                      <li>Reduce discretionary spending (dining out, entertainment)</li>
                      <li>Use budgeting apps to monitor progress automatically</li>
                      <li>Apply savings directly to debt principal</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <h3 className="font-semibold text-purple-900 text-sm sm:text-base mb-2">3. Make Debt More Affordable</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      High-interest debts such as credit cards can possibly be lowered through refinancing. A good first 
                      step would be to call the credit card company and ask if they can lower the interest rate; a borrower 
                      that always pays their bills on time with an account in good standing can sometimes be granted a 
                      lower rate.
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-2">
                      <li>Consolidate high-interest debt into lower-rate personal loans</li>
                      <li>Transfer credit card balances to 0% APR promotional offers</li>
                      <li>Refinance student loans or mortgages to lower rates</li>
                      <li>Negotiate lower interest rates with current creditors</li>
                      <li>Consider debt consolidation programs if struggling</li>
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                    <h3 className="font-semibold text-orange-900 text-sm sm:text-base mb-2">4. Use the Debt Avalanche or Snowball Method</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      <strong>Debt Avalanche:</strong> Pay minimums on all debts, then put extra money toward the highest 
                      interest rate debt first. This saves the most money on interest.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      <strong>Debt Snowball:</strong> Pay minimums on all debts, then put extra money toward the smallest 
                      balance first. This provides psychological wins and motivation.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-red-500 shadow-sm">
                    <h3 className="font-semibold text-red-900 text-sm sm:text-base mb-2">5. Avoid Taking On New Debt</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      While working to lower your DTI, resist the temptation to take on new debt. Every new obligation 
                      increases your DTI and makes it harder to qualify for loans or improve your financial position.
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1 ml-2">
                      <li>Pause major purchases until DTI improves</li>
                      <li>Use cash or debit cards instead of credit cards</li>
                      <li>Build an emergency fund to avoid debt for unexpected expenses</li>
                      <li>Wait to finance vehicles or make large purchases</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Common Mistakes */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Common DTI Mistakes to Avoid
                </h2>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="space-y-3 text-xs sm:text-sm text-red-900">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-1">❌</span>
                      <div>
                        <strong>Forgetting about irregular expenses:</strong> Only including regular monthly debt payments 
                        without accounting for periodic expenses like property taxes or insurance can give you a false sense 
                        of security. Always convert annual or semi-annual expenses to monthly amounts.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-1">❌</span>
                      <div>
                        <strong>Using net income instead of gross:</strong> DTI calculations use gross (before-tax) income, 
                        not take-home pay. Using net income will artificially inflate your DTI ratio.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-1">❌</span>
                      <div>
                        <strong>Ignoring minimum payments:</strong> Some people calculate DTI based on what they currently 
                        pay on credit cards, but lenders use minimum required payments. Even if you pay more, lenders 
                        calculate based on minimums.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-1">❌</span>
                      <div>
                        <strong>Closing old accounts to improve DTI:</strong> While paying off debt helps, closing old 
                        accounts can hurt your credit score by reducing available credit and credit history length. Pay 
                        down balances but keep accounts open.
                      </div>
                    </li>
                  </ul>
                </div>
              </section>

              {/* DTI Impact on Loan Terms */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  How DTI Affects Your Loan Terms and Interest Rates
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Your DTI ratio doesn't just determine whether you get approved for a loan—it also significantly impacts 
                  the terms you're offered. Lenders view borrowers with lower DTI ratios as less risky, which translates 
                  to better loan conditions. Understanding this relationship can save you thousands of dollars over the life 
                  of a loan.
                </p>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                  <h3 className="font-semibold text-indigo-900 mb-3 text-sm sm:text-base">Interest Rate Impact</h3>
                  <p className="text-xs sm:text-sm text-indigo-800 mb-3">
                    Borrowers with DTI ratios below 30% typically qualify for the best interest rates available. As your 
                    DTI increases, lenders may add a risk premium to your interest rate. For example, on a $300,000 mortgage, 
                    a 0.5% higher interest rate due to elevated DTI could cost you over $30,000 in additional interest over 
                    a 30-year term.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border border-indigo-300">
                      <p className="text-xs font-semibold text-indigo-900 mb-1">DTI ≤ 30%</p>
                      <p className="text-xs text-gray-700">Best rates, lowest fees, flexible terms</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-300">
                      <p className="text-xs font-semibold text-indigo-900 mb-1">DTI 31-43%</p>
                      <p className="text-xs text-gray-700">Standard rates, possible rate increase</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-300">
                      <p className="text-xs font-semibold text-indigo-900 mb-1">DTI 44-50%</p>
                      <p className="text-xs text-gray-700">Higher rates, larger down payment required</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-indigo-300">
                      <p className="text-xs font-semibold text-indigo-900 mb-1">DTI &gt; 50%</p>
                      <p className="text-xs text-gray-700">Very high rates or denial, cosigner needed</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-yellow-900 mb-2 text-sm sm:text-base">Down Payment Requirements</h3>
                  <p className="text-xs sm:text-sm text-yellow-800">
                    Lenders may require larger down payments from borrowers with higher DTI ratios to offset their risk. 
                    While someone with a 25% DTI might qualify for a mortgage with just 5% down, a borrower with a 40% DTI 
                    might need to put down 15-20% or more. This requirement can delay home purchases significantly as buyers 
                    work to save additional funds while simultaneously managing their existing debt obligations.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">Loan Amount Limitations</h3>
                  <p className="text-xs sm:text-sm text-green-800">
                    A higher DTI directly limits how much you can borrow. If your DTI is already at 35% before applying 
                    for a mortgage, lenders will only approve a loan amount that keeps your total DTI below their maximum 
                    threshold (typically 43%). This means you might qualify for a $250,000 mortgage instead of the $350,000 
                    you were hoping for, forcing you to adjust your home search accordingly or work to reduce existing debts 
                    before applying.
                  </p>
                </div>
              </section>

              {/* When DTI Rules Don't Apply */}
              <section className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Special Situations and DTI Exceptions
                </h2>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  While DTI guidelines are generally strict, certain circumstances and loan programs offer more flexibility. 
                  Understanding these exceptions can open up opportunities even if your DTI is higher than traditional limits.
                </p>

                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500 shadow-sm">
                    <h3 className="font-semibold text-teal-900 text-sm sm:text-base mb-2">Compensating Factors</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      Lenders may approve loans despite higher DTI ratios if you have strong compensating factors. These 
                      include substantial cash reserves (6+ months of mortgage payments in savings), excellent credit scores 
                      (750+), large down payments (20%+), or a proven track record of managing higher debt levels responsibly. 
                      Some borrowers with DTI ratios up to 50% have been approved based on exceptional compensating factors.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <h3 className="font-semibold text-purple-900 text-sm sm:text-base mb-2">Manual Underwriting</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      Instead of relying solely on automated underwriting systems, some lenders offer manual underwriting 
                      where a human reviews your complete financial picture. This process considers factors like job stability, 
                      career trajectory, education level, and overall financial responsibility. Manual underwriting is particularly 
                      beneficial for self-employed individuals or those with non-traditional income sources whose DTI might look 
                      unfavorable on paper but who actually have strong financial stability.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                    <h3 className="font-semibold text-orange-900 text-sm sm:text-base mb-2">Portfolio Loans</h3>
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      Some banks and credit unions keep certain loans in their own portfolio instead of selling them to 
                      secondary markets. These portfolio loans aren't subject to the same strict DTI requirements as 
                      conventional loans because the lender assumes all the risk. Local community banks and credit unions 
                      often offer more flexibility with DTI ratios for borrowers with long-standing relationships or unique 
                      circumstances that don't fit standard lending criteria.
                    </p>
                  </div>
                </div>
              </section>

              {/* Summary */}
              <section className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Key Takeaways</h2>
                <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>DTI is calculated</strong> by dividing total monthly debt payments by gross monthly 
                    income. Front-end ratio includes only housing costs, while back-end includes all debt obligations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Conventional mortgage lenders</strong> typically require front-end DTI ≤ 28% and 
                    back-end DTI ≤ 36%, while FHA allows up to 31/43 and VA loans allow up to 41/41.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>A DTI of 33% or less</strong> is considered healthy and manageable, while 50% or more 
                    is considered high risk and indicates financial vulnerability.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>To lower your DTI,</strong> focus on increasing income through raises or side work, 
                    reducing expenses through budgeting, and making debt more affordable through refinancing or consolidation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Use the debt avalanche method</strong> (highest interest first) to save the most money, 
                    or the snowball method (smallest balance first) for psychological motivation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Always calculate DTI using gross income</strong> (before taxes), not net income, and 
                    include all debt obligations including minimum credit card payments.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Monitor your DTI regularly</strong> as part of your financial health checkup, especially 
                    before applying for major loans like mortgages or auto financing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Your DTI affects interest rates and loan terms</strong>—lower ratios can save you tens 
                    of thousands in interest over the life of a loan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span><strong>Compensating factors, manual underwriting, and portfolio loans</strong> can provide 
                    flexibility for borrowers with higher DTI ratios but strong overall financial profiles.</span>
                  </li>
                </ul>
              </section>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DebtToIncomeRatioCalculatorComponent;
