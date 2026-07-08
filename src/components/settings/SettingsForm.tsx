"use client";



import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeTeacherPassword, updateTeacherProfile } from "@/lib/actions";



export function SettingsForm({

  fullName: initialFullName,

  email,

}: {

  fullName: string;

  email: string;

}) {

  const [profileError, setProfileError] = useState<string | null>(null);

  const [profileSuccess, setProfileSuccess] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [profilePending, startProfileTransition] = useTransition();

  const [passwordPending, startPasswordTransition] = useTransition();
  const router = useRouter();



  function handleProfileSubmit(formData: FormData) {

    setProfileError(null);

    setProfileSuccess(false);

    startProfileTransition(async () => {

      const result = await updateTeacherProfile(formData);

      if (result?.error) {

        setProfileError(result.error);

      } else if (result?.success) {

        setProfileSuccess(true);
        router.refresh();

      }

    });

  }



  function handlePasswordSubmit(formData: FormData) {

    setPasswordError(null);

    setPasswordSuccess(false);

    startPasswordTransition(async () => {

      const result = await changeTeacherPassword(formData);

      if (result?.error) {

        setPasswordError(result.error);

      } else if (result?.success) {

        setPasswordSuccess(true);

      }

    });

  }



  return (

    <div className="space-y-6">

      <form action={handleProfileSubmit} className="space-y-4">

        <div>

          <label className="mb-1.5 block text-sm text-text-secondary">Email</label>

          <input

            type="email"

            value={email}

            readOnly

            className="w-full cursor-not-allowed rounded-xl border border-border bg-bg-elevated/50 px-4 py-3 text-sm text-text-muted outline-none"

          />

        </div>

        <div>

          <label className="mb-1.5 block text-sm text-text-secondary">ФИО</label>

          <input

            name="fullName"

            type="text"

            required

            minLength={3}

            defaultValue={initialFullName}

            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"

          />

        </div>



        {profileError && (

          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">

            {profileError}

          </p>

        )}

        {profileSuccess && (

          <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">

            Профиль сохранён

          </p>

        )}



        <button

          type="submit"

          disabled={profilePending}

          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"

        >

          {profilePending ? "Сохранение..." : "Сохранить профиль"}

        </button>

      </form>



      <hr className="border-border" />



      <form action={handlePasswordSubmit} className="space-y-4">

        <h3 className="font-medium">Смена пароля</h3>

        <div>

          <label className="mb-1.5 block text-sm text-text-secondary">

            Текущий пароль

          </label>

          <input

            name="currentPassword"

            type="password"

            required

            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"

          />

        </div>

        <div>

          <label className="mb-1.5 block text-sm text-text-secondary">

            Новый пароль

          </label>

          <input

            name="newPassword"

            type="password"

            required

            minLength={6}

            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"

          />

        </div>

        <div>

          <label className="mb-1.5 block text-sm text-text-secondary">

            Подтверждение

          </label>

          <input

            name="confirmPassword"

            type="password"

            required

            minLength={6}

            className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-accent"

          />

        </div>



        {passwordError && (

          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">

            {passwordError}

          </p>

        )}

        {passwordSuccess && (

          <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-400">

            Пароль успешно изменён

          </p>

        )}



        <button

          type="submit"

          disabled={passwordPending}

          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-secondary hover:border-accent/30 hover:text-accent disabled:opacity-50"

        >

          {passwordPending ? "Сохранение..." : "Сохранить пароль"}

        </button>

      </form>

    </div>

  );

}

