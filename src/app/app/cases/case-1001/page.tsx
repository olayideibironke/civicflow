import { redirect } from "next/navigation";

export default function LegacyCaseDetailRedirectPage() {
  redirect("/app/cases/cf-1001");
}