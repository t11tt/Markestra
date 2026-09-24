import type { CampaignType } from "./types";

export const POSTER_W = 1080;
export const POSTER_H = 1440;

export interface PosterInput {
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
}

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
  photo: (CanvasImageSource & { width: number; height: number }) | null
): PosterDraw {
  const price = money(input.price);
  const dates = `${input.startDate} → ${input.endDate}`;
  ctx.clearRect(0, 0, POSTER_W, POSTER_H);
  if (input.layout === "combo") return drawCombo(ctx, input, photo, price, dates);
  if (input.layout === "festival") return drawFestival(ctx, input, photo, price, dates);
  return drawNewProduct(ctx, input, photo, price, dates);
}

function drawNewProduct(
  ctx: CanvasRenderingContext2D,
  input: PosterInput,
  photo: (CanvasImageSource & { width: number; height: number }) | null,
  price: string,
  dates: string
): PosterDraw {
  ctx.fillStyle = "#0c0b12";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawMark(ctx, input.image, photo, 0, 0, POSTER_W, 760);
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
  const detail = wrapText(ctx, input.detail, 936, 3);
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
  photo: (CanvasImageSource & { width: number; height: number }) | null,
  price: string,
  dates: string
): PosterDraw {
  ctx.fillStyle = "#100e18";
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  drawMark(ctx, input.image, photo, 0, 0, 620, POSTER_H);
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
  const detail = wrapText(ctx, input.detail, 360, 5);
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
  photo: (CanvasImageSource & { width: number; height: number }) | null,
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

  drawMark(ctx, input.image, photo, 80, 270, 920, 620);

  ctx.font = `bold 58px ${FONT}`;
  const title = wrapText(ctx, input.title, 920, 2);
  paintLines(ctx, title.lines, 80, 930, 72, "#f7f4ee");

  ctx.font = `32px ${FONT}`;
  const detail = wrapText(ctx, input.detail, 920, 2);
  paintLines(ctx, detail.lines, 80, 1090, 46, "#b7b3c7");

  ctx.font = `bold 96px ${FONT}`;
  ctx.fillStyle = "#e4e7ff";
  ctx.fillText(price, 80, 1220);
  ctx.font = `28px ${FONT}`;
  ctx.fillStyle = "#8d89a3";
  ctx.fillText(input.brand, 80, 1348);
  return { titleTruncated: title.truncated, detailTruncated: detail.truncated };
}

export function loadPosterPhoto(src?: string) {
  if (!src || !src.startsWith("data:")) return Promise.resolve(null);
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
