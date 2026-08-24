import { obstacleManager } from "../obstacles/ObstacleManager";
import { collectibleManager } from "../collectibles/CollectibleManager";
import { powerUpManager } from "../powerups/PowerUpManager";
import { bossManager } from "../boss/BossManager";
import { difficultyManager } from "./DifficultyManager";
import type { PlayerController } from "../players/PlayerController";

// حلقة منطق اللعب (بند 29) — يستدعيها GameScene كل إطار (~60fps)
// منفصلة تماماً عن حلقة الرؤية الحاسوبية (VisionController تُشغّل نفسها بشكل مستقل)
export class GameLoop {
  private bossActive = false;

  update(deltaMs: number, players: PlayerController[]): void {
    difficultyManager.update(deltaMs / 1000);

    if (this.bossActive) {
      bossManager.update(deltaMs, players);
    } else {
      obstacleManager.update(deltaMs, players);
      collectibleManager.update(deltaMs, players);
      powerUpManager.update(deltaMs, players);
    }
  }

  startBossPhase(): void {
    this.bossActive = true;
    obstacleManager.stop();
    collectibleManager.stop();
    powerUpManager.stop();
    bossManager.start();
  }

  isBossActive(): boolean {
    return this.bossActive;
  }

  reset(): void {
    this.bossActive = false;
    bossManager.stop();
  }
}

export const gameLoop = new GameLoop();
