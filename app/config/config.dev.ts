/**
 * These are configuration settings for the dev environment.
 *
 * Do not include API secrets in this file or anywhere in your JS.
 *
 * https://reactnative.dev/docs/security#storing-sensitive-info
 */
export default {
  revenueCatApiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? "",
  revenueCatEntitlement: "Pro",
}
