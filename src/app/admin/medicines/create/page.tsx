import { redirect } from "next/navigation";

// Medicines are created inline on the medicines management page
export default function CreateMedicineRoute() {
  redirect("/admin/medicines");
}
