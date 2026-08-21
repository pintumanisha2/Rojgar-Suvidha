import { redirect } from "next/navigation";

// /contact → /contact-us permanent redirect
export default function ContactRedirectPage() {
  redirect("/contact-us");
}
