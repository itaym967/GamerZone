export interface ProfileFormData {
  bio: string;
  games: string[];
  hiddenTags: { [key: string]: string };
  tag: string;
  username: string;
}

export interface Gamertag {
  platform: string;
  tag: string;
}

export interface ProfileStats {
  friendsCount: number;
  gamesCount: number;
  memberSince: string | null;
  swapsApproved: number;
  swapsReceived: number;
  swapsSent: number;
}

export type ProfileTab = "edit" | "gamertags" | "stats" | "account";

export const PLATFORMS = [
  "Valorant",
  "Fortnite",
  "Minecraft",
  "CS2",
  "Apex Legends",
  "League of Legends",
  "FIFA 24",
  "Call of Duty",
  "Roblox",
  "GTA V",
  "Overwatch 2",
  "Rocket League",
  "Rainbow Six Siege",
  "Discord",
  "Steam",
];

export const AVATARS = [
  { id: "/avatars/samurai.png", name: "Samurai" },
  { id: "/avatars/hacker.png", name: "Hacker" },
  { id: "/avatars/girl_pink.png", name: "Pink" },
  { id: "/avatars/girl_blue.png", name: "Blue" },
  { id: "/avatars/ninja.png", name: "Ninja" },
  { id: "/avatars/gamer.png", name: "Gamer" },
];
