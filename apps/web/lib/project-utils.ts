import Color, { ColorInstance } from "color";

export const emojiMap = {
  "📓": "Notebook",
} as const;

export function generateGradient(projectId: string, isHovered = false) {
  const hash = projectId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const palettes = [
    ["#FF9A9E", "#FAD0C4"],
    ["#A6C1EE", "#FBC2EB"],
    ["#96E6A1", "#D4FC79"],
    ["#FFD1FF", "#FAD0C4"],
    ["#A8EDEA", "#FED6E3"],
    ["#E2D1C3", "#FDE6E9"],
    ["#BFF098", "#6FD6FF"],
    ["#F6D5F7", "#FBE9D7"],
    ["#E6DEE9", "#CBD6E4"],
    ["#C2E9FB", "#A1C4FD"],
  ];

  const palette = palettes[Math.abs(hash) % palettes.length];

  const color1 = Color(palette[0]);
  const color2 = Color(palette[1]);

  const processColor = (color: ColorInstance) => {
    return isHovered
      ? color.darken(0.2).desaturate(0.1).toString()
      : color.darken(0.3).desaturate(0.2).toString();
  };

  return `linear-gradient(135deg,
    ${processColor(color1)} 0%,
    ${processColor(color2)} 100%)`;
}

export function getProjectEmoji(projectId: string): keyof typeof emojiMap {
  const emoji = Object.keys(emojiMap);

  const hash = projectId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return emoji[Math.abs(hash) % emoji.length] as keyof typeof emojiMap;
}

export function urlFromEmoji(emoji: keyof typeof emojiMap): string | undefined {
  const baseUrl = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets";
  const name = emojiMap[emoji as keyof typeof emojiMap];
  if (!name) return undefined;

  return `${baseUrl}/${name}/3D/${name.toLowerCase().replace(/\s+/g, "_")}_3d.png`;
}
