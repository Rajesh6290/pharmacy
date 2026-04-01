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
  ChevronDown,
  Package,
  Pill,
  ClipboardList,
  MapPin,
  Tag,
  User,
  Home,
  Truck,
} from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, IconButton } from "@mui/material";
import { FaTimes } from "react-icons/fa";

const CATEGORIES = [
  "Medicine",
  "Healthcare",
  "Lab Tests",
  "PLUS",
  "Health Blog",
];

const MEDICINE_TYPES = [
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
  const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Select Location");
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

  const handleCheckPinCode = () => {
    if (pinCode.trim().length >= 6) {
      setSelectedLocation(pinCode);
      setLocationDrawerOpen(false);
      setPinCode("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      {/* Top Bar with Logo, Delivery, Search, and Actions */}
      <div className="border-accent-100 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-360 items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Sidheswar Drugs House"
              width={140}
              height={46}
              priority
              className="h-12 w-auto"
            />
            <div className="hidden flex-col gap-0 lg:flex">
              <span className="text-primary text-base leading-tight font-bold">
                SIDHESWAR
              </span>
              <span className="text-primary -mt-0.5 text-xs font-semibold tracking-wider">
                DRUGS HOUSE
              </span>
            </div>
          </Link>

          {/* Delivery Location Button */}
          <button
            onClick={() => setLocationDrawerOpen(true)}
            className="text-accent-700 hover:bg-accent-50 hidden items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 transition md:flex"
          >
            <MapPin size={16} className="text-primary-500" />
            <div className="flex flex-col items-start">
              <span className="text-accent-500 text-xs">Deliver to</span>
              <span className="text-accent-900 -mt-0.5 text-sm font-semibold">
                {selectedLocation}
              </span>
            </div>
            <ChevronDown size={14} className="text-accent-400" />
          </button>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden flex-1 md:flex md:items-center md:justify-center"
          >
            <div className="relative w-full max-w-2xl">
              <Search
                size={18}
                className="text-accent-400 absolute top-1/2 left-4 -translate-y-1/2"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for Medicine and Healthcare items"
                className="border-accent-200 focus:border-primary-500 focus:ring-primary-100 w-full rounded-full border py-3 pr-24 pl-12 text-sm transition outline-none focus:ring-2"
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 absolute top-1/2 right-2 -translate-y-1/2 rounded-full px-6 py-1.5 text-sm font-semibold text-white transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Offers Link */}
            <Link
              href="/store"
              className="text-accent-700 hover:text-primary-600 hidden items-center gap-1.5 text-sm font-medium transition lg:flex"
            >
              <Tag size={16} />
              Offers
            </Link>

            {/* User Section */}
            {isAuthenticated ? (
              <div className="relative hidden sm:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="text-accent-700 hover:text-primary-600 flex items-center gap-2 text-sm font-medium transition"
                >
                  <User size={16} />
                  <span>Hello, {user?.name?.split(" ")[0]}</span>
                  <ChevronDown size={14} />
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
              <Link
                href="/login"
                className="text-accent-700 hover:text-primary-600 hidden items-center gap-1.5 text-sm font-medium transition sm:flex"
              >
                <User size={16} />
                Hello, Log in
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="text-accent-700 hover:text-primary-600 hover:bg-accent-50 relative rounded-lg p-2 transition"
            >
              <ShoppingCart size={22} />
              <span className="bg-error-500 absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white">
                2
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="text-accent-600 hover:bg-accent-50 rounded-lg p-2 transition md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form
          onSubmit={handleSearch}
          className="border-accent-100 border-t px-4 pt-3 pb-3 md:hidden"
        >
          <div className="relative">
            <Search
              size={16}
              className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicines…"
              className="border-accent-200 focus:border-primary-400 w-full rounded-full border py-2.5 pr-16 pl-10 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-primary-500 absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full px-4 py-1.5 text-xs font-bold text-white"
            >
              Go
            </button>
          </div>
        </form>
      </div>

      {/* Category Navigation Bar */}
      <div className="border-accent-100 hidden overflow-x-auto border-b bg-white md:block [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex max-w-360 items-center justify-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={cat === "Medicine" ? "/store" : "#"}
              className={`shrink-0 text-base font-medium transition-colors ${
                pathname.startsWith("/store") && cat === "Medicine"
                  ? "text-primary-600 font-semibold"
                  : "text-accent-700 hover:text-primary-600"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Medicine Types Sub-Navigation (visible when in store) */}
      {pathname.startsWith("/store") && (
        <div className="border-accent-100 hidden overflow-x-auto border-b bg-white md:block [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex max-w-360 items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
            <Link
              href="/store"
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                !pathname.includes("category")
                  ? "bg-primary-500 text-white"
                  : "text-accent-600 hover:bg-accent-100"
              }`}
            >
              <Pill size={12} /> All Medicines
            </Link>
            <div className="bg-accent-200 mx-1 h-4 w-px shrink-0" />
            {MEDICINE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/store?category=${encodeURIComponent(type)}`}
                className="text-accent-600 hover:bg-accent-100 hover:text-primary-600 shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              >
                {type}
              </Link>
            ))}
          </div>
        </div>
      )}

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
              {/* Mobile Location Button */}
              <button
                onClick={() => {
                  setLocationDrawerOpen(true);
                  setMenuOpen(false);
                }}
                className="text-accent-700 hover:bg-accent-50 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium"
              >
                <MapPin size={16} />
                Select Location
              </button>

              {[
                { href: "/", label: "Home" },
                { href: "/store", label: "Browse Medicines" },
                { href: "/cart", label: "My Cart" },
                { href: "/prescription", label: "Upload Prescription" },
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

      {/* Material-UI Location Drawer */}
      <Drawer
        anchor="right"
        open={locationDrawerOpen}
        onClose={() => setLocationDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 500, md: 520 },
            maxWidth: "100%",
          },
        }}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between bg-white px-6 py-5 shadow-sm">
            <div>
              <h2 className="text-accent-900 text-xl font-bold">
                Choose your Location
              </h2>
              <p className="text-accent-500 mt-0.5 text-sm">
                Select delivery address to see product availability
              </p>
            </div>
            <IconButton
              onClick={() => setLocationDrawerOpen(false)}
              sx={{
                color: "#6b7280",
                "&:hover": { backgroundColor: "#f3f4f6" },
              }}
            >
              <FaTimes size={18} />
            </IconButton>
          </div>

          {/* Drawer Content */}
          <div className="bg-accent-50 flex-1 overflow-y-auto px-6 py-6">
            {/* PIN Code Input Section */}
            <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="bg-primary-100 text-primary-600 rounded-full p-2.5">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-accent-900 text-base font-semibold">
                    Enter PIN Code
                  </h3>
                  <p className="text-accent-500 text-xs">
                    Check serviceability at your location
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) =>
                    setPinCode(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="e.g., 110001"
                  maxLength={6}
                  className="border-accent-300 focus:border-primary-500 focus:ring-primary-200 flex-1 rounded-lg border bg-white px-4 py-3 text-sm transition outline-none focus:ring-2"
                />
                <button
                  onClick={handleCheckPinCode}
                  disabled={pinCode.length < 6}
                  className="bg-primary-500 hover:bg-primary-600 disabled:bg-accent-300 rounded-lg px-7 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
                >
                  Check
                </button>
              </div>
            </div>

            {/* Login to View Addresses Section */}
            {isAuthenticated ? (
              <div className="mb-5 rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <div className="bg-tertiary-100 text-tertiary-600 rounded-full p-2.5">
                    <Home size={20} />
                  </div>
                  <div>
                    <h3 className="text-accent-900 text-base font-semibold">
                      My Saved Addresses
                    </h3>
                    <p className="text-accent-500 text-xs">
                      Select from your saved locations
                    </p>
                  </div>
                </div>
                <div className="border-accent-200 hover:bg-accent-50 cursor-pointer rounded-lg border bg-white p-4 transition">
                  <div className="flex items-start gap-3">
                    <div className="bg-accent-100 text-accent-600 mt-0.5 rounded-md p-2">
                      <Home size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-accent-900 text-sm font-semibold">
                          Home
                        </span>
                        <span className="bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                          DEFAULT
                        </span>
                      </div>
                      <p className="text-accent-600 mt-1 text-xs leading-relaxed">
                        {selectedLocation === "Select Location"
                          ? "No address saved yet"
                          : selectedLocation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="from-primary-50 to-tertiary-50 mb-5 rounded-xl bg-linear-to-br p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="text-primary-600 rounded-full bg-white p-3 shadow-sm">
                    <User size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-accent-900 text-base font-bold">
                      Login to View Addresses
                    </h3>
                    <p className="text-accent-600 mt-0.5 text-xs">
                      Save addresses for faster checkout
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  onClick={() => setLocationDrawerOpen(false)}
                  className="bg-primary-500 hover:bg-primary-600 block w-full rounded-lg py-3 text-center text-sm font-bold text-white shadow-md transition hover:shadow-lg"
                >
                  Login Now
                </Link>
              </div>
            )}

            {/* Service Info Cards */}
            <div className="space-y-3">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-tertiary-100 text-tertiary-600 mt-0.5 rounded-lg p-2.5">
                    <Truck size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-accent-900 text-sm font-semibold">
                      Serving more than 1,000
                    </h4>
                    <p className="text-accent-600 mt-0.5 text-xs">
                      towns and cities in India
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-secondary-100 text-secondary-600 mt-0.5 rounded-lg p-2.5">
                    <ShoppingCart size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-accent-900 text-sm font-semibold">
                      Over 30,00,000 orders
                    </h4>
                    <p className="text-accent-600 mt-0.5 text-xs">
                      safely delivered
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-primary-100 text-primary-600 mt-0.5 rounded-lg p-2.5">
                    <Package size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-accent-900 text-sm font-semibold">
                      Know More
                    </h4>
                    <p className="text-accent-600 mt-0.5 text-xs">
                      About our delivery services
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </header>
  );
};

export default Navbar;
