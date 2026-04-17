import type { ProductAssetPreviewMap } from "./product-asset-preview.types";

function createPreviewSvg({
  title,
  subtitle,
  palette,
  width,
  height,
}: {
  title: string;
  subtitle: string;
  palette: { background: string; accent: string; text: string };
  width: number;
  height: number;
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${palette.background}" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" rx="28" fill="url(#g)" />
      <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="24" fill="rgba(255,255,255,0.72)" />
      <circle cx="${width * 0.72}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.16}" fill="rgba(255,255,255,0.32)" />
      <text x="56" y="${height * 0.34}" fill="${palette.text}" font-size="${Math.max(20, width * 0.06)}" font-family="Georgia, serif" font-weight="700">${title}</text>
      <text x="56" y="${height * 0.46}" fill="${palette.text}" font-size="${Math.max(12, width * 0.03)}" font-family="Arial, sans-serif">${subtitle}</text>
      <rect x="56" y="${height * 0.58}" width="${width * 0.42}" height="${height * 0.16}" rx="18" fill="rgba(255,255,255,0.85)" />
      <rect x="${width * 0.56}" y="${height * 0.54}" width="${width * 0.22}" height="${height * 0.2}" rx="22" fill="rgba(87,52,34,0.22)" />
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const productAssetPreviewMock: ProductAssetPreviewMap = {
  "spu-hanger-coffee": {
    douyin: {
      cover: {
        title: "抖音封面主视觉",
        caption: "更强主视觉和更快信息节奏，突出礼盒转化感。",
        image: {
          id: "douyin-cover-hero",
          label: "抖音礼盒主视觉",
          previewUrl: createPreviewSvg({
            title: "Gift Box Drop",
            subtitle: "爆款礼盒 · 春季限定",
            palette: {
              background: "#f2d8c2",
              accent: "#a34f2a",
              text: "#3f1d12",
            },
            width: 1200,
            height: 900,
          }),
          width: 1200,
          height: 900,
          status: "ready",
        },
      },
      gallery: {
        title: "抖音卖点组图",
        caption: "卖点更直接，强调风味、礼盒结构和场景利益点。",
        items: [
          {
            id: "douyin-gallery-1",
            label: "礼盒冲击图",
            previewUrl: createPreviewSvg({
              title: "礼盒开场",
              subtitle: "首屏抓眼 + 节日送礼",
              palette: {
                background: "#f7e2d1",
                accent: "#b85d35",
                text: "#442314",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "douyin-gallery-2",
            label: "风味卖点卡",
            previewUrl: createPreviewSvg({
              title: "花果坚果",
              subtitle: "双风味直接表达",
              palette: {
                background: "#f4ded0",
                accent: "#8f4d30",
                text: "#3b2115",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "douyin-gallery-3",
            label: "场景利益点",
            previewUrl: createPreviewSvg({
              title: "办公室送礼",
              subtitle: "节奏快、利益点明确",
              palette: {
                background: "#f6e4d8",
                accent: "#aa6a46",
                text: "#46281b",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
        ],
      },
      detail: {
        title: "抖音详情长图",
        caption: "更短、更直接，适合快速浏览后转化。",
        sections: [
          {
            id: "douyin-detail-1",
            label: "核心卖点段",
            previewUrl: createPreviewSvg({
              title: "核心卖点",
              subtitle: "冷萃工艺与风味亮点",
              palette: {
                background: "#f4e4d2",
                accent: "#9f6843",
                text: "#4b3022",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "douyin-detail-2",
            label: "冲泡说明段",
            previewUrl: createPreviewSvg({
              title: "冲泡说明",
              subtitle: "水量、时间与口味建议",
              palette: {
                background: "#efe1d2",
                accent: "#875635",
                text: "#40291b",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "douyin-detail-3",
            label: "礼盒细节段",
            previewUrl: createPreviewSvg({
              title: "礼盒细节",
              subtitle: "包装、送礼与收纳信息",
              palette: {
                background: "#f6eadf",
                accent: "#ab7851",
                text: "#4a3024",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
    wechat: {
      cover: {
        title: "视频号场景封面",
        caption: "更克制的生活方式封面，降低促销感。",
        image: {
          id: "wechat-cover-hero",
          label: "视频号场景封面",
          previewUrl: createPreviewSvg({
            title: "Morning Ritual",
            subtitle: "桌面场景 · 温和内容感",
            palette: {
              background: "#dfe8e1",
              accent: "#76917f",
              text: "#2e4036",
            },
            width: 1200,
            height: 900,
          }),
          width: 1200,
          height: 900,
          status: "ready",
        },
      },
      gallery: {
        title: "视频号生活方式组图",
        caption: "强调饮用场景、桌面氛围和阅读感。",
        items: [
          {
            id: "wechat-gallery-1",
            label: "桌面场景图",
            previewUrl: createPreviewSvg({
              title: "桌面一角",
              subtitle: "早餐、办公与轻内容感",
              palette: {
                background: "#e6efe7",
                accent: "#7f9e87",
                text: "#304438",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "wechat-gallery-2",
            label: "风味叙事图",
            previewUrl: createPreviewSvg({
              title: "风味故事",
              subtitle: "花果香与坚果尾韵",
              palette: {
                background: "#e2eadf",
                accent: "#8ba28f",
                text: "#334439",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "wechat-gallery-3",
            label: "轻送礼图",
            previewUrl: createPreviewSvg({
              title: "轻礼赠送",
              subtitle: "适合分享和内容阅读",
              palette: {
                background: "#edf2ea",
                accent: "#90a695",
                text: "#334338",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
        ],
      },
      detail: {
        title: "视频号详情长图",
        caption: "更连续的内容阅读节奏，强调场景和故事感。",
        sections: [
          {
            id: "wechat-detail-1",
            label: "场景开篇段",
            previewUrl: createPreviewSvg({
              title: "场景开篇",
              subtitle: "晨间、办公与分享",
              palette: {
                background: "#e6eee7",
                accent: "#799482",
                text: "#304238",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "wechat-detail-2",
            label: "内容叙事段",
            previewUrl: createPreviewSvg({
              title: "内容叙事",
              subtitle: "风味、工艺与生活方式",
              palette: {
                background: "#e3eadf",
                accent: "#889f8d",
                text: "#334439",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "wechat-detail-3",
            label: "收束段",
            previewUrl: createPreviewSvg({
              title: "内容收束",
              subtitle: "更适合连续阅读的收尾",
              palette: {
                background: "#edf1ea",
                accent: "#9aaea0",
                text: "#34453a",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
  },
  "spu-jasmine-tea": {
    douyin: {
      cover: {
        title: "抖音直播间封面",
        caption: "突出冲泡效率和直播讲解节奏，强调一瓶多杯的利益点。",
        image: {
          id: "tea-douyin-cover",
          label: "抖音轻乳茶主视觉",
          previewUrl: createPreviewSvg({
            title: "Milk Tea Boost",
            subtitle: "一瓶做四杯 · 直播间主推",
            palette: {
              background: "#f6e4c8",
              accent: "#d68f3f",
              text: "#5a3313",
            },
            width: 1200,
            height: 900,
          }),
          width: 1200,
          height: 900,
          status: "ready",
        },
      },
      gallery: {
        title: "抖音卖点组图",
        caption: "更直接地拆出风味、冲泡效率和组合售卖利益点。",
        items: [
          {
            id: "tea-douyin-gallery-1",
            label: "风味利益图",
            previewUrl: createPreviewSvg({
              title: "茉莉奶香",
              subtitle: "前调清香 · 尾段顺滑",
              palette: {
                background: "#f8ead2",
                accent: "#d89d54",
                text: "#59391a",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "tea-douyin-gallery-2",
            label: "冲泡效率图",
            previewUrl: createPreviewSvg({
              title: "30 秒出杯",
              subtitle: "直播间讲解更直接",
              palette: {
                background: "#f7e7d7",
                accent: "#cb8240",
                text: "#5a3518",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "tea-douyin-gallery-3",
            label: "组合售卖图",
            previewUrl: createPreviewSvg({
              title: "双瓶更划算",
              subtitle: "拉高客单的直播组合",
              palette: {
                background: "#faeddc",
                accent: "#d49a5a",
                text: "#5f3b1f",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
        ],
      },
      detail: {
        title: "抖音详情长图",
        caption: "段落更短，优先服务直播讲解和快速成交。",
        sections: [
          {
            id: "tea-douyin-detail-1",
            label: "核心转化段",
            previewUrl: createPreviewSvg({
              title: "核心转化",
              subtitle: "一瓶多杯 + 茉莉轻乳感",
              palette: {
                background: "#f8ebd5",
                accent: "#c98f4c",
                text: "#5a3518",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "tea-douyin-detail-2",
            label: "冲泡流程段",
            previewUrl: createPreviewSvg({
              title: "冲泡流程",
              subtitle: "加冰、加水、摇匀即可",
              palette: {
                background: "#f9efdf",
                accent: "#d7a163",
                text: "#624122",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "tea-douyin-detail-3",
            label: "规格权益段",
            previewUrl: createPreviewSvg({
              title: "规格权益",
              subtitle: "单瓶、双瓶、礼盒三档展示",
              palette: {
                background: "#f6ead9",
                accent: "#cf9454",
                text: "#5b391c",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
    wechat: {
      cover: {
        title: "视频号茶饮封面",
        caption: "更偏内容封面，强调茶饮场景和柔和阅读感。",
        image: {
          id: "tea-wechat-cover",
          label: "视频号轻乳茶封面",
          previewUrl: createPreviewSvg({
            title: "Tea Moments",
            subtitle: "轻乳茶场景 · 柔和叙事",
            palette: {
              background: "#e6efd9",
              accent: "#89a85f",
              text: "#34451d",
            },
            width: 1200,
            height: 900,
          }),
          width: 1200,
          height: 900,
          status: "ready",
        },
      },
      gallery: {
        title: "视频号生活方式组图",
        caption: "更强调瓶身质感、饮用场景和风味叙事。",
        items: [
          {
            id: "tea-wechat-gallery-1",
            label: "瓶身场景图",
            previewUrl: createPreviewSvg({
              title: "瓶身细节",
              subtitle: "桌面陈列与晨间饮用",
              palette: {
                background: "#edf3e3",
                accent: "#93aa73",
                text: "#33441f",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "tea-wechat-gallery-2",
            label: "风味叙事图",
            previewUrl: createPreviewSvg({
              title: "茉莉风味",
              subtitle: "茶感、奶感与尾段平衡",
              palette: {
                background: "#e8efdf",
                accent: "#84a066",
                text: "#34441f",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
          {
            id: "tea-wechat-gallery-3",
            label: "分享场景图",
            previewUrl: createPreviewSvg({
              title: "轻分享",
              subtitle: "办公室与下午茶场景",
              palette: {
                background: "#eef4e8",
                accent: "#9aaf7f",
                text: "#364522",
              },
              width: 900,
              height: 900,
            }),
            width: 900,
            height: 900,
            status: "ready",
          },
        ],
      },
      detail: {
        title: "视频号详情长图",
        caption: "更连续的阅读节奏，突出茶饮故事感和使用场景。",
        sections: [
          {
            id: "tea-wechat-detail-1",
            label: "内容开篇段",
            previewUrl: createPreviewSvg({
              title: "内容开篇",
              subtitle: "一杯轻乳茶的日常切入",
              palette: {
                background: "#eef4e5",
                accent: "#8aa36b",
                text: "#34431f",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "tea-wechat-detail-2",
            label: "风味说明段",
            previewUrl: createPreviewSvg({
              title: "风味说明",
              subtitle: "茉莉清香与轻乳尾韵",
              palette: {
                background: "#e8efdf",
                accent: "#93a97a",
                text: "#354320",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
          {
            id: "tea-wechat-detail-3",
            label: "场景收束段",
            previewUrl: createPreviewSvg({
              title: "场景收束",
              subtitle: "适合复购与日常分享的结尾",
              palette: {
                background: "#f1f5ea",
                accent: "#9eb389",
                text: "#384624",
              },
              width: 1200,
              height: 1600,
            }),
            width: 1200,
            height: 1600,
            status: "ready",
          },
        ],
      },
    },
  },
};
