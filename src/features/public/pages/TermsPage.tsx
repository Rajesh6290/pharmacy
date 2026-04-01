"use client";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using the Sidheswar Drugs House website and services, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.",
  },
  {
    title: "2. Eligibility",
    body: "You must be at least 18 years old to place an order. By placing an order, you confirm that you are of legal age and that the information you provide is accurate.",
  },
  {
    title: "3. Prescription Medicines",
    body: "Schedule H and Schedule H1 medicines require a valid prescription from a registered medical practitioner. By uploading a prescription, you confirm it is genuine. Misuse or fraudulent prescriptions will result in order cancellation and may be reported to authorities.",
  },
  {
    title: "4. Product Information",
    body: "We endeavour to display accurate product information including composition, usage, and pricing. However, product availability and prices are subject to change without prior notice.",
  },
  {
    title: "5. Pricing & Payments",
    body: "All prices are inclusive of GST as applicable. Payments are processed securely through Razorpay. Cash on Delivery (COD) is available for eligible orders. We reserve the right to cancel orders with incorrect pricing due to technical errors.",
  },
  {
    title: "6. Order Cancellation",
    body: "You may cancel an order before it is dispatched. Once dispatched, cancellations will not be accepted. We reserve the right to cancel any order due to stock unavailability, suspected fraud, or inability to verify the prescription.",
  },
  {
    title: "7. Returns & Refunds",
    body: "Medicines, once dispensed, cannot be returned or exchanged for safety and hygiene reasons. Refunds are applicable only in cases of: (a) wrong product delivered, (b) damaged product, or (c) order cancelled before dispatch. Refunds will be processed within 5–7 business days.",
  },
  {
    title: "8. Privacy",
    body: "Your personal information, including health data and prescription details, is handled in accordance with our Privacy Policy and is never sold to third parties. It is used solely for order processing and regulatory compliance.",
  },
  {
    title: "9. Intellectual Property",
    body: "All content on this website — including logos, text, images, and software — is the property of Sidheswar Drugs House and is protected under applicable intellectual property laws.",
  },
  {
    title: "10. Limitation of Liability",
    body: "Sidheswar Drugs House shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability in any case is limited to the value of the order in dispute.",
  },
  {
    title: "11. Governing Law",
    body: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bhubaneswar, India.",
  },
  {
    title: "12. Changes to Terms",
    body: "We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the revised terms.",
  },
  {
    title: "13. Contact Us",
    body: "For any questions regarding these terms, contact us at: Sidheswar Drugs House, Phone: +91-XXXXXXXXXX, Email: legal@sidheswardrugs.com",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-accent-900 mb-2 text-3xl font-bold">
        Terms &amp; Conditions
      </h1>
      <p className="text-accent-400 mb-10 text-sm">
        Last updated: 1 April 2026
      </p>

      {sections.map((section) => (
        <section key={section.title} className="mb-7">
          <h2 className="text-accent-800 mb-2 text-base font-semibold">
            {section.title}
          </h2>
          <p className="text-accent-600 text-sm leading-relaxed">
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );
}
