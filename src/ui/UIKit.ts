import Phaser from "phaser";
import { audioManager } from "../audio/AudioManager";

// أدوات واجهة موحّدة تُستخدم بكل الشاشات — أزرار كبيرة ملونة مناسبة للأطفال (بند 35)
export type ButtonColor = "blue" | "green" | "red" | "yellow" | "grey";

export function createBigButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  color: ButtonColor,
  onClick: () => void,
  options?: { width?: number; height?: number; fontSize?: string; icon?: string },
): Phaser.GameObjects.Container {
  const width = options?.width ?? 280;
  const height = options?.height ?? 74;
  const key = `button_${color}`;
  const image = scene.add.image(0, 0, key).setDisplaySize(width, height);
  const text = scene.add
    .text(0, 0, `${options?.icon ? options.icon + " " : ""}${label}`, {
      fontFamily: "Tahoma, sans-serif",
      fontSize: options?.fontSize ?? "26px",
      color: "#2b1d0e",
      fontStyle: "bold",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [image, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  container.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.05, duration: 100 }));
  container.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, duration: 100 }));
  container.on("pointerdown", () => {
    audioManager.play("uiClick");
    scene.tweens.add({ targets: container, scale: 0.95, duration: 60, yoyo: true, onComplete: onClick });
  });

  return container;
}

export function createPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  colorHex = 0x162447,
  alpha = 0.92,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(colorHex, alpha);
  g.fillRoundedRect(-width / 2, -height / 2, width, height, 24);
  g.lineStyle(4, 0xffffff, 0.15);
  g.strokeRoundedRect(-width / 2, -height / 2, width, height, 24);
  return g;
}

export function titleText(scene: Phaser.Scene, x: number, y: number, label: string, size = "44px"): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, label, {
      fontFamily: "Tahoma, sans-serif",
      fontSize: size,
      color: "#ffffff",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setShadow(0, 3, "#00000066", 6);
}

export function bodyText(scene: Phaser.Scene, x: number, y: number, label: string, size = "22px", color = "#eef2ff"): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, label, { fontFamily: "Tahoma, sans-serif", fontSize: size, color })
    .setOrigin(0.5);
}

export function backButton(scene: Phaser.Scene, onClick: () => void): Phaser.GameObjects.Container {
  return createBigButton(scene, 90, 40, "رجوع", "grey", onClick, { width: 130, fontSize: "20px", icon: "◀" });
}

// خلفية مشهدية موحّدة (سماء متدرّجة + غيوم + أرض + أشجار) بدل الشاشة السوداء المسطّحة - تُستخدم بكل شاشات القوائم
export function sceneBackdrop(scene: Phaser.Scene): void {
  const { width, height } = scene.game.config as { width: number; height: number };
  const w = Number(width) || 1366;
  const h = Number(height) || 896;

  const g = scene.add.graphics();
  g.fillGradientStyle(0x6fc3ff, 0x6fc3ff, 0xbdeeb0, 0xbdeeb0, 1);
  g.fillRect(0, 0, w, h);

  scene.add.image(w * 0.12, h * 0.12, "background_cloudA").setAlpha(0.85).setScale(0.7);
  scene.add.image(w * 0.55, h * 0.08, "background_cloudB").setAlpha(0.75).setScale(0.55);
  scene.add.image(w * 0.85, h * 0.16, "background_cloudA").setAlpha(0.65).setScale(0.45);

  const groundY = h - 70;
  scene.add.rectangle(w / 2, groundY + 45, w, 140, 0x4caf50);
  scene.add.rectangle(w / 2, groundY - 5, w, 6, 0x2e7d32).setAlpha(0.6);

  const treePositions = [0.04, 0.94, 0.24, 0.76];
  treePositions.forEach((fx, i) => {
    const img = scene.add.image(w * fx, groundY - 6, i % 2 === 0 ? "background_treeLarge" : "background_tree");
    img.setScale(i % 2 === 0 ? 0.55 : 0.4);
    img.setOrigin(0.5, 1);
    img.setAlpha(0.9);
  });
}
