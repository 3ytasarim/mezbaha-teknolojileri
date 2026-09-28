import type { CSSProperties } from "react";

/**
 * 21st.dev "Gradient Backgrounds" (meghtrix) — kaynaktaki bileşen, üst kapsayıcıya `absolute inset-0` oturan radyal gradyan
 * katmanıdır: `radial-gradient(125% 125% at 50% <konum>, #fff 40%, <renk> 100%)`. Kaynaktaki renk (#6366f1 vb.) yerine
 * sitenin mavisi verilir. Üst öğe `relative isolate` olmalı; içerik bu katmanın üstünde durur.
 *
 * `origin`: beyaz merkezin konumu. "50% 10%" = beyaz üstte, renk alta doğru koyulaşır (kaynaktaki "top" varyantı);
 * "50% 90%" = beyaz altta, renk üste doğru koyulaşır.
 */
export function GradientBackground({
  color = "#23305f",
  origin = "50% 10%",
  className = "",
}: {
  color?: string;
  origin?: string;
  className?: string;
}) {
  const style: CSSProperties = {
    background: `radial-gradient(125% 125% at ${origin}, #fff 40%, ${color} 100%)`,
  };

  return <div aria-hidden="true" className={`absolute inset-0 -z-10 ${className}`} style={style} />;
}
