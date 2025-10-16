import CalculatorCard from '../CalculatorCard';

export default function CalculatorCardExample() {
  const handleCalculatorClick = (id: string) => {
    console.log('Calculator clicked:', id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <CalculatorCard
        id="bmi-calculator"
        title="BMI Calculator"
        description="Calculate your Body Mass Index and understand your weight status"
        category="Health & Fitness"
        href="/calculators/bmi"
        isPopular={true}
        lastUpdated="2 days ago"
        onCalculatorClick={handleCalculatorClick}
      />
      <CalculatorCard
        id="mortgage-calculator"
        title="Mortgage Calculator"
        description="Calculate monthly mortgage payments, total interest, and amortization schedule"
        category="Financial"
        href="/calculators/mortgage"
        isPopular={true}
        lastUpdated="1 week ago"
        onCalculatorClick={handleCalculatorClick}
      />
      <CalculatorCard
        id="percentage-calculator"
        title="Percentage Calculator"
        description="Calculate percentages, percentage increase, decrease, and more"
        category="Math"
        href="/calculators/percentage"
        lastUpdated="3 days ago"
        onCalculatorClick={handleCalculatorClick}
      />
    </div>
  );
}