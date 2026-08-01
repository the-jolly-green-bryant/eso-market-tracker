import PageContainer from "../components/PageContainer";
import TradableItemCategoryReference from "../components/TradableItemCategoryReference";
import { CATEGORIES } from "../constants";
import { PLATFORMS, usePlatform } from "../platform";
import * as routes from "../routes";

const TradableItemCategories: React.FC = () => {
  const { platform } = usePlatform();
  const platformLabel = PLATFORMS[platform];
  const canonicalPath = routes.getCategories(platform);
  return (
    <PageContainer
      pageTitle="Market Categories"
      metaTitle={`Browse ${platformLabel} ESO Market Categories | ESO Market Tracker`}
      metaDescription={`Browse current ${platformLabel} prices by ESO item category, including gold upgrade materials, crafting materials, and companion gear.`}
      canonicalPath={canonicalPath}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${platformLabel} Elder Scrolls Online Market Categories`,
        url: `https://esomarkettracker.com${canonicalPath}`,
        description: `Browse ESO market prices by item category for ${platformLabel}.`,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: Object.keys(CATEGORIES).map((category, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: category,
            url: `https://esomarkettracker.com${encodeURI(
              routes.getCategory(category, platform),
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
};

export default TradableItemCategories;
