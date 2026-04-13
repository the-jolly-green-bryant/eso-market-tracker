import { Link } from 'react-router-dom'

import * as routes from '../routes'
import './TradableItemCategoryReference.scss'

export default ({ category }: { category: string }) => (
  <Link
    to={{
      pathname: routes.getCategory(category),
      state: { categoryReference: category },
    }}
  >
    <div className="tradable-item-category-reference">{category}</div>
  </Link>
)
