import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { ChatDock } from "@/components/ChatDock";
import { PortalNav } from "@/components/PortalNav";
import { ShellSync } from "@/components/ShellSync";
import { SiteFooter } from "@/components/SiteFooter";
import { TextSize } from "@/components/TextSize";
import { WebAppInstallGuide } from "@/components/WebAppInstallGuide";
import "./styles/components.css";

export const metadata: Metadata = {
  title: {
    default: "시니어 안심",
    template: "%s · 시니어 안심",
  },
  description: "받은 주소가 괜찮은지 확인해 드립니다.",
  applicationName: "시니어 안심",
  appleWebApp: {
    capable: true,
    title: "시니어 안심",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body data-nonce={nonce || undefined}>
        <ShellSync />
        <a className="skip-link" href="#main-content">본문 바로가기</a>
        <TextSize />
        <PortalNav />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <ChatDock />
        <WebAppInstallGuide />
      </body>
    </html>
  );
}
