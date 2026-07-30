import { createContext, useContext, useEffect, useState } from 'react'

export const PLATFORMS = {
  'xbox-na': 'Xbox NA',
  'xbox-eu': 'Xbox EU',
  'ps-na': 'PlayStation NA',
  'ps-eu': 'PlayStation EU',
} as const

/** A supported ESO console megaserver. */
export type MarketPlatform = keyof typeof PLATFORMS

type PlatformContextValue = {
  platform: MarketPlatform
  setPlatform: (platform: MarketPlatform) => void
}

const PlatformContext = createContext<PlatformContextValue>({
  platform: 'xbox-na',
  setPlatform: () => undefined,
})

export const PlatformProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [platform, setPlatform] = useState<MarketPlatform>(() => {
    if (typeof window === 'undefined') return 'xbox-na'
    const saved = window.localStorage.getItem('eso-market-platform')
    return saved && saved in PLATFORMS ? (saved as MarketPlatform) : 'xbox-na'
  })

  useEffect(() => {
    window.localStorage.setItem('eso-market-platform', platform)
  }, [platform])

  return (
    <PlatformContext.Provider value={{ platform, setPlatform }}>
      {children}
    </PlatformContext.Provider>
  )
}

export const usePlatform = () => useContext(PlatformContext)
