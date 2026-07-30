import { Link } from 'react-router-dom'

import * as routes from '../routes'
import './TradableItemCategoryReference.scss'

const displayName = (category: string) =>
  category.startsWith('Mats (')
    ? `${category.slice(6, -1)} Materials`
    : category

export default ({
  category,
  itemCount,
}: {
  category: string
  itemCount: number
}) => (
  <Link
    className="tradable-item-category-reference"
    to={{
      pathname: routes.getCategory(category),
      state: { categoryReference: category },
    }}
  >
    <span className="tradable-item-category-reference-kicker">
      Market category
    </span>
    <strong>{displayName(category)}</strong>
    <span className="tradable-item-category-reference-meta">
      {itemCount.toLocaleString()} tracked items
    </span>
    <span className="tradable-item-category-reference-arrow" aria-hidden="true">
      →
    </span>
  </Link>
)
