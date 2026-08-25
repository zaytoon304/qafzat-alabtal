import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { eventBus, GameEvents } from "../../core/EventBus";
import { gameState } from "../../core/GameState";
import { session } from "../Session";
import { gameController } from "../GameController";
import { obstacleManager, type ObstacleInstance } from "../../obstacles/ObstacleManager";
import { collectibleManager, type CollectibleInstance } from "../../collectibles/CollectibleManager";
import { powerUpManager, type PowerUpInstance } from "../../powerups/PowerUpManager";
import { bossManager } from "../../boss/BossManager";
import { characterManager, poseKey, type CharacterPose } from "../../characters/CharacterManager";
import { worldManager } from "../../worlds/WorldManager";
import { visionController } from "../../vision/VisionController";
import { motionRecognition } from "../../vision/MotionRecognition";
import { audioManager } from "../../audio/AudioManager";
import { scoreManager } from "../../scoring/ScoreManager";
import { comboManager } from "../../scoring/ComboManager";
import { TRACK_HIT_LINE_X, TRACK_SPAWN_X } from "../TrackGeometry";
import type { MotionType } from "../../core/Types";

const LANE_X = [230, 480, 730];
const PLAYER_Y = 460;
const TOP_Y = 10;

// عبارات تشجيع عربية سعودية متنوعة — بند 31 (مو نفس العبارة كل مرة)
const SUCCESS_PHRASES = ["رائع!", "ممتاز!", "كفو!", "يا سلام!", "أبدعت!", "تجنّن!", "عاشت الأيادي!", "ما شاء الله!"];

const MOTION_ICON: Record<MotionType, string> = {
  JUMP: "⬆️",
  DUCK: "⬇️",
  MOVE_LEFT: "⬅️",
  MOVE_RIGHT: "➡️",
  TURN: "🔄",
  RAISE_HAND: "🖐️",
};

function progressY(x: number): number {
  const t = Phaser.Math.Clamp((TRACK_SPAWN_X - x) / (TRACK_SPAWN_X - TRACK_HIT_LINE_X), 0, 1.5);
  return Phaser.Math.Linear(TOP_Y, PLAYER_Y, t);
}

export class GameScene extends Phaser.Scene {
  private obstacleSprites = new Map<number, Phaser.GameObjects.Image>();
  private collectibleSprites = new Map<number, Phaser.GameObjects.Image>();
  private powerupSprites = new Map<number, Phaser.GameObjects.Image>();
  private consumedIds = new Set<string>();
  private playerSprites = new Map<number, Phaser.GameObjects.Image>();
  private poseOverride = new Map<number, { pose: CharacterPose; until: number }>();
  private playerShieldFx = new Map<number, Phaser.GameObjects.Arc>();

  private hudScoreTexts = new Map<number, Phaser.GameObjects.Text>();
  private hudLivesTexts = new Map<number, Phaser.GameObjects.Text>();
  private comboText!: Phaser.GameObjects.Text;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private toastText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;

  private bossSprite: Phaser.GameObjects.Image | null = null;
  private bossHealthBarBg: Phaser.GameObjects.Rectangle | null = null;
  private bossHealthBarFill: Phaser.GameObjects.Rectangle | null = null;
  private bossTelegraphText: Phaser.GameObjects.Text | null = null;

  private unsubs: Array<() => void> = [];
  private paused = false;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private ended = false;

  constructor() {
    super("Game");
  }

  async create(): Promise<void> {
    this.cameras.main.fadeIn(300, 11, 16, 32);
    this.ended = false;
    this.consumedIds.clear();
    this.obstacleSprites.clear();
    this.collectibleSprites.clear();
    this.powerupSprites.clear();
    this.playerSprites.clear();

    if (!visionController.isCameraActive) {
      try {
        await visionController.start(session.playerCount);
      } catch (err) {
        console.error("[Game] تعذّر تشغيل الكاميرا:", err);
      }
    }

    this.buildWorldBackground();
    this.buildLaneMarkers();

    const players = Array.from({ length: session.playerCount }, (_, i) => ({
      playerIndex: i,
      character: session.selectedCharacter,
    }));
    gameController.startRun(players, session.selectedLevelId, session.difficulty);

    this.buildPlayerSprites();
    this.buildHUD();
    this.bindEvents();
    this.bindPauseKey();
  }

  private buildWorldBackground(): void {
    const world = worldManager.get(session.selectedWorld);
    const { width, height } = GameConfig.screen;
    const g = this.add.graphics();
    g.fillGradientStyle(world.skyTop, world.skyTop, world.skyBottom, world.skyBottom, 1);
    g.fillRect(0, 0, width, height);

    this.add.image(150, 90, "background_cloudA").setAlpha(0.8).setScale(0.7);
    this.add.image(700, 60, "background_cloudB").setAlpha(0.7).setScale(0.6);
    this.add.image(850, 130, "background_cloudA").setAlpha(0.6).setScale(0.5);

    this.add.rectangle(width / 2, PLAYER_Y + 55, width, 120, world.groundColor);
    this.add.rectangle(width / 2, PLAYER_Y - 5, width, 4, world.accentColor).setAlpha(0.6);
  }

  private buildLaneMarkers(): void {
    for (const x of LANE_X) {
      this.add.rectangle(x, PLAYER_Y + 40, 90, 6, 0xffffff, 0.18);
    }
  }

  private buildPlayerSprites(): void {
    const players = gameController.playerManager.all();
    players.forEach((p, i) => {
      const def = characterManager.get(p.character);
      const offset = players.length > 1 ? (i - (players.length - 1) / 2) * 18 : 0;
      const sprite = this.add.image(LANE_X[1] + offset, PLAYER_Y, poseKey(def.spriteKey, "idle")).setDisplaySize(80 * def.aspect, 80);
      sprite.setData("playerIndex", p.id);
      sprite.setData("offset", offset);
      sprite.setData("character", p.character);
      this.playerSprites.set(p.id, sprite);
    });
  }

  private buildHUD(): void {
    const { width } = GameConfig.screen;
    const players = gameController.playerManager.all();

    players.forEach((p, i) => {
      const x = 16 + i * 190;
      const scoreT = this.add.text(x, 12, "0", { fontFamily: "Tahoma", fontSize: "22px", color: "#ffd54f", fontStyle: "bold" });
      const livesT = this.add.text(x, 40, "❤️❤️❤️", { fontFamily: "Tahoma", fontSize: "18px" });
      this.hudScoreTexts.set(p.id, scoreT);
      this.hudLivesTexts.set(p.id, livesT);
    });

    this.comboText = this.add
      .text(width / 2, 20, "", { fontFamily: "Tahoma", fontSize: "26px", color: "#ff7043", fontStyle: "bold" })
      .setOrigin(0.5)
      .setAlpha(0);

    this.add.rectangle(width - 130, 24, 220, 14, 0x222222).setStrokeStyle(2, 0xffffff);
    this.progressBarFill = this.add.rectangle(width - 130 - 108, 24, 4, 10, 0x4fd1c5).setOrigin(0, 0.5);

    this.toastText = this.add
      .text(width / 2, 100, "", { fontFamily: "Tahoma", fontSize: "24px", color: "#ffffff", fontStyle: "bold", backgroundColor: "#00000088", padding: { x: 14, y: 8 } })
      .setOrigin(0.5)
      .setAlpha(0);

    const muteBtn = this.add
      .text(width - 30, 60, audioManager.isMuted() ? "🔇" : "🔊", { fontSize: "26px" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    muteBtn.on("pointerdown", () => {
      audioManager.setMuted(!audioManager.isMuted());
      muteBtn.setText(audioManager.isMuted() ? "🔇" : "🔊");
    });

    const pauseBtn = this.add.text(width - 60, 60, "⏸", { fontSize: "26px" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    pauseBtn.on("pointerdown", () => this.togglePause());

    this.debugText = this.add
      .text(6, GameConfig.screen.height - 6, "", { fontFamily: "monospace", fontSize: "13px", color: "#00ff9c", backgroundColor: "#00000099", padding: { x: 6, y: 4 } })
      .setOrigin(0, 1)
      .setVisible(session.debugMode);
  }

  private bindPauseKey(): void {
    this.input.keyboard?.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard?.on("keydown-F1", () => {
      session.debugMode = !session.debugMode;
      this.debugText.setVisible(session.debugMode);
    });
  }

  private togglePause(): void {
    if (this.ended) return;
    this.paused = !this.paused;
    if (this.paused) {
      gameState.transitionTo("PAUSED", true);
      this.showPauseOverlay();
    } else {
      gameState.transitionTo("PLAYING", true);
      this.pauseOverlay?.destroy();
      this.pauseOverlay = null;
    }
  }

  private showPauseOverlay(): void {
    const { width, height } = GameConfig.screen;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    const text = this.add.text(width / 2, height / 2 - 60, "⏸ إيقاف مؤقت", { fontFamily: "Tahoma", fontSize: "36px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
    const resumeBtn = this.add.text(width / 2, height / 2 + 10, "▶ استمرار", { fontFamily: "Tahoma", fontSize: "26px", color: "#4fd1c5" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on("pointerdown", () => this.togglePause());
    const exitBtn = this.add.text(width / 2, height / 2 + 60, "🏠 القائمة الرئيسية", { fontFamily: "Tahoma", fontSize: "24px", color: "#ff7043" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    exitBtn.on("pointerdown", () => this.exitToMenu());
    this.pauseOverlay = this.add.container(0, 0, [bg, text, resumeBtn, exitBtn]);
  }

  private exitToMenu(): void {
    this.ended = true;
    gameController.stop();
    visionController.stop();
    this.scene.start("Menu");
  }

  private bindEvents(): void {
    const on = (name: string, cb: (payload: any) => void) => this.unsubs.push(eventBus.on(name, cb));

    on(GameEvents.SCORE_CHANGED, (p: { playerIndex: number; score: number }) => {
      this.hudScoreTexts.get(p.playerIndex)?.setText(`⭐ ${p.score}`);
    });

    on(GameEvents.COMBO_CHANGED, (p: { playerIndex: number; combo: number }) => {
      if (p.combo >= 2) {
        this.comboText.setText(`Combo x${p.combo}!`);
        this.comboText.setAlpha(1);
        this.tweens.add({ targets: this.comboText, scale: 1.3, duration: 120, yoyo: true });
      } else {
        this.comboText.setAlpha(0);
      }
    });

    on(GameEvents.PLAYER_LIFE_LOST, (p: { playerIndex: number; livesRemaining: number }) => {
      this.hudLivesTexts.get(p.playerIndex)?.setText("❤️".repeat(Math.max(0, p.livesRemaining)) || "💔");
      audioManager.play("collision");
      this.surprisedPulse(p.playerIndex);
    });

    on(GameEvents.OBSTACLE_PASSED, (p: { playerIndex: number }) => {
      audioManager.play("success");
      this.celebrateBounce(p.playerIndex);
      // كل عدة مرات نجاح نعرض عبارة تشجيع كاملة بدل "+" بس، عشان يحس الطفل بتنوع حقيقي
      const label = Math.random() < 0.3 ? SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)] : "+";
      this.popTextNear(p.playerIndex, label);
    });

    on(GameEvents.OBSTACLE_HIT, () => audioManager.play("collision"));

    on(GameEvents.COLLECT_STAR, (p: { playerIndex: number; id: number }) => {
      audioManager.play("collect");
      this.consumeSprite("star", p.id, this.collectibleSprites);
      this.popTextNear(p.playerIndex, "⭐");
      this.burstParticles(this.playerSprites.get(p.playerIndex)?.x ?? LANE_X[1], this.playerSprites.get(p.playerIndex)?.y ?? PLAYER_Y, "tile_gem");
    });

    on(GameEvents.COLLECT_COIN, (p: { playerIndex: number; id: number }) => {
      audioManager.play("collect");
      this.consumeSprite("coin", p.id, this.collectibleSprites);
      this.popTextNear(p.playerIndex, "🪙");
      this.burstParticles(this.playerSprites.get(p.playerIndex)?.x ?? LANE_X[1], this.playerSprites.get(p.playerIndex)?.y ?? PLAYER_Y, "tile_coin");
    });

    on(GameEvents.POWERUP_COLLECTED, (p: { playerIndex: number; kind: string; id: number }) => {
      audioManager.play("powerup");
      this.consumeSprite("power", p.id, this.powerupSprites);
      this.showToast(`${p.kind} !`);
    });

    on(GameEvents.ACHIEVEMENT_UNLOCKED, (p: { title: string; icon: string }) => {
      this.showToast(`${p.icon} إنجاز جديد: ${p.title}`);
    });

    on(GameEvents.BOSS_SPAWN, () => this.setupBossVisuals());
    on(GameEvents.BOSS_ATTACK, (p: { motion: MotionType }) => this.showBossTelegraph(p.motion));
    on(GameEvents.BOSS_HIT, (p: { playerIndex: number; bossHealth: number }) => {
      audioManager.play("success");
      this.updateBossHealth(p.bossHealth);
      this.celebrateBounce(p.playerIndex);
    });
    on(GameEvents.BOSS_PLAYER_HIT, (p: { playerIndex: number }) => {
      audioManager.play("collision");
      this.surprisedPulse(p.playerIndex);
    });
    on(GameEvents.BOSS_DEFEATED, () => {
      audioManager.play("levelComplete");
      if (this.bossSprite) this.burstParticles(this.bossSprite.x, this.bossSprite.y, "tile_gem");
      for (const p of gameController.playerManager.all()) this.celebrateBounce(p.id);
      this.teardownBossVisuals();
    });

    on(GameEvents.STATE_CHANGED, (p: { to: string }) => {
      if (p.to === "LEVEL_COMPLETE") this.onRunEnded("LevelComplete");
      if (p.to === "GAME_OVER") this.onRunEnded("GameOver");
    });
  }

  private onRunEnded(nextScene: "LevelComplete" | "GameOver"): void {
    if (this.ended) return;
    this.ended = true;
    audioManager.stopMusic();
    audioManager.play(nextScene === "LevelComplete" ? "levelComplete" : "gameOver");
    const player = gameController.playerManager.get(0);
    const data = {
      score: scoreManager.getScore(0),
      stars: scoreManager.getStars(0),
      coins: scoreManager.getCoins(0),
      levelName: gameController.getLevel().name,
      character: player?.character ?? session.selectedCharacter,
    };
    this.time.delayedCall(1300, () => {
      this.cameras.main.fadeOut(300, 11, 16, 32);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        visionController.stop();
        this.scene.start(nextScene, data);
      });
    });
  }

  // اهتزاز خفيف "متفاجئ" عند الاصطدام — بدون تخويف الطفل، مجرد رمشة سريعة + انضغاط بسيط
  private surprisedPulse(playerIndex: number): void {
    const sprite = this.playerSprites.get(playerIndex);
    if (!sprite) return;
    this.poseOverride.set(playerIndex, { pose: "hurt", until: this.time.now + 350 });
    this.tweens.add({ targets: sprite, alpha: 0.3, duration: 90, yoyo: true, repeat: 3 });
    this.tweens.add({ targets: sprite, scaleX: sprite.scaleX * 0.85, scaleY: sprite.scaleY * 1.15, duration: 120, yoyo: true, ease: "Quad.easeOut" });
  }

  // قفزة فرح صغيرة (Squash & Stretch) عند أي نجاح — إحساس "Juicy" بدل رد فعل جامد
  private celebrateBounce(playerIndex: number): void {
    const sprite = this.playerSprites.get(playerIndex);
    if (!sprite) return;
    this.tweens.add({
      targets: sprite,
      scaleX: { from: 1.25, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 260,
      ease: "Back.easeOut",
    });
  }

  private popTextNear(playerIndex: number, label: string): void {
    const sprite = this.playerSprites.get(playerIndex);
    const x = sprite?.x ?? LANE_X[1];
    const y = (sprite?.y ?? PLAYER_Y) - 60;
    const t = this.add
      .text(x, y, label, { fontFamily: "Tahoma", fontSize: "26px", color: "#ffd54f", fontStyle: "bold" })
      .setOrigin(0.5)
      .setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 750, delay: 150, onComplete: () => t.destroy() });
  }

  // انفجار جزيئات صغير للتحفيز البصري عند الجمع/النجاح — بند 12/31
  private burstParticles(x: number, y: number, textureKey: string): void {
    const emitter = this.add.particles(x, y, textureKey, {
      lifespan: 500,
      speed: { min: 80, max: 200 },
      scale: { start: 0.6, end: 0 },
      angle: { min: 0, max: 360 },
      quantity: 8,
      emitting: false,
    });
    emitter.explode(8);
    this.time.delayedCall(600, () => emitter.destroy());
  }

  private showToast(msg: string): void {
    this.toastText.setText(msg);
    this.toastText.setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, duration: 1800, delay: 900 });
  }

  private consumeSprite(prefix: string, id: number, pool: Map<number, Phaser.GameObjects.Image>): void {
    const key = `${prefix}:${id}`;
    this.consumedIds.add(key);
    const sprite = pool.get(id);
    if (sprite) {
      this.tweens.add({ targets: sprite, scale: sprite.scale * 1.6, alpha: 0, duration: 200, onComplete: () => sprite.destroy() });
      pool.delete(id);
    }
  }

  private setupBossVisuals(): void {
    const { width } = GameConfig.screen;
    this.bossSprite = this.add.image(width / 2, -100, "tile_castle").setDisplaySize(140, 140).setTint(0x8a2be2);
    this.tweens.add({ targets: this.bossSprite, y: 150, duration: 500, ease: "Bounce.easeOut" });
    this.bossHealthBarBg = this.add.rectangle(width / 2, 60, 320, 20, 0x222222).setStrokeStyle(2, 0xffffff);
    this.bossHealthBarFill = this.add.rectangle(width / 2 - 158, 60, 316, 16, 0xff1744).setOrigin(0, 0.5);
    this.bossTelegraphText = this.add.text(width / 2, 220, "", { fontFamily: "Tahoma", fontSize: "40px" }).setOrigin(0.5);
    this.showToast("👑 الزعيم! نفّذ الحركات لهزيمته");
  }

  private showBossTelegraph(motion: MotionType): void {
    this.bossTelegraphText?.setText(MOTION_ICON[motion]);
    if (this.bossTelegraphText) {
      this.tweens.add({ targets: this.bossTelegraphText, scale: 1.5, duration: 250, yoyo: true });
    }
  }

  private updateBossHealth(health: number): void {
    if (!this.bossHealthBarFill) return;
    const pct = Phaser.Math.Clamp(health / bossManager.maxHealth, 0, 1);
    this.tweens.add({ targets: this.bossHealthBarFill, width: 316 * pct, duration: 200, ease: "Quad.easeOut" });
    this.tweens.add({ targets: this.bossSprite, alpha: 0.3, scale: 0.9, duration: 80, yoyo: true });
  }

  private teardownBossVisuals(): void {
    this.bossSprite?.destroy();
    this.bossHealthBarBg?.destroy();
    this.bossHealthBarFill?.destroy();
    this.bossTelegraphText?.destroy();
    this.bossSprite = null;
    this.bossHealthBarBg = null;
    this.bossHealthBarFill = null;
    this.bossTelegraphText = null;
  }

  update(_time: number, delta: number): void {
    if (this.paused || this.ended) return;

    gameController.update(delta);
    this.updatePlayerVisuals();

    if (this.hasBossPhase()) {
      // لا مزامنة عوائق أثناء الزعيم
    } else {
      this.syncObstacles();
      this.syncCollectibles();
      this.syncPowerups();
    }

    this.updateProgressBar();
    if (session.debugMode) this.updateDebugOverlay();
  }

  private hasBossPhase(): boolean {
    return gameState.state === "BOSS";
  }

  private updatePlayerVisuals(): void {
    const players = gameController.playerManager.all();
    for (const p of players) {
      const sprite = this.playerSprites.get(p.id);
      if (!sprite || !p.isAlive) continue;
      const offset = (sprite.getData("offset") as number) ?? 0;
      const targetX = LANE_X[p.lane] + offset;
      sprite.x = Phaser.Math.Linear(sprite.x, targetX, 0.25);

      const jumpOffset = p.isJumping ? -90 * Math.sin(p.jumpProgress * Math.PI) : 0;
      // نبضة حياة خفيفة وقت الجري العادي (Idle Bob) — يخلي الشخصية تحس حيّة لا جامدة
      const idleBob = !p.isJumping && !p.isDucking ? Math.sin(this.time.now / 180 + p.id) * 3 : 0;
      sprite.y = PLAYER_Y + jumpOffset + idleBob;
      sprite.angle = p.isTurning ? p.turnProgress * 360 : 0;

      // وضعية الرسمة الحقيقية حسب حالة اللاعب (بدل تشويه Squash قديم على رسمة واحدة)
      const def = characterManager.get(p.character);
      const override = this.poseOverride.get(p.id);
      let pose: CharacterPose;
      if (override && this.time.now < override.until) pose = override.pose;
      else if (p.isJumping) pose = "jump";
      else if (p.isDucking) pose = "duck";
      else pose = Math.floor(this.time.now / 180 + p.id * 2) % 2 === 0 ? "idle" : "walk1";
      sprite.setTexture(poseKey(def.spriteKey, pose));
      sprite.setTint(p.isHandRaised ? 0xffe082 : 0xffffff);

      if (p.isInvincible && !this.playerShieldFx.has(p.id)) {
        const fx = this.add.circle(sprite.x, sprite.y, 50, 0x4fd1c5, 0.25).setStrokeStyle(2, 0x4fd1c5);
        this.playerShieldFx.set(p.id, fx);
      } else if (!p.isInvincible && this.playerShieldFx.has(p.id)) {
        this.playerShieldFx.get(p.id)?.destroy();
        this.playerShieldFx.delete(p.id);
      }
      const fx = this.playerShieldFx.get(p.id);
      if (fx) {
        fx.x = sprite.x;
        fx.y = sprite.y;
      }
    }
  }

  private syncObstacles(): void {
    const active = obstacleManager.getActive();
    const activeIds = new Set(active.map((o) => o.id));
    for (const [id, sprite] of this.obstacleSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.obstacleSprites.delete(id);
      }
    }
    for (const obs of active) {
      let sprite = this.obstacleSprites.get(obs.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, obs.def.spriteTile).setTint(obs.def.color);
        sprite.setDisplaySize(obs.def.widthPx, obs.def.heightPx);
        this.obstacleSprites.set(obs.id, sprite);
      }
      const x = obs.lane === "ALL" ? LANE_X[1] : LANE_X[obs.lane];
      sprite.x = x;
      sprite.y = progressY(obs.x) + obs.def.yOffsetPx;
    }
  }

  private syncCollectibles(): void {
    const active = collectibleManager.getActive();
    const activeIds = new Set(active.map((c) => c.id));
    for (const [id, sprite] of this.collectibleSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.collectibleSprites.delete(id);
      }
    }
    for (const item of active) {
      const key = `${item.kind === "STAR" ? "star" : "coin"}:${item.id}`;
      if (this.consumedIds.has(key)) continue;
      let sprite = this.collectibleSprites.get(item.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, item.kind === "STAR" ? "tile_gem" : "tile_coin").setDisplaySize(34, 34);
        this.collectibleSprites.set(item.id, sprite);
      }
      sprite.x = LANE_X[item.lane];
      sprite.y = progressY(item.x);
    }
  }

  private syncPowerups(): void {
    const active = powerUpManager.getActive();
    const activeIds = new Set(active.map((p) => p.id));
    for (const [id, sprite] of this.powerupSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.powerupSprites.delete(id);
      }
    }
    for (const item of active) {
      const key = `power:${item.id}`;
      if (this.consumedIds.has(key)) continue;
      let sprite = this.powerupSprites.get(item.id);
      if (!sprite) {
        sprite = this.add.image(0, 0, "tile_chest").setDisplaySize(42, 42).setTint(0xffd700);
        this.powerupSprites.set(item.id, sprite);
      }
      sprite.x = LANE_X[item.lane];
      sprite.y = progressY(item.x);
    }
  }

  private updateProgressBar(): void {
    const level = gameController.getLevel();
    const pct = Phaser.Math.Clamp(gameController.getDistanceM() / level.distanceGoalM, 0, 1);
    this.progressBarFill.width = Math.max(4, 316 * pct * (216 / 316));
  }

  private updateDebugOverlay(): void {
    const p = gameController.playerManager.get(0);
    const snap = motionRecognition.getSnapshot(0);
    const lines = [
      `FPS: ${Math.round(this.game.loop.actualFps)}`,
      `Players: ${gameController.playerManager.all().length}`,
      `Lane: ${p?.lane ?? "-"} Jump:${p?.isJumping} Duck:${p?.isDucking}`,
      `signals: jump=${snap?.jump.toFixed(2)} duck=${snap?.duck.toFixed(2)} lat=${snap?.lateral.toFixed(2)} turn=${snap?.turn.toFixed(2)} hand=${snap?.raiseHand.toFixed(2)}`,
      `distance: ${gameController.getDistanceM().toFixed(0)}m / ${gameController.getLevel().distanceGoalM}m`,
    ];
    this.debugText.setText(lines.join("\n"));
  }

  shutdown(): void {
    this.unsubs.forEach((off) => off());
    this.unsubs = [];
  }
}
