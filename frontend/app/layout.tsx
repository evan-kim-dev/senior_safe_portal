import type { Metadata, Viewport } from "next";
import { ChatDock } from "@/components/ChatDock";
import { PortalNav } from "@/components/PortalNav";
import { ShellSync } from "@/components/ShellSync";
import { SiteFooter } from "@/components/SiteFooter";
import { TextSize } from "@/components/TextSize";
import "./styles/components.css";

export const metadata: Metadata = {
  title: "이 링크, 괜찮나요?",
  description: "받은 주소가 괜찮은지 확인해 드립니다.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2B59FF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <ShellSync />
        <a className="skip-link" href="#main-content">본문 바로가기</a>
        <TextSize />
        <PortalNav />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <ChatDock />
      </body>
    </html>
  );
}
