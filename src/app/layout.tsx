import type { Metadata, Viewport } from "next";
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { SURVEY } from "@/lib/config";

const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "600", "700"], variable: "--font-devanagari" });
const latin = Noto_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-latin" });

export const metadata: Metadata = {
  title: `${SURVEY.title} — ${SURVEY.village}`,
  description: "ग्राम कुम्हारिया के चुनाव पर अनौपचारिक जनमत सर्वेक्षण। यह आधिकारिक मतदान नहीं है।",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const year = new Date().getFullYear();
  const tel = SURVEY.helpline.replace(/[^0-9+]/g, "");
  return (
    <html lang="hi" className={`${devanagari.variable} ${latin.variable}`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&display=block"
        />
      </head>
      <body>
        <header className="site-header sticky-top">
          <div className="tricolor-bar"><span /><span /><span /></div>
          <div className="header-row container-xl d-flex align-items-center justify-content-between gap-3">
            <a className="brand d-flex align-items-center gap-3 text-decoration-none" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`}>
              <span className="brand-seal"><span className="material-symbols-outlined">account_balance</span></span>
              <span className="d-flex flex-column">
                <span className="brand-title">{SURVEY.village}</span>
                <span className="brand-sub d-none d-sm-block">ग्राम जनमत मंच • स्वतंत्र नागरिक विचार एवं ओपिनियन पोल</span>
              </span>
            </a>
            {SURVEY.helpline && (
              <a className="helpline d-none d-lg-flex align-items-center gap-2 text-decoration-none" href={`tel:${tel}`}>
                <span className="material-symbols-outlined">call</span>
                <span className="d-flex flex-column">
                  <span className="helpline-label">नागरिक सहायता</span>
                  <span className="helpline-number">{SURVEY.helpline}</span>
                </span>
              </a>
            )}
          </div>
        </header>
        <div className="status-strip">
          <div className="container-xl d-flex flex-column flex-md-row align-items-center justify-content-between gap-1">
            <span className="d-flex align-items-center gap-2">
              <span className="live-dot" aria-hidden="true" />
              अनौपचारिक ग्राम जनमत सर्वेक्षण {year} • स्वतंत्र सामुदायिक राय
            </span>
            <span className="d-flex align-items-center gap-3">
              <span className="pill pill-live"><span className="material-symbols-outlined">poll</span> सर्वेक्षण सक्रिय है (Poll is Live)</span>
              <span className="strip-muted d-none d-sm-inline-flex align-items-center gap-1">
                <span className="material-symbols-outlined">group</span> सार्वजनिक सहभागिता
              </span>
            </span>
          </div>
        </div>
        <main className="container-xl py-4">{children}</main>
        <footer className="site-footer">
          <div className="container-xl py-4 d-flex flex-column flex-md-row justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="brand-seal small-seal"><span className="material-symbols-outlined">shield</span></span>
              <div>
                <div className="fw-semibold">ग्राम जनमत सर्वेक्षण एवं सामुदायिक संवाद मंच</div>
                <div className="text-muted small">{SURVEY.village} — स्वतंत्र, गैर-सरकारी सर्वेक्षण</div>
              </div>
            </div>
            <div className="text-muted small align-self-md-center">
              © {year} {SURVEY.title}। यह आधिकारिक चुनाव या राज्य निर्वाचन आयोग का मतदान नहीं है।
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
