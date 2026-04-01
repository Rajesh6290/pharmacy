import { redirect } from "next/navigation";

export default function AuthRootRoute() {
  redirect("/login");
}
