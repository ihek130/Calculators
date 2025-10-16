import React from 'react';
import { Helmet } from 'react-helmet-async';
import CalculatorLayout from '@/components/CalculatorLayout';
import HomeEquityLoanCalculatorComponent from '@/components/calculators/HomeEquityLoanCalculatorComponent';

const HomeEquityLoanCalculatorPage = () => {
  return (
    <>
      <Helmet>
        <title>Home Equity Loan Calculator - Free Online Tool | CalcVerse</title>
        <meta 
          name="description" 
          content="Calculate home equity loan payments with our free online calculator. Compare fixed home equity loans vs HELOCs. Get detailed amortization schedules and equity analysis." 
        />
        <meta name="keywords" content="home equity loan calculator, HELOC calculator, home equity line of credit, fixed home equity loan, home equity payments" />
        <link rel="canonical" href="https://calcverse.com/home-equity-loan-calculator" />
      </Helmet>
      <CalculatorLayout 
        title="Home Equity Loan Calculator"
        description="Calculate home equity loan payments and compare fixed loans vs HELOCs"
      >
        <HomeEquityLoanCalculatorComponent />
      </CalculatorLayout>
    </>
  );
};

export default HomeEquityLoanCalculatorPage;