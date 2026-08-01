import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Redirect, Route, Switch } from "react-router-dom";
import About from "./pages/About";
import AuthorizedDevelopers from "./pages/AuthorizedDevelopers";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Report from "./pages/Report";
import TermsAndConditions from "./pages/TermsAndConditions";
import TradableItemCategories from "./pages/TradableItemCategories";
import TradableItemCategoryDetail, {
  CategoryProps,
} from "./pages/TradableItemCategoryDetail";
import TradableItemDetail, { ItemProps } from "./pages/TradableItemDetail";
import TamrielSavingsAlternative from "./pages/TamrielSavingsAlternative";
import ApiDocs from "./pages/ApiDocs";
import DiscordBot from "./pages/DiscordBot";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./components/components.scss";
import * as routes from "./routes";
import { MemoryRouter } from "react-router";
import Analytics from "./components/Analytics";
import {
  DEFAULT_PLATFORM,
  getPlatformFromSearch,
  PlatformProvider,
  removePlatformFromSearch,
} from "./platform";

setupIonicReact();

// The route table keeps canonical and legacy compatibility paths together.
// eslint-disable-next-line max-lines-per-function
const SWITCH = (initialData: unknown) => (
  <Switch>
    <Route
      path={routes.index()}
      exact={true}
      render={({ location }) => {
        const platform =
          getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM;
        return (
          <Redirect
            to={{
              pathname: routes.getDashboard(platform),
              search: removePlatformFromSearch(location.search),
            }}
          />
        );
      }}
    />

    <Route
      path={`${routes.platformPattern()}${routes.dashboard()}/:text?`}
      exact={true}
    >
      <Dashboard />
    </Route>

    <Route
      path={`${routes.platformPattern()}${routes.item()}/:slug`}
      exact={true}
    >
      <TradableItemDetail staticData={initialData as ItemProps["staticData"]} />
    </Route>

    <Route
      path={`${routes.dashboard()}/:text?`}
      exact={true}
      render={({ location, match }) => {
        const platform =
          getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM;
        const text = (match.params as { text?: string }).text;
        return (
          <Redirect
            to={{
              pathname: text
                ? routes.getSearchResults(text, platform)
                : routes.getDashboard(platform),
              search: removePlatformFromSearch(location.search),
            }}
          />
        );
      }}
    />

    <Route
      path={`${routes.item()}/:slug`}
      exact={true}
      render={({ location, match }) => {
        const platform =
          getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM;
        return (
          <Redirect
            to={{
              pathname: routes.getItem(
                (match.params as { slug: string }).slug,
                platform,
              ),
              search: removePlatformFromSearch(location.search),
            }}
          />
        );
      }}
    />

    <Route
      path={`/INTERNAL_LINK/:slug`}
      exact={true}
      render={(props) => (
        <Redirect
          to={routes.getItem(props.match.params.slug, DEFAULT_PLATFORM)}
        />
      )}
    />

    <Route
      path={`${routes.platformPattern()}${routes.categories()}`}
      exact={true}
    >
      <TradableItemCategories />
    </Route>

    <Route
      path={`${routes.platformPattern()}${routes.category()}/:slug`}
      exact={true}
    >
      <TradableItemCategoryDetail
        staticData={initialData as CategoryProps["staticData"]}
      />
    </Route>

    <Route
      path={routes.categories()}
      exact={true}
      render={({ location }) => {
        const platform =
          getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM;
        return (
          <Redirect
            to={{
              pathname: routes.getCategories(platform),
              search: removePlatformFromSearch(location.search),
            }}
          />
        );
      }}
    />

    <Route
      path={`${routes.category()}/:slug`}
      exact={true}
      render={({ location, match }) => {
        const platform =
          getPlatformFromSearch(location.search) ?? DEFAULT_PLATFORM;
        return (
          <Redirect
            to={{
              pathname: routes.getCategory(
                (match.params as { slug: string }).slug,
                platform,
              ),
              search: removePlatformFromSearch(location.search),
            }}
          />
        );
      }}
    />

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

    <Route path={routes.tamrielSavingsAlternative()} exact={true}>
      <TamrielSavingsAlternative />
    </Route>

    <Route path={routes.apiDocs()} exact={true}>
      <ApiDocs />
    </Route>

    <Route path={routes.discordBot()} exact={true}>
      <DiscordBot />
    </Route>

    <Route path="*">
      <Redirect to={routes.getDashboard(DEFAULT_PLATFORM)} />
    </Route>
  </Switch>
);

const isServer = typeof window === "undefined";
const Router = isServer ? MemoryRouter : IonReactRouter;

const App: React.FC<{
  initialUrl?: string;
  initialData?: unknown;
}> = ({ initialUrl, initialData }) => (
  <IonApp>
    <Router {...(isServer ? { initialEntries: [initialUrl ?? "/"] } : {})}>
      <PlatformProvider>
        <Analytics />
        <IonRouterOutlet id="main">{SWITCH(initialData)}</IonRouterOutlet>
      </PlatformProvider>
    </Router>
  </IonApp>
);

export default App;
