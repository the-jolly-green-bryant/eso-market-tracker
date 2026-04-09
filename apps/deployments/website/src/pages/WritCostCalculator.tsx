import { useQuery, useLazyQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

import FloatingButton from '../components/FloatingButton'
import InlineSelect from '../components/InlineSelect'
import LoadingSkeleton from '../components/LoadingSkeleton'
import PageContainer from '../components/PageContainer'
import TradableItemReference from '../components/TradableItemReference'
import TradableItemReferenceSkeleton from '../components/TradableItemReferenceSkeleton'
import {
    CraftableCategoryWithItemsType,
    CraftableCostBreakdownType,
    CraftableItemReferenceType,
    CraftableSchemaReferenceType,
    CraftableSchemaWithCategoriesType,
} from '../models/craftable-item-types'

import * as constants from '../constants'
import * as queries from '../models/queries'

const WritCostCalculator: React.FC = () => {
    const DEFAULT_WRIT_TYPE = 'jewelry-crafting-writ'

    // Store our craftables with category slugs as well so we can add/remove them as dropdowns change.
    const [craftableSlugsWithCategory, setCraftableSlugsWithCategory] =
        useState<string[]>([])

    // Store our unlocked category slugs alongside the unlocking category.
    const [
        unlockedSlugsWithUnlockingCategory,
        setUnlockedSlugWithUnlockingCategory,
    ] = useState<string[]>([])

    // Store our last fetched writ type so we know whether to show or hide breakdown.
    const [currentWritType, setCurrentWritType] = useState<string>()
    const [lastFetchedWritType, setLastFetchedCurrentWritType] =
        useState<string>()

    // Query for pulling all writ types we support.
    const {
        loading: writTypesLoading,
        error: writTypesError,
        data: writTypesData,
    } = useQuery<{
        writSchemas: CraftableSchemaReferenceType[]
    }>(queries.GET_WRIT_SCHEMA_REFERENCES)

    // Query for pulling all schema information for our desired writ type.
    const [
        getSchema,
        { loading: schemaLoading, error: schemaError, data: schemaData },
    ] = useLazyQuery<{
        craftableSchemaWithCategories: CraftableSchemaWithCategoriesType
    }>(queries.GET_CRAFTABLE_SCHEMA, {
        variables: { slug: '' },
    })

    // Query for calculating item cost.
    const [
        getCostBreakdown,
        { loading: costLoading, error: costError, data: costData },
    ] = useLazyQuery<{
        craftableCostBreakdown: CraftableCostBreakdownType
    }>(queries.GET_CRAFTABLE_COST_BREAKDOWN, {
        variables: { slugs: [] },
    })

    // Allow users to calculate totals.
    const updateTotalsBreakdown = (newSlugs: string[]) => {
        if (!schemaData || newSlugs.length != getRequiredCategoryCount()) {
            console.log(
                `Not ready for totals. We have ${newSlugs.length} slug(s).`,
            )
            return
        }

        // Strip the categories from our slugs so we can send them for calculation.
        const craftableSlugs = newSlugs.map((slugWithCategory: string) => {
            return slugWithCategory.split('--').pop()
        })
        console.log('craftableSlugs', craftableSlugs)

        setLastFetchedCurrentWritType(currentWritType)
        getCostBreakdown({
            variables: { slugs: craftableSlugs },
        })
    }

    // Get the number of required categories for this item.
    const getRequiredCategoryCount = () => {
        if (!schemaData) {
            return 100 // We're totally not ready for anything.
        }

        return (
            schemaData.craftableSchemaWithCategories.categories.length +
            schemaData.craftableSchemaWithCategories.oneOfCategories.length
        )
    }

    const getRenderedUnlockableSelect = (
        category: CraftableCategoryWithItemsType,
    ) => {
        // Get potential category slugs.
        let potentialCategories: CraftableCategoryWithItemsType[] = []
        schemaData!.craftableSchemaWithCategories.oneOfCategories.forEach(
            (selection) => {
                potentialCategories = potentialCategories.concat(
                    selection.categories,
                )
            },
        )

        // Filter for applicable categories and map them into concatenated slugs.
        const relevantCategorySlugs = potentialCategories
            .filter((i) => {
                return i.displayLabel == category.unlockedCategoryLabel
            })
            .map((i) => {
                return `${category.slug}--${i.slug}`
            })

        let hasSelection = false
        relevantCategorySlugs.forEach((slug) => {
            if (unlockedSlugsWithUnlockingCategory.includes(slug)) {
                hasSelection = true
            }
        })

        return (
            <div>
                {hasSelection ? (
                    relevantCategorySlugs.map((combinedSlug) => {
                        const [unlockingCategorySlug, unlockedCategorySlug] =
                            combinedSlug.split('--')

                        return potentialCategories
                            .filter((i) => {
                                return (
                                    i.slug == unlockedCategorySlug &&
                                    unlockedSlugsWithUnlockingCategory.includes(
                                        combinedSlug,
                                    )
                                )
                            })
                            .map((unlockedCategory) => {
                                return (
                                    <div key={`${combinedSlug}`}>
                                        {getRenderedCategoryDropdown(
                                            unlockedCategory,
                                        )}
                                    </div>
                                )
                            })
                    })
                ) : (
                    <InlineSelect
                        label={category.unlockedCategoryLabel!}
                        options={[]}
                        onChange={(newValue: string) => {
                            console.log("I'm disabled!")
                        }}
                        disabled={true}
                        placeholder={`Select ${category.displayLabel} First...`}
                    />
                )}
            </div>
        )
    }

    const getItemFromCategoryBySlug = (
        slug: string,
        category: CraftableCategoryWithItemsType,
    ): CraftableItemReferenceType | null => {
        let item: CraftableItemReferenceType | null = null
        category.craftables.forEach((targetCraftable) => {
            if (targetCraftable.slug == slug) {
                item = targetCraftable
            }
        })
        return item
    }

    const getRenderedCategoryDropdown = (
        category: CraftableCategoryWithItemsType,
    ) => {
        let currentlySelectedSlug: string | null = null
        craftableSlugsWithCategory.forEach((combinedSlug) => {
            const [categorySlug, craftableSlug] = combinedSlug.split('--')
            if (categorySlug == category.slug) {
                const currentlySelectedItem = getItemFromCategoryBySlug(
                    craftableSlug,
                    category,
                )
                if (currentlySelectedItem) {
                    currentlySelectedSlug = `${currentlySelectedItem.slug}--${currentlySelectedItem.unlocks}`
                }
            }
        })

        console.log(
            `Currently selected slug for ${category.displayLabel} is ${currentlySelectedSlug}`,
        )

        return (
            <div>
                <InlineSelect
                    label={category.displayLabel}
                    defaultValue={
                        currentlySelectedSlug ? currentlySelectedSlug : ''
                    }
                    options={category.craftables.map((craftable) => {
                        return {
                            value: `${craftable.slug}--${craftable.unlocks}`,
                            label: craftable.displayLabel,
                        }
                    })}
                    onChange={(newValue: string) => {
                        // Filter out any slugs that belong to this category and append the new value.
                        const [craftableSlug, categoryUnlockedSlug] =
                            newValue.split('--')

                        const newUnlockedSlugs =
                            unlockedSlugsWithUnlockingCategory
                                .filter((oldSlug: string) => {
                                    return !oldSlug.startsWith(category.slug)
                                })
                                .concat(
                                    categoryUnlockedSlug &&
                                        categoryUnlockedSlug != 'null' &&
                                        categoryUnlockedSlug != 'undefined'
                                        ? [
                                              `${category.slug}--${categoryUnlockedSlug}`,
                                          ]
                                        : [],
                                )

                        const categorySlugsRemoved =
                            unlockedSlugsWithUnlockingCategory
                                .filter((oldSlug: string) => {
                                    return !newUnlockedSlugs.includes(oldSlug)
                                })
                                .map((combinedSlug) => {
                                    const [
                                        parentCategorySlug,
                                        childCategorySlug,
                                    ] = combinedSlug.split('--')
                                    return childCategorySlug
                                })

                        const newSlugs = craftableSlugsWithCategory
                            .filter((oldSlug: string) => {
                                // Exclude any craftables belonging to this category. We're replacing them.
                                if (oldSlug.startsWith(category.slug)) {
                                    return false
                                }

                                // Exclude any craftables belonging to a category that is re-locked by changing this.
                                const [oldSlugCategory, oldSlugCraftable] =
                                    oldSlug.split('--')
                                if (
                                    categorySlugsRemoved.includes(
                                        oldSlugCategory,
                                    )
                                ) {
                                    return false
                                }

                                return true
                            })
                            .concat([`${category.slug}--${craftableSlug}`])

                        // Determine if any craftables were lost due to the loss of a category.
                        const craftableSlugsRemoved =
                            craftableSlugsWithCategory.filter(
                                (oldSlug: string) => {
                                    return (
                                        !newSlugs.includes(oldSlug) &&
                                        !oldSlug.startsWith(category.slug)
                                    )
                                },
                            )

                        let replacementCraftableSlugs: string[] = []
                        craftableSlugsRemoved.forEach((combinedSlug) => {
                            const [categorySlug, craftableSlug] =
                                combinedSlug.split('--')
                            const replacementPairings =
                                schemaData!.craftableSchemaWithCategories.oneOfCategories.filter(
                                    (pairing) => {
                                        return pairing.categories.filter(
                                            (targetCategory) => {
                                                return (
                                                    targetCategory.slug ==
                                                    categorySlug
                                                )
                                            },
                                        ).length
                                    },
                                )
                            replacementPairings.forEach((pairing) => {
                                let lostItem: CraftableItemReferenceType | null =
                                    null
                                pairing.categories
                                    .filter((targetCategory) => {
                                        return (
                                            targetCategory.slug == categorySlug
                                        )
                                    })
                                    .forEach((targetCategory) => {
                                        targetCategory.craftables
                                            .filter((targetCraftable) => {
                                                return (
                                                    targetCraftable.slug ==
                                                    craftableSlug
                                                )
                                            })
                                            .forEach((targetCraftable) => {
                                                lostItem = targetCraftable
                                            })
                                    })

                                pairing.categories
                                    .filter((targetCategory) => {
                                        return (
                                            !categorySlugsRemoved.includes(
                                                targetCategory.slug,
                                            ) &&
                                            newUnlockedSlugs
                                                .map((combinedSlug) => {
                                                    const [parent, child] =
                                                        combinedSlug.split('--')
                                                    return child
                                                })
                                                .includes(targetCategory.slug)
                                        )
                                    })
                                    .forEach((replacementCategory) => {
                                        if (replacementCategory && lostItem) {
                                            replacementCraftableSlugs =
                                                replacementCategory.craftables
                                                    .filter(
                                                        (targetCraftable) => {
                                                            return (
                                                                targetCraftable.displayLabel ==
                                                                lostItem!
                                                                    .displayLabel
                                                            )
                                                        },
                                                    )
                                                    .map((targetCraftable) => {
                                                        return `${replacementCategory.slug}--${targetCraftable.slug}`
                                                    })
                                        }
                                    })
                            })
                        })

                        const newAndReplacementSlugs = newSlugs.concat(
                            replacementCraftableSlugs,
                        )
                        setUnlockedSlugWithUnlockingCategory(newUnlockedSlugs)
                        setCraftableSlugsWithCategory(newAndReplacementSlugs)
                        updateTotalsBreakdown(newAndReplacementSlugs)
                    }}
                />

                {category.unlockedCategoryLabel &&
                    getRenderedUnlockableSelect(category)}
            </div>
        )
    }

    const forceLoading = false

    return (
        <PageContainer
            pageTitle="Writ Cost Calculator"
            metaTitle={constants.getFullPageTitle('Writ Cost Calculator')}
            metaDescription="How much does it cost to complete that ESO master crafting writ? Find out with this utility tool!"
        >
            <InlineSelect
                label={'Writ Type'}
                options={
                    writTypesData
                        ? writTypesData.writSchemas.map(
                              (schema: CraftableSchemaReferenceType) => {
                                  return {
                                      value: schema.slug,
                                      label: schema.label,
                                  }
                              },
                          )
                        : []
                }
                defaultValue={DEFAULT_WRIT_TYPE}
                onChange={(newValue: string) => {
                    console.log('Setting Dropdown Value', newValue)
                    if (currentWritType != newValue) {
                        setLastFetchedCurrentWritType('this-doesnt-exist')
                    }

                    setCurrentWritType(newValue)
                    setCraftableSlugsWithCategory([])
                    setUnlockedSlugWithUnlockingCategory([])
                    getSchema({
                        variables: { slug: newValue },
                    })
                }}
                loading={forceLoading || writTypesLoading}
            />

            {(writTypesLoading || schemaLoading || forceLoading) && (
                <div>
                    <InlineSelect
                        label={'Writ Type'}
                        options={[]}
                        onChange={(newValue: string) => {}}
                        loading={true}
                    />

                    <InlineSelect
                        label={'Writ Type'}
                        options={[]}
                        onChange={(newValue: string) => {}}
                        loading={true}
                    />

                    <InlineSelect
                        label={'Writ Type'}
                        options={[]}
                        onChange={(newValue: string) => {}}
                        loading={true}
                    />
                </div>
            )}

            {schemaData &&
                !forceLoading &&
                schemaData.craftableSchemaWithCategories.categories.map(
                    (category: CraftableCategoryWithItemsType) => {
                        return (
                            <div key={`root-categories-${category.slug}`}>
                                {getRenderedCategoryDropdown(category)}
                            </div>
                        )
                    },
                )}

            <FloatingButton>
                <div className="floating-button-label">Total Cost</div>

                <div
                    className={`floating-button-value ${
                        !costData ||
                        currentWritType != lastFetchedWritType ||
                        craftableSlugsWithCategory.length !=
                            getRequiredCategoryCount()
                            ? 'is-small'
                            : ''
                    } ${
                        costLoading || forceLoading
                            ? 'skeleton-loader-background'
                            : ''
                    }`}
                >
                    {!costLoading &&
                        !forceLoading &&
                        (costData &&
                        lastFetchedWritType == currentWritType &&
                        craftableSlugsWithCategory.length ==
                            getRequiredCategoryCount()
                            ? costData.craftableCostBreakdown.totalCost.toLocaleString()
                            : 'Complete the form to begin calculating writ cost...')}
                </div>
            </FloatingButton>

            {((costData &&
                lastFetchedWritType == currentWritType &&
                craftableSlugsWithCategory.length ==
                    getRequiredCategoryCount()) ||
                costLoading ||
                forceLoading) && (
                <div>
                    <div className="page-container-section-label">
                        Item Breakdown
                    </div>

                    {(costLoading || forceLoading) && (
                        <div>
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                            <TradableItemReferenceSkeleton />
                        </div>
                    )}

                    {costData &&
                        !forceLoading &&
                        currentWritType == 'provisioning-crafting-writ' && (
                            <LoadingSkeleton
                                error={false}
                                loading={false}
                                isInline={true}
                                title="Expect leftovers (and decimals)!"
                                message="The prices here reflect only the portion of ingredients used to fulfill writ requirements."
                            />
                        )}

                    {costData &&
                        !forceLoading &&
                        costData.craftableCostBreakdown.requirements.map(
                            (requirement) => {
                                return (
                                    <TradableItemReference
                                        key={requirement.item.slug}
                                        item={requirement.item}
                                        disableClick={true}
                                        itemDescriptor={`x${requirement.quantity}`}
                                    />
                                )
                            },
                        )}
                </div>
            )}

            <div className="floating-button-spacer" />
        </PageContainer>
    )
}

export default WritCostCalculator
