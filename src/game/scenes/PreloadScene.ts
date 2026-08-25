import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { storageManager } from "../../storage/LocalStorageManager";

// كل شخصية لها 6 وضعيات حقيقية (وقوف/قفز/انحناء/مشي/إصابة/احتفال) - حزمة Kenney "Platformer Characters"
const CHAR_PREFIX: Record<string, string> = {
  hero_boy: "player",
  hero_girl: "female",
  robot: "soldier",
  explorer: "adventurer",
  wizard: "zombie",
};
const CHAR_POSES = ["idle", "jump", "duck", "walk1", "hurt", "cheer1"] as const;

const TILE_FILES = [
  "tile_block",
  "tile_spike",
  "tile_spikes",
  "tile_coin",
  "tile_gem",
  "tile_heart",
  "tile_chest",
  "tile_crate",
  "tile_water",
  "tile_tree",
  "tile_treeTop",
  "tile_treeTrunk",
  "tile_bush",
  "tile_sand",
  "tile_stone",
  "tile_brick",
  "tile_castle",
  "tile_key",
  "tile_flag",
  "tile_door",
  "tile_column",
  "background_cloudA",
  "background_cloudB",
  "background_tree",
  "background_treeLarge",
];

const EFFECT_FILES = ["effect_blast", "effect_blastLarge", "effect_shot", "effect_trail", "item_shieldRound", "item_helmet", "item_hatTop", "item_sword"];

const UI_FILES: Record<string, string> = {
  button_blue: "button_blue",
  button_green: "button_green",
  button_red: "button_red",
  button_yellow: "button_yellow",
  button_grey: "button_grey",
  button_round_blue: "button_round_blue",
  star: "star",
  checkmark: "checkmark",
};

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  preload(): void {
    const { width, height } = GameConfig.screen;
    const barBg = this.add.rectangle(width / 2, height / 2, 420, 28, 0x1a1a2e).setStrokeStyle(2, 0xffffff);
    const bar = this.add.rectangle(width / 2 - 205, height / 2, 4, 20, 0x4fd1c5).setOrigin(0, 0.5);
    this.add
      .text(width / 2, height / 2 - 50, "قفزة الأبطال", { fontFamily: "Tahoma", fontSize: "40px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5);
    const pctText = this.add
      .text(width / 2, height / 2 + 40, "0%", { fontFamily: "Tahoma", fontSize: "20px", color: "#cccccc" })
      .setOrigin(0.5);

    this.load.on("progress", (v: number) => {
      bar.width = 410 * v;
      pctText.setText(`${Math.round(v * 100)}%`);
    });

    for (const [charKey, prefix] of Object.entries(CHAR_PREFIX)) {
      for (const pose of CHAR_POSES) {
        this.load.image(`char_${charKey}_${pose}`, `/assets/images/characters/heroes/${prefix}_${pose}.png`);
      }
    }
    for (const file of TILE_FILES) {
      this.load.image(file, `/assets/images/tiles/${file}.png`);
    }
    for (const file of EFFECT_FILES) {
      this.load.image(file, `/assets/images/effects/${file}.png`);
    }
    for (const [key, file] of Object.entries(UI_FILES)) {
      this.load.image(key, `/assets/images/ui/${file}.png`);
    }

    barBg.setVisible(true);
  }

  create(): void {
    const hasProfile = !!storageManager.getActiveProfile();
    this.scene.start(hasProfile ? "Menu" : "Profile");
  }
}
