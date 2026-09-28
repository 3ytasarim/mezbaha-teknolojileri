import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Yönetim Paneli Girişi",
  robots: { index: false, follow: false },
};

/** Site laciverti zemin, yumuşak mavi ve turuncu parlamalar (21st.dev Sign In Card 2 arka planının site renkleriyle uyarlaması). */
export default function AdminLoginPage() {
  return (
    <div className="admin-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-[#141c3f] px-4 py-10">
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#3a4d9a]/45 via-[#23305f]/70 to-[#101838]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />
      <div aria-hidden="true" className="absolute left-1/2 top-0 h-[60vh] w-[120vh] max-w-[140vw] -translate-x-1/2 rounded-b-[50%] bg-[#6f86e0]/20 blur-[80px]" />
      <div aria-hidden="true" className="absolute bottom-0 left-1/2 h-[70vh] w-[80vh] max-w-[120vw] -translate-x-1/2 rounded-t-full bg-accent/20 blur-[90px]" />
      <div aria-hidden="true" className="absolute left-1/4 top-1/4 size-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px]" />
      <div aria-hidden="true" className="absolute bottom-1/4 right-1/4 size-96 animate-pulse rounded-full bg-white/5 opacity-40 blur-[100px] [animation-delay:1s]" />

      <LoginForm />
    </div>
  );
}
