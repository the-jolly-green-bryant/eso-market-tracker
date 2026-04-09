import { IonIcon } from '@ionic/react'
import { closeOutline } from 'ionicons/icons'
import { useEffect, useState, useRef } from 'react'
import './ModalToggle.scss'

interface ContainerProps {
    toggle: React.ReactNode
    children: React.ReactNode
    title: string
}

const ReferenceBlock: React.FC<ContainerProps> = ({
    toggle,
    children,
    title,
}) => {
    const [isActive, setIsActive] = useState(false)

    return (
        <div className="modal-toggle-container">
            <div
                className="modal-toggle-activator"
                onClick={() => {
                    setIsActive(true)
                }}
            >
                {toggle}
            </div>

            {isActive && (
                <div className="modal-toggle-modal">
                    <div className="modal-toggle-modal-header">
                        <div className="modal-toggle-modal-header-title">
                            {title}
                        </div>

                        <div
                            className="modal-toggle-modal-header-close"
                            onClick={() => {
                                setIsActive(false)
                            }}
                        >
                            <IonIcon icon={closeOutline}></IonIcon>
                        </div>
                    </div>

                    <div className="modal-toggle-modal-content">{children}</div>
                </div>
            )}

            {isActive && (
                <div
                    className="modal-toggle-modal-overlay"
                    onClick={() => {
                        setIsActive(false)
                    }}
                />
            )}
        </div>
    )
}

export default ReferenceBlock
