import { IonIcon } from "@ionic/react";
import { searchOutline, closeOutline } from "ionicons/icons";
import debounce from "lodash.debounce";
import {
  KeyboardEvent,
  RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useHistory } from "react-router-dom";
import "./SearchBar.scss";
import * as routes from "../routes";
import { usePlatform } from "../platform";
import { __useSearch } from "../pages/useItem";
import { TradableItemType } from "../models/tradable-item-types";
import { trackItemSelection } from "../analytics";

interface ContainerProps {
  text?: string;
  searchCallback?: (searchText: string) => void;
  onClear?: () => void;
  onNavigateAway?: () => void;
  placeholderText?: string;
  inputRef?: RefObject<HTMLInputElement>;
  suggestions?: TradableItemType[];
  suggestionsLoading?: boolean;
  suggestionsQuery?: string;
}

// The combobox owns its keyboard, async suggestion, and navigation state.
/* eslint-disable max-lines-per-function */
const SearchBar: React.FC<ContainerProps> = ({
  searchCallback = null,
  onClear = null,
  onNavigateAway = null,
  text = "",
  placeholderText = "Search Items...",
  inputRef,
  suggestions: suppliedSuggestions,
  suggestionsLoading: suppliedSuggestionsLoading = false,
  suggestionsQuery = "",
}) => {
  const [searchText, setSearchText] = useState(text);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const history = useHistory();
  const { platform } = usePlatform();
  const listboxId = useId();
  const searchCallbackRef = useRef(searchCallback);
  const normalizedSearch = searchText.trim();
  const remoteSuggestions = __useSearch(
    suppliedSuggestions === undefined ? suggestionQuery : "",
  );
  const suppliedSuggestionsAreCurrent =
    suppliedSuggestions !== undefined &&
    suggestionsQuery.trim().toLocaleLowerCase() ===
      normalizedSearch.toLocaleLowerCase();
  const suggestions = (
    suppliedSuggestionsAreCurrent ? suppliedSuggestions : remoteSuggestions.data
  ).slice(0, 6);
  const suggestionsLoading =
    suppliedSuggestions === undefined
      ? remoteSuggestions.loading
      : suppliedSuggestionsLoading;
  const showSuggestions = suggestionsOpen && normalizedSearch.length >= 2;

  const debouncedSearch = useMemo(
    () => debounce((value: string) => searchCallbackRef.current?.(value), 400),
    [],
  );

  useEffect(() => {
    searchCallbackRef.current = searchCallback;
  }, [searchCallback]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  useEffect(() => {
    if (suppliedSuggestions !== undefined) return;

    const timer = window.setTimeout(
      () =>
        setSuggestionQuery(
          normalizedSearch.length >= 2 ? normalizedSearch : "",
        ),
      180,
    );
    return () => window.clearTimeout(timer);
  }, [normalizedSearch, suppliedSuggestions]);

  useEffect(() => {
    setActiveSuggestion(-1);
  }, [normalizedSearch, suggestions.length]);

  const performTermSearch = () => {
    if (!normalizedSearch) return;
    debouncedSearch.cancel();
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);

    if (searchCallback) {
      searchCallback(normalizedSearch);
    } else {
      history.push(routes.getSearchResults(normalizedSearch, platform));
      onNavigateAway?.();
    }
  };

  const openItem = (item: TradableItemType) => {
    debouncedSearch.cancel();
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);
    trackItemSelection(item, "search_autocomplete");
    history.push({
      pathname: routes.getItem(item.slug, platform),
      state: { itemReference: item },
    });
    onNavigateAway?.();
  };

  const onSearchChange = (
    e: React.ChangeEvent<HTMLInputElement> | KeyboardEvent<HTMLInputElement>,
  ) => {
    const nextValue = (e.target as HTMLInputElement).value;
    const key = (e as KeyboardEvent<HTMLInputElement>).key;
    setSearchText(nextValue);

    if (key === "ArrowDown" && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion((current) =>
        Math.min(current + 1, suggestions.length),
      );
      return;
    }

    if (key === "ArrowUp" && showSuggestions) {
      e.preventDefault();
      setActiveSuggestion((current) => Math.max(current - 1, -1));
      return;
    }

    if (key === "Escape") {
      setSuggestionsOpen(false);
      setActiveSuggestion(-1);
      return;
    }

    if (key === "Enter" && showSuggestions && activeSuggestion >= 0) {
      e.preventDefault();
      if (activeSuggestion === suggestions.length) {
        performTermSearch();
      } else {
        openItem(suggestions[activeSuggestion]);
      }
      return;
    }

    if (key === "Enter" && !searchCallback) {
      performTermSearch();
    }

    if (!searchCallback) {
      return;
    }

    if (key === "Enter") {
      performTermSearch();
    } else {
      debouncedSearch(nextValue);
    }
  };

  const onSearchClear = () => {
    setSearchText("");
    setSuggestionsOpen(false);
    setActiveSuggestion(-1);

    if (!onClear) {
      return;
    }

    onClear();
  };

  return (
    <div
      className="search-bar"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setSuggestionsOpen(false);
          setActiveSuggestion(-1);
        }
      }}
    >
      <input
        ref={inputRef}
        aria-keyshortcuts="Meta+K Control+K"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showSuggestions}
        aria-activedescendant={
          activeSuggestion >= 0
            ? `${listboxId}-option-${activeSuggestion}`
            : undefined
        }
        autoComplete="off"
        value={searchText}
        type="text"
        onKeyDown={onSearchChange}
        onChange={onSearchChange}
        onFocus={() => setSuggestionsOpen(true)}
        placeholder={placeholderText}
      />

      <button
        aria-label={searchText ? "Clear search" : "Search"}
        className="search-bar-icon"
        onClick={searchText ? onSearchClear : performTermSearch}
        type="button"
      >
        <IonIcon icon={searchText ? closeOutline : searchOutline}></IonIcon>
      </button>

      {showSuggestions && (
        <div
          className="search-autocomplete"
          id={listboxId}
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
        >
          {suggestionsLoading && !suggestions.length ? (
            <div className="search-autocomplete-status">Finding items…</div>
          ) : (
            suggestions.map((item, index) => (
              <button
                aria-selected={activeSuggestion === index}
                className={activeSuggestion === index ? "is-active" : ""}
                id={`${listboxId}-option-${index}`}
                key={`${item.slug}-${item.platform ?? platform}`}
                onClick={() => openItem(item)}
                role="option"
                type="button"
              >
                <span>{item.displayLabel}</span>
                <small>Open price history</small>
              </button>
            ))
          )}

          <button
            aria-selected={activeSuggestion === suggestions.length}
            className={`search-autocomplete-term${
              activeSuggestion === suggestions.length ? " is-active" : ""
            }`}
            id={`${listboxId}-option-${suggestions.length}`}
            onClick={performTermSearch}
            role="option"
            type="button"
          >
            <span>Search for “{normalizedSearch}”</span>
            <small>Show every matching item</small>
          </button>
        </div>
      )}
    </div>
  );
};
/* eslint-enable max-lines-per-function */

export default SearchBar;
