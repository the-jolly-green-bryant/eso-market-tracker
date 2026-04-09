import { menuController } from '@ionic/core'
import { IonIcon } from '@ionic/react'
import { searchOutline, closeOutline } from 'ionicons/icons'
import debounce from 'lodash.debounce'
import { KeyboardEvent, useCallback, useState } from 'react'
import { useHistory } from 'react-router-dom'
import './SearchBar.scss'
import * as routes from '../routes'

interface ContainerProps {
    text?: string
    searchCallback?: (searchText: string) => void
    onClear?: () => void
    onNavigateAway?: () => void
    placeholderText?: string
}

const SearchBar: React.FC<ContainerProps> = ({
    searchCallback = null,
    onClear = null,
    onNavigateAway = null,
    text = '',
    placeholderText = 'Search Items...',
}) => {
    const [searchText, setSearchText] = useState(text)
    const history = useHistory()

    const debouncedSearch = searchCallback
        ? useCallback(debounce(searchCallback, 400), [])
        : null

    const onSearchChange = (
        e:
            | React.ChangeEvent<HTMLInputElement>
            | KeyboardEvent<HTMLInputElement>,
    ) => {
        setSearchText((e.target as HTMLInputElement).value)
        if (
            (e as KeyboardEvent<HTMLInputElement>).key == 'Enter' &&
            !searchCallback
        ) {
            history.push(
                routes.getSearchResults((e.target as HTMLInputElement).value),
            )
            if (onNavigateAway) {
                onNavigateAway()
            }
        }

        if (!searchCallback) {
            return
        }

        if ((e as KeyboardEvent<HTMLInputElement>).key == 'Enter') {
            searchCallback((e.target as HTMLInputElement).value)
        } else if (debouncedSearch) {
            debouncedSearch((e.target as HTMLInputElement).value)
        }
    }

    const onSearchClear = () => {
        setSearchText('')

        if (!onClear) {
            return
        }

        onClear()
    }

    return (
        <div className="search-bar">
            <input
                autoComplete="off"
                value={searchText}
                type="text"
                onKeyPress={onSearchChange}
                onChange={onSearchChange}
                placeholder={placeholderText}
            />

            <div className="search-bar-icon" onClick={onSearchClear}>
                <IonIcon icon={text ? closeOutline : searchOutline}></IonIcon>
            </div>
        </div>
    )
}

export default SearchBar
