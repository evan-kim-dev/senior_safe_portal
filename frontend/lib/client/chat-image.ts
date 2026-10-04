const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.82;
const MAX_BASE64_CHARS = 900_000;

export const CHAT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export type ChatImagePayload = {
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  data: string;
  previewUrl: string;
  name: string;
};

function isAllowedMime(value: string): value is ChatImagePayload["mimeType"] {
  return value === "image/jpeg" || value === "image/png" || value === "image/webp" || value === "image/gif";
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load-failed"));
    };
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<{ data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("encode-failed"));
          return;
        }
        const previewUrl = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onload = () => {
          const result = typeof reader.result === "string" ? reader.result : "";
          const comma = result.indexOf(",");
          const data = comma >= 0 ? result.slice(comma + 1) : "";
          if (!data) {
            URL.revokeObjectURL(previewUrl);
            reject(new Error("encode-failed"));
            return;
          }
          resolve({ data, previewUrl });
        };
        reader.onerror = () => {
          URL.revokeObjectURL(previewUrl);
          reject(new Error("encode-failed"));
        };
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

/** 채팅용으로 사진을 줄여 JPEG base64 로 만든다. */
export async function prepareChatImage(file: File): Promise<ChatImagePayload> {
  if (!isAllowedMime(file.type)) {
    throw new Error("unsupported");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("encode-failed");
  context.drawImage(image, 0, 0, width, height);

  const { data, previewUrl } = await canvasToJpeg(canvas);
  if (data.length > MAX_BASE64_CHARS) {
    URL.revokeObjectURL(previewUrl);
    throw new Error("too-large");
  }

  return {
    mimeType: "image/jpeg",
    data,
    previewUrl,
    name: file.name || "사진.jpg",
  };
}
