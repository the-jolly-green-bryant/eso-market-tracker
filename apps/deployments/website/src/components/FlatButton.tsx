import { MouseEvent, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom'
import './FlatButton.scss'

interface ContainerProps {
  animationDuration?: number
  children: React.ReactNode
  className?: string
  to?: {
    pathname: string
    state: object
  }
  onButtonClick?: () => void
}

const FlatButton: React.FC<ContainerProps> = ({
  children,
  className = '',
  to = null,
  onButtonClick = null,
  animationDuration = 600,
}) => {
  const history = useHistory()
  const [isClicked, setIsClicked] = useState(false)
  const [diameter, setDiameter] = useState(0)
  const [clickPosition, setClickPosition] = useState([0, 0])
  const buttonRef = useRef<HTMLAnchorElement>(null)

  const handleClick = () => {
    if (to != null) {
      history.push({
        pathname: to.pathname,
        state: to.state ? to.state : {},
      })
    }

    if (onButtonClick != null) {
      onButtonClick()
    }
  }

  const playRippleEffect = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isClicked || !buttonRef.current) {
      return
    }

    setDiameter(
      Math.max(buttonRef.current.clientWidth, buttonRef.current.clientHeight)
    )
    setClickPosition([e.clientX, e.clientY])
    setIsClicked(true)

    setTimeout(() => {
      setIsClicked(false)
    }, animationDuration)

    setTimeout(() => {
      handleClick()
    }, animationDuration * 0.5)
  }

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    playRippleEffect(e)
  }

  return (
    <a className={`flat-button ${className}`} onClick={onClick} ref={buttonRef}>
      {children}

      {isClicked && buttonRef.current && (
        <div
          className="flat-button-ripple"
          style={{
            animationDuration: `${animationDuration}ms`,
            height: `${diameter}px`,
            width: `${diameter}px`,
            left: `${
              clickPosition[0] - (buttonRef.current.offsetLeft + diameter / 2)
            }px`,
            top: `${
              clickPosition[1] - (buttonRef.current.offsetTop + diameter / 2)
            }px`,
          }}
        />
      )}
    </a>
  )
}

export default FlatButton
