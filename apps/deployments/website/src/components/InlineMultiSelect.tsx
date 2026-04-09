import { IonIcon } from '@ionic/react'
import { chevronExpandOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'

import './InlineSelect.scss'

type OptionType = {
    label: string
    value: string
    group: string
}

interface ContainerProps {
    label: string
    onChange: (newValues: string[]) => void
    defaultValues?: string[]
    options?: OptionType[]
    placeholder?: string
    loading?: boolean
    disabled?: boolean
}

const InlineSelect: React.FC<ContainerProps> = ({
    label,
    onChange,
    placeholder = 'Select...',
    options = [],
    loading = false,
    defaultValues = [],
    disabled = false,
}) => {
    const [values, setValues] = useState(defaultValues)

    const getOptionGroups = () => {
        let results: { [key: string]: OptionType[] } = {}
        options.forEach((a) => {
            results[a.group] = results[a.group] || []
            results[a.group].push(a)
        })

        let optionGroups: {
            label: string
            options: OptionType[]
        }[] = []
        Object.keys(results).forEach((key) => {
            optionGroups.push({
                label: key,
                options: results[key],
            })
        })

        return optionGroups
    }

    useEffect(() => {
        if (values) {
            onChange(values)
        }
    }, [])

    return (
        <div
            className={`inline-select ${
                loading ? 'skeleton-loader-background' : ''
            }`}
        >
            <div className={`inline-select-label`}>
                <div className={loading ? 'skeleton-loader-item' : ''}>
                    {label}
                </div>
            </div>

            {!loading && (
                <div className="inline-select-dropdown">
                    <select
                        value={values}
                        multiple={true}
                        onChange={(e) => {
                            const options = e.target.options
                            const newValues: string[] = []
                            for (var i = 0, l = options.length; i < l; i++) {
                                if (options[i].selected) {
                                    newValues.push(options[i].value)
                                }
                            }

                            setValues(newValues)
                            onChange(newValues)
                        }}
                        disabled={disabled}
                    >
                        <option value="" disabled selected>
                            {placeholder}
                        </option>

                        {getOptionGroups().map((optionGroup) => {
                            return (
                                <optgroup
                                    label={optionGroup.label}
                                    key={`${label} - ${optionGroup.label}`}
                                >
                                    {optionGroup.options.map((optionSet) => {
                                        return (
                                            <option
                                                value={optionSet.value}
                                                key={`${label} - ${optionSet.label} - ${optionSet.value}`}
                                            >
                                                {optionSet.label}
                                            </option>
                                        )
                                    })}
                                </optgroup>
                            )
                        })}
                    </select>

                    <div className="inline-select-dropdown-arrow">
                        <IonIcon icon={chevronExpandOutline}></IonIcon>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InlineSelect
