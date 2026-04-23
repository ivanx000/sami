export interface CuratedApp {
  id: string
  name: string
  icon: string
  category: string
}

export const CURATED_APPS: CuratedApp[] = [
  // Social
  { id: "instagram", name: "Instagram", icon: "📷", category: "Social" },
  { id: "tiktok", name: "TikTok", icon: "🎵", category: "Social" },
  { id: "twitter", name: "X (Twitter)", icon: "🐦", category: "Social" },
  { id: "facebook", name: "Facebook", icon: "👥", category: "Social" },
  { id: "snapchat", name: "Snapchat", icon: "👻", category: "Social" },
  { id: "pinterest", name: "Pinterest", icon: "📌", category: "Social" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", category: "Social" },
  { id: "tumblr", name: "Tumblr", icon: "✏️", category: "Social" },
  { id: "bereal", name: "BeReal", icon: "📸", category: "Social" },
  { id: "threads", name: "Threads", icon: "🧵", category: "Social" },
  // Video
  { id: "youtube", name: "YouTube", icon: "▶️", category: "Video" },
  { id: "twitch", name: "Twitch", icon: "🟣", category: "Video" },
  { id: "netflix", name: "Netflix", icon: "🎬", category: "Video" },
  { id: "hulu", name: "Hulu", icon: "📺", category: "Video" },
  { id: "disneyplus", name: "Disney+", icon: "🏰", category: "Video" },
  { id: "primevideo", name: "Prime Video", icon: "🎥", category: "Video" },
  { id: "hbomax", name: "Max (HBO)", icon: "🎞️", category: "Video" },
  { id: "appletv", name: "Apple TV+", icon: "🍎", category: "Video" },
  // Messaging
  { id: "whatsapp", name: "WhatsApp", icon: "💬", category: "Messaging" },
  { id: "telegram", name: "Telegram", icon: "✈️", category: "Messaging" },
  { id: "discord", name: "Discord", icon: "🎮", category: "Messaging" },
  { id: "imessage", name: "Messages", icon: "💭", category: "Messaging" },
  { id: "messenger", name: "Messenger", icon: "⚡", category: "Messaging" },
  { id: "signal", name: "Signal", icon: "🔒", category: "Messaging" },
  { id: "slack", name: "Slack", icon: "🔷", category: "Messaging" },
  // Gaming
  { id: "roblox", name: "Roblox", icon: "🧱", category: "Gaming" },
  { id: "fortnite", name: "Fortnite", icon: "🎯", category: "Gaming" },
  { id: "minecraft", name: "Minecraft", icon: "⛏️", category: "Gaming" },
  { id: "clashofclans", name: "Clash of Clans", icon: "⚔️", category: "Gaming" },
  { id: "candycrush", name: "Candy Crush", icon: "🍬", category: "Gaming" },
  { id: "wordle", name: "Wordle", icon: "🟩", category: "Gaming" },
  { id: "chess", name: "Chess.com", icon: "♟️", category: "Gaming" },
  // Shopping
  { id: "amazon", name: "Amazon", icon: "📦", category: "Shopping" },
  { id: "ebay", name: "eBay", icon: "🛍️", category: "Shopping" },
  { id: "shein", name: "SHEIN", icon: "👗", category: "Shopping" },
  { id: "etsy", name: "Etsy", icon: "🎀", category: "Shopping" },
  // Music
  { id: "spotify", name: "Spotify", icon: "🎧", category: "Music" },
  { id: "applemusic", name: "Apple Music", icon: "🎶", category: "Music" },
  { id: "soundcloud", name: "SoundCloud", icon: "☁️", category: "Music" },
  // News & Reading
  { id: "reddit", name: "Reddit", icon: "🤖", category: "News" },
  { id: "applenews", name: "Apple News", icon: "📰", category: "News" },
  { id: "flipboard", name: "Flipboard", icon: "📖", category: "News" },
  { id: "medium", name: "Medium", icon: "✍️", category: "News" },
  // Dating
  { id: "tinder", name: "Tinder", icon: "🔥", category: "Dating" },
  { id: "bumble", name: "Bumble", icon: "🐝", category: "Dating" },
  { id: "hinge", name: "Hinge", icon: "💛", category: "Dating" },
  // Other
  { id: "safari", name: "Safari", icon: "🧭", category: "Browser" },
  { id: "chrome", name: "Chrome", icon: "🌐", category: "Browser" },
  { id: "doordash", name: "DoorDash", icon: "🚗", category: "Food" },
  { id: "ubereats", name: "Uber Eats", icon: "🍔", category: "Food" },
]

export function filterCuratedApps(query: string): CuratedApp[] {
  const q = query.trim().toLowerCase()
  if (!q) return CURATED_APPS
  return CURATED_APPS.filter((app) => app.name.toLowerCase().includes(q))
}
