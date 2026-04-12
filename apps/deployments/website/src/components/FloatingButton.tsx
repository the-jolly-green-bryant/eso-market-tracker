import './FloatingButton.scss'

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

const FlatButton: React.FC<ContainerProps> = ({ children, className = '' }) => (
  <div className={`floating-button ${className}`}>{children}</div>
)

export default FlatButton
