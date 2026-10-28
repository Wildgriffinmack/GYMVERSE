"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { submissionContext, track, type AnalyticsEvent } from "@/lib/analytics";
import { submitWaitlist } from "@/lib/submit";
import type { FieldErrors, Prepared, SubmissionContext, WaitlistSubmission } from "@/lib/waitlist";
import { analyticsPropsFor } from "@/lib/waitlist";
import { WAITLIST } from "@/lib/content";
import { ctaClasses } from "../ui/CtaLink";
import { focusFirstError } from "./fields";

interface FormEngineOptions<V, S extends WaitlistSubmission> {
  form: "member" | "coach";
  initial: V;
  fields: readonly string[];
  validate: (values: V) => FieldErrors<V>;
  prepare: (values: V, context: SubmissionContext) => Prepared<S, V>;
  successEvent: AnalyticsEvent;
  onSuccess: (persisted: boolean) => void;
}

/** Shared state machine for both waitlist forms: validation, focus management, submission and tracking. */
export function useWaitlistForm<V extends object, S extends WaitlistSubmission>(opts: FormEngineOptions<V, S>) {
  const [values, setValues] = useState<V>(opts.initial);
  const [errors, setErrors] = useState<FieldErrors<V>>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>(WAITLIST.submitError);
  // Bumped on each invalid submit; the effect below moves focus once the errors are rendered.
  const [focusRequest, setFocusRequest] = useState(0);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { fields } = opts;

  useEffect(() => {
    // Only runs when a new invalid submit requests focus, not on every keystroke.
    if (focusRequest) focusFirstError(formRef.current, fields, errors as Partial<Record<string, string>>);
  }, [focusRequest]);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track("form_start", { form: opts.form });
  }

  function set<K extends keyof V>(key: K, value: V[K]) {
    markStarted();
    const next = { ...values, [key]: value };
    setValues(next);
    if (attempted) setErrors(opts.validate(next));
    if (status === "error") setStatus("idle");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    markStarted();
    const prepared = opts.prepare(values, submissionContext());
    if (!prepared.ok) {
      setErrors(prepared.errors);
      setAttempted(true);
      setFocusRequest((n) => n + 1);
      track("form_submit_error", { form: opts.form, error_count: Object.keys(prepared.errors).length });
      return;
    }
    setErrors({});
    setStatus("submitting");
    const honeypot = (formRef.current?.elements.namedItem(HONEYPOT_NAME) as HTMLInputElement | null)?.value ?? "";
    const result = await submitWaitlist(prepared.submission, { honeypot });
    if (!result.ok) {
      setErrorMessage(result.message);
      setStatus("error");
      return;
    }
    track(opts.successEvent, analyticsPropsFor(prepared.submission));
    opts.onSuccess(result.persisted);
  }

  return { values, errors, status, errorMessage, set, onSubmit, formRef };
}

export function SubmitButton({ label, submitting }: { label: string; submitting: boolean }) {
  return (
    <button type="submit" disabled={submitting} aria-disabled={submitting} className={ctaClasses("primary", "lg", "w-full disabled:cursor-wait disabled:opacity-80")}>
      {submitting ? (
        <>
          <LoaderCircle aria-hidden="true" size={20} className="animate-spin" />
          {WAITLIST.submitting}
        </>
      ) : (
        <>
          {label}
          <ArrowRight aria-hidden="true" size={20} strokeWidth={2.6} />
        </>
      )}
    </button>
  );
}

/** Name of the hidden anti-bot field (must match HONEYPOT_FIELD on the server). */
export const HONEYPOT_NAME = "website";

/** Off-screen field people never see or fill in; automated form fillers often do. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

export function FormFooter({ status, message = WAITLIST.submitError }: { status: "idle" | "submitting" | "error"; message?: string }) {
  return (
    <>
      {status === "error" ? (
        <p role="alert" className="text-center text-[14.5px] text-hot">
          {message}
        </p>
      ) : null}
      <p className="text-center text-[13px] leading-relaxed text-ash">{WAITLIST.consent}</p>
    </>
  );
}
