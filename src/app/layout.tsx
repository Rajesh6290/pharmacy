import type { Metadata } from "next";
import { Work_Sans, Geist_Mono } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/shared/hooks/AuthProvider";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sidheshwardrugshouse.com";
const SITE_NAME = "Sidheswar Drugs House";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Buy genuine medicines online from Sidheswar Drugs House. Prescription upload, fast delivery, and trusted pharmacy service.",
  keywords:
    "pharmacy, medicine, buy medicine online, prescription pharmacy, Sidheswar Drugs House, online pharmacy India",
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Buy genuine medicines online from Sidheswar Drugs House. Prescription upload, fast delivery, and trusted pharmacy service.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Online Pharmacy`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Buy genuine medicines online from Sidheswar Drugs House.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${workSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
