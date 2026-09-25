"use client";

import Form from "next/form";
import { useT } from "@/lib/i18n/provider";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
  defaultName = "",
  nameLabel,
  namePlaceholder,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  defaultEmail?: string;
  defaultName?: string;
  nameLabel?: string;
  namePlaceholder?: string;
}) {
  const t = useT();
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {nameLabel && (
        <div className="flex flex-col gap-2">
          <Label
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="name"
          >
            {nameLabel}
          </Label>
          <Input
            autoComplete="name"
            className="h-12 rounded-xl border-input bg-background text-base"
            defaultValue={defaultName}
            id="name"
            maxLength={64}
            minLength={2}
            name="name"
            placeholder={namePlaceholder}
            required
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="email"
        >
          {t.auth.emailLabel}
        </Label>

        <Input
          autoComplete="email"
          className="h-12 rounded-xl border-input bg-background text-base"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="name@example.mn"
          required
          type="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          className="font-normal text-zinc-600 dark:text-zinc-400"
          htmlFor="password"
        >
          {t.auth.passwordLabel}
        </Label>

        <Input
          autoComplete={nameLabel ? "new-password" : "current-password"}
          className="h-12 rounded-xl border-input bg-background text-base"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {children}
    </Form>
  );
}
