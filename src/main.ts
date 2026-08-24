import Phaser from "phaser";
import { GameConfig } from "./core/Config";
import { BootScene } from "./game/scenes/BootScene";
import { PreloadScene } from "./game/scenes/PreloadScene";
import { ProfileScene } from "./game/scenes/ProfileScene";
import { MenuScene } from "./game/scenes/MenuScene";
import { CharacterSelectScene } from "./game/scenes/CharacterSelectScene";
import { WorldSelectScene } from "./game/scenes/WorldSelectScene";
import { SetupPlayScene } from "./game/scenes/SetupPlayScene";
import { CalibrationScene } from "./game/scenes/CalibrationScene";
import { TrainingScene } from "./game/scenes/TrainingScene";
import { GameScene } from "./game/scenes/GameScene";
import { LevelCompleteScene } from "./game/scenes/LevelCompleteScene";
import { GameOverScene } from "./game/scenes/GameOverScene";
import { LeaderboardScene } from "./game/scenes/LeaderboardScene";
import { ProfileStatsScene } from "./game/scenes/ProfileStatsScene";
import { SettingsScene } from "./game/scenes/SettingsScene";

const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GameConfig.screen.width,
  height: GameConfig.screen.height,
  backgroundColor: "#0b1020",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [
    BootScene,
    PreloadScene,
    ProfileScene,
    MenuScene,
    CharacterSelectScene,
    WorldSelectScene,
    SetupPlayScene,
    CalibrationScene,
    TrainingScene,
    GameScene,
    LevelCompleteScene,
    GameOverScene,
    LeaderboardScene,
    ProfileStatsScene,
    SettingsScene,
  ],
};

new Phaser.Game(phaserConfig);
