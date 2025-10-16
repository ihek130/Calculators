import { Calculator, Heart, TrendingUp, Wrench, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  count: number;
  href: string;
}

interface CategoriesGridProps {
  onCategoryClick?: (categoryId: string) => void;
}

export default function CategoriesGrid({ onCategoryClick }: CategoriesGridProps) {
  const categories: Category[] = [
    {
      id: "financial",
      title: "Financial Calculators",
      description: "Mortgage, loan, investment, and tax calculators",
      icon: TrendingUp,
      count: 32,
      href: "/categories/financial"
    },
    {
      id: "health",
      title: "Fitness & Health",
      description: "BMI, calorie, pregnancy, and nutrition calculators",
      icon: Heart,
      count: 28,
      href: "/categories/health"
    },
    {
      id: "math",
      title: "Math Calculators",
      description: "Scientific, algebra, geometry, and statistics tools",
      icon: Calculator,
      count: 45,
      href: "/categories/math"
    },
    {
      id: "other",
      title: "Other Calculators",
      description: "Age, date, time, and specialized calculators",
      icon: Wrench,
      count: 38,
      href: "/categories/other"
    },
    {
      id: "embed",
      title: "Calculators for Your Site",
      description: "Embeddable widgets for your website",
      icon: Code,
      count: 12,
      href: "/categories/embed"
    }
  ];

  const handleCategoryClick = (category: Category) => {
    console.log('Category clicked:', category.id);
    onCategoryClick?.(category.id);
  };

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Calculator Categories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our comprehensive collection of calculators organized by category
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card 
                key={category.id} 
                className="hover-elevate cursor-pointer transition-all duration-200"
                onClick={() => handleCategoryClick(category)}
                data-testid={`card-category-${category.id}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {category.count}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    calculators
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}