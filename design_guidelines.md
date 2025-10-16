# Calculator Website Design Guidelines

## Design Approach
**System-Based Approach**: Following a clean, utility-focused design system optimized for information density and user efficiency. The calculator website prioritizes functionality and trustworthiness over visual flair.

## Core Design Elements

### Color Palette (Trust & Clarity - Exact Implementation Required)
**Root CSS Variables:**
- `--bg: #F5FBFF` (Light blue-tinted background)
- `--surface: #FFFFFF` (Pure white cards/surfaces)
- `--text: #0B1224` (Dark navy text)
- `--muted: #6B7280` (Gray for secondary text)
- `--brand: #1E88E5` (Primary blue for CTAs)
- `--brand-600: #1565C0` (Darker blue for hover states)
- `--accent: #00A3A3` (Teal for highlights/accents)
- `--border: #E6F0FA` (Light blue borders)

### Typography
- **Primary Font**: System font stack for performance
- **Hierarchy**: 
  - H1: 32px bold for calculator names
  - H2: 24px semibold for major sections
  - H3: 20px medium for subsections
  - Body: 16px regular for content
  - Small: 14px for labels and meta text

### Layout System
**Tailwind Spacing Units**: Use consistent spacing with units of 2, 4, 8, 12, and 16
- `p-2, p-4, p-8` for padding
- `m-4, m-8, m-12` for margins
- `gap-4, gap-8` for flexbox/grid gaps

### Component Library

**Navigation**
- Clean header with logo, search bar, and navigation links
- Breadcrumbs on all calculator pages
- Footer with sitemap links and metadata

**Calculator Interface**
- **Two-column layout**: Inputs on left, results on right
- **Input fields**: Large, clearly labeled with unit suffixes
- **Buttons**: Primary brand color with 10px border-radius
- **Results cards**: White surface with subtle border
- **Button interactions**: `transform: translateY(-1px)` on hover, `filter: brightness(.94)`

**Content Sections**
- **Hero section**: Minimal with search functionality
- **Category cards**: Grid layout with clear hierarchy
- **SEO content blocks**: Well-structured with proper heading hierarchy
- **FAQ accordions**: Collapsible sections for better content organization

### Interactive Elements

**Search Functionality**
- Prominent search bar in header and hero
- Real-time filtering of calculators
- Clean, minimal search results

**Embed Widgets**
- Modal overlay for embed code generation
- Copy-to-clipboard functionality
- Iframe code with responsive dimensions

**Calculator Controls**
- Large, accessible input fields
- Clear "Calculate" and "Reset" buttons
- URL parameter sharing for results
- Print-friendly view option

## Mobile-First Responsive Design
- Single-column layout on mobile devices
- Touch-friendly button sizes (44px minimum)
- Collapsible navigation menu
- Optimized calculator interfaces for small screens

## SEO Content Structure
- Semantic HTML5 structure (article, section, aside)
- Proper heading hierarchy for content organization
- JSON-LD schema integration for FAQs and HowTo content
- Internal linking strategy for topical authority

## Performance Optimizations
- Minimal JavaScript footprint
- CSS variables for consistent theming
- Lazy loading for non-critical elements
- Inline critical CSS for above-the-fold content

## Accessibility Standards
- WCAG contrast compliance with provided color scheme
- Keyboard navigation support
- ARIA attributes for form controls and interactive elements
- Screen reader friendly content structure

## Visual Consistency
- Consistent use of brand colors throughout
- Uniform spacing using defined units
- Standardized component styling
- Clean, professional aesthetic focused on trust and usability

## Images
No large hero images or decorative graphics. The design focuses on clean, functional interfaces with:
- Simple icons for calculator categories
- Minimal graphics for visual hierarchy
- No background images or complex visuals
- Icon fonts or SVG icons for UI elements

This design system prioritizes functionality, trust, and performance while maintaining visual consistency across hundreds of calculator pages.