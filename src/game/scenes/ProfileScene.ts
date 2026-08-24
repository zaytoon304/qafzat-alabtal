import Phaser from "phaser";
import { GameConfig } from "../../core/Config";
import { storageManager } from "../../storage/LocalStorageManager";
import { titleText, bodyText, createBigButton, createPanel } from "../../ui/UIKit";

// إنشاء/اختيار ملف اللاعب — بند 24. اسم اللاعب يُدخل عبر حقل نصي حقيقي فوق الـ Canvas
export class ProfileScene extends Phaser.Scene {
  private inputEl: HTMLInputElement | null = null;

  constructor() {
    super("Profile");
  }

  create(): void {
    const { width, height } = GameConfig.screen;
    this.cameras.main.setBackgroundColor("#0b1020");

    titleText(this, width / 2, 90, "من سيلعب اليوم؟");
    createPanel(this, width / 2, height / 2, 520, 260);

    bodyText(this, width / 2, height / 2 - 70, "اكتب اسمك:");

    this.createNameInput();

    createBigButton(this, width / 2, height / 2 + 60, "ابدأ!", "green", () => this.confirm(), { width: 220 });

    const profiles = storageManager.getProfiles();
    if (profiles.length > 0) {
      bodyText(this, width / 2, height - 120, "أو اختر ملفاً محفوظاً:", "20px");
      profiles.slice(0, 4).forEach((p, i) => {
        createBigButton(
          this,
          width / 2 - 300 + i * 200,
          height - 60,
          p.name,
          "blue",
          () => {
            storageManager.setActiveProfileId(p.id);
            this.goToMenu();
          },
          { width: 180, fontSize: "20px" },
        );
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.removeInput());
  }

  private createNameInput(): void {
    const el = document.createElement("input");
    el.type = "text";
    el.maxLength = 14;
    el.placeholder = "اسمك هنا";
    el.style.position = "absolute";
    el.style.left = "50%";
    el.style.top = "calc(50% - 15px)";
    el.style.transform = "translate(-50%, 0)";
    el.style.fontSize = "22px";
    el.style.padding = "8px 14px";
    el.style.borderRadius = "10px";
    el.style.border = "none";
    el.style.textAlign = "center";
    el.style.width = "260px";
    el.style.zIndex = "10";
    document.getElementById("app")?.appendChild(el);
    el.focus();
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.confirm();
    });
    this.inputEl = el;
  }

  private removeInput(): void {
    this.inputEl?.remove();
    this.inputEl = null;
  }

  private confirm(): void {
    const name = (this.inputEl?.value ?? "").trim() || "بطل صغير";
    storageManager.createProfile(name, "hero_boy", "forest");
    this.goToMenu();
  }

  private goToMenu(): void {
    this.removeInput();
    this.scene.start("Menu");
  }
}
