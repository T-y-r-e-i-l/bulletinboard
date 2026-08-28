export const island = {
  cream: "#FFFBE7",
  eggshell: "#F7F8E6",
  ink: "#8A7B66",
  mute: "#A89478",
  coral: "#E59266",
  yellow: "#F7CD67",
  grass: "#7EC85A",
  wood: "#C9A06A",
  woodDark: "#8B5A2B",
  sky: "#87D6F0",
  phone: {
    select: "#889DF0",
    draw: "#E59266",
    text: "#F7CD67",
    sticky: "#F8A6B2",
    url: "#82D5BB",
    image: "#B77DEE",
    audio: "#8AC68A",
  },
} as const

export const chromeShadow = "shadow-[0_8px_0_rgba(90,70,40,0.14)]"
export const chromePill = `rounded-full bg-[#FFFBE7] ${chromeShadow}`
export const chromeCard = `rounded-[32px] bg-[#FFFBE7] ${chromeShadow}`
export const chromePhone = `rounded-[36px] bg-[#FFFBE7] ${chromeShadow}`
export const chromeNameTag =
  "inline-flex items-center rounded-full bg-[#E59266] px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-[#FFFBE7]"
export const chromeSquircle = "rounded-[37%]"
export const selectedRing = "ring-[5px] ring-[#F7CD67] ring-offset-4 ring-offset-[#7EC85A]"
