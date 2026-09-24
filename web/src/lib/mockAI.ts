import { Channel, ChannelContent } from "./types";

// A deterministic-ish mock "AI" that fabricates channel content from campaign facts.
// Frontend only — simulates the structured JSON the real 千问 model would return.

export interface GenInput {
  productName: string;
  productDetail: string;
  price: number;
  originalPrice?: number;
  goal: string;
  brandName: string;
  address: string;
}

const goalCTA: Record<string, string> = {
  to_store: "导航到店，出示本条即享",
  orders: "点击下单，手慢无",
  inquiry: "私信「套餐」了解详情",
  trial: "评论区报名，免费体验",
};

const emojiPool = ["✨", "🔥", "💫", "🥢", "😋", "📍", "💛", "🎁"];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

export function genChannelContent(
  channel: Channel,
  input: GenInput,
  seed = 0
): ChannelContent {
  const priceLine = input.originalPrice
    ? `原价 ¥${input.originalPrice}，现价 ¥${input.price}`
    : `到手价 ¥${input.price}`;
  const cta = goalCTA[input.goal] ?? "了解更多";

  if (channel === "xiaohongshu") {
    return {
      channel,
      title: `${pick(emojiPool, seed)}${input.productName}也太值了吧！${priceLine}`,
      body: `姐妹们冲！${input.brandName} 新出的「${input.productName}」\n${input.productDetail}\n\n${priceLine}，性价比直接拉满～\n📍 ${input.address}\n真的很适合和朋友一起来，出片又好吃！`,
      tags: ["探店", input.productName, "宝藏小店", "美食推荐", "限时优惠"],
      cta,
      confirmed: false,
    };
  }
  if (channel === "moments") {
    return {
      channel,
      title: `${input.productName} 上新啦`,
      body: `【${input.brandName}】${input.productName} 来啦 ${pick(
        emojiPool,
        seed + 1
      )}\n${input.productDetail}\n${priceLine}\n${cta}`,
      tags: ["上新", "优惠"],
      cta,
      confirmed: false,
    };
  }
  // douyin
  return {
    channel,
    title: `${input.productName} 30秒种草脚本`,
    body: `【开场】“这家店的${input.productName}，我愿称之为本地天花板”\n【分镜1】商品特写 + ${input.productDetail}\n【分镜2】价格字幕：${priceLine}\n【口播】“${cta}”\n【结尾】定位：${input.address}`,
    tags: ["探店", "美食", input.productName],
    cta,
    confirmed: false,
  };
}

export function genAll(
  channels: Channel[],
  input: GenInput
): ChannelContent[] {
  return channels.map((c, i) => genChannelContent(c, input, i));
}
