"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = {
  error?: string;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Geçerli bir e-posta ve şifre girin." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (!user || !user.active) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const validPassword = await verifyPassword(user.passwordHash, password);

  if (!validPassword) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);

  redirect("/admin");
}
