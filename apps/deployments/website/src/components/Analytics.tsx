import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../analytics'

export default () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(
      `${location.pathname}${location.search}`,
      document.title || 'ESO Market Tracker'
    )
  }, [location.pathname, location.search])

  return null
}
