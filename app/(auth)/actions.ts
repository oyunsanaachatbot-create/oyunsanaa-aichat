"use server";

import { signIn } from "@/app/(auth)/auth";
import { createUser, getUser } from "@/lib/db/queries";

// энд чинь validation байвал хэвээр үлдээгээрэй

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { status: "failed", message: "Email болон password шаардлагатай" };
  }

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { status: "failed", message: "Email эсвэл password буруу" };
  }

  return { status: "success" };
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { status: "failed", message: "Email болон password шаардлагатай" };
  }

  const users = await getUser(email);
  if (users.length > 0) {
    return { status: "failed", message: "Энэ email бүртгэлтэй байна" };
  }

  await createUser(email, password);

  const res = await signIn("credentials", {
    email,
    password,
    redirect: false,
  });

  if (res?.error) {
    return { status: "failed", message: "Бүртгэл амжилтгүй" };
  }

  return { status: "success" };
}
