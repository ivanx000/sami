import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases"

import Config from "@/config"

type PurchasesContextType = {
  isPremium: boolean
  isLoading: boolean
  offerings: PurchasesOfferings | null
  customerInfo: CustomerInfo | null
  /** Human-readable diagnostic when offerings can't be loaded. Surfaced on the paywall. */
  offeringsError: string | null
  refetchOfferings: () => Promise<void>
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
}

const PurchasesContext = createContext<PurchasesContextType | null>(null)

export const PurchasesProvider: FC<PropsWithChildren> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)
  const [offeringsError, setOfferingsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOfferings = useCallback(async () => {
    setOfferingsError(null)
    try {
      const [info, currentOfferings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ])
      setCustomerInfo(info)
      setOfferings(currentOfferings)

      // Diagnose the empty-offering case so it shows up on the paywall.
      if (!currentOfferings.current) {
        setOfferingsError(
          "RevenueCat returned no current offering. In the dashboard, make sure one offering is marked Current.",
        )
      } else if (currentOfferings.current.availablePackages.length === 0) {
        setOfferingsError(
          "Current offering has 0 packages. The App Store products in the offering aren't resolving — usually means the simulator has no Sandbox Apple ID, or the build doesn't include react-native-purchases yet.",
        )
      }
      console.log(
        "[RC] offerings loaded. all=",
        Object.keys(currentOfferings.all),
        "current=",
        currentOfferings.current?.identifier ?? "(none)",
        "packages=",
        currentOfferings.current?.availablePackages.map((p) => p.identifier) ?? [],
      )
    } catch (e: any) {
      const msg: string = e?.message ?? String(e)
      console.warn("[RC] init error:", msg, e)
      // RevenueCat returns OfferingsManager.Error 1 / "None of the products … could be fetched"
      // when StoreKit can't see the products. The two real causes on iOS:
      //   1. Products are in READY_TO_SUBMIT (not yet approved by Apple) — only resolves
      //      in Sandbox StoreKit (TestFlight, or device signed into a Sandbox Apple ID).
      //   2. No internet, wrong bundle ID, or signed paid-apps agreement is missing.
      if (msg.includes("could be fetched") || msg.includes("OfferingsManager")) {
        setOfferingsError(
          "App Store can't see your products. Most likely the subscriptions are still in " +
            "'Ready to Submit' in App Store Connect. To test before the first App Review approval, " +
            "install via TestFlight, OR on this device sign into a Sandbox Apple ID " +
            "(Settings → App Store → Sandbox Account) and relaunch the app.",
        )
      } else {
        setOfferingsError(`RevenueCat error: ${msg}`)
      }
    }
  }, [])

  useEffect(() => {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG)
    }

    const apiKey = Config.revenueCatApiKey
    // Loud, greppable startup line so it's obvious when the env var didn't make it into the bundle.
    console.log(
      "[RC] configure key length:",
      apiKey.length,
      "prefix:",
      apiKey.slice(0, 8) || "(empty)",
    )

    if (!apiKey) {
      setOfferingsError(
        "EXPO_PUBLIC_REVENUECAT_API_KEY is empty. Restart Metro after editing .env, or check eas.json env block for the active build profile.",
      )
      setIsLoading(false)
      return
    }

    try {
      // Guard against Fast Refresh re-running this effect, which produces the
      // "Purchases instance already set" warning otherwise.
      const isConfigured =
        typeof (Purchases as any).isConfigured === "function"
          ? (Purchases as any).isConfigured()
          : false
      if (!isConfigured) {
        Purchases.configure({ apiKey })
      }
    } catch (e: any) {
      console.warn("[RC] configure threw:", e)
      setOfferingsError(`Purchases.configure failed: ${e?.message ?? String(e)}`)
      setIsLoading(false)
      return
    }

    fetchOfferings().finally(() => setIsLoading(false))

    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info)
    })
  }, [fetchOfferings])

  const isPremium = useMemo(() => {
    if (!customerInfo) return false
    return !!customerInfo.entitlements.active[Config.revenueCatEntitlement]
  }, [customerInfo])

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg)
      setCustomerInfo(info)
      return !!info.entitlements.active[Config.revenueCatEntitlement]
    } catch (e: any) {
      if (!e.userCancelled) {
        console.warn("Purchase error:", e)
      }
      return false
    }
  }, [])

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases()
      setCustomerInfo(info)
      return !!info.entitlements.active[Config.revenueCatEntitlement]
    } catch (e) {
      console.warn("Restore error:", e)
      return false
    }
  }, [])

  const value = useMemo(
    () => ({
      isPremium,
      isLoading,
      offerings,
      customerInfo,
      offeringsError,
      refetchOfferings: fetchOfferings,
      purchasePackage,
      restorePurchases,
    }),
    [
      isPremium,
      isLoading,
      offerings,
      customerInfo,
      offeringsError,
      fetchOfferings,
      purchasePackage,
      restorePurchases,
    ],
  )

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>
}

export const usePurchases = () => {
  const ctx = useContext(PurchasesContext)
  if (!ctx) throw new Error("usePurchases must be used within a PurchasesProvider")
  return ctx
}
