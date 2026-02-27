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
  {
    id: "https://api.dicebear.com/7.x/bottts/svg?seed=Samurai",
    name: "Samurai",
  },
  { id: "https://api.dicebear.com/7.x/bottts/svg?seed=Hacker", name: "Hacker" },
  { id: "https://api.dicebear.com/7.x/lorelei/svg?seed=Pink", name: "Pink" },
  { id: "https://api.dicebear.com/7.x/lorelei/svg?seed=Blue", name: "Blue" },
  {
    id: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ninja",
    name: "Ninja",
  },
  {
    id: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gamer",
    name: "Gamer",
  },
];
