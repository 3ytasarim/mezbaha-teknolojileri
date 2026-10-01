"use client";

import { useActionState, useEffect } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button3D } from "@/components/ui/button-3d";
import { useDict } from "@/components/i18n/locale-provider";
import { reportLeadFormConversion } from "@/lib/analytics/google-ads";
import { submitQuoteAction, type QuoteFormState } from "@/app/(public)/teklif-al/actions";

const initialState: QuoteFormState = { status: "idle" };

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-red-400";

function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export type QuoteProductOption = { id: string; name: string };

// Değerler (kayıt) Türkçe sabit anahtarlardır; görünen etiketler sözlükten gelir (forms.projectTypes, aynı sırada).
const PROJECT_TYPES = ["Yeni mezbaha kurulumu", "Mevcut tesise ekipman", "Modernizasyon / yenileme", "Diğer"];

/** Teklif talebi formu: firma ve proje bilgileriyle, isteğe bağlı ürün seçimiyle. */
export function QuoteForm({ products, defaultProductId }: { products: QuoteProductOption[]; defaultProductId?: string }) {
  const f = useDict().forms;
  const [state, formAction, pending] = useActionState(submitQuoteAction, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") reportLeadFormConversion();
  }, [state.status]);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col items-center rounded-[22px] border border-emerald-200 bg-emerald-50 p-8 text-center sm:p-12">
        <CheckCircle2 className="size-14 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">{f.thanks}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  const describe = (key: keyof NonNullable<QuoteFormState["fieldErrors"]>) => (errors[key] ? `${key}-error` : undefined);

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-24px_rgba(35,48,95,0.4)] sm:p-8 lg:p-10"
    >
      {state.status === "error" && state.message && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">{f.honeypot}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="name" label={f.name} required error={errors.name}>
          <input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={describe("name")} className={inputClass} />
        </Field>
        <Field id="company" label={f.company} required error={errors.company}>
          <input id="company" name="company" autoComplete="organization" required aria-invalid={!!errors.company} aria-describedby={describe("company")} className={inputClass} />
        </Field>
        <Field id="email" label={f.email} required error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={describe("email")} className={inputClass} />
        </Field>
        <Field id="phone" label={f.phone} required error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!errors.phone} aria-describedby={describe("phone")} className={inputClass} />
        </Field>
        <Field id="country" label={f.country} required error={errors.country}>
          <input id="country" name="country" autoComplete="country-name" defaultValue={f.countryDefault} required aria-invalid={!!errors.country} aria-describedby={describe("country")} className={inputClass} />
        </Field>
        <Field id="projectType" label={f.projectType}>
          <select id="projectType" name="projectType" defaultValue="" className={inputClass}>
            <option value="">{f.choose}</option>
            {PROJECT_TYPES.map((type, i) => (
              <option key={type} value={type}>
                {f.projectTypes[i] ?? type}
              </option>
            ))}
          </select>
        </Field>
        <Field id="productId" label={f.product}>
          <select id="productId" name="productId" defaultValue={defaultProductId ?? ""} className={inputClass}>
            <option value="">{f.productNone}</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="capacity" label={f.capacity}>
          <input id="capacity" name="capacity" placeholder={f.capacityPlaceholder} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="message" label={f.request} required error={errors.message}>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              aria-invalid={!!errors.message}
              aria-describedby={describe("message")}
              placeholder={f.requestPlaceholder}
              className={`${inputClass} h-auto resize-y py-3`}
            />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={!!errors.consent}
            aria-describedby={describe("consent")}
            className="mt-1 size-5 shrink-0 rounded border-slate-300 accent-[var(--color-primary)]"
          />
          <span>
            {f.consentQuote}
            <span className="text-accent"> *</span>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Button3D type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
          {pending ? f.sending : f.sendQuote}
        </Button3D>
      </div>
    </form>
  );
}
