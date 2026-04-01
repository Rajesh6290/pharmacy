"use client";

const faqs = [
  {
    q: "How do I order medicines online?",
    a: "Browse our store, select the medicine you need, choose a batch, add it to your cart, and checkout using Razorpay or Cash on Delivery.",
  },
  {
    q: "Do I need a prescription for all medicines?",
    a: "Only Schedule H and H1 medicines require a valid prescription. The product page will clearly show an 'Rx Required' badge when a prescription is needed.",
  },
  {
    q: "How do I upload a prescription?",
    a: "On the product detail page or in your cart, you will find an 'Upload Prescription' button. Upload a clear photo (JPEG/PNG) or PDF of your doctor's prescription.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major UPI apps (Google Pay, PhonePe, Paytm), credit/debit cards, net banking via Razorpay, and Cash on Delivery.",
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. All online payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We never store your card details.",
  },
  {
    q: "How do I track my order?",
    a: "After placing an order, go to 'My Orders' in your account dashboard to view the real-time status of all your orders.",
  },
  {
    q: "Can I cancel an order?",
    a: "Orders in 'Pending' or 'Confirmed' status can be cancelled. Contact us immediately at +91-XXXXXXXXXX or email for assistance.",
  },
  {
    q: "What is the return/refund policy?",
    a: "Medicines cannot be returned once dispensed for safety reasons. In case of a wrong item or damaged delivery, contact us within 24 hours for a full refund.",
  },
  {
    q: "Do you offer home delivery?",
    a: "Yes, we offer home delivery within our service area. Delivery times and charges will be shown at checkout.",
  },
  {
    q: "How do I contact customer support?",
    a: "Call us at +91-XXXXXXXXXX (Mon–Sat, 9 AM–7 PM) or email support@sidheswardrugs.com. We typically respond within 2 business hours.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-accent-900 text-3xl font-bold">
          Frequently Asked Questions
        </h1>
        <p className="text-accent-500 mt-2 text-sm">
          Everything you need to know about ordering medicines online from
          Sidheswar Drugs House.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <details
            key={idx}
            className="border-accent-200 group rounded-xl border bg-white shadow-sm open:shadow-md"
          >
            <summary className="text-accent-800 flex cursor-pointer list-none items-center justify-between px-5 py-4 font-medium">
              {item.q}
              <span className="text-primary-500 ml-3 shrink-0 text-xl font-light transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-accent-600 border-accent-100 border-t px-5 py-4 text-sm leading-relaxed">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
