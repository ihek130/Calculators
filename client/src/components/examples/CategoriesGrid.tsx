import CategoriesGrid from '../CategoriesGrid';

export default function CategoriesGridExample() {
  const handleCategoryClick = (categoryId: string) => {
    console.log('Category clicked:', categoryId);
  };

  return <CategoriesGrid onCategoryClick={handleCategoryClick} />;
}