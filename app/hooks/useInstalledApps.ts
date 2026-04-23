import { useEffect, useState } from "react"
import { Linking } from "react-native"

import { CURATED_APPS, CuratedApp } from "@/data/curatedApps"

export function useInstalledApps(): { apps: CuratedApp[]; loading: boolean } {
  const [apps, setApps] = useState<CuratedApp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const results = await Promise.all(
        CURATED_APPS.map(async (app) => {
          try {
            const installed = await Linking.canOpenURL(`${app.urlScheme}://`)
            return installed ? app : null
          } catch {
            return null
          }
        }),
      )

      if (!cancelled) {
        const installed = results.filter((a): a is CuratedApp => a !== null)
        // Fall back to full list if nothing detected (e.g. simulator or missing plist entry)
        setApps(installed.length > 0 ? installed : CURATED_APPS)
        setLoading(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  return { apps, loading }
}
