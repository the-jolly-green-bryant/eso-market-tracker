import { Link } from "react-router-dom";

import * as routes from "../routes";
import "./TradableItemCategoryReference.scss";
import { usePlatform } from "../platform";

const displayName = (category: string) =>
  category.startsWith("Mats (")
    ? `${category.slice(6, -1)} Materials`
    : category;

export default ({
  category,
  itemCount,
}: {
  category: string;
  itemCount: number;
}) => {
  const { platform } = usePlatform();
  return (
    <Link
      className="tradable-item-category-reference"
      to={{
        pathname: routes.getCategory(category, platform),
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
      <span
        className="tradable-item-category-reference-arrow"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
};
