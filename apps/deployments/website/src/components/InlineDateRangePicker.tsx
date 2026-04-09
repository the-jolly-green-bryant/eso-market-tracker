import { IonIcon } from '@ionic/react'
import { chevronExpandOutline } from 'ionicons/icons'
import { useEffect, useState } from 'react'
import 'react-calendar/dist/Calendar.css'
import DateRangePicker from '@wojtekmaj/react-daterange-picker'
import '@wojtekmaj/react-daterange-picker/dist/DateRangePicker.css'

import './InlineSelect.scss'

type DateValuePiece = Date | null
type DateValue = DateValuePiece | [DateValuePiece, DateValuePiece]

interface ContainerProps {
    label: string
    startDate: string
    endDate: string
    onChange: (newStartDate: string, newEndDate: string) => void
    loading?: boolean
    disabled?: boolean
}

const InlineDateRangePicker: React.FC<ContainerProps> = ({
    label,
    startDate,
    endDate,
    onChange,
    loading = false,
    disabled = false,
}) => {
    const [value, setValue] = useState<DateValue>([
        new Date(startDate),
        new Date(endDate),
    ])

    const [calendarIsOpen, setCalendarIsOpen] = useState(false)

    // useEffect(() => {
    //     if (values) {
    //         onChange(values)
    //     }
    // }, [])

    const formatDate = (date: Date) => {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear()

        if (month.length < 2) month = '0' + month
        if (day.length < 2) day = '0' + day

        return [year, month, day].join('-')
    }

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
                <div className="inline-select-daterange-picker">
                    <DateRangePicker
                        clearIcon={null}
                        calendarIcon={null}
                        onChange={(newDateRange) => {
                            onChange(
                                formatDate(
                                    newDateRange
                                        ? (
                                              newDateRange as [
                                                  DateValuePiece,
                                                  DateValuePiece,
                                              ]
                                          )[0]!
                                        : new Date(startDate),
                                ),
                                formatDate(
                                    newDateRange
                                        ? (
                                              newDateRange as [
                                                  DateValuePiece,
                                                  DateValuePiece,
                                              ]
                                          )[1]!
                                        : new Date(endDate),
                                ),
                            )
                            setValue(newDateRange)
                        }}
                        onCalendarOpen={() => {
                            setCalendarIsOpen(true)
                        }}
                        onCalendarClose={() => {
                            setCalendarIsOpen(false)
                        }}
                        showLeadingZeros={true}
                        value={value}
                    />

                    {/*<div className="inline-select-dropdown-arrow">
                        <IonIcon icon={chevronExpandOutline}></IonIcon>
                    </div>*/}

                    {calendarIsOpen && (
                        <div className="inline-select-daterange-picker-modal-overlay" />
                    )}
                </div>
            )}
        </div>
    )
}

export default InlineDateRangePicker
