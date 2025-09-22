import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== 'undefined'
      ? window.innerWidth < MOBILE_BREAKPOINT
      : false

  const [isMobile, setIsMobile] = React.useState(getIsMobile)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // For modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
    } else {
      // For older browsers
      // @ts-ignore
      mql.addListener(onChange)
    }
    setIsMobile(mql.matches)
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange)
      } else {
        // @ts-ignore
        mql.removeListener(onChange)
      }
    }
  }, [])

  return isMobile
}
