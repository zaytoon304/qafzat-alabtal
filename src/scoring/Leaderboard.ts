import { storageManager } from "../storage/LocalStorageManager";
import type { CharacterId, LeaderboardEntry } from "../core/Types";

// لوحة الأبطال المحلية — بند 25
export class Leaderboard {
  submit(playerName: string, score: number, character: CharacterId): void {
    storageManager.addLeaderboardEntry({ playerName, score, character, date: Date.now() });
  }

  top(count = 10): LeaderboardEntry[] {
    return storageManager.getLeaderboard().slice(0, count);
  }
}

export const leaderboard = new Leaderboard();
