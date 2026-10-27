"use client";

import { AUDIENCE_SIZES, COACH_TYPES, WAITLIST } from "@/lib/content";
import { COACH_FIELDS, EMPTY_COACH, LIMITS, prepareCoach, validateCoach } from "@/lib/waitlist";
import { CheckboxField, ChipGroup, TextArea, TextField } from "./fields";
import { FormFooter, SubmitButton, useWaitlistForm } from "./useWaitlistForm";

const L = WAITLIST.coach;

export function CoachForm({ onSuccess }: { onSuccess: (persisted: boolean) => void }) {
  const { values, errors, status, set, onSubmit, formRef } = useWaitlistForm({
    form: "coach",
    initial: EMPTY_COACH,
    fields: COACH_FIELDS,
    validate: validateCoach,
    prepare: prepareCoach,
    successEvent: "coach_application",
    onSuccess,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-label="Founding coach application" className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="c-name" name="fullName" label={L.fullName} value={values.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} autoComplete="name" autoCapitalize="words" maxLength={LIMITS.name} />
        <TextField id="c-email" name="email" type="email" label={L.email} value={values.email} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" inputMode="email" autoCapitalize="none" maxLength={LIMITS.email} placeholder="you@example.com" />
      </div>

      <TextField id="c-handle" name="handle" label={L.handle} value={values.handle} onChange={(v) => set("handle", v)} error={errors.handle} autoCapitalize="none" placeholder={L.handlePlaceholder} maxLength={LIMITS.handle} />

      <ChipGroup id="c-type" name="coachType" legend={L.coachType} options={COACH_TYPES} value={values.coachType} onChange={(v) => set("coachType", v)} error={errors.coachType} />
      <ChipGroup id="c-audience" name="audienceSize" legend={L.audienceSize} options={AUDIENCE_SIZES} value={values.audienceSize} onChange={(v) => set("audienceSize", v)} error={errors.audienceSize} />

      <TextArea id="c-help" name="helpMost" label={L.helpMost} value={values.helpMost} onChange={(v) => set("helpMost", v)} error={errors.helpMost} placeholder={L.helpMostPlaceholder} maxLength={LIMITS.helpMost} />

      <CheckboxField id="c-lead" name="leadBeta" label={L.leadBeta} checked={values.leadBeta} onChange={(v) => set("leadBeta", v)} />

      <div className="space-y-3 pt-1">
        <SubmitButton label={L.cta} submitting={status === "submitting"} />
        <FormFooter status={status} />
      </div>
    </form>
  );
}
