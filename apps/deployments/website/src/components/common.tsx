import LoadingSkeleton from './LoadingSkeleton'
import TradableItemReferenceSkeleton from './TradableItemReferenceSkeleton'

export const LOADING_STATE = (
  <div>
    <LoadingSkeleton error={false}>
      <div>
        <TradableItemReferenceSkeleton />
        <TradableItemReferenceSkeleton />
        <TradableItemReferenceSkeleton />
      </div>
    </LoadingSkeleton>
  </div>
)

export const ERROR_STATE = (
  <div className="page-container-content-header-negative-spacer">
    <LoadingSkeleton error={true} />
  </div>
)

export const toPrice = (n: number) => Math.round(n).toLocaleString()
