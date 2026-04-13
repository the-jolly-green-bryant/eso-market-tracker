import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, Switch } from 'react-router-dom'
import NavigationMenu from './components/NavigationMenu'
import About from './pages/About'
import AuthorizedDevelopers from './pages/AuthorizedDevelopers'
import Dashboard from './pages/Dashboard'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Report from './pages/Report'
import TermsAndConditions from './pages/TermsAndConditions'
import TradableItemCategories from './pages/TradableItemCategories'
import TradableItemCategoryDetail from './pages/TradableItemCategoryDetail'
import TradableItemDetail from './pages/TradableItemDetail'

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
import * as routes from './routes'

setupIonicReact()

const SWITCH = (
  <Switch>
    <Route path={routes.index()} exact={true}>
      <Redirect to={`${routes.dashboard()}/`} />
    </Route>

    <Route path={`${routes.dashboard()}/:text?`} exact={true}>
      <Dashboard />
    </Route>

    <Route path={`${routes.item()}/:slug`} exact={true}>
      <TradableItemDetail />
    </Route>

    <Route
      path={`/INTERNAL_LINK/:slug`}
      exact={true}
      render={(props) => (
        <Redirect to={`${routes.item()}/${props.match.params.slug}`} />
      )}
    />

    <Route path={routes.categories()} exact={true}>
      <TradableItemCategories />
    </Route>

    <Route path={`${routes.category()}/:slug`} exact={true}>
      <TradableItemCategoryDetail />
    </Route>

    <Route path={routes.about()} exact={true}>
      <About />
    </Route>

    <Route path={routes.report()} exact={true}>
      <Report />
    </Route>

    <Route path={routes.termsAndConditions()} exact={true}>
      <TermsAndConditions />
    </Route>

    <Route path={routes.privacyPolicy()} exact={true}>
      <PrivacyPolicy />
    </Route>

    <Route path={routes.authorizedDevelopers()} exact={true}>
      <AuthorizedDevelopers />
    </Route>

    <Route path="*">
      <Redirect to={`${routes.dashboard()}/`} />
    </Route>
  </Switch>
)

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonSplitPane contentId="main">
        <NavigationMenu />
        <IonRouterOutlet id="main">{SWITCH}</IonRouterOutlet>
      </IonSplitPane>
    </IonReactRouter>
  </IonApp>
)

export default App
