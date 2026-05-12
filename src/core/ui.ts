import Phaser from "phaser";

export function addPanel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, alpha = 0.78): Phaser.GameObjects.Graphics {
  const panel = scene.add.graphics();
  panel.fillStyle(0x321d0d, alpha);
  panel.lineStyle(3, 0xffd98e, 0.8);
  panel.fillRoundedRect(x, y, width, height, 18);
  panel.strokeRoundedRect(x, y, width, height, 18);
  return panel;
}

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  size = 30
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  const normal = 0xffcf6a;
  const hover = 0xffe29c;
  const down = 0xf0a43a;
  const bg = scene.add.graphics();
  const text = scene.add.text(0, 1, label, {
    fontFamily: "Trebuchet MS, Segoe UI, sans-serif",
    fontSize: `${size}px`,
    color: "#351802",
    fontStyle: "bold"
  }).setOrigin(0.5);

  const draw = (fill: number) => {
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.lineStyle(4, 0x7b3905, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 18);
  };

  draw(normal);
  container.add([bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on(Phaser.Input.Events.POINTER_OVER, () => draw(hover));
  container.on(Phaser.Input.Events.POINTER_OUT, () => draw(normal));
  container.on(Phaser.Input.Events.POINTER_DOWN, () => draw(down));
  container.on(Phaser.Input.Events.POINTER_UP, () => {
    draw(hover);
    onClick();
  });
  return container;
}

export function coverImage(image: Phaser.GameObjects.Image, width: number, height: number): void {
  const texture = image.scene.textures.get(image.texture.key);
  const source = texture.getSourceImage() as HTMLImageElement;
  const scale = Math.max(width / source.width, height / source.height);
  image.setScale(scale);
}
