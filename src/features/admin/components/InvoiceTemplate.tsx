"use client";

import Image from "next/image";

export interface InvoiceItem {
  medicineName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  gst: number;
  discount: number;
  total: number;
}

export interface InvoiceData {
  orderNumber: string;
  invoiceNumber?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  type: string;
  createdAt: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  totalAmount: number;
}

export interface PharmacySettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  gstin?: string;
  panNumber?: string;
  license1?: string;
  license2?: string;
  tagline?: string;
}

interface InvoiceTemplateProps {
  order: InvoiceData;
  settings: PharmacySettings;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const yr = String(d.getFullYear()).slice(-2);
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "pm" : "am";
  const h = d.getHours() % 12 || 12;
  return `${day}-${month}-${yr} ${String(h).padStart(2, "0")}:${mins} ${ampm}`;
}

export default function InvoiceTemplate({
  order,
  settings,
}: InvoiceTemplateProps) {
  const totalMRP = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const netAmount = Math.round(order.totalAmount);
  const roundOff = parseFloat((netAmount - order.totalAmount).toFixed(2));
  const totalSaving = parseFloat((totalMRP - netAmount).toFixed(2));
  const cgst = parseFloat((order.totalGst / 2).toFixed(2));
  const sgst = cgst;
  const billNo =
    order.invoiceNumber ?? order.orderNumber.replace(/\D/g, "").slice(-6);

  return (
    <div
      id="invoice-print-root"
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#000",
        background: "#fff",
        padding: "16px",
        maxWidth: "320px",
        margin: "0 auto",
        lineHeight: 1.4,
      }}
    >
      {/* Logo & Header */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <Image
          src="/logo.svg"
          alt="logo"
          width={80}
          height={28}
          style={{ display: "inline-block", marginBottom: "4px" }}
        />
        <div
          style={{
            fontWeight: "bold",
            fontSize: "14px",
            textTransform: "uppercase",
          }}
        >
          {settings.pharmacyName}
        </div>
        {settings.address && (
          <div
            style={{
              fontSize: "10px",
              color: "#444",
              marginTop: "2px",
              whiteSpace: "pre-wrap",
            }}
          >
            {settings.address}
          </div>
        )}
        {settings.phone && (
          <div style={{ fontSize: "10px", marginTop: "2px" }}>
            M. {settings.phone}
          </div>
        )}
      </div>

      {/* License / GSTIN / PAN */}
      {(settings.gstin ||
        settings.panNumber ||
        settings.license1 ||
        settings.license2) && (
        <div
          style={{
            borderTop: "1px dashed #000",
            borderBottom: "1px dashed #000",
            padding: "4px 0",
            fontSize: "9px",
            textAlign: "center",
            marginBottom: "6px",
            lineHeight: 1.6,
          }}
        >
          {settings.license1 && (
            <span>LICENSE 20 : {settings.license1} | </span>
          )}
          {settings.license2 && (
            <span>LICENSE 21 : {settings.license2} | </span>
          )}
          {settings.gstin && <span>GSTIN {settings.gstin} | </span>}
          {settings.panNumber && <span>PAN {settings.panNumber}</span>}
        </div>
      )}

      {/* Customer + Bill Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          marginBottom: "6px",
          fontSize: "10px",
        }}
      >
        <div>
          <span style={{ fontWeight: "bold" }}>PATIENT NAME</span>{" "}
          {order.customerName ?? "Walk-in"}
        </div>
        <div>
          <span style={{ fontWeight: "bold" }}>MOBILE</span>{" "}
          {order.customerPhone ?? "—"}
        </div>
        <div>
          <span style={{ fontWeight: "bold" }}>Bill No:</span> {billNo}
        </div>
        <div>
          <span style={{ fontWeight: "bold" }}>Payment:</span>{" "}
          {order.paymentMethod.toUpperCase()}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <span style={{ fontWeight: "bold" }}>Date:</span>{" "}
          {formatDate(order.createdAt)}
        </div>
      </div>

      {/* Items Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "6px",
          fontSize: "10px",
        }}
      >
        <thead>
          <tr
            style={{
              borderTop: "1px solid #000",
              borderBottom: "1px solid #000",
            }}
          >
            <th
              style={{ textAlign: "left", padding: "2px 1px", width: "18px" }}
            >
              Sr.
            </th>
            <th style={{ textAlign: "left", padding: "2px 1px" }}>Item Name</th>
            <th
              style={{ textAlign: "center", padding: "2px 1px", width: "36px" }}
            >
              Batch
            </th>
            <th
              style={{ textAlign: "right", padding: "2px 1px", width: "30px" }}
            >
              MRP
            </th>
            <th
              style={{ textAlign: "right", padding: "2px 1px", width: "22px" }}
            >
              QTY
            </th>
            <th
              style={{ textAlign: "right", padding: "2px 1px", width: "36px" }}
            >
              D.Price
            </th>
            <th
              style={{ textAlign: "right", padding: "2px 1px", width: "24px" }}
            >
              GST
            </th>
            <th
              style={{ textAlign: "right", padding: "2px 1px", width: "42px" }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => {
            const discountedUnitPrice = parseFloat(
              (item.unitPrice * (1 - item.discount / 100)).toFixed(2)
            );
            return (
              <tr key={i} style={{ borderBottom: "1px dashed #ccc" }}>
                <td style={{ padding: "2px 1px" }}>{i + 1}</td>
                <td style={{ padding: "2px 1px" }}>{item.medicineName}</td>
                <td
                  style={{
                    padding: "2px 1px",
                    textAlign: "center",
                    fontSize: "9px",
                  }}
                >
                  {item.batchNumber}
                </td>
                <td style={{ padding: "2px 1px", textAlign: "right" }}>
                  {item.unitPrice.toFixed(2)}
                </td>
                <td style={{ padding: "2px 1px", textAlign: "right" }}>
                  {item.quantity}
                </td>
                <td style={{ padding: "2px 1px", textAlign: "right" }}>
                  {discountedUnitPrice.toFixed(2)}
                </td>
                <td style={{ padding: "2px 1px", textAlign: "right" }}>
                  {item.gst}%
                </td>
                <td style={{ padding: "2px 1px", textAlign: "right" }}>
                  {item.total.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Terms placeholder */}
      <div
        style={{
          fontSize: "9px",
          color: "#666",
          marginBottom: "6px",
          borderBottom: "1px dashed #000",
          paddingBottom: "4px",
        }}
      >
        Terms & Conditions: Goods once sold will not be taken back.
      </div>

      {/* Totals */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "2px 12px",
          fontSize: "11px",
          marginBottom: "6px",
        }}
      >
        <span style={{ color: "#444" }}>CGST</span>
        <span style={{ textAlign: "right" }}>{cgst.toFixed(2)}</span>
        <span style={{ color: "#444" }}>SGST</span>
        <span style={{ textAlign: "right" }}>{sgst.toFixed(2)}</span>
        <span style={{ color: "#444" }}>Total GST</span>
        <span style={{ textAlign: "right" }}>{order.totalGst.toFixed(2)}</span>
        <span style={{ color: "#444" }}>Total Item(s)</span>
        <span style={{ textAlign: "right" }}>{order.items.length}</span>
        <span style={{ color: "#444" }}>Total MRP</span>
        <span style={{ textAlign: "right" }}>{totalMRP.toFixed(2)}</span>
        {Math.abs(roundOff) > 0 && (
          <>
            <span style={{ color: "#444" }}>Round off.</span>
            <span style={{ textAlign: "right" }}>{roundOff.toFixed(2)}</span>
          </>
        )}
        <span
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            borderTop: "1px solid #000",
            paddingTop: "3px",
          }}
        >
          Net Rs.
        </span>
        <span
          style={{
            fontWeight: "bold",
            fontSize: "13px",
            textAlign: "right",
            borderTop: "1px solid #000",
            paddingTop: "3px",
          }}
        >
          {netAmount.toFixed(2)}
        </span>
        {totalSaving > 0 && (
          <>
            <span style={{ color: "#2a7a4b" }}>Total Saving: Rs.</span>
            <span style={{ textAlign: "right", color: "#2a7a4b" }}>
              {totalSaving.toFixed(2)}
            </span>
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px dashed #000",
          paddingTop: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: "9px",
          color: "#444",
        }}
      >
        <div>
          <div>Billed By {settings.pharmacyName}</div>
          {settings.website && (
            <div style={{ marginTop: "2px" }}>- {settings.website}</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              border: "1px dashed #999",
              padding: "4px",
              borderRadius: "4px",
              fontSize: "8px",
              width: "48px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#f0f0f0",
                margin: "0 auto 2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7px",
                color: "#999",
              }}
            >
              QR
            </div>
            Scan to Reorder
          </div>
        </div>
      </div>

      {/* Sign line */}
      <div
        style={{
          marginTop: "20px",
          borderTop: "1px solid #000",
          width: "100px",
          paddingTop: "2px",
          fontSize: "9px",
          textAlign: "center",
        }}
      >
        Sign
      </div>
    </div>
  );
}
