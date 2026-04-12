import PageContainer from '../components/PageContainer'
import { useQuery } from '@apollo/client'
import { IonIcon } from '@ionic/react'
import {
  calendarOutline,
  cashOutline,
  fileTrayStackedOutline,
} from 'ionicons/icons'

import * as queries from '../models/queries'

const AppStats: React.FC = () => {
  const { data } = useQuery<{
    appStats: {
      transactionCount: number
      itemCount: number
      latestTransactionDate: string
    }
  }>(queries.GET_APP_STATS)

  return (
    <PageContainer pageTitle="App Stats">
      <div className="static-content">
        <div className="static-content-header">Stats for Data Nerds</div>

        <div className="static-content-text">
          <p>
            We're hard at work bringing you the freshest trading data for ESO.
            Here are some cool stats to rock your world.
          </p>
        </div>

        <div className="static-content-text">
          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={calendarOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label">Data Last Updated</div>

            <div className="tradable-item-stat-value">
              {data && data.appStats.latestTransactionDate}
            </div>
          </div>

          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={fileTrayStackedOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label">
              Total Unique Items Tracked
            </div>

            <div className="tradable-item-stat-value">
              {data && data.appStats.itemCount.toLocaleString()}
            </div>
          </div>

          <div className="tradable-item-stat-container">
            <div className="tradable-item-stat-icon">
              <IonIcon icon={cashOutline}></IonIcon>
            </div>
            <div className="tradable-item-stat-label">Total Sales Recorded</div>

            <div className="tradable-item-stat-value">
              {data && data.appStats.transactionCount.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="static-content-text">
          <p>
            Simply put, the ESO Market Tracker is the most comprehensive sales
            tracker you'll find anywhere.
          </p>

          <p>Tell a friend.</p>
        </div>
      </div>
    </PageContainer>
  )
}

export default AppStats
