"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button3D } from "@/components/ui/button-3d";
import { useDict } from "@/components/i18n/locale-provider";
import { submitContactAction, type ContactFormState } from "@/app/(public)/iletisim/actions";

const initialState: ContactFormState = { status: "idle" };

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 aria-[invalid=true]:border-red-400";

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
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

/** İletişim formu (Meridius iletişim düzeni: yuvarlak köşeli kart, geniş alanlar, net hata iletileri). */
export function ContactForm({ className = "", bare = false }: { className?: string; bare?: boolean }) {
  const f = useDict().forms;
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center bg-emerald-50 p-8 text-center sm:p-10 ${bare ? "h-full" : "rounded-[22px] border border-emerald-200"} ${className}`}
      >
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">{f.thanks}</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className={`bg-white p-6 sm:p-8 lg:p-10 ${bare ? "" : "rounded-[22px] border border-slate-200 shadow-[0_22px_50px_-14px_rgba(35,48,95,0.28)]"} ${className}`}
    >
      <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">{f.contactTitle}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{f.contactSub}</p>

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {/* Bal küpü: ekranda görünmez, botlar doldurur */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">{f.honeypot}</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="name" label={f.name} required error={errors.name}>
          <input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} className={inputClass} />
        </Field>
        <Field id="email" label={f.email} required error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} className={inputClass} />
        </Field>
        <Field id="phone" label={f.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} />
        </Field>
        <Field id="company" label={f.company}>
          <input id="company" name="company" autoComplete="organization" className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="subject" label={f.subject}>
            <input id="subject" name="subject" placeholder={f.subjectPlaceholder} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="message" label={f.messageLabel} required error={errors.message}>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
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
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 size-5 shrink-0 rounded border-slate-300 accent-[var(--color-primary)]"
          />
          <span>
            {f.consentContact}
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
          {pending ? f.sending : f.sendMessage}
        </Button3D>
      </div>
    </form>
  );
}
