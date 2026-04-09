import { gql } from '@apollo/client'

export const GET_CATEGORIES = gql`
    query GetCategories {
        tradableItemCategories {
            displayLabel
            label
            slug
        }
    }
`

export const GET_CATEGORY = gql`
    query GetCategory($slug: String!) {
        tradableItemCategory(slug: $slug) {
            displayLabel
            label
            slug
            items {
                displayLabel
                currentXboxStats {
                    averageUnitPrice
                    medianUnitPrice
                    minimumUnitPrice
                    maximumUnitPrice
                    commonQuantity
                    commonUnitPriceRangeLower
                    commonUnitPriceRangeUpper
                    totalUnitsSold
                    totalSales
                    recentSales
                }
                slug
                description
                imageLink
                wikiLink
                howToAcquire
            }
        }
    }
`

export const GET_TRENDS = gql`
    query GetTrends {
        trends {
            label
            slug
            visible
        }
    }
`

export const GET_TREND = gql`
    query GetTrend($slug: String!) {
        trend(slug: $slug) {
            label
            slug
            groupedSlugs
            itemSlugs
            initiallySelectedItemSlug
            markedDates
            groupDetails {
                label
            }
            dateDetails {
                date
                label
            }
            focusSales
            focusDelta
            focusTimespan
        }
    }
`

export const GET_ITEM = gql`
    query GetItem($slug: String!) {
        tradableItem(slug: $slug) {
            craftableSlug
            refinableSlug
            labelForAverage
            labelForSales
            category {
                displayLabel
                slug
            }
            displayLabel
            isVolatile
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
                date
                whiteAverageUnitPrice
                greenAverageUnitPrice
                blueAverageUnitPrice
                purpleAverageUnitPrice
                goldAverageUnitPrice
                numberOfQualitiesTracked
            }
            historicalXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
                date
            }
            description
            detailedImageLink
            imageLink
            wikiLink
            howToAcquire
            relatedItems {
                displayLabel
                currentXboxStats {
                    averageUnitPrice
                    medianUnitPrice
                    minimumUnitPrice
                    maximumUnitPrice
                    commonQuantity
                    commonUnitPriceRangeLower
                    commonUnitPriceRangeUpper
                    totalUnitsSold
                    totalSales
                    recentSales
                }
                slug
                description
                imageLink
                wikiLink
                howToAcquire
            }
        }
    }
`

export const GET_MULTIPLE_ITEMS = gql`
    query GetMultipleItems($slugs: [String]!) {
        multipleTradableItems(slugs: $slugs) {
            craftableSlug
            refinableSlug
            category {
                displayLabel
                slug
            }
            displayLabel
            isVolatile
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
                date
                whiteAverageUnitPrice
                greenAverageUnitPrice
                blueAverageUnitPrice
                purpleAverageUnitPrice
                goldAverageUnitPrice
                numberOfQualitiesTracked
            }
            historicalXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
                date
            }
            description
            detailedImageLink
            imageLink
            wikiLink
            howToAcquire
            relatedItems {
                displayLabel
                currentXboxStats {
                    averageUnitPrice
                    medianUnitPrice
                    minimumUnitPrice
                    maximumUnitPrice
                    commonQuantity
                    commonUnitPriceRangeLower
                    commonUnitPriceRangeUpper
                    totalUnitsSold
                    totalSales
                    recentSales
                }
                slug
                description
                imageLink
                wikiLink
                howToAcquire
            }
        }
    }
`

export const SEARCH_ITEMS = gql`
    query SearchItemsQuery($search: String!, $offset: Int!, $limit: Int!) {
        tradableItems(search: $search, offset: $offset, limit: $limit) {
            displayLabel
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
            }
            description
            imageLink
            wikiLink
            howToAcquire
        }
    }
`

export const GET_CATEGORY_ITEMS = gql`
    query CategoryItemsQuery(
        $categorySlug: String!
        $offset: Int!
        $limit: Int!
    ) {
        tradableItems(
            categorySlug: $categorySlug
            offset: $offset
            limit: $limit
        ) {
            displayLabel
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
            }
            description
            imageLink
            wikiLink
            howToAcquire
        }
    }
`

export const GET_TOP_SELLERS = gql`
    query TopSellingTradableItemsQuery($platform: String!) {
        topSellingTradableItems(platform: $platform) {
            displayLabel
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
            }
            description
            imageLink
            wikiLink
            howToAcquire
        }
    }
`

export const GET_TOP_RISING = gql`
    query TopRisingTradableItemsQuery($platform: String!) {
        topRisingTradableItems(platform: $platform) {
            displayLabel
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
            }
            description
            imageLink
            wikiLink
            howToAcquire
        }
    }
`

export const GET_TOP_OPPORTUNITIES = gql`
    query LargestRangeTradableItemsQuery($platform: String!) {
        largestRangeTradableItems(platform: $platform) {
            displayLabel
            label
            slug
            currentXboxStats {
                averageUnitPrice
                medianUnitPrice
                minimumUnitPrice
                maximumUnitPrice
                commonQuantity
                commonUnitPriceRangeLower
                commonUnitPriceRangeUpper
                totalUnitsSold
                totalSales
                recentSales
            }
            description
            imageLink
            wikiLink
            howToAcquire
        }
    }
`

export const GET_PEOPLE = gql`
    query PeopleQuery {
        contributors
        sponsors
    }
`

export const GET_APP_STATS = gql`
    query AppStatsQuery {
        appStats {
            transactionCount
            itemCount
            latestTransactionDate
        }
    }
`

export const GET_WRIT_SCHEMA_REFERENCES = gql`
    query {
        writSchemas {
            slug
            label
        }
    }
`

export const GET_CRAFTABLE_SCHEMA = gql`
    query ($slug: String!) {
        craftableSchemaWithCategories(slug: $slug) {
            slug
            label
            categories {
                slug
                displayLabel
                unlockedCategoryLabel
                craftables {
                    slug
                    displayLabel
                    unlocks
                }
            }
            oneOfCategories {
                categories {
                    slug
                    displayLabel
                    craftables {
                        slug
                        displayLabel
                    }
                }
            }
        }
    }
`

export const GET_CRAFTABLE_COST_BREAKDOWN = gql`
    query GetCraftableCostBreakdownQuery($slugs: [String]!) {
        craftableCostBreakdown(slugs: $slugs) {
            requirements {
                item {
                    displayLabel
                    label
                    slug
                    currentXboxStats {
                        averageUnitPrice
                        medianUnitPrice
                        minimumUnitPrice
                        maximumUnitPrice
                        commonQuantity
                        commonUnitPriceRangeLower
                        commonUnitPriceRangeUpper
                        totalUnitsSold
                        totalSales
                        recentSales
                    }
                    description
                    imageLink
                    wikiLink
                    howToAcquire
                }
                averageUnitPrice
                quantity
            }
            totalCost
        }
    }
`

export const GET_GUILD = gql`
    query ObfuscatedGuildCategoryBreakdownQuery($guildAccessKey: String!) {
        obfuscatedGuild(guildAccessKey: $guildAccessKey) {
            firstSaleDate
            lastSaleDate
            zones {
                label
                slug
                stores {
                    label
                    slug
                }
            }
        }
    }
`

export const GET_GUILD_BREAKDOWN = gql`
    query ObfuscatedGuildCategoryBreakdownQuery(
        $guildAccessKey: String!
        $storeSlugs: [String]!
        $sortByValue: Boolean!
        $startDate: String!
        $endDate: String!
    ) {
        obfuscatedGuildCategoryBreakdown(
            guildAccessKey: $guildAccessKey
            storeSlugs: $storeSlugs
            sortByValue: $sortByValue
            startDate: $startDate
            endDate: $endDate
        ) {
            grandSales
            grandValue
            categories {
                label
                slug
                totalSales
                totalValue
                percentageOfGrandSales
                percentageOfGrandValue
                topItems {
                    label
                    slug
                    totalSales
                    totalValue
                }
            }
            # TODO - Top Items
        }
    }
`
