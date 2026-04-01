"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  Search,
  Upload,
  ChevronDown,
  Package,
  Home,
  Pill,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream/Ointment",
  "Drops",
  "Powder",
  "Inhaler",
  "Vitamins",
];

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/store?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Announcement strip */}
      <div className="bg-primary-700 text-primary-100 px-4 py-1.5 text-center text-xs font-medium">
        🚚 Free delivery on orders above ₹499 &nbsp;·&nbsp; Open Mon–Sat 8 AM –
        9 PM
      </div>

      {/* Main row */}
      <div className="border-accent-100 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              alt="Sidheswar Drugs House"
              width={140}
              height={46}
              priority
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden flex-1 md:flex">
            <div className="relative w-full">
              <Search
                size={16}
                className="text-accent-400 absolute top-1/2 left-4 -translate-y-1/2"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for medicines, health products, vitamins…"
                className="border-accent-200 focus:border-primary-500 focus:ring-primary-100 bg-accent-50 w-full rounded-full border py-2.5 pr-24 pl-11 text-sm transition outline-none focus:ring-2"
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full px-5 py-1.5 text-xs font-bold text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Upload Rx */}
            <Link
              href="/prescription"
              className="border-primary-400 text-primary-600 hover:bg-primary-50 hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:flex"
            >
              <Upload size={13} /> Upload Rx
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="text-accent-600 hover:text-primary-600 hover:bg-accent-50 relative rounded-full p-2 transition"
            >
              <ShoppingCart size={21} />
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="border-accent-200 hover:border-primary-300 hover:text-primary-600 text-accent-700 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition"
                >
                  <div className="bg-primary-100 text-primary-700 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden max-w-[72px] truncate sm:block">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown size={13} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="border-accent-200 absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border bg-white shadow-2xl"
                    >
                      <div className="border-accent-100 border-b px-4 py-3">
                        <p className="text-accent-900 truncate text-sm font-semibold">
                          {user?.name}
                        </p>
                        <p className="text-accent-400 truncate text-xs">
                          {user?.email}
                        </p>
                      </div>
                      {user?.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="text-accent-700 hover:bg-accent-50 flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                        >
                          <Package size={15} /> Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/users"
                        onClick={() => setUserMenuOpen(false)}
                        className="text-accent-700 hover:bg-accent-50 flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      >
                        <ClipboardList size={15} /> My Orders
                      </Link>
                      <Link
                        href="/cart"
                        onClick={() => setUserMenuOpen(false)}
                        className="text-accent-700 hover:bg-accent-50 flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      >
                        <ShoppingCart size={15} /> My Cart
                      </Link>
                      <div className="border-accent-100 border-t" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="text-error-600 hover:bg-error-50 flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className="text-accent-700 hover:text-primary-600 hover:bg-accent-50 rounded-full px-3 py-1.5 text-sm font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-500 hover:bg-primary-600 rounded-full px-4 py-1.5 text-sm font-bold text-white transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="text-accent-600 hover:bg-accent-50 rounded-lg p-2 transition md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form
          onSubmit={handleSearch}
          className="border-accent-100 border-t px-4 pt-2 pb-3 md:hidden"
        >
          <div className="relative">
            <Search
              size={15}
              className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines…"
              className="border-accent-200 focus:border-primary-400 bg-accent-50 w-full rounded-full border py-2 pr-16 pl-9 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-primary-500 absolute top-1/2 right-1 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold text-white"
            >
              Go
            </button>
          </div>
        </form>
      </div>

      {/* Category quick-links bar */}
      <div className="border-accent-100 hidden overflow-x-auto border-b bg-white md:block [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              pathname === "/"
                ? "bg-primary-500 text-white"
                : "text-accent-600 hover:bg-accent-100"
            }`}
          >
            <Home size={12} /> Home
          </Link>
          <Link
            href="/store"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              pathname.startsWith("/store") || pathname.startsWith("/products")
                ? "bg-primary-500 text-white"
                : "text-accent-600 hover:bg-accent-100"
            }`}
          >
            <Pill size={12} /> All Medicines
          </Link>
          <div className="bg-accent-200 mx-1 h-4 w-px shrink-0" />
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/store?category=${encodeURIComponent(cat)}`}
              className="text-accent-600 hover:bg-accent-100 hover:text-primary-600 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-accent-100 overflow-hidden border-t bg-white md:hidden"
          >
            <div className="space-y-0.5 px-4 py-3">
              {[
                { href: "/", label: "Home" },
                { href: "/store", label: "Browse Medicines" },
                { href: "/cart", label: "My Cart" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-accent-700 hover:bg-accent-50 block rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-accent-100 border-t pt-2">
                {isAuthenticated ? (
                  <>
                    {user?.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="text-accent-700 hover:bg-accent-50 block rounded-lg px-3 py-2.5 text-sm"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/users"
                      onClick={() => setMenuOpen(false)}
                      className="text-accent-700 hover:bg-accent-50 block rounded-lg px-3 py-2.5 text-sm"
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="text-error-600 hover:bg-error-50 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1"
                    >
                      <button className="border-accent-300 text-accent-700 w-full rounded-full border py-2 text-sm font-medium">
                        Login
                      </button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1"
                    >
                      <button className="bg-primary-500 w-full rounded-full py-2 text-sm font-bold text-white">
                        Register
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
