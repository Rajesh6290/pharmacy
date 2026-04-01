import { redirect } from "next/navigation";

export default function AdminRootRoute() {
  redirect("/admin/dashboard");
}
