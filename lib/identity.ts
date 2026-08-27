import { createHmac } from "node:crypto"

const ANIMALS: { animal: string; emoji: string }[] = [
  { animal: "Alligator", emoji: "🐊" },
  { animal: "Anteater", emoji: "🐜" },
  { animal: "Armadillo", emoji: "🦔" },
  { animal: "Axolotl", emoji: "🦎" },
  { animal: "Badger", emoji: "🦡" },
  { animal: "Bat", emoji: "🦇" },
  { animal: "Beaver", emoji: "🦫" },
  { animal: "Buffalo", emoji: "🦬" },
  { animal: "Camel", emoji: "🐪" },
  { animal: "Capybara", emoji: "🐹" },
  { animal: "Chameleon", emoji: "🦎" },
  { animal: "Cheetah", emoji: "🐆" },
  { animal: "Chinchilla", emoji: "🐭" },
  { animal: "Chipmunk", emoji: "🐿️" },
  { animal: "Coyote", emoji: "🐺" },
  { animal: "Crow", emoji: "🐦‍⬛" },
  { animal: "Dingo", emoji: "🐕" },
  { animal: "Dolphin", emoji: "🐬" },
  { animal: "Duck", emoji: "🦆" },
  { animal: "Elephant", emoji: "🐘" },
  { animal: "Ferret", emoji: "🦦" },
  { animal: "Fox", emoji: "🦊" },
  { animal: "Frog", emoji: "🐸" },
  { animal: "Giraffe", emoji: "🦒" },
  { animal: "Goose", emoji: "🪿" },
  { animal: "Hedgehog", emoji: "🦔" },
  { animal: "Hippo", emoji: "🦛" },
  { animal: "Iguana", emoji: "🦎" },
  { animal: "Jackal", emoji: "🐺" },
  { animal: "Kangaroo", emoji: "🦘" },
  { animal: "Koala", emoji: "🐨" },
  { animal: "Lemur", emoji: "🐒" },
  { animal: "Leopard", emoji: "🐆" },
  { animal: "Llama", emoji: "🦙" },
  { animal: "Manatee", emoji: "🐋" },
  { animal: "Moose", emoji: "🫎" },
  { animal: "Narwhal", emoji: "🦄" },
  { animal: "Octopus", emoji: "🐙" },
  { animal: "Otter", emoji: "🦦" },
  { animal: "Owl", emoji: "🦉" },
  { animal: "Panda", emoji: "🐼" },
  { animal: "Penguin", emoji: "🐧" },
  { animal: "Platypus", emoji: "🦆" },
  { animal: "Quokka", emoji: "🦘" },
  { animal: "Rabbit", emoji: "🐇" },
  { animal: "Raccoon", emoji: "🦝" },
  { animal: "Rhino", emoji: "🦏" },
  { animal: "Seal", emoji: "🦭" },
  { animal: "Skunk", emoji: "🦨" },
  { animal: "Sloth", emoji: "🦥" },
  { animal: "Squirrel", emoji: "🐿️" },
  { animal: "Tiger", emoji: "🐯" },
  { animal: "Turtle", emoji: "🐢" },
  { animal: "Walrus", emoji: "🦭" },
  { animal: "Wolf", emoji: "🐺" },
  { animal: "Wolverine", emoji: "🦡" },
  { animal: "Wombat", emoji: "🐨" },
  { animal: "Zebra", emoji: "🦓" },
]

const HUES = [12, 28, 42, 165, 192, 214, 262, 292, 332, 348]

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "127.0.0.1"
  }
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "127.0.0.1"
}

export function identityFromIp(ip: string) {
  const secret = process.env.IDENTITY_SECRET || "publicpaste-dev-identity"
  const digest = createHmac("sha256", secret).update(ip).digest("hex")
  const animalIndex = Number.parseInt(digest.slice(0, 4), 16) % ANIMALS.length
  const hueIndex = Number.parseInt(digest.slice(4, 6), 16) % HUES.length
  const chosen = ANIMALS[animalIndex]!
  const hue = HUES[hueIndex]!
  return {
    name: `Anonymous ${chosen.animal}`,
    animal: chosen.animal,
    emoji: chosen.emoji,
    color: `hsl(${hue} 72% 46%)`,
  }
}
