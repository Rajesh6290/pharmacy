import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Truck,
  Award,
  Heart,
} from "lucide-react";

const TRUST_BADGES = [
  {
    icon: <Shield size={22} className="text-tertiary-400" />,
    title: "100% Authentic",
    sub: "All medicines verified & licensed",
  },
  {
    icon: <Truck size={22} className="text-tertiary-400" />,
    title: "Fast Delivery",
    sub: "Same-day delivery available",
  },
  {
    icon: <Award size={22} className="text-tertiary-400" />,
    title: "25+ Years Trust",
    sub: "Serving the community since 1999",
  },
  {
    icon: <Heart size={22} className="text-tertiary-400" />,
    title: "Expert Pharmacists",
    sub: "Licensed pharmacists on call",
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-accent-900 text-white">
      {/* Trust bar */}
      <div className="border-accent-800 border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {TRUST_BADGES.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-accent-500 mt-0.5 text-xs">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Image
              src="/logo.svg"
              alt="Sidheswar Drugs House"
              width={150}
              height={50}
              className="mb-4 h-12 w-auto brightness-0 invert"
            />
            <p className="text-accent-400 mt-2 max-w-xs text-sm leading-relaxed">
              Your trusted local pharmacy — quality medicines, expert care, and
              seamless online ordering since 1999.
            </p>
            <div className="mt-5 space-y-2.5">
              <a
                href="tel:+919876543210"
                className="text-accent-400 hover:text-tertiary-300 flex items-center gap-2.5 text-sm transition-colors"
              >
                <Phone size={14} className="text-tertiary-400 shrink-0" />
                +91 98765 43210
              </a>
              <a
                href="mailto:info@sidheswardrugs.com"
                className="text-accent-400 hover:text-tertiary-300 flex items-center gap-2.5 text-sm transition-colors"
              >
                <Mail size={14} className="text-tertiary-400 shrink-0" />
                info@sidheswardrugs.com
              </a>
              <div className="text-accent-400 flex items-start gap-2.5 text-sm">
                <MapPin
                  size={14}
                  className="text-tertiary-400 mt-0.5 shrink-0"
                />
                Sidheswar Drugs House, Main Road, Odisha, India
              </div>
              <div className="text-accent-400 flex items-center gap-2.5 text-sm">
                <Clock size={14} className="text-tertiary-400 shrink-0" />
                Mon–Sat: 8:00 AM – 9:00 PM
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-accent-300 mb-5 text-xs font-bold tracking-widest uppercase">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Home", href: "/" },
                { label: "Medicine Store", href: "/store" },
                { label: "Products", href: "/products" },
                { label: "My Cart", href: "/cart" },
                { label: "My Orders", href: "/users" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-accent-400 hover:text-tertiary-300 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-accent-300 mb-5 text-xs font-bold tracking-widest uppercase">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {[
                "Tablet",
                "Capsule",
                "Syrup",
                "Injection",
                "Vitamins",
                "Cream/Ointment",
                "Inhaler",
                "Powder",
              ].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/store?category=${encodeURIComponent(cat)}`}
                    className="text-accent-400 hover:text-tertiary-300 text-sm transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy & Account */}
          <div>
            <h3 className="text-accent-300 mb-5 text-xs font-bold tracking-widest uppercase">
              Account & Policy
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: "Login", href: "/login" },
                { label: "Register", href: "/register" },
                { label: "FAQ", href: "/faq" },
                {
                  label: "Terms & Conditions",
                  href: "/terms-and-conditions",
                },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-accent-400 hover:text-tertiary-300 text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment methods */}
            <div className="mt-8">
              <h3 className="text-accent-300 mb-3 text-xs font-bold tracking-widest uppercase">
                Secure Payments
              </h3>
              <div className="flex flex-wrap gap-2">
                {["UPI", "Cards", "NetBanking", "Wallets", "COD"].map((p) => (
                  <span
                    key={p}
                    className="border-accent-700 text-accent-400 rounded border px-2 py-0.5 text-[10px] font-medium"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-accent-800 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-accent-500 text-xs">
            © {year} Sidheswar Drugs House. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="text-accent-500 text-xs">
              GSTIN: 21XXXXX0000X1Z5
            </span>
            <span className="text-accent-700">·</span>
            <span className="text-accent-500 text-xs">
              Licensed Pharmacy · Odisha, India
            </span>
            <span className="text-accent-700">·</span>
            <span className="bg-primary-800 text-primary-200 rounded px-2 py-0.5 text-[10px] font-semibold">
              Powered by Razorpay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
