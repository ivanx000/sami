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
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
}

const PurchasesContext = createContext<PurchasesContextType | null>(null)

export const PurchasesProvider: FC<PropsWithChildren> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG)
    }

    Purchases.configure({ apiKey: Config.revenueCatApiKey })

    const loadInitialData = async () => {
      try {
        const [info, currentOfferings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ])
        setCustomerInfo(info)
        setOfferings(currentOfferings)
      } catch (e) {
        console.warn("RevenueCat init error:", e)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()

    Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info)
    })
  }, [])

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
    () => ({ isPremium, isLoading, offerings, customerInfo, purchasePackage, restorePurchases }),
    [isPremium, isLoading, offerings, customerInfo, purchasePackage, restorePurchases],
  )

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>
}

export const usePurchases = () => {
  const ctx = useContext(PurchasesContext)
  if (!ctx) throw new Error("usePurchases must be used within a PurchasesProvider")
  return ctx
}
