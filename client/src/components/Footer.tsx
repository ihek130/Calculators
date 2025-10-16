import { Calculator } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerSections = [
    {
      title: "Categories",
      links: [
        { label: "Financial Calculators", href: "/financial-calculators" },
        { label: "Health & Fitness", href: "/health-calculators" },
        { label: "Math Calculators", href: "/math-calculators" },
        { label: "Other Calculators", href: "/other-calculators" }
      ]
    },
    {
      title: "Popular Calculators",
      links: [
        { label: "BMI Calculator", href: "/calculators/bmi-calculator" },
        { label: "Mortgage Calculator", href: "/calculators/mortgage-calculator" },
        { label: "Percentage Calculator", href: "/calculators/percentage-calculator" },
        { label: "Scientific Calculator", href: "/calculators/scientific-calculator" }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "All Calculators", href: "/all-calculators" },
        { label: "Blog", href: "/blog" }
      ]
    }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Calculator className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold text-foreground">CalcVerse</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Free online calculators for every need. Fast, accurate, and completely free to use.
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border flex justify-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} CalcVerse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}