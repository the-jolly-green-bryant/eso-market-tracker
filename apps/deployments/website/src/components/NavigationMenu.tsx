import { useQuery } from '@apollo/client'
import { IonContent, IonMenu, IonMenuToggle, IonIcon } from '@ionic/react'
import { chevronForwardOutline } from 'ionicons/icons'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

import LoadingSkeleton from '../components/LoadingSkeleton'
import SearchBar from './SearchBar'
import './NavigationMenu.scss'
import * as constants from '../constants'
import * as routes from '../routes'
import * as queries from '../models/queries'
import {
    TradableItemCategoryReferenceType,
    TrendType,
} from '../models/tradable-item-types'

const NavigationMenu: React.FC = () => {
    const menuRef = useRef<HTMLIonMenuElement>(null)
    const {
        loading: loadingCategories,
        error: categoriesError,
        data: categoriesData,
    } = useQuery<{
        tradableItemCategories: TradableItemCategoryReferenceType[]
    }>(queries.GET_CATEGORIES)

    const {
        loading: loadingTrends,
        error: trendsError,
        data: trendsData,
    } = useQuery<{
        trends: TrendType[]
    }>(queries.GET_TRENDS)

    const { data: appStatsData } = useQuery<{
        appStats: {
            transactionCount: number
            itemCount: number
            latestTransactionDate: string
        }
    }>(queries.GET_APP_STATS)

    return (
        <IonMenu
            contentId="main"
            type="push"
            ref={menuRef}
            swipeGesture={false}
        >
            <div className="navigation-menu">
                <div className="navigation-menu-header">
                    <div className="navigation-menu-header-image">
                        <img src="assets/images/icon-marketing.png" alt="" />
                    </div>

                    <div className="navigation-menu-header-title">
                        Fight. Loot. Profit.
                    </div>

                    <a
                        className="navigation-menu-header-button"
                        href={constants.PATREON_LINK}
                        target="_blank"
                    >
                        Learn More
                    </a>
                </div>

                <div className="navigation-menu-section">
                    <div className="navigation-menu-section-label">Stats</div>

                    <div className="navigation-menu-section-item-container">
                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.appStats(),
                                    }}
                                >
                                    Last Updated:{' '}
                                    {new Date().toISOString().split('T')[0]}
                                </Link>
                            </IonMenuToggle>
                        </div>

                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.appStats(),
                                    }}
                                >
                                    Unique Items:{' '}
                                    {appStatsData &&
                                        appStatsData.appStats.itemCount.toLocaleString()}
                                </Link>
                            </IonMenuToggle>
                        </div>

                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.appStats(),
                                    }}
                                >
                                    Total Sales:{' '}
                                    {appStatsData &&
                                        appStatsData.appStats.transactionCount.toLocaleString()}
                                </Link>
                            </IonMenuToggle>
                        </div>
                    </div>
                </div>

                <div className="navigation-menu-section">
                    <div className="navigation-menu-section-label">
                        Utilities
                    </div>

                    <div className="navigation-menu-section-item-container">
                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.writCostCalculator(),
                                    }}
                                >
                                    Writ Cost Calculator
                                </Link>
                            </IonMenuToggle>
                        </div>
                    </div>
                </div>

                <div className="navigation-menu-section">
                    <div className="navigation-menu-section-label">
                        Browse by Category
                    </div>

                    <div className="navigation-menu-section-item-container">
                        {loadingCategories ? (
                            <LoadingSkeleton error={false} />
                        ) : categoriesError ? (
                            <LoadingSkeleton error={true} />
                        ) : (
                            <div>
                                {categoriesData &&
                                    categoriesData.tradableItemCategories.map(
                                        (category, index) => {
                                            return (
                                                <div
                                                    className="navigation-menu-section-item"
                                                    key={`category_${index}`}
                                                >
                                                    <IonMenuToggle
                                                        autoHide={false}
                                                    >
                                                        <Link
                                                            to={{
                                                                pathname:
                                                                    routes.getCategory(
                                                                        category.slug,
                                                                    ),
                                                                state: {
                                                                    categoryReference:
                                                                        category,
                                                                },
                                                            }}
                                                        >
                                                            <div className="navigation-menu-section-item-label">
                                                                {
                                                                    category.displayLabel
                                                                }
                                                            </div>

                                                            <div className="navigation-menu-section-item-icon">
                                                                <IonIcon
                                                                    icon={
                                                                        chevronForwardOutline
                                                                    }
                                                                ></IonIcon>
                                                            </div>
                                                        </Link>
                                                    </IonMenuToggle>
                                                </div>
                                            )
                                        },
                                    )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="navigation-menu-section">
                    <div className="navigation-menu-section-label">
                        About Us &amp; More
                    </div>

                    <div className="navigation-menu-section-item-container">
                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.guild(),
                                    }}
                                >
                                    Guild Lookup
                                </Link>
                            </IonMenuToggle>
                        </div>

                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: routes.about(),
                                    }}
                                >
                                    About Us
                                </Link>
                            </IonMenuToggle>
                        </div>

                        <div className="navigation-menu-section-item">
                            <IonMenuToggle autoHide={false}>
                                <Link
                                    to={{
                                        pathname: constants.REPORT_A_BUG_LINK,
                                    }}
                                    target="_blank"
                                >
                                    Report a Bug
                                </Link>
                            </IonMenuToggle>
                        </div>

                        {/*<div className="navigation-menu-section-item">
                            Patreon
                        </div>

                        <div className="navigation-menu-section-item">
                            Kofi thing & other support links
                        </div>*/}
                    </div>
                </div>
            </div>
        </IonMenu>
    )
}

export default NavigationMenu
