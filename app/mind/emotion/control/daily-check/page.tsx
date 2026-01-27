import { redirect } from "next/navigation";

export default function Page() {
  redirect("/mind/emotion/control/daily-check?new=1");
}
