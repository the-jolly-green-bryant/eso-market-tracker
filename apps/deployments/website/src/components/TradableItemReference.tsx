import FlatButton from "../components/FlatButton";
import { GoldPrice, GoldPriceRange } from "../components/GoldPrice";
import LocalImage from "../components/LocalImage";
import PlaceholderImage from "../components/PlaceholderImage";
import { TradableItemReferenceType } from "../models/tradable-item-types";
import * as routes from "../routes";
import { trackItemSelection } from "../analytics";

interface ContainerProps {
  item: TradableItemReferenceType;
  displayRange?: boolean;
  disableClick?: boolean;
  itemDescriptor?: string;
}

const TradableItemReference: React.FC<ContainerProps> = ({
  item,
  displayRange = false,
  disableClick = false,
  itemDescriptor = "",
}) => {
  const updatedDate = item.currentXboxStats.date;

  return (
    <div className="tradable-item-reference">
      <FlatButton
        onButtonClick={() => trackItemSelection(item, "item_results")}
        to={
          disableClick
            ? undefined
            : {
                pathname: routes.getItem(item.slug),
                state: { itemReference: item },
              }
        }
      >
        <div className="tradable-item-reference-label-container">
          <div className="tradable-item-reference-label">
            {item.displayLabel} {itemDescriptor}
          </div>

          <div className="tradable-item-reference-price">
            Avg. Price:{" "}
            <GoldPrice value={item.currentXboxStats.averageUnitPrice} />
          </div>

          {displayRange ? (
            <div className="tradable-item-reference-sales">
              <GoldPriceRange
                minimum={item.currentXboxStats.commonUnitPriceRangeLower}
                maximum={item.currentXboxStats.commonUnitPriceRangeUpper}
              />{" "}
              &bull; Updated {updatedDate}
            </div>
          ) : (
            <div className="tradable-item-reference-sales">
              Updated {updatedDate}
            </div>
          )}
        </div>

        <div className="tradable-item-reference-image">
          {item.imageLink && <LocalImage imageUrl={item.imageLink} />}

          {!item.imageLink && <PlaceholderImage isMissing={true} />}
        </div>
      </FlatButton>
    </div>
  );
};

export default TradableItemReference;
