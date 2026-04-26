export interface CuratedApp {
  id: string
  name: string
  initials: string
  brandColor: string
  urlScheme: string
  category: string
  bundleId: string
}

export const CURATED_APPS: CuratedApp[] = [
  // Social
  { id: "instagram", name: "Instagram", initials: "IG", brandColor: "#E1306C", urlScheme: "instagram", category: "Social", bundleId: "com.burbn.instagram" },
  { id: "tiktok", name: "TikTok", initials: "TT", brandColor: "#010101", urlScheme: "tiktok", category: "Social", bundleId: "com.zhiliaoapp.musically" },
  { id: "twitter", name: "X (Twitter)", initials: "X", brandColor: "#000000", urlScheme: "twitter", category: "Social", bundleId: "com.atebits.Tweetie2" },
  { id: "facebook", name: "Facebook", initials: "FB", brandColor: "#1877F2", urlScheme: "fb", category: "Social", bundleId: "com.facebook.Facebook" },
  { id: "snapchat", name: "Snapchat", initials: "SC", brandColor: "#FFCC00", urlScheme: "snapchat", category: "Social", bundleId: "com.toyopagroup.picaboo" },
  { id: "pinterest", name: "Pinterest", initials: "PT", brandColor: "#E60023", urlScheme: "pinterest", category: "Social", bundleId: "pinterest" },
  { id: "linkedin", name: "LinkedIn", initials: "LI", brandColor: "#0A66C2", urlScheme: "linkedin", category: "Social", bundleId: "com.linkedin.LinkedIn" },
  { id: "tumblr", name: "Tumblr", initials: "TB", brandColor: "#35465C", urlScheme: "tumblr", category: "Social", bundleId: "com.tumblr.tumblr" },
  { id: "bereal", name: "BeReal", initials: "BR", brandColor: "#000000", urlScheme: "bereal", category: "Social", bundleId: "AlexisBarreyat.BeReal" },
  { id: "threads", name: "Threads", initials: "TH", brandColor: "#000000", urlScheme: "barcelona", category: "Social", bundleId: "com.burbn.barcelona" },
  // Video
  { id: "youtube", name: "YouTube", initials: "YT", brandColor: "#FF0000", urlScheme: "youtube", category: "Video", bundleId: "com.google.ios.youtube" },
  { id: "twitch", name: "Twitch", initials: "TV", brandColor: "#9146FF", urlScheme: "twitch", category: "Video", bundleId: "tv.twitch" },
  { id: "netflix", name: "Netflix", initials: "NF", brandColor: "#E50914", urlScheme: "nflx", category: "Video", bundleId: "com.netflix.Netflix" },
  { id: "hulu", name: "Hulu", initials: "HU", brandColor: "#1CE783", urlScheme: "hulu", category: "Video", bundleId: "com.hulu.plus" },
  { id: "disneyplus", name: "Disney+", initials: "D+", brandColor: "#0063E5", urlScheme: "disneyplus", category: "Video", bundleId: "com.disney.disneyplus" },
  { id: "primevideo", name: "Prime Video", initials: "PV", brandColor: "#00A8E0", urlScheme: "primevideo", category: "Video", bundleId: "com.amazon.aiv.AIVApp" },
  { id: "hbomax", name: "Max (HBO)", initials: "MX", brandColor: "#702FFF", urlScheme: "max", category: "Video", bundleId: "com.hbo.hbonow" },
  { id: "appletv", name: "Apple TV+", initials: "TV", brandColor: "#555555", urlScheme: "videos", category: "Video", bundleId: "com.apple.tv" },
  // Messaging
  { id: "whatsapp", name: "WhatsApp", initials: "WA", brandColor: "#25D366", urlScheme: "whatsapp", category: "Messaging", bundleId: "net.whatsapp.WhatsApp" },
  { id: "telegram", name: "Telegram", initials: "TG", brandColor: "#2AABEE", urlScheme: "tg", category: "Messaging", bundleId: "ph.telegra.Telegraph" },
  { id: "discord", name: "Discord", initials: "DC", brandColor: "#5865F2", urlScheme: "discord", category: "Messaging", bundleId: "com.hammerandchisel.discord" },
  { id: "messenger", name: "Messenger", initials: "MS", brandColor: "#0099FF", urlScheme: "fb-messenger", category: "Messaging", bundleId: "com.facebook.Messenger" },
  { id: "signal", name: "Signal", initials: "SG", brandColor: "#3A76F0", urlScheme: "sgnl", category: "Messaging", bundleId: "org.whispersystems.signal" },
  { id: "slack", name: "Slack", initials: "SL", brandColor: "#4A154B", urlScheme: "slack", category: "Messaging", bundleId: "com.tinyspeck.chatlyio" },
  // Gaming
  { id: "roblox", name: "Roblox", initials: "RX", brandColor: "#E8281A", urlScheme: "roblox", category: "Gaming", bundleId: "com.roblox.robloxmobile" },
  { id: "minecraft", name: "Minecraft", initials: "MC", brandColor: "#62B47A", urlScheme: "minecraft", category: "Gaming", bundleId: "com.mojang.minecraftpe" },
  { id: "clashofclans", name: "Clash of Clans", initials: "CC", brandColor: "#1B8CE3", urlScheme: "clashofclans", category: "Gaming", bundleId: "com.supercell.magic" },
  { id: "candycrush", name: "Candy Crush", initials: "CC", brandColor: "#F5851F", urlScheme: "king-candycrushsaga", category: "Gaming", bundleId: "com.king.candycrushsaga" },
  { id: "chess", name: "Chess.com", initials: "CH", brandColor: "#7FA650", urlScheme: "chess", category: "Gaming", bundleId: "com.chess.chesscom" },
  // Shopping
  { id: "amazon", name: "Amazon", initials: "AM", brandColor: "#FF9900", urlScheme: "amazon", category: "Shopping", bundleId: "com.amazon.Amazon" },
  { id: "ebay", name: "eBay", initials: "EB", brandColor: "#E43137", urlScheme: "ebay", category: "Shopping", bundleId: "com.ebay.iphone.shopping" },
  { id: "shein", name: "SHEIN", initials: "SH", brandColor: "#000000", urlScheme: "shein", category: "Shopping", bundleId: "com.shein.sheingroup" },
  { id: "etsy", name: "Etsy", initials: "ET", brandColor: "#F1641E", urlScheme: "etsy", category: "Shopping", bundleId: "com.etsy.iphone" },
  // Music
  { id: "spotify", name: "Spotify", initials: "SP", brandColor: "#1DB954", urlScheme: "spotify", category: "Music", bundleId: "com.spotify.client" },
  { id: "applemusic", name: "Apple Music", initials: "AM", brandColor: "#FA233B", urlScheme: "music", category: "Music", bundleId: "com.apple.Music" },
  { id: "soundcloud", name: "SoundCloud", initials: "SC", brandColor: "#FF5500", urlScheme: "soundcloud", category: "Music", bundleId: "com.soundcloud.TouchApp" },
  // News & Reading
  { id: "reddit", name: "Reddit", initials: "RD", brandColor: "#FF4500", urlScheme: "reddit", category: "News", bundleId: "com.reddit.Reddit" },
  { id: "applenews", name: "Apple News", initials: "AN", brandColor: "#FF3B30", urlScheme: "applenews", category: "News", bundleId: "com.apple.news" },
  { id: "flipboard", name: "Flipboard", initials: "FL", brandColor: "#E12828", urlScheme: "flipboard", category: "News", bundleId: "com.flipboard.flipboard-iphone" },
  { id: "medium", name: "Medium", initials: "MD", brandColor: "#000000", urlScheme: "medium", category: "News", bundleId: "com.medium.Medium" },
  // Dating
  { id: "tinder", name: "Tinder", initials: "TN", brandColor: "#FE3C72", urlScheme: "tinder", category: "Dating", bundleId: "com.cardify.tinder" },
  { id: "bumble", name: "Bumble", initials: "BM", brandColor: "#F8C200", urlScheme: "bumble", category: "Dating", bundleId: "com.bumble.app" },
  { id: "hinge", name: "Hinge", initials: "HG", brandColor: "#D5534A", urlScheme: "hinge", category: "Dating", bundleId: "co.hinge.app" },
  // Browser
  { id: "safari", name: "Safari", initials: "SF", brandColor: "#006CFF", urlScheme: "x-web-search", category: "Browser", bundleId: "com.apple.mobilesafari" },
  { id: "chrome", name: "Chrome", initials: "CR", brandColor: "#4285F4", urlScheme: "googlechrome", category: "Browser", bundleId: "com.google.chrome.ios" },
  // Food
  { id: "doordash", name: "DoorDash", initials: "DD", brandColor: "#FF3008", urlScheme: "doordash", category: "Food", bundleId: "doordash.DoorDash" },
  { id: "ubereats", name: "Uber Eats", initials: "UE", brandColor: "#06C167", urlScheme: "ubereats", category: "Food", bundleId: "com.ubercorp.UberEats" },
]

export function filterCuratedApps(apps: CuratedApp[], query: string): CuratedApp[] {
  const q = query.trim().toLowerCase()
  if (!q) return apps
  return apps.filter((app) => app.name.toLowerCase().includes(q))
}
