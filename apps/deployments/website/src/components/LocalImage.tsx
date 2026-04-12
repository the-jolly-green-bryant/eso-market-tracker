import { useState } from 'react'

import PlaceholderImage from '../components/PlaceholderImage'
import './LocalImage.scss'

interface ContainerProps {
  imageUrl: string
}

const LocalImage: React.FC<ContainerProps> = ({ imageUrl }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const onLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div className="local-image">
      {!imageLoaded && <PlaceholderImage />}

      <img src={imageUrl} onLoad={onLoad} />
    </div>
  )
}

export default LocalImage
