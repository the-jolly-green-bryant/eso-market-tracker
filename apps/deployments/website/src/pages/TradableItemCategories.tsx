import PageContainer from "../components/PageContainer";
import TradableItemCategoryReference from "../components/TradableItemCategoryReference";
import { CATEGORIES } from "../constants";

const TradableItemCategories: React.FC = () => (
  <PageContainer
    pageTitle="Market Categories"
    metaTitle="Browse ESO Market Categories | ESO Market Tracker"
    metaDescription="Browse current Xbox and PlayStation prices by ESO item category, including gold upgrade materials, crafting materials, and companion gear."
    canonicalPath="/categories"
    jsonLd={{
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Elder Scrolls Online Market Categories",
      url: "https://esomarkettracker.com/categories",
      description:
        "Browse ESO console market prices by item category for Xbox and PlayStation.",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: Object.keys(CATEGORIES).map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category,
          url: `https://esomarkettracker.com/category/${encodeURIComponent(
            category,
          )}`,
        })),
      },
    }}
  >
    <div className="page-container-intro">
      <span>Browse the market</span>
      <p>
        Explore focused collections from the public console dataset. Choose a
        category to compare current values and recent market activity.
      </p>
    </div>
    <div className="page-container-list">
      {Object.keys(CATEGORIES).map((category) => (
        <TradableItemCategoryReference
          key={category}
          category={category}
          itemCount={CATEGORIES[category as keyof typeof CATEGORIES].length}
        />
      ))}
    </div>
  </PageContainer>
);

export default TradableItemCategories;
