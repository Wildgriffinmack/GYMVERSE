"use client";

import { AGE_RANGES, FITNESS_LEVELS, SOURCES, STRUGGLES, USER_TYPES, WAITLIST } from "@/lib/content";
import { EMPTY_MEMBER, LIMITS, MEMBER_FIELDS, prepareMember, validateMember } from "@/lib/waitlist";
import { CheckboxField, ChipGroup, SelectField, TextField } from "./fields";
import { FormFooter, SubmitButton, useWaitlistForm } from "./useWaitlistForm";

const L = WAITLIST.member;

export function MemberForm({ onSuccess }: { onSuccess: (persisted: boolean) => void }) {
  const { values, errors, status, set, onSubmit, formRef } = useWaitlistForm({
    form: "member",
    initial: EMPTY_MEMBER,
    fields: MEMBER_FIELDS,
    validate: validateMember,
    prepare: prepareMember,
    successEvent: "waitlist_signup",
    onSuccess,
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-label="Early access waitlist" className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="m-name" name="fullName" label={L.fullName} value={values.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} autoComplete="name" autoCapitalize="words" maxLength={LIMITS.name} />
        <TextField id="m-email" name="email" type="email" label={L.email} value={values.email} onChange={(v) => set("email", v)} error={errors.email} autoComplete="email" inputMode="email" autoCapitalize="none" maxLength={LIMITS.email} placeholder="you@example.com" />
      </div>

      <ChipGroup id="m-age" name="ageRange" legend={L.ageRange} options={AGE_RANGES} value={values.ageRange} onChange={(v) => set("ageRange", v)} error={errors.ageRange} />

      {values.ageRange === "under_18" ? (
        <CheckboxField id="m-age13" name="confirmedAge13" label={L.confirmedAge13} hint={L.confirmedAge13Hint} checked={values.confirmedAge13} onChange={(v) => set("confirmedAge13", v)} error={errors.confirmedAge13} />
      ) : null}

      <ChipGroup id="m-level" name="fitnessLevel" legend={L.fitnessLevel} options={FITNESS_LEVELS} value={values.fitnessLevel} onChange={(v) => set("fitnessLevel", v)} error={errors.fitnessLevel} />
      <ChipGroup id="m-type" name="userType" legend={L.userType} options={USER_TYPES} value={values.userType} onChange={(v) => set("userType", v)} error={errors.userType} />
      <ChipGroup id="m-struggle" name="struggle" legend={L.struggle} options={STRUGGLES} value={values.struggle} onChange={(v) => set("struggle", v)} error={errors.struggle} />

      <CheckboxField id="m-beta" name="betaTester" label={L.betaTester} checked={values.betaTester} onChange={(v) => set("betaTester", v)} />

      <SelectField id="m-source" name="source" legend={L.source} options={SOURCES} value={values.source} onChange={(v) => set("source", v)} error={errors.source} optional />

      <div className="space-y-3 pt-1">
        <SubmitButton label={L.cta} submitting={status === "submitting"} />
        <FormFooter status={status} />
      </div>
    </form>
  );
}
