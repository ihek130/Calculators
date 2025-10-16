import Header from '../Header';

export default function HeaderExample() {
  const handleSearch = (query: string) => {
    console.log('Search triggered:', query);
  };

  return (
    <Header 
      onSearch={handleSearch}
      searchPlaceholder="Search calculators..."
    />
  );
}