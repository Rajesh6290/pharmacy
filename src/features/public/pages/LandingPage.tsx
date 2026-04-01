"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Clock,
  Pill,
  ClipboardList,
  BellRing,
  Star,
  ArrowRight,
  Phone,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Search,
  Zap,
} from "lucide-react";
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import CustomButton from "@/shared/common/CustomButton";
import useSwr from "@/shared/hooks/useSwr";

/* ─── Types ──────────────────────────────────────────────────── */
interface Medicine {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  unit: string;
  quantity: number;
  requiresPrescription: boolean;
  photo?: string;
  batches: {
    sellingPrice: number;
    gst: number;
    quantity: number;
    expiryDate: string;
  }[];
}

/* ─── Static data ────────────────────────────────────────────── */
const HERO_SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=80",
    alt: "Pharmacist at pharmacy counter",
    tagline: "Expert Pharmacists, Trusted Care",
  },
  {
    src: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1600&q=80",
    alt: "Medicine shelves in pharmacy",
    tagline: "5000+ Medicines Always in Stock",
  },
  {
    src: "https://images.unsplash.com/photo-1576671081837-49000212a370?w=1600&q=80",
    alt: "Healthcare professional",
    tagline: "Your Health, Our Priority",
  },
  {
    src: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=1600&q=80",
    alt: "Medicine capsules and tablets",
    tagline: "100% Authentic Medicines",
  },
];

const features = [
  {
    icon: <Pill size={28} className="text-primary-500" />,
    title: "Wide Medicine Range",
    desc: "Thousands of branded and generic medicines with accurate batch and expiry info.",
  },
  {
    icon: <ShieldCheck size={28} className="text-primary-500" />,
    title: "100% Authentic",
    desc: "All medicines sourced directly from licensed vendors — verified, safe, and genuine.",
  },
  {
    icon: <Truck size={28} className="text-primary-500" />,
    title: "Fast Delivery",
    desc: "Same-day or next-day delivery within the city. Track your order in real-time.",
  },
  {
    icon: <Clock size={28} className="text-primary-500" />,
    title: "Open 8 AM – 9 PM",
    desc: "Walk-in or order online during store hours. POS billing available instantly.",
  },
  {
    icon: <ClipboardList size={28} className="text-primary-500" />,
    title: "Prescription Handling",
    desc: "Upload your prescription online. Our pharmacists review and fulfil orders safely.",
  },
  {
    icon: <BellRing size={28} className="text-primary-500" />,
    title: "Expiry & Stock Alerts",
    desc: "Smart alerts keep our inventory fresh. You always receive medicines in-date.",
  },
];

const testimonials = [
  {
    name: "Anita Mohanty",
    text: "Ordering medicines online has never been this easy. Delivery was on time and packaging was perfect!",
    rating: 5,
  },
  {
    name: "Ravi Kumar",
    text: "The pharmacist reviewed my prescription quickly. Great service and genuine products.",
    rating: 5,
  },
  {
    name: "Priya Das",
    text: "Best pharmacy in the area. The online store is smooth and the staff is very helpful.",
    rating: 5,
  },
];

const steps = [
  {
    step: "01",
    title: "Browse Products",
    desc: "Search or browse our full catalogue of medicines and health products.",
  },
  {
    step: "02",
    title: "Upload Prescription",
    desc: "For prescription medicines, securely upload your doctor's prescription.",
  },
  {
    step: "03",
    title: "Pay Securely",
    desc: "Checkout with Razorpay — UPI, cards, net banking all supported.",
  },
  {
    step: "04",
    title: "Get Delivered",
    desc: "Receive your medicines at your doorstep, fast and safely packed.",
  },
];

/* ─── Animation variants ─────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

/* ─── Reusable animated section wrapper ──────────────────────── */
function AnimSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Medicine Card ──────────────────────────────────────────── */
function MedicineCard({ med }: { med: Medicine }) {
  const validBatches = med.batches.filter(
    (b) => b.quantity > 0 && new Date(b.expiryDate) > new Date()
  );
  const price = validBatches.length
    ? Math.min(...validBatches.map((b) => b.sellingPrice))
    : null;
  const inStock = med.quantity > 0;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      className="border-accent-200 group flex flex-col rounded-2xl border bg-white shadow-sm transition-colors"
    >
      {/* Image */}
      <div className="bg-accent-50 relative h-40 w-full overflow-hidden rounded-t-2xl">
        {med.photo ? (
          <Image
            src={med.photo}
            alt={med.name}
            fill
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Pill size={40} className="text-accent-200" strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          {med.requiresPrescription && (
            <span className="bg-secondary-100 text-secondary-700 rounded-full px-2 py-0.5 text-[10px] font-medium">
              Rx
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              inStock
                ? "bg-primary-100 text-primary-700"
                : "bg-error-100 text-error-700"
            }`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-accent-400 mb-0.5 text-[11px] font-medium tracking-wide uppercase">
          {med.category}
        </p>
        <h3 className="text-accent-900 line-clamp-2 text-sm leading-snug font-semibold">
          {med.name}
        </h3>
        {med.genericName && (
          <p className="text-accent-400 mt-0.5 text-xs">{med.genericName}</p>
        )}
        <p className="text-accent-400 mt-1 text-xs">by {med.manufacturer}</p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            {price ? (
              <>
                <p className="text-primary-600 text-base font-bold">
                  ₹{price.toFixed(2)}
                </p>
                <p className="text-accent-400 text-[10px]">per {med.unit}</p>
              </>
            ) : (
              <p className="text-accent-400 text-sm">—</p>
            )}
          </div>
          <Link href={`/products/${med._id}`}>
            <motion.button
              whileTap={{ scale: 0.93 }}
              disabled={!inStock}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                inStock
                  ? "bg-primary-500 hover:bg-primary-600 text-white"
                  : "bg-accent-100 text-accent-400 cursor-not-allowed"
              }`}
            >
              {inStock ? (
                <>
                  <ShoppingCart size={12} /> Order
                </>
              ) : (
                <>
                  <AlertCircle size={12} /> OOS
                </>
              )}
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
const LandingPage = () => {
  const [slide, setSlide] = useState(0);
  const [medSearch, setMedSearch] = useState("");
  const { data: medData, isLoading: medLoading } = useSwr(
    "medicines?limit=10&sort=createdAt&order=desc"
  );
  const allMedicines: Medicine[] = medData?.medicines ?? [];

  const filteredMeds = medSearch
    ? allMedicines.filter(
        (m) =>
          m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
          m.genericName?.toLowerCase().includes(medSearch.toLowerCase())
      )
    : allMedicines;

  useEffect(() => {
    const timer = setInterval(
      () => setSlide((s) => (s + 1) % HERO_SLIDES.length),
      4500
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full">
      {/* ══════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[88dvh] overflow-hidden">
        <AnimatePresence mode="wait">
          {HERO_SLIDES.map(
            (sl, i) =>
              i === slide && (
                <motion.div
                  key={sl.src}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={sl.src}
                    alt={sl.alt}
                    fill
                    priority={i === 0}
                    className="object-cover object-center"
                    sizes="100vw"
                  />
                </motion.div>
              )
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="to-primary-900/70 absolute inset-0 bg-linear-to-br from-black/75 via-black/55" />

        {/* Content */}
        <div className="relative mx-auto flex min-h-[88dvh] max-w-7xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
          <motion.span
            key={slide}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/90 uppercase backdrop-blur-sm"
          >
            <ShieldCheck size={13} className="text-tertiary-300" />
            {HERO_SLIDES[slide].tagline}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="max-w-4xl text-4xl leading-tight font-bold tracking-tight text-white drop-shadow-xl sm:text-5xl lg:text-7xl"
          >
            Your Health, <span className="text-tertiary-300">Our Priority</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg"
          >
            Sidheswar Drugs House — combining offline POS billing with online
            medicine ordering, real-time inventory, and GST-compliant invoicing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.32 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link href="/store">
              <CustomButton
                variant="primary"
                size="large"
                fullWidth={false}
                endIcon={<ArrowRight size={18} />}
              >
                Shop Medicines
              </CustomButton>
            </Link>
            <Link href="/register">
              <CustomButton
                variant="secondary"
                size="large"
                fullWidth={false}
                className="border-white! text-white! hover:bg-white/10!"
              >
                Create Account
              </CustomButton>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.5 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-white/80"
          >
            {[
              {
                icon: <ShieldCheck size={15} className="text-tertiary-300" />,
                label: "GST Compliant",
              },
              {
                icon: <Truck size={15} className="text-tertiary-300" />,
                label: "Same-Day Delivery",
              },
              {
                icon: <Pill size={15} className="text-tertiary-300" />,
                label: "5000+ Medicines",
              },
            ].map((b) => (
              <span key={b.label} className="flex items-center gap-1.5">
                {b.icon} {b.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Arrow controls */}
        {(["prev", "next"] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() =>
              setSlide((s) =>
                dir === "prev"
                  ? (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                  : (s + 1) % HERO_SLIDES.length
              )
            }
            aria-label={dir === "prev" ? "Previous slide" : "Next slide"}
            className={`absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white backdrop-blur-sm transition hover:bg-black/55 ${
              dir === "prev" ? "left-4" : "right-4"
            }`}
          >
            {dir === "prev" ? (
              <ChevronLeft size={22} />
            ) : (
              <ChevronRight size={22} />
            )}
          </button>
        ))}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURED MEDICINES
         ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <AnimSection>
            <motion.div
              variants={fadeUp}
              className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-primary-600 mb-1 text-sm font-semibold tracking-widest uppercase">
                  Fresh arrivals
                </p>
                <h2 className="text-accent-900 text-3xl font-bold">
                  Recently Added Medicines
                </h2>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search
                    size={15}
                    className="text-accent-400 absolute top-1/2 left-3 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="border-accent-200 focus:border-primary-400 focus:ring-primary-100 bg-accent-50 w-full rounded-full border py-2 pr-3 pl-8 text-sm outline-none focus:ring-2"
                  />
                </div>
                <Link href="/store">
                  <CustomButton
                    variant="primary"
                    size="small"
                    fullWidth={false}
                    endIcon={<ArrowRight size={14} />}
                  >
                    View all
                  </CustomButton>
                </Link>
              </div>
            </motion.div>
          </AnimSection>

          {/* Grid */}
          {medLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="border-accent-100 bg-accent-50 h-64 animate-pulse rounded-2xl border"
                />
              ))}
            </div>
          ) : filteredMeds.length === 0 ? (
            <div className="text-accent-400 flex flex-col items-center gap-3 py-16">
              <Pill size={48} strokeWidth={1} />
              <p>No medicines found</p>
            </div>
          ) : (
            <AnimSection className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredMeds.slice(0, 10).map((med) => (
                <MedicineCard key={med._id} med={med} />
              ))}
            </AnimSection>
          )}

          {/* Login prompt */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="from-primary-50 to-tertiary-50 border-primary-100 mt-10 flex flex-col items-center gap-4 rounded-2xl border bg-linear-to-r p-6 text-center sm:flex-row sm:justify-between sm:text-left"
          >
            <div>
              <p className="text-accent-800 font-semibold">
                Want to order medicines online?
              </p>
              <p className="text-accent-500 text-sm">
                Login or create a free account to start shopping
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href="/login">
                <CustomButton
                  variant="secondary"
                  size="small"
                  fullWidth={false}
                >
                  Login
                </CustomButton>
              </Link>
              <Link href="/register">
                <CustomButton variant="primary" size="small" fullWidth={false}>
                  Register Free
                </CustomButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES GRID
         ══════════════════════════════════════════════════════ */}
      <section className="bg-accent-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <p className="text-primary-600 mb-2 text-sm font-semibold tracking-widest uppercase">
                Why us
              </p>
              <h2 className="text-accent-900 text-3xl font-bold">
                Why Choose Sidheswar Drugs House?
              </h2>
              <p className="text-accent-500 mt-3 text-base">
                We combine technology with care to deliver the best pharmacy
                experience
              </p>
            </motion.div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  className="border-accent-100 rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="bg-primary-50 mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                    {f.icon}
                  </div>
                  <h3 className="text-accent-800 mb-2 text-base font-semibold">
                    {f.title}
                  </h3>
                  <p className="text-accent-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimSection>
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <p className="text-primary-600 mb-2 text-sm font-semibold tracking-widest uppercase">
                Simple process
              </p>
              <h2 className="text-accent-900 text-3xl font-bold">
                How It Works
              </h2>
              <p className="text-accent-500 mt-3 text-base">
                Order your medicines online in 4 simple steps
              </p>
            </motion.div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  variants={fadeUp}
                  className="relative flex flex-col items-center text-center"
                >
                  {i < steps.length - 1 && (
                    <div className="bg-primary-100 absolute top-6 left-1/2 hidden h-0.5 w-full translate-x-6 lg:block" />
                  )}
                  <div className="bg-primary-500 relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg">
                    {s.step}
                  </div>
                  <h3 className="text-accent-800 mb-2 text-base font-semibold">
                    {s.title}
                  </h3>
                  <p className="text-accent-500 text-sm leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BANNER
         ══════════════════════════════════════════════════════ */}
      <section className="bg-primary-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimSection className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: "5000+", label: "Medicines Available" },
              { value: "25+", label: "Years of Trust" },
              { value: "10K+", label: "Happy Customers" },
              { value: "100%", label: "Authentic Products" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <p className="text-4xl font-extrabold text-white">
                  {stat.value}
                </p>
                <p className="text-primary-200 mt-1 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════════════════════════ */}
      <section className="bg-accent-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              <h2 className="text-accent-900 text-3xl font-bold">
                What Our Customers Say
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeUp}
                  whileHover={{ y: -3 }}
                  className="border-accent-100 rounded-2xl border bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-warning-400 text-warning-400"
                      />
                    ))}
                  </div>
                  <p className="text-accent-600 mb-4 text-sm leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <p className="text-accent-800 text-sm font-semibold">
                    {t.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
         ══════════════════════════════════════════════════════ */}
      <section className="from-secondary-600 to-primary-700 bg-linear-to-r py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-widest text-white uppercase">
              <Zap size={13} /> Get started today
            </span>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Order Your Medicines?
            </h2>
            <p className="text-primary-200 mt-4 text-base">
              Join thousands of customers who trust Sidheswar Drugs House for
              their healthcare needs.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/store">
                <CustomButton
                  variant="primary"
                  size="large"
                  fullWidth={false}
                  className="text-primary-700! hover:bg-accent-100! bg-white!"
                  endIcon={<ArrowRight size={18} />}
                >
                  Browse Store
                </CustomButton>
              </Link>
              <a href="tel:+919876543210">
                <CustomButton
                  variant="secondary"
                  size="large"
                  fullWidth={false}
                  className="border-white! text-white! hover:bg-white/10!"
                  startIcon={<Phone size={16} />}
                >
                  Call Us Now
                </CustomButton>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
