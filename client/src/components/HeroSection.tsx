import { useState } from "react";
import { Search, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroSectionProps {
  onSearch?: (query: string) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    console.log('Hero search triggered:', searchQuery);
  };

  return (
    <section className="bg-gradient-to-br from-background to-muted/20 py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Calculator className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
          Free Online Calculators for Every Need
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Access hundreds of professional calculators for finance, health, math, and more. 
          Fast, accurate, and completely free to use.
        </p>

        {/* Hero Search */}
        <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for any calculator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-lg"
                data-testid="input-hero-search"
              />
            </div>
            <Button 
              type="submit" 
              size="lg"
              className="h-12 px-8"
              data-testid="button-hero-search"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Quick Access Links */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "BMI Calculator",
            "Mortgage Calculator", 
            "Percentage Calculator",
            "Scientific Calculator"
          ].map((calc) => (
            <Button
              key={calc}
              variant="outline"
              size="sm"
              className="hover-elevate"
              data-testid={`button-quick-${calc.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => console.log(`Quick access: ${calc}`)}
            >
              {calc}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}