export const POSTER_STYLES = [
  { id: "tea", name: "青瓷茶席", en: "Tea atelier", color: "#899578" },
  { id: "charcoal", name: "炭火夜食", en: "After dark", color: "#24251f" },
  { id: "nanyang", name: "南洋午后", en: "Nanyang afternoon", color: "#58613b" },
  { id: "lime", name: "夏日青柠", en: "Summer table", color: "#698443" },
  { id: "mist-garden", name: "雾绿茶庭", en: "A quiet moment", color: "#9ba98b", background: "/poster-backgrounds/mist-garden.webp", ink: "#30402d", paper: "#f1f0df", composition: "paper" },
  { id: "ember-night", name: "炭火夜宴", en: "Stay for the evening", color: "#25231e", background: "/poster-backgrounds/ember-night.webp", ink: "#f6ead1", paper: "#24241f", composition: "cinema" },
  { id: "tropical-noon", name: "南洋晴昼", en: "Slow afternoons", color: "#677244", background: "/poster-backgrounds/tropical-noon.webp", ink: "#f7f0d8", paper: "#f6efd9", composition: "collage" },
  { id: "citrus-breeze", name: "青柠海风", en: "Fresh little moments", color: "#c4dbca", background: "/poster-backgrounds/citrus-breeze.webp", ink: "#264e42", paper: "#e9f0dc", composition: "round" },
  { id: "butter-studio", name: "奶油烘焙", en: "Made for a sweet day", color: "#e6d5b3", background: "/poster-backgrounds/butter-studio.webp", ink: "#684634", paper: "#fff9ea", composition: "polaroid" },
] as const;

export type PosterStyle = typeof POSTER_STYLES[number]["id"];
export function isPosterStyle(value: unknown): value is PosterStyle {
  return POSTER_STYLES.some((style) => style.id === value);
}
export function posterBackground(style?: PosterStyle) {
  const template = POSTER_STYLES.find((item) => item.id === style);
  return template && "background" in template ? template.background : undefined;
}

export function nextPosterStyle(previous?: string): PosterStyle {
  const options = POSTER_STYLES.filter((style) => "background" in style && style.id !== previous);
  return options[Math.floor(Math.random() * options.length)].id;
}
