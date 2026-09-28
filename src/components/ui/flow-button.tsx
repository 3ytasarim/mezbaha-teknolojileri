import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/**
 * 21st.dev "Flow Button" (xubohuah) — bileşenin herkese açık önizleme paketinden okunup taşındı: hap düğme (site laciverti zemin);
 * hover'da oklar yer değiştirir (soldan girer, sağdan çıkar), köşeler yuvarlaktan 12px'e döner, merkezden büyüyen dolgu
 * düğmeyi kaplar. Uyarlamalar: renkler site paleti (lacivert zemin, turuncu hover dolgusu), `href` desteği
 * (Next.js Link), odaklanınca (klavye) hover ile aynı görünüm, `prefers-reduced-motion` desteği.
 *
 * Renkler: varsayılan lacivert zemin + beyaz yazı; hover/odakta turuncu dolgu genişler.
 * Kullanım: başlıktaki "Teklif Oluştur" gibi hafif, sürekli görünen ikincil-ana eylemler.
 */
type CommonProps = { text: string; className?: string; srHint?: string };
type LinkProps = CommonProps & { href: string };
type ButtonProps = CommonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

const EASE_ARROW = "duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none";

export function FlowButton(props: LinkProps | ButtonProps) {
  const { text, className = "", srHint } = props;

  const classes = `group relative inline-flex cursor-pointer items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-primary bg-primary px-8 py-3 text-sm font-semibold text-white outline-offset-4 transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none hover:rounded-xl hover:border-accent focus-visible:rounded-xl focus-visible:border-accent active:scale-[0.95] ${className}`;

  const inner = (
    <>
      <ArrowRight
        aria-hidden="true"
        className={`absolute start-[-25%] z-[9] size-4 fill-none stroke-white transition-all ${EASE_ARROW} group-hover:start-4 group-focus-visible:start-4`}
      />
      <span className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3 group-focus-visible:translate-x-3 motion-reduce:transition-none">
        {text}
        {srHint && <span className="sr-only"> {srHint}</span>}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-accent opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:size-[220px] group-hover:opacity-100 group-focus-visible:size-[220px] group-focus-visible:opacity-100 motion-reduce:transition-none"
      />
      <ArrowRight
        aria-hidden="true"
        className={`absolute end-4 z-[9] size-4 fill-none stroke-white transition-all ${EASE_ARROW} group-hover:end-[-25%] group-focus-visible:end-[-25%]`}
      />
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={classes}>
        {inner}
      </Link>
    );
  }

  const { text: _t, className: _c, srHint: _h, ...rest } = props as ButtonProps;
  void _t;
  void _c;
  void _h;
  return (
    <button type="button" {...rest} className={classes}>
      {inner}
    </button>
  );
}
