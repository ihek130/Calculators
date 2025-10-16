import HeroSection from '../HeroSection';

export default function HeroSectionExample() {
  const handleSearch = (query: string) => {
    console.log('Hero search triggered:', query);
  };

  return <HeroSection onSearch={handleSearch} />;
}