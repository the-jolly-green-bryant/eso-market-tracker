import { IonIcon } from '@ionic/react'
import { chevronExpandOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'

import './InlineSelect.scss'

interface ContainerProps {
  label: string
  onChange: (newValue: string) => void
  defaultValue?: string
  options?: {
    label: string
    value: string
  }[]
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
  defaultValue = '',
  disabled = false,
}) => {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (value) {
      onChange(value)
    }
  }, [])

  return (
    <div
      className={`inline-select ${loading ? 'skeleton-loader-background' : ''}`}
    >
      <div className={`inline-select-label`}>
        <div className={loading ? 'skeleton-loader-item' : ''}>{label}</div>
      </div>

      {!loading && (
        <div className="inline-select-dropdown">
          <select
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              onChange(e.target.value)
            }}
            disabled={disabled}
          >
            <option value="" disabled selected>
              {placeholder}
            </option>

            {options.map((optionSet) => (
              <option
                value={optionSet.value}
                key={`${label} - ${optionSet.label} - ${optionSet.value}`}
              >
                {optionSet.label}
              </option>
            ))}
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
