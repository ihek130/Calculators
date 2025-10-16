import { ExternalLink, Calculator } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CalculatorCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  isPopular?: boolean;
  lastUpdated?: string;
  onCalculatorClick?: (id: string) => void;
}

export default function CalculatorCard({
  id,
  title,
  description,
  category,
  href,
  isPopular = false,
  lastUpdated,
  onCalculatorClick
}: CalculatorCardProps) {
  const handleClick = () => {
    console.log('Calculator clicked:', id);
    onCalculatorClick?.(id);
  };

  return (
    <Card className="hover-elevate cursor-pointer transition-all duration-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-primary" />
            {isPopular && (
              <Badge variant="secondary" className="text-xs">
                Popular
              </Badge>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col justify-between pt-0">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit text-xs">
            {category}
          </Badge>
          
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdated}
            </p>
          )}
        </div>
        
        <Button 
          className="w-full mt-4" 
          onClick={handleClick}
          data-testid={`button-calculator-${id}`}
        >
          Use Calculator
        </Button>
      </CardContent>
    </Card>
  );
}