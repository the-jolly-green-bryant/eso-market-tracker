import {
    IonApp,
    IonRouterOutlet,
    IonSplitPane,
    setupIonicReact,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, Switch } from 'react-router-dom'
import * as Sentry from '@sentry/capacitor'
import NavigationMenu from './components/NavigationMenu'
import About from './pages/About'
import AppStats from './pages/AppStats'
import AuthorizedDevelopers from './pages/AuthorizedDevelopers'
import Dashboard from './pages/Dashboard'
import GuildDetail from './pages/GuildDetail'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Report from './pages/Report'
import TermsAndConditions from './pages/TermsAndConditions'
import TradableItemCategories from './pages/TradableItemCategories'
import TradableItemCategoryDetail from './pages/TradableItemCategoryDetail'
import TradableItemDetail from './pages/TradableItemDetail'
import TrendPage from './pages/TrendPage'
import WritCostCalculator from './pages/WritCostCalculator'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

/* Theme variables */
import './theme/variables.css'

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import * as routes from './routes'
import * as constants from './constants'

Sentry.init({
    dsn: 'https://14e9ebba79f300d63e3a787630bafd8c@o4506009996427264.ingest.sentry.io/4506022223282176',
    integrations: [
        // new Sentry.BrowserTracing({
        //   // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        //   tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
        // }),
        // new Sentry.Replay(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    environment: constants.SENTRY_ENVIRONMENT,
})

setupIonicReact()

const App: React.FC = () => {
    const apolloClient = new ApolloClient({
        uri: constants.API_GRAPHQL_ENDPOINT,
        cache: new InMemoryCache({
            typePolicies: {
                Query: {
                    fields: {
                        tradableItems: {
                            // Don't cache separate results based on
                            // any of this field's arguments.
                            keyArgs: ['search', 'categorySlug'],

                            // Concatenate the incoming list items with
                            // the existing list items.
                            merge(existing = [], incoming) {
                                return [...existing, ...incoming]
                            },
                        },
                    },
                },
            },
        }),
    })

    return (
        <ApolloProvider client={apolloClient}>
            <IonApp>
                <IonReactRouter>
                    <IonSplitPane contentId="main">
                        <NavigationMenu />
                        <IonRouterOutlet id="main">
                            <Switch>
                                <Route path={routes.index()} exact={true}>
                                    <Redirect to={`${routes.dashboard()}/`} />
                                </Route>

                                <Route
                                    path={`${routes.dashboard()}/:text?`}
                                    exact={true}
                                >
                                    <Dashboard />
                                </Route>

                                <Route
                                    path={`${routes.item()}/:slug`}
                                    exact={true}
                                >
                                    <TradableItemDetail />
                                </Route>

                                <Route
                                    path={`${routes.trend()}/:slug`}
                                    exact={true}
                                >
                                    <TrendPage />
                                </Route>

                                <Route
                                    path={`/INTERNAL_LINK/:slug`}
                                    exact={true}
                                    render={(props) => (
                                        <Redirect
                                            to={`${routes.item()}/${
                                                props.match.params.slug
                                            }`}
                                        />
                                    )}
                                />

                                <Route path={routes.categories()} exact={true}>
                                    <TradableItemCategories />
                                </Route>

                                <Route
                                    path={`${routes.category()}/:slug`}
                                    exact={true}
                                >
                                    <TradableItemCategoryDetail />
                                </Route>

                                <Route
                                    path={`${routes.guild()}/:guildAccessKey?`}
                                    exact={true}
                                >
                                    <GuildDetail />
                                </Route>

                                {/*<Route
                                    path={`${routes.guild()}/:accessKey`}
                                    exact={true}
                                >
                                    <TradableItemCategoryDetail />
                                </Route>*/}

                                <Route
                                    path={routes.writCostCalculator()}
                                    exact={true}
                                >
                                    <WritCostCalculator />
                                </Route>

                                <Route path={routes.about()} exact={true}>
                                    <About />
                                </Route>

                                <Route path={routes.report()} exact={true}>
                                    <Report />
                                </Route>

                                <Route
                                    path={routes.termsAndConditions()}
                                    exact={true}
                                >
                                    <TermsAndConditions />
                                </Route>

                                <Route
                                    path={routes.privacyPolicy()}
                                    exact={true}
                                >
                                    <PrivacyPolicy />
                                </Route>

                                <Route
                                    path={routes.authorizedDevelopers()}
                                    exact={true}
                                >
                                    <AuthorizedDevelopers />
                                </Route>

                                <Route path={routes.appStats()} exact={true}>
                                    <AppStats />
                                </Route>

                                <Route path="*">
                                    <Redirect to={`${routes.dashboard()}/`} />
                                </Route>
                            </Switch>
                        </IonRouterOutlet>
                    </IonSplitPane>
                </IonReactRouter>
            </IonApp>
        </ApolloProvider>
    )
}

export default App
