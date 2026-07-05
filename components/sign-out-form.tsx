import Form from "next/form";
import { signOut } from "@/app/(auth)/auth";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const SignOutForm = async () => {
  const t = await getDictionary();
  return (
    <Form
      action={async () => {
        "use server";
        await signOut({
          redirectTo: "/login?signedOut=1",
        });
      }}
      className="w-full"
    >
      <button className="w-full px-1 py-0.5 text-left text-red-500" type="submit">
        {t.common.signOut}
      </button>
    </Form>
  );
};
