import './FloatingButton.scss'

interface ContainerProps {
    children: React.ReactNode
    className?: string
}

const FlatButton: React.FC<ContainerProps> = ({ children, className = '' }) => {
    return <div className={`floating-button ${className}`}>{children}</div>
}

export default FlatButton
