import { eventBus, GameEvents } from "../core/EventBus";
import { gameState } from "../core/GameState";
import type { CharacterId, Difficulty } from "../core/Types";
import { PlayerManager } from "../players/PlayerManager";
import { obstacleManager } from "../obstacles/ObstacleManager";
import { collectibleManager } from "../collectibles/CollectibleManager";
import { powerUpManager } from "../powerups/PowerUpManager";
import { difficultyManager } from "./DifficultyManager";
import { gameLoop } from "./GameLoop";
import { levelManager, type LevelDef } from "./LevelManager";
import { storageManager } from "../storage/LocalStorageManager";
import { leaderboard } from "../scoring/Leaderboard";
import { scoreManager } from "../scoring/ScoreManager";

export interface RunPlayerConfig {
  playerIndex: number;
  character: CharacterId;
}

// المنسّق الأعلى لجولة لعب واحدة: يربط اللاعبين + المستوى + الصعوبة + كل الأنظمة الفرعية
export class GameController {
  readonly playerManager = new PlayerManager();
  private level: LevelDef = levelManager.get(1);
  private distanceM = 0;
  private startedAt = 0;
  private running = false;

  constructor() {
    eventBus.on(GameEvents.BOSS_DEFEATED, () => {
      if (this.running) this.onBossDefeated();
    });
  }

  startRun(players: RunPlayerConfig[], levelId: number, difficulty: Difficulty): void {
    this.level = levelId === 999 ? levelManager.getMixedEndless() : levelManager.get(levelId);
    difficultyManager.setBaseDifficulty(difficulty);
    this.playerManager.clear();
    for (const p of players) this.playerManager.spawn(p.playerIndex, p.character);

    this.distanceM = 0;
    this.startedAt = performance.now();
    this.running = true;
    gameLoop.reset();

    obstacleManager.start(this.level.allowedObstacleTypes);
    collectibleManager.start();
    powerUpManager.start();

    gameState.transitionTo("PLAYING", true);
  }

  // يُستدعى من GameScene كل إطار
  update(deltaMs: number): void {
    if (!this.running) return;

    const players = this.playerManager.all();
    gameLoop.update(deltaMs, players);

    if (!gameLoop.isBossActive()) {
      this.distanceM += (difficultyManager.getObstacleSpeed() / 45) * (deltaMs / 1000);
      if (this.level.hasBoss && this.distanceM >= this.level.distanceGoalM) {
        gameState.transitionTo("BOSS", true);
        gameLoop.startBossPhase();
      } else if (!this.level.hasBoss && this.distanceM >= this.level.distanceGoalM) {
        this.finishLevel();
        return;
      }
    }

    if (this.playerManager.isEveryoneOut()) {
      this.gameOver();
    }
  }

  getDistanceM(): number {
    return this.distanceM;
  }

  getLevel(): LevelDef {
    return this.level;
  }

  getElapsedSeconds(): number {
    return (performance.now() - this.startedAt) / 1000;
  }

  private finishLevel(): void {
    this.running = false;
    obstacleManager.stop();
    collectibleManager.stop();
    powerUpManager.stop();

    for (const player of this.playerManager.all()) {
      eventBus.emit(GameEvents.LEVEL_COMPLETE, { playerIndex: player.id });
      this.persistResults(player.id);
    }
    gameState.transitionTo("LEVEL_COMPLETE", true);
  }

  onBossDefeated(): void {
    this.finishLevel();
  }

  private gameOver(): void {
    this.running = false;
    obstacleManager.stop();
    collectibleManager.stop();
    powerUpManager.stop();
    gameLoop.reset();

    for (const player of this.playerManager.all()) {
      this.persistResults(player.id);
    }
    eventBus.emit(GameEvents.GAME_OVER, {});
    gameState.transitionTo("GAME_OVER", true);
  }

  private persistResults(playerIndex: number): void {
    const player = this.playerManager.get(playerIndex);
    if (!player) return;
    const score = scoreManager.getScore(playerIndex);
    const stars = scoreManager.getStars(playerIndex);
    const coins = scoreManager.getCoins(playerIndex);

    const profile = storageManager.getActiveProfile();
    if (profile) {
      profile.highestScore = Math.max(profile.highestScore, score);
      profile.totalStars += stars;
      profile.totalCoins += coins;
      const elapsed = this.getElapsedSeconds();
      if (profile.bestTimeSeconds === null || elapsed > profile.bestTimeSeconds) {
        profile.bestTimeSeconds = elapsed;
      }
      if (!profile.levelsCompleted.includes(this.level.id) && this.level.id !== 999) {
        profile.levelsCompleted.push(this.level.id);
      }
      storageManager.saveProfile(profile);
      leaderboard.submit(profile.name, score, player.character);
    }
  }

  stop(): void {
    this.running = false;
    obstacleManager.stop();
    collectibleManager.stop();
    powerUpManager.stop();
    gameLoop.reset();
  }
}

export const gameController = new GameController();
