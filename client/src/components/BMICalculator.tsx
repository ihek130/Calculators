import { useState } from "react";
import { Calculator, RotateCcw, Share, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface BMIResult {
  bmi: number;
  category: string;
  categoryColor: string;
  healthyRange: string;
}

export default function BMICalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [units, setUnits] = useState("metric");
  const [result, setResult] = useState<BMIResult | null>(null);

  const calculateBMI = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    
    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      alert("Please enter valid height and weight values");
      return;
    }

    let bmi: number;
    
    if (units === "metric") {
      // Height in cm, weight in kg
      const heightInMeters = heightNum / 100;
      bmi = weightNum / (heightInMeters * heightInMeters);
    } else {
      // Height in inches, weight in lbs
      bmi = (weightNum / (heightNum * heightNum)) * 703;
    }

    let category: string;
    let categoryColor: string;
    let healthyRange: string;

    if (bmi < 18.5) {
      category = "Underweight";
      categoryColor = "text-blue-600";
      healthyRange = units === "metric" ? "18.5 - 24.9 kg/m²" : "18.5 - 24.9";
    } else if (bmi < 25) {
      category = "Normal weight";
      categoryColor = "text-green-600";
      healthyRange = units === "metric" ? "18.5 - 24.9 kg/m²" : "18.5 - 24.9";
    } else if (bmi < 30) {
      category = "Overweight";
      categoryColor = "text-yellow-600";
      healthyRange = units === "metric" ? "18.5 - 24.9 kg/m²" : "18.5 - 24.9";
    } else {
      category = "Obese";
      categoryColor = "text-red-600";
      healthyRange = units === "metric" ? "18.5 - 24.9 kg/m²" : "18.5 - 24.9";
    }

    setResult({
      bmi: Math.round(bmi * 10) / 10,
      category,
      categoryColor,
      healthyRange
    });

    console.log('BMI calculated:', { bmi, category });
  };

  const resetCalculator = () => {
    setHeight("");
    setWeight("");
    setResult(null);
    console.log('BMI calculator reset');
  };

  const shareResult = () => {
    if (result) {
      const shareText = `My BMI is ${result.bmi} (${result.category})`;
      navigator.clipboard.writeText(shareText);
      console.log('BMI result shared:', shareText);
    }
  };

  const showEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}/calculators/bmi?embed=true" width="100%" height="500" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    console.log('Embed code copied:', embedCode);
  };

  const faqs = [
    {
      q: "What is BMI and how is it calculated?",
      a: "BMI (Body Mass Index) is a measure of body fat based on height and weight. It's calculated by dividing your weight in kilograms by your height in meters squared (kg/m²)."
    },
    {
      q: "Is BMI accurate for everyone?",
      a: "BMI is a useful screening tool but has limitations. It doesn't distinguish between muscle and fat mass, so it may not be accurate for athletes or very muscular individuals."
    },
    {
      q: "What is a healthy BMI range?",
      a: "A healthy BMI range for adults is typically 18.5 to 24.9. However, this can vary based on age, ethnicity, and individual health factors."
    },
    {
      q: "Can children use this BMI calculator?",
      a: "This calculator is designed for adults. Children and teens have different BMI calculations that account for age and gender. Consult a pediatrician for child BMI assessments."
    },
    {
      q: "What should I do if my BMI is outside the normal range?",
      a: "If your BMI is outside the normal range, consider consulting with a healthcare professional who can provide personalized advice based on your overall health."
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Calculator className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-4">BMI Calculator</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Calculate your Body Mass Index (BMI) to assess whether your weight is in a healthy range for your height.
        </p>
      </div>

      {/* Calculator Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Input Column */}
        <Card>
          <CardHeader>
            <CardTitle>Calculate Your BMI</CardTitle>
            <CardDescription>Enter your height and weight below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Units Selection */}
            <div>
              <Label htmlFor="units">Units</Label>
              <Select value={units} onValueChange={setUnits}>
                <SelectTrigger data-testid="select-units">
                  <SelectValue placeholder="Select units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (cm, kg)</SelectItem>
                  <SelectItem value="imperial">Imperial (in, lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Height Input */}
            <div>
              <Label htmlFor="height">
                Height ({units === "metric" ? "cm" : "inches"})
              </Label>
              <Input
                id="height"
                type="number"
                placeholder={units === "metric" ? "e.g., 175" : "e.g., 69"}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                data-testid="input-height"
              />
            </div>

            {/* Weight Input */}
            <div>
              <Label htmlFor="weight">
                Weight ({units === "metric" ? "kg" : "lbs"})
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder={units === "metric" ? "e.g., 70" : "e.g., 154"}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                data-testid="input-weight"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={calculateBMI}
                className="flex-1"
                data-testid="button-calculate"
              >
                Calculate BMI
              </Button>
              <Button 
                variant="outline" 
                onClick={resetCalculator}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Column */}
        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
            <CardDescription>BMI calculation and health category</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {result.bmi}
                  </div>
                  <div className={`text-xl font-semibold ${result.categoryColor} mb-4`}>
                    {result.category}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Healthy BMI range: {result.healthyRange}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={shareResult}
                    data-testid="button-share"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={showEmbedCode}
                    data-testid="button-embed"
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Embed
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                  <strong>Disclaimer:</strong> BMI is a screening tool and should not be used as a diagnostic tool. 
                  Consult with a healthcare professional for personalized health advice.
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your height and weight to calculate your BMI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEO Content */}
      <div className="space-y-8">
        {/* How it works */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">How it works</h2>
          <p className="text-muted-foreground mb-4">
            The BMI calculator uses the standard BMI formula: weight (kg) ÷ height (m)². 
            For imperial units, the formula is: (weight in pounds ÷ height in inches²) × 703.
          </p>
          
          <h3 className="text-xl font-semibold text-foreground mb-3">Formula</h3>
          <div className="bg-muted/30 p-4 rounded-lg mb-4">
            <code className="text-sm">
              BMI = weight (kg) ÷ height (m)²<br />
              BMI = (weight (lbs) ÷ height (in)²) × 703
            </code>
          </div>

          <h3 className="text-xl font-semibold text-foreground mb-3">Example</h3>
          <p className="text-muted-foreground">
            For a person who is 175 cm tall and weighs 70 kg:<br />
            BMI = 70 ÷ (1.75)² = 70 ÷ 3.06 = 22.9 kg/m² (Normal weight)
          </p>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}