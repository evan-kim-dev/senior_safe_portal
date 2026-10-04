import type { Metadata, Viewport } from "next";
import { ChatDock } from "@/components/ChatDock";
import { PortalNav } from "@/components/PortalNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TextSize } from "@/components/TextSize";
import "./styles/components.css";

export const metadata: Metadata = {
  title: "이 링크, 괜찮나요?",
  description: "받은 주소가 괜찮은지 확인해 드립니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2B59FF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <TextSize />
        <PortalNav />
        {children}
        <SiteFooter />
        <ChatDock />
      </body>
    </html>
  );
}
