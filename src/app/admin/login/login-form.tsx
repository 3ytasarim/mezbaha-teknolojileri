"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

/**
 * Yönetim paneli girişi — 21st.dev "Sign In Card 2" (jatin-yadav05) bileşeninin düzeni ve animasyonları (bileşenin herkese
 * açık önizleme paketinden okunup taşındı): fareyle eğilen 3B cam kart, kenarlarda dolanan ışık şeritleri, yumuşak
 * parlamalar, odaklanan alanlarda vurgu, şifre göster/gizle. Renkler sitenin laciverti ve turuncusu.
 * Kaynaktaki sahte "Beni hatırla / Şifremi unuttum / Google" öğeleri çalışmadığı için alınmadı; giriş mantığı
 * (`login` sunucu eylemi, e-posta + şifre) değişmedi.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const onLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const fieldWrap = "relative flex items-center overflow-hidden rounded-lg";
  const fieldInput =
    "h-11 w-full rounded-lg border border-transparent bg-white/5 pl-10 pr-3 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-white/35 focus:border-white/25 focus:bg-white/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative z-10 w-full max-w-sm"
      style={{ perspective: 1500 }}
    >
      <motion.div className="relative" style={{ rotateX, rotateY }} onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ z: 10 }}>
        <div className="group relative">
          {/* dolanan ışık şeritleri */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-px overflow-hidden rounded-2xl">
            <motion.div
              className="absolute left-0 top-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{ left: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
              transition={{ left: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror" } }}
            />
            <motion.div
              className="absolute right-0 top-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-orange-300 to-transparent"
              animate={{ top: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
              transition={{ top: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 0.6 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 0.6 } }}
            />
            <motion.div
              className="absolute bottom-0 right-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{ right: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
              transition={{ right: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.2 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.2 } }}
            />
            <motion.div
              className="absolute bottom-0 left-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-orange-300 to-transparent"
              animate={{ bottom: ["-50%", "100%"], opacity: [0.3, 0.7, 0.3] }}
              transition={{ bottom: { duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1, delay: 1.8 }, opacity: { duration: 1.2, repeat: Infinity, repeatType: "mirror", delay: 1.8 } }}
            />
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101838]/60 p-7 shadow-2xl backdrop-blur-xl">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
                backgroundSize: "30px 30px",
              }}
            />

            <div className="relative mb-6 space-y-1.5 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="mx-auto flex justify-center pb-3"
              >
                <Image
                  src="/images/brand/logo-white.svg"
                  alt="Mezbaha Teknolojileri"
                  width={483}
                  height={117}
                  unoptimized
                  priority
                  className="h-14 w-auto"
                />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-heading text-xl font-bold text-white">
                Yönetim Paneli
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-white/60">
                Mezbaha Teknolojileri hesabınızla giriş yapın
              </motion.p>
            </div>

            <form action={formAction} className="relative space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  E-posta
                </label>
                <div className={fieldWrap}>
                  <Mail aria-hidden="true" className={`absolute left-3 size-4 transition-colors duration-300 ${focused === "email" ? "text-white" : "text-white/40"}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="E-posta adresi"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    className={fieldInput}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Şifre
                </label>
                <div className={fieldWrap}>
                  <Lock aria-hidden="true" className={`absolute left-3 size-4 transition-colors duration-300 ${focused === "password" ? "text-white" : "text-white/40"}`} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Şifre"
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    className={`${fieldInput} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    className="absolute right-1 flex size-9 items-center justify-center rounded-md text-white/40 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {state.error && (
                <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {state.error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={pending}
                className="group/button relative mt-2 w-full"
              >
                <div aria-hidden="true" className="absolute inset-0 rounded-lg bg-accent/60 opacity-0 blur-lg transition-opacity duration-300 group-hover/button:opacity-80" />
                <div className="relative flex h-11 items-center justify-center overflow-hidden rounded-lg bg-accent text-sm font-semibold text-white transition-all duration-300 group-hover/button:bg-accent-hover disabled:opacity-60">
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                      Giriş yapılıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap
                      <ArrowRight className="ml-1.5 size-4 transition-transform duration-300 group-hover/button:translate-x-1" aria-hidden="true" />
                    </>
                  )}
                </div>
              </motion.button>
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
