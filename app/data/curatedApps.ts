export interface CuratedApp {
  id: string
  name: string
  initials: string
  brandColor: string
  urlScheme: string
  category: string
}

export const CURATED_APPS: CuratedApp[] = [
  // Social
  { id: "instagram", name: "Instagram", initials: "IG", brandColor: "#E1306C", urlScheme: "instagram", category: "Social" },
  { id: "tiktok", name: "TikTok", initials: "TT", brandColor: "#010101", urlScheme: "tiktok", category: "Social" },
  { id: "twitter", name: "X (Twitter)", initials: "X", brandColor: "#000000", urlScheme: "twitter", category: "Social" },
  { id: "facebook", name: "Facebook", initials: "FB", brandColor: "#1877F2", urlScheme: "fb", category: "Social" },
  { id: "snapchat", name: "Snapchat", initials: "SC", brandColor: "#FFCC00", urlScheme: "snapchat", category: "Social" },
  { id: "pinterest", name: "Pinterest", initials: "PT", brandColor: "#E60023", urlScheme: "pinterest", category: "Social" },
  { id: "linkedin", name: "LinkedIn", initials: "LI", brandColor: "#0A66C2", urlScheme: "linkedin", category: "Social" },
  { id: "tumblr", name: "Tumblr", initials: "TB", brandColor: "#35465C", urlScheme: "tumblr", category: "Social" },
  { id: "bereal", name: "BeReal", initials: "BR", brandColor: "#000000", urlScheme: "bereal", category: "Social" },
  { id: "threads", name: "Threads", initials: "TH", brandColor: "#000000", urlScheme: "barcelona", category: "Social" },
  // Video
  { id: "youtube", name: "YouTube", initials: "YT", brandColor: "#FF0000", urlScheme: "youtube", category: "Video" },
  { id: "twitch", name: "Twitch", initials: "TV", brandColor: "#9146FF", urlScheme: "twitch", category: "Video" },
  { id: "netflix", name: "Netflix", initials: "NF", brandColor: "#E50914", urlScheme: "nflx", category: "Video" },
  { id: "hulu", name: "Hulu", initials: "HU", brandColor: "#1CE783", urlScheme: "hulu", category: "Video" },
  { id: "disneyplus", name: "Disney+", initials: "D+", brandColor: "#0063E5", urlScheme: "disneyplus", category: "Video" },
  { id: "primevideo", name: "Prime Video", initials: "PV", brandColor: "#00A8E0", urlScheme: "primevideo", category: "Video" },
  { id: "hbomax", name: "Max (HBO)", initials: "MX", brandColor: "#702FFF", urlScheme: "max", category: "Video" },
  { id: "appletv", name: "Apple TV+", initials: "TV", brandColor: "#555555", urlScheme: "videos", category: "Video" },
  // Messaging
  { id: "whatsapp", name: "WhatsApp", initials: "WA", brandColor: "#25D366", urlScheme: "whatsapp", category: "Messaging" },
  { id: "telegram", name: "Telegram", initials: "TG", brandColor: "#2AABEE", urlScheme: "tg", category: "Messaging" },
  { id: "discord", name: "Discord", initials: "DC", brandColor: "#5865F2", urlScheme: "discord", category: "Messaging" },
  { id: "messenger", name: "Messenger", initials: "MS", brandColor: "#0099FF", urlScheme: "fb-messenger", category: "Messaging" },
  { id: "signal", name: "Signal", initials: "SG", brandColor: "#3A76F0", urlScheme: "sgnl", category: "Messaging" },
  { id: "slack", name: "Slack", initials: "SL", brandColor: "#4A154B", urlScheme: "slack", category: "Messaging" },
  // Gaming
  { id: "roblox", name: "Roblox", initials: "RX", brandColor: "#E8281A", urlScheme: "roblox", category: "Gaming" },
  { id: "minecraft", name: "Minecraft", initials: "MC", brandColor: "#62B47A", urlScheme: "minecraft", category: "Gaming" },
  { id: "clashofclans", name: "Clash of Clans", initials: "CC", brandColor: "#1B8CE3", urlScheme: "clashofclans", category: "Gaming" },
  { id: "candycrush", name: "Candy Crush", initials: "CC", brandColor: "#F5851F", urlScheme: "king-candycrushsaga", category: "Gaming" },
  { id: "chess", name: "Chess.com", initials: "CH", brandColor: "#7FA650", urlScheme: "chess", category: "Gaming" },
  // Shopping
  { id: "amazon", name: "Amazon", initials: "AM", brandColor: "#FF9900", urlScheme: "amazon", category: "Shopping" },
  { id: "ebay", name: "eBay", initials: "EB", brandColor: "#E43137", urlScheme: "ebay", category: "Shopping" },
  { id: "shein", name: "SHEIN", initials: "SH", brandColor: "#000000", urlScheme: "shein", category: "Shopping" },
  { id: "etsy", name: "Etsy", initials: "ET", brandColor: "#F1641E", urlScheme: "etsy", category: "Shopping" },
  // Music
  { id: "spotify", name: "Spotify", initials: "SP", brandColor: "#1DB954", urlScheme: "spotify", category: "Music" },
  { id: "applemusic", name: "Apple Music", initials: "AM", brandColor: "#FA233B", urlScheme: "music", category: "Music" },
  { id: "soundcloud", name: "SoundCloud", initials: "SC", brandColor: "#FF5500", urlScheme: "soundcloud", category: "Music" },
  // News & Reading
  { id: "reddit", name: "Reddit", initials: "RD", brandColor: "#FF4500", urlScheme: "reddit", category: "News" },
  { id: "applenews", name: "Apple News", initials: "AN", brandColor: "#FF3B30", urlScheme: "applenews", category: "News" },
  { id: "flipboard", name: "Flipboard", initials: "FL", brandColor: "#E12828", urlScheme: "flipboard", category: "News" },
  { id: "medium", name: "Medium", initials: "MD", brandColor: "#000000", urlScheme: "medium", category: "News" },
  // Dating
  { id: "tinder", name: "Tinder", initials: "TN", brandColor: "#FE3C72", urlScheme: "tinder", category: "Dating" },
  { id: "bumble", name: "Bumble", initials: "BM", brandColor: "#F8C200", urlScheme: "bumble", category: "Dating" },
  { id: "hinge", name: "Hinge", initials: "HG", brandColor: "#D5534A", urlScheme: "hinge", category: "Dating" },
  // Browser
  { id: "safari", name: "Safari", initials: "SF", brandColor: "#006CFF", urlScheme: "x-web-search", category: "Browser" },
  { id: "chrome", name: "Chrome", initials: "CR", brandColor: "#4285F4", urlScheme: "googlechrome", category: "Browser" },
  // Food
  { id: "doordash", name: "DoorDash", initials: "DD", brandColor: "#FF3008", urlScheme: "doordash", category: "Food" },
  { id: "ubereats", name: "Uber Eats", initials: "UE", brandColor: "#06C167", urlScheme: "ubereats", category: "Food" },
]

export function filterCuratedApps(apps: CuratedApp[], query: string): CuratedApp[] {
  const q = query.trim().toLowerCase()
  if (!q) return apps
  return apps.filter((app) => app.name.toLowerCase().includes(q))
}
