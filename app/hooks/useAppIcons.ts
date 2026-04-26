import { useEffect, useState } from "react"

import { CuratedApp } from "@/data/curatedApps"

const iconCache = new Map<string, string>()

export function useAppIcons(apps: CuratedApp[]): Record<string, string> {
  const [icons, setIcons] = useState<Record<string, string>>(() => {
    const cached: Record<string, string> = {}
    apps.forEach((a) => {
      const url = iconCache.get(a.id)
      if (url) cached[a.id] = url
    })
    return cached
  })

  useEffect(() => {
    const uncached = apps.filter((a) => !iconCache.has(a.id))
    if (uncached.length === 0) return

    Promise.all(
      uncached.map(async (app) => {
        try {
          const res = await fetch(
            `https://itunes.apple.com/lookup?bundleId=${app.bundleId}&entity=software`,
          )
          const json = await res.json()
          const raw: string | undefined = json.results?.[0]?.artworkUrl100
          // Request PNG to preserve transparency (avoids white JPEG background)
          const url = raw?.replace(/\d+x\d+bb\.jpg$/, "100x100bb.png")
          if (url) iconCache.set(app.id, url)
        } catch {
          // leave uncached, fallback to initials
        }
      }),
    ).then(() => {
      const result: Record<string, string> = {}
      apps.forEach((a) => {
        const url = iconCache.get(a.id)
        if (url) result[a.id] = url
      })
      setIcons(result)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return icons
}
