import PageContainer from '../components/PageContainer'
import TradableItemCategoryReference from '../components/TradableItemCategoryReference'
import { CATEGORIES } from '../constants'

const TradableItemCategories: React.FC = () => (
  <PageContainer pageTitle="TradableItemCategories">
    <div className="page-container-list">
      {Object.keys(CATEGORIES).map((category) => (
        <TradableItemCategoryReference category={category} />
      ))}
    </div>
  </PageContainer>
)

export default TradableItemCategories
