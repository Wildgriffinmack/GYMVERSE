"use client";

import type { ReactNode } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import type { Option } from "@/lib/content";
import { cx } from "@/lib/ui";

const LABEL = "flex items-baseline justify-between gap-3 font-label text-[16px] font-bold uppercase tracking-[0.08em] text-warm";
const CONTROL =
  "mt-2 w-full rounded-2xl border bg-charcoal px-4 text-[16px] text-warm placeholder:text-ash/70 transition focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/30";

function errorId(id: string) {
  return `${id}-error`;
}

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function OptionalTag() {
  return <span className="font-sans text-[12.5px] font-medium normal-case tracking-normal text-ash">Optional</span>;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(id)} className="mt-2 flex items-start gap-1.5 text-[14px] leading-snug text-hot">
      <CircleAlert aria-hidden="true" size={16} className="mt-px shrink-0" />
      {message}
    </p>
  );
}

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: "text" | "email";
  autoComplete?: string;
  inputMode?: "text" | "email" | "url";
  autoCapitalize?: "none" | "words" | "sentences";
  placeholder?: string;
  maxLength?: number;
}

export function TextField({ id, name, label, value, onChange, error, type = "text", autoComplete, inputMode, autoCapitalize, placeholder, maxLength }: TextFieldProps) {
  return (
    <div data-field={name}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        spellCheck={type === "email" ? false : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(error && errorId(id))}
        className={cx(CONTROL, "h-13", error ? "border-hot/70" : "border-white/10")}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

interface TextAreaProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  maxLength: number;
}

export function TextArea({ id, name, label, value, onChange, error, placeholder, maxLength }: TextAreaProps) {
  const countId = `${id}-count`;
  return (
    <div data-field={name}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(countId, error && errorId(id))}
        className={cx(CONTROL, "resize-y py-3 leading-relaxed", error ? "border-hot/70" : "border-white/10")}
      />
      <div className="flex items-start justify-between gap-3">
        <FieldError id={id} message={error} />
        <p id={countId} className="ml-auto mt-2 shrink-0 text-[12.5px] text-ash">
          {value.length}/{maxLength}
        </p>
      </div>
    </div>
  );
}

interface ChoiceProps<V extends string> {
  id: string;
  name: string;
  legend: string;
  options: readonly Option<V>[];
  value: V | "";
  onChange: (value: V) => void;
  error?: string;
}

/** Single-choice chips backed by native radio inputs (keyboard arrows and screen readers work as usual). */
export function ChipGroup<V extends string>({ id, name, legend, options, value, onChange, error }: ChoiceProps<V>) {
  return (
    <fieldset data-field={name} aria-describedby={describedBy(error && errorId(id))}>
      <legend className={LABEL}>{legend}</legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          const inputId = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cx(
                "inline-flex min-h-11 cursor-pointer items-center rounded-xl border px-3.5 py-2 text-[15px] font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flame",
                checked ? "border-flame bg-flame/15 text-warm" : "border-white/10 bg-charcoal text-ash hover:border-white/25 hover:text-warm",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                aria-invalid={error ? true : undefined}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldError id={id} message={error} />
    </fieldset>
  );
}

export function SelectField<V extends string>({ id, name, legend, options, value, onChange, error, optional, placeholder = "Choose one" }: ChoiceProps<V> & { optional?: boolean; placeholder?: string }) {
  return (
    <div data-field={name}>
      <label htmlFor={id} className={LABEL}>
        {legend}
        {optional ? <OptionalTag /> : null}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value as V)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(error && errorId(id))}
          className={cx(CONTROL, "h-13 cursor-pointer appearance-none pr-11", value ? "text-warm" : "text-ash", error ? "border-hot/70" : "border-white/10")}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" size={18} className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-ash" />
      </div>
      <FieldError id={id} message={error} />
    </div>
  );
}

export function CheckboxField({
  id,
  name,
  label,
  checked,
  onChange,
  error,
  hint,
}: {
  id: string;
  name: string;
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  hint?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div data-field={name}>
      <label
        htmlFor={id}
        className={cx(
          "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
          error ? "border-hot/60" : checked ? "border-flame/50 bg-flame/[0.06]" : "border-white/10 hover:border-white/20",
        )}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, error && errorId(id))}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-flame"
        />
        <span>
          <span className="block text-[15.5px] font-medium leading-snug text-warm">{label}</span>
          {hint ? (
            <span id={hintId} className="mt-1 block text-[13.5px] leading-snug text-ash">
              {hint}
            </span>
          ) : null}
        </span>
      </label>
      <FieldError id={id} message={error} />
    </div>
  );
}

/** Focuses the first invalid field (in render order). Call after React has committed the error state. */
export function focusFirstError(form: HTMLFormElement | null, order: readonly string[], errors: Partial<Record<string, string>>) {
  const first = order.find((field) => errors[field]);
  if (!form || !first) return;
  const wrapper = form.querySelector<HTMLElement>(`[data-field="${first}"]`);
  const control = wrapper?.querySelector<HTMLElement>("input:checked") ?? wrapper?.querySelector<HTMLElement>("input, select, textarea");
  control?.focus({ preventScroll: true });
  wrapper?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}
