import type { CampaignType } from "./types";
import { POSTER_STYLES, posterBackground, type PosterStyle } from "./poster-templates";
export { POSTER_STYLES, type PosterStyle } from "./poster-templates";

export const POSTER_W = 1080;
export const POSTER_H = 1440;


export interface PosterInput {
  style?: PosterStyle;
  layout: CampaignType;
  label: string;
  title: string;
  detail: string;
  price: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  brand: string;
  image?: string;
  images?: string[];
  category?: string;
  offer?: string;
  intent?: string;
}

type PosterPhoto = CanvasImageSource & { width: number; height: number };

export interface PosterDraw {
  titleTruncated: boolean;
  detailTruncated: boolean;
}

const FONT = '"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif';

function money(value: number) {
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const chars = Array.from(text.replace(/\s+/g, " ").trim());
  const lines: string[] = [];
  let current = "";
  let truncated = false;
  const pushEllipsis = (source: string) => {
    let fitted = source;
    while (fitted && ctx.measureText(`${fitted}…`).width > maxWidth) {
      fitted = fitted.slice(0, -1);
    }
    lines.push(`${fitted || source}…`);
  };
  for (let i = 0; i < chars.length; i++) {
    const next = current + chars[i];
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (lines.length >= maxLines - 1) {
      truncated = true;
      pushEllipsis(current || chars[i]);
      current = "";
      break;
    }
    if (current) lines.push(current);
    current = chars[i];
  }
  if (current) {
    if (lines.length < maxLines) lines.push(current);
    else truncated = true;
  }
  return { lines, truncated };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  image: string | undefined,
  photo: CanvasImageSource & { width: number; height: number } | null,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#1c1a27";
  ctx.fillRect(x, y, w, h);
  if (photo) drawCover(ctx, photo, x, y, w, h);
  else {
    ctx.fillStyle = "#f4f1ea";
    ctx.font = `200px "Segoe UI Emoji", ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(image || "♪", x + w / 2, y + h / 2);
  }
  ctx.restore();
}

function drawCollage(
  ctx: CanvasRenderingContext2D,
  fallback: string | undefined,
  photos: PosterPhoto[],
  x: number,
  y: number,
  w: number,
  h: number
) {
  const frames = photos.slice(0, 4);
  if (frames.length === 0) {
    drawMark(ctx, fallback, null, x, y, w, h);
    return;
  }
  const gap = 10;
  const boxes =
    frames.length === 1
      ? [{ x, y, w, h }]
      : frames.length === 2
        ? [
            { x, y, w: (w - gap) / 2, h },
            { x: x + (w + gap) / 2, y, w: (w - gap) / 2, h },
          ]
        : frames.length === 3
          ? [
              { x, y, w: w * 0.62, h },
              { x: x + w * 0.64, y, w: w * 0.36, h: (h - gap) / 2 },
              { x: x + w * 0.64, y: y + (h + gap) / 2, w: w * 0.36, h: (h - gap) / 2 },
            ]
          : [
              { x, y, w: (w - gap) / 2, h: (h - gap) / 2 },
              { x: x + (w + gap) / 2, y, w: (w - gap) / 2, h: (h - gap) / 2 },
              { x, y: y + (h + gap) / 2, w: (w - gap) / 2, h: (h - gap) / 2 },
              { x: x + (w + gap) / 2, y: y + (h + gap) / 2, w: (w - gap) / 2, h: (h - gap) / 2 },
            ];
  frames.forEach((photo, index) => {
    const box = boxes[index];
    drawMark(ctx, fallback, photo, box.x, box.y, box.w, box.h);
  });
}

function briefLine(input: PosterInput) {
  return [input.category, input.offer, input.intent].filter(Boolean).join("  ·  ");
}

function paintLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}

export function renderPoster(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  photos: PosterPhoto | PosterPhoto[] | null,
  background: PosterPhoto | null = null
): PosterDraw {
  const price = money(input.price);
  const dates = `${input.startDate} → ${input.endDate}`;
  const frames = Array.isArray(photos) ? photos.filter(Boolean) : photos ? [photos] : [];
  ctx.clearRect(0, 0, POSTER_W, POSTER_H);
  if (posterBackground(input.style)) return drawBackdropPoster(ctx, input, frames, background);
  if (input.style) return drawEditorial(ctx, input, frames, dates);
  if (input.layout === "combo") return drawCombo(ctx, input, frames, price, dates);
  if (input.layout === "festival") return drawFestival(ctx, input, frames, price, dates);
  return drawNewProduct(ctx, input, frames, price, dates);
}

function drawBackdropPoster(ctx: CanvasRenderingContext2D, input: PosterInput, photos: PosterPhoto[], background: PosterPhoto | null): PosterDraw {
  const theme = POSTER_STYLES.find((item) => item.id === input.style);
  if (!theme || !("background" in theme)) return drawEditorial(ctx, input, photos, `${input.startDate} → ${input.endDate}`);
  ctx.fillStyle = theme.color;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  if (background) drawCover(ctx, background, 0, 0, POSTER_W, POSTER_H);
  const headerShade = ctx.createLinearGradient(0, 0, 0, 350);
  headerShade.addColorStop(0, `${theme.color}b3`);
  headerShade.addColorStop(1, `${theme.color}00`);
  ctx.fillStyle = headerShade; ctx.fillRect(0, 0, POSTER_W, 350);
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  ctx.fillStyle = theme.ink;
  ctx.font = `26px ${FONT}`;
  ctx.fillText(`${input.category || input.label}  /  ${input.brand}`, 540, 65, 900);
  ctx.font = `bold 70px "KaiTi","STKaiti",${FONT}`;
  const title = wrapText(ctx, input.title, 900, 2);
  title.lines.forEach((line, i) => ctx.fillText(line, 540, 125 + i * 86));
  ctx.font = "italic 27px Georgia,serif";
  ctx.fillText(theme.en, 540, 145 + title.lines.length * 86, 900);

  // Photos remain the merchant's originals; framing changes, products are not invented.
  const frames = photos.slice(0, 4);
  if (frames.length) {
    const round = theme.composition === "round";
    const single = frames.length === 1;
    const boxes = single
      ? [{ x: round ? 180 : 100, y: 365, w: round ? 720 : 880, h: 720, angle: theme.composition === "polaroid" ? -.035 : theme.composition === "paper" ? -.015 : 0 }]
      : frames.length === 2
        ? [{x:75,y:360,w:610,h:540,angle:-.025},{x:475,y:700,w:530,h:390,angle:.035}]
        : [{x:65,y:355,w:575,h:430,angle:-.025},{x:670,y:400,w:340,h:350,angle:.025},{x:230,y:805,w:640,h:290,angle:-.015},{x:65,y:880,w:245,h:215,angle:.04}];
    frames.forEach((photo, i) => {
      const box = boxes[i];
      ctx.save();
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
      ctx.rotate(box.angle);
      ctx.shadowColor = "#17201555"; ctx.shadowBlur = 28; ctx.shadowOffsetY = 14;
      ctx.fillStyle = theme.paper;
      ctx.beginPath();
      if (round) ctx.ellipse(0, 0, box.w / 2 + 9, box.h / 2 + 9, 0, 0, Math.PI * 2);
      else ctx.rect(-box.w / 2 - 10, -box.h / 2 - 10, box.w + 20, box.h + (theme.composition === "polaroid" ? 46 : 20));
      ctx.fill(); ctx.shadowColor = "transparent";
      ctx.beginPath();
      if (round) ctx.ellipse(0, 0, box.w / 2, box.h / 2, 0, 0, Math.PI * 2);
      else ctx.rect(-box.w / 2, -box.h / 2, box.w, box.h);
      ctx.clip(); drawCover(ctx, photo, -box.w / 2, -box.h / 2, box.w, box.h);
      ctx.restore();
    });
  } else {
    ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = theme.ink;
    ctx.beginPath(); ctx.ellipse(540, 715, 350, 300, -.12, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = theme.ink; ctx.font = `100px "Segoe UI Emoji",${FONT}`;
    ctx.fillText(input.image && !input.image.startsWith("/") && input.image.length < 10 ? input.image : "✦", 540, 580, 600);
    ctx.font = `38px ${FONT}`; ctx.fillText(input.offer || input.category || input.label, 540, 780, 780);
  }
  const footerColor = theme.composition === "cinema" || theme.composition === "collage" ? theme.color : theme.paper;
  const footerShade = ctx.createLinearGradient(0, 1080, 0, 1440);
  footerShade.addColorStop(0, `${footerColor}00`);
  footerShade.addColorStop(.28, `${footerColor}d9`);
  footerShade.addColorStop(1, `${footerColor}f2`);
  ctx.fillStyle = footerShade; ctx.fillRect(0, 1080, POSTER_W, 360);
  ctx.fillStyle = theme.ink; ctx.textAlign = "left"; ctx.font = `bold 84px ${FONT}`;
  ctx.fillText(money(input.price), 80, 1150);
  ctx.font = `27px ${FONT}`;
  const detail = wrapText(ctx, input.detail, 590, 3);
  paintLines(ctx, detail.lines, 410, 1155, 38, theme.ink);
  ctx.strokeStyle = theme.ink; ctx.globalAlpha = .35; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(80, 1300); ctx.lineTo(1000, 1300); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.font = `bold 38px ${FONT}`; ctx.fillStyle = theme.ink;
  ctx.fillText(input.brand, 540, 1330, 900);
  ctx.font = `22px ${FONT}`; ctx.fillText(`${input.startDate} → ${input.endDate}`, 540, 1390, 900);
  return { titleTruncated: title.truncated, detailTruncated: detail.truncated };
}

function drawEditorial(ctx: CanvasRenderingContext2D, input: PosterInput, photos: PosterPhoto[], dates: string): PosterDraw {
  const theme = POSTER_STYLES.find((style) => style.id === input.style) || POSTER_STYLES[0];
  const paper = "#faf5df";
  ctx.fillStyle = theme.color;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  // A single merchant photograph stays intact. Multiple photos become an editorial collage.
  if (photos.length === 1) {
    drawCover(ctx, photos[0], 0, 0, POSTER_W, 1280);
    const shade = ctx.createLinearGradient(0, 0, 0, 1280);
    shade.addColorStop(0, theme.id === "charcoal" ? "#11150ff2" : `${theme.color}ef`);
    shade.addColorStop(.26, `${theme.color}40`);
    shade.addColorStop(.6, "#10170d08");
    shade.addColorStop(1, "#182310c9");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, POSTER_W, 1280);
  } else if (photos.length > 1) {
    const boxes = [{x:54,y:340,w:460,h:340,r:-.045},{x:560,y:400,w:466,h:340,r:.045},{x:190,y:770,w:700,h:440,r:-.025},{x:65,y:1020,w:300,h:220,r:.05}];
    photos.slice(0,4).forEach((photo,index) => {
      const b=boxes[index]; ctx.save(); ctx.translate(b.x+b.w/2,b.y+b.h/2); ctx.rotate(b.r);
      ctx.shadowColor="#10190e66"; ctx.shadowBlur=30; ctx.shadowOffsetY=12;
      ctx.fillStyle=paper; ctx.fillRect(-b.w/2-7,-b.h/2-7,b.w+14,b.h+14); ctx.shadowColor="transparent";
      drawCover(ctx,photo,-b.w/2,-b.h/2,b.w,b.h); ctx.restore();
    });
  }
  // Deterministic paper grain; export and preview render identically.
  ctx.save(); ctx.globalAlpha=.055;
  for(let i=0;i<4800;i++) { const x=(i*7919)%1080,y=(i*1543)%1280; ctx.fillStyle=i%2 ? "#ffffff":"#10170d"; ctx.fillRect(x,y,1.5,1.5); }
  ctx.restore();
  ctx.textAlign="center"; ctx.textBaseline="top"; ctx.fillStyle=paper;
  ctx.font=`30px ${FONT}`; ctx.fillText(`${input.category || input.label}  /  MENU STORIES`,540,58,900);
  ctx.font=`bold 78px "KaiTi","STKaiti",${FONT}`;
  const title=wrapText(ctx,input.title,900,2);
  title.lines.forEach((line,i)=>ctx.fillText(line,540,116+i*98));
  const ruleY=132+title.lines.length*98;
  ctx.font='italic 28px Georgia,serif'; ctx.fillText(theme.en,540,ruleY,900);
  ctx.strokeStyle=paper; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(160,ruleY+46); ctx.quadraticCurveTo(540,ruleY+58,920,ruleY+42); ctx.stroke();
  // Hand-drawn botanical flourishes and curved arrows, inspired by the supplied menus.
  const leaf=(x:number,y:number,flip:number) => { ctx.save(); ctx.translate(x,y); ctx.scale(flip,1); ctx.beginPath(); ctx.moveTo(0,0);ctx.quadraticCurveTo(15,-55,70,-75);ctx.quadraticCurveTo(66,-15,0,0);ctx.moveTo(0,0);ctx.lineTo(62,-65);ctx.moveTo(22,-22);ctx.lineTo(21,-48);ctx.moveTo(42,-43);ctx.lineTo(61,-42);ctx.stroke();ctx.restore(); };
  leaf(68,136,1);leaf(1012,320,-1);
  ctx.save();ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(920,910);ctx.bezierCurveTo(1020,950,1010,1050,950,1080);ctx.stroke();ctx.restore();
  ctx.beginPath();ctx.moveTo(950,1080);ctx.lineTo(957,1058);ctx.moveTo(950,1080);ctx.lineTo(974,1079);ctx.stroke();
  ctx.textAlign="left";
  ctx.fillStyle=paper;ctx.font=`bold 82px ${FONT}`;ctx.fillText(money(input.price),66,1120);
  if (input.originalPrice && input.originalPrice>input.price) {
    const original=money(input.originalPrice);ctx.font=`28px ${FONT}`;ctx.fillText(original,70,1213);
    ctx.beginPath();ctx.moveTo(70,1229);ctx.lineTo(70+ctx.measureText(original).width,1229);ctx.stroke();
  }
  ctx.font=`26px ${FONT}`;
  const detail=wrapText(ctx,input.detail,590,2);
  paintLines(ctx,detail.lines,420,1146,38,paper);
  ctx.fillStyle=theme.id === "charcoal" ? "#171b13":"#263e2c";ctx.fillRect(0,1280,1080,160);
  ctx.strokeStyle="#d6cda5";ctx.beginPath();ctx.moveTo(0,1280);ctx.quadraticCurveTo(530,1260,1080,1280);ctx.stroke();
  ctx.textAlign="center";ctx.fillStyle=paper;ctx.font=`bold 44px ${FONT}`;
  ctx.fillText(input.brand,540,1312,930);ctx.font=`22px ${FONT}`;ctx.fillText(dates,540,1380,930);
  return {titleTruncated:title.truncated,detailTruncated:detail.truncated};
}

function drawNewProduct(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  photos: PosterPhoto[],
  price: string,
  dates: string
): PosterDraw {
  ctx.fillStyle = "#0c0b12";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawCollage(ctx, input.image, photos, 0, 0, POSTER_W, 760);
  const fade = ctx.createLinearGradient(0, 560, 0, 760);
  fade.addColorStop(0, "rgba(12,11,18,0)");
  fade.addColorStop(1, "#0c0b12");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 560, POSTER_W, 200);

  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = "#a5b4fc";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(input.label, 72, 820);

  ctx.font = `bold 64px ${FONT}`;
  const title = wrapText(ctx, input.title, 936, 2);
  paintLines(ctx, title.lines, 72, 880, 78, "#f7f4ee");

  ctx.font = `34px ${FONT}`;
  const detail = wrapText(ctx, [input.detail, briefLine(input)].filter(Boolean).join(" · "), 936, 3);
  paintLines(ctx, detail.lines, 72, 1060, 48, "#b7b3c7");

  ctx.font = `bold 108px ${FONT}`;
  ctx.fillStyle = "#e4e7ff";
  ctx.fillText(price, 72, 1260);
  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = "#8d89a3";
  ctx.fillText(`${input.brand}  ·  ${dates}`, 72, 1376);
  return { titleTruncated: title.truncated, detailTruncated: detail.truncated };
}

function drawCombo(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  photos: PosterPhoto[],
  price: string,
  dates: string
): PosterDraw {
  ctx.fillStyle = "#100e18";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawCollage(ctx, input.image, photos, 0, 0, 620, POSTER_H);
  ctx.fillStyle = "#17151f";
  ctx.fillRect(620, 0, 460, POSTER_H);

  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = "#a5b4fc";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(input.label, 668, 96);

  ctx.font = `bold 92px ${FONT}`;
  ctx.fillStyle = "#f7f4ee";
  ctx.fillText(price, 668, 180);
  let cursor = 310;
  if (input.originalPrice) {
    const was = money(input.originalPrice);
    ctx.font = `36px ${FONT}`;
    ctx.fillStyle = "#8d89a3";
    ctx.fillText(was, 668, cursor);
    const width = ctx.measureText(was).width;
    ctx.strokeStyle = "#8d89a3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(668, cursor + 22);
    ctx.lineTo(668 + width, cursor + 22);
    ctx.stroke();
    cursor += 70;
  }

  ctx.font = `bold 44px ${FONT}`;
  const title = wrapText(ctx, input.title, 360, 4);
  paintLines(ctx, title.lines, 668, cursor + 20, 58, "#f7f4ee");
  cursor += 20 + title.lines.length * 58 + 28;

  ctx.font = `30px ${FONT}`;
  const detail = wrapText(ctx, [input.detail, briefLine(input)].filter(Boolean).join(" · "), 360, 5);
  paintLines(ctx, detail.lines, 668, cursor, 42, "#b7b3c7");

  ctx.font = `26px ${FONT}`;
  ctx.fillStyle = "#8d89a3";
  ctx.fillText(dates, 668, 1288);
  ctx.fillText(input.brand, 668, 1336);
  return { titleTruncated: title.truncated, detailTruncated: detail.truncated };
}

function drawFestival(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  photos: PosterPhoto[],
  price: string,
  dates: string
): PosterDraw {
  const bg = ctx.createLinearGradient(0, 0, 0, POSTER_H);
  bg.addColorStop(0, "#241838");
  bg.addColorStop(1, "#0c0b12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  ctx.fillStyle = "#5e6ad2";
  ctx.fillRect(0, 0, POSTER_W, 150);
  ctx.font = `bold 36px ${FONT}`;
  ctx.fillStyle = "#f7f4ee";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(dates, POSTER_W / 2, 78);

  ctx.font = `bold 28px ${FONT}`;
  ctx.fillStyle = "#c7d2fe";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(input.label, 80, 196);

  drawCollage(ctx, input.image, photos, 80, 270, 920, 620);

  ctx.font = `bold 58px ${FONT}`;
  const title = wrapText(ctx, input.title, 920, 2);
  paintLines(ctx, title.lines, 80, 930, 72, "#f7f4ee");

  ctx.font = `32px ${FONT}`;
  const detail = wrapText(ctx, [input.detail, briefLine(input)].filter(Boolean).join(" · "), 920, 2);
  paintLines(ctx, detail.lines, 80, 1090, 46, "#b7b3c7");

  ctx.font = `bold 96px ${FONT}`;
  ctx.fillStyle = "#e4e7ff";
  ctx.fillText(price, 80, 1220);
  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = "#8d89a3";
  ctx.fillText(input.brand, 80, 1348);
  return { titleTruncated: title.truncated, detailTruncated: detail.truncated };
}

export async function capturePosterPng(input: PosterInput) {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_W;
  canvas.height = POSTER_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const sources = input.images?.length ? input.images : input.image ? [input.image] : [];
  const photos = (await Promise.all(sources.map((src) => loadPosterPhoto(src)))).filter(
    (photo): photo is HTMLImageElement => Boolean(photo)
  );
  const background = await loadPosterPhoto(posterBackground(input.style));
  renderPoster(ctx, input, photos, background);
  return canvas.toDataURL("image/png");
}

export function loadPosterPhoto(src?: string) {
  if (!src || !(src.startsWith("data:") || src.startsWith("/api/files/") || src.startsWith("/poster-backgrounds/") || src.startsWith("http"))) {
    return Promise.resolve(null);
  }
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
