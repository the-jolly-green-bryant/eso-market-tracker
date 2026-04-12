import { Link } from 'react-router-dom'

import { TradableItemCategoryReferenceType } from '../models/tradable-item-types'
import * as routes from '../routes'
import './TradableItemCategoryReference.scss'

interface ContainerProps {
  category: TradableItemCategoryReferenceType
}

const TradableItemCategoryReference: React.FC<ContainerProps> = ({
  category,
}) => (
  <Link
    to={{
      pathname: routes.getCategory(category.slug),
      state: { categoryReference: category },
    }}
  >
    <div className="tradable-item-category-reference">
      {category.displayLabel} - {category.slug}
    </div>
  </Link>
)

export default TradableItemCategoryReference
