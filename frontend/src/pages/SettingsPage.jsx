import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import {
  updateAccountDetails,
  changeCurrentPassword,
} from "../api/auth.api";
import {
  updateAvatar,
  updateCoverImage,
  deleteCoverImage,
} from "../api/user.api";

function SectionCard({ title, children }) {
  return (
    <div className="rounded-lg border border-neutral-800 p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ImagesSection() {
  const { user, setUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(null);
  const [coverProgress, setCoverProgress] = useState(null);
  const [avatarError, setAvatarError] = useState("");
  const [coverError, setCoverError] = useState("");

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarError("");
    setAvatarBusy(true);
    setAvatarProgress(0);
    try {
      const updated = await updateAvatar(avatarFile, {
        onUploadProgress: (e) => {
          if (e.total) setAvatarProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setUser(updated);
      setAvatarFile(null);
    } catch (err) {
      setAvatarError(
        err.response?.data?.message || "Couldn't update avatar. Try again."
      );
    } finally {
      setAvatarBusy(false);
      setAvatarProgress(null);
    }
  };

  const handleCoverUpload = async () => {
    if (!coverFile) return;
    setCoverError("");
    setCoverBusy(true);
    setCoverProgress(0);
    try {
      const updated = await updateCoverImage(coverFile, {
        onUploadProgress: (e) => {
          if (e.total) setCoverProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setUser(updated);
      setCoverFile(null);
    } catch (err) {
      setCoverError(
        err.response?.data?.message || "Couldn't update cover image. Try again."
      );
    } finally {
      setCoverBusy(false);
      setCoverProgress(null);
    }
  };

  const handleCoverDelete = async () => {
    setCoverError("");
    setCoverBusy(true);
    try {
      const updated = await deleteCoverImage();
      setUser(updated);
    } catch (err) {
      setCoverError(
        err.response?.data?.message || "Couldn't remove cover image. Try again."
      );
    } finally {
      setCoverBusy(false);
    }
  };

  return (
    <SectionCard title="Profile images">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-neutral-300 mb-2">Avatar</p>
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-16 h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-700 shrink-0 flex items-center justify-center text-lg font-medium">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
              />
            </div>
            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={!avatarFile || avatarBusy}
              className="rounded-md px-3 py-2 text-sm bg-brand hover:bg-brand-light transition-colors disabled:opacity-50 shrink-0"
            >
              {avatarBusy ? "Uploading…" : "Save"}
            </button>
          </div>
          {avatarProgress !== null && (
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-2">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${avatarProgress}%` }}
              />
            </div>
          )}
          {avatarError && (
            <p className="text-red-400 text-sm mt-2">{avatarError}</p>
          )}
        </div>

        <div>
          <p className="text-sm text-neutral-300 mb-2">Cover image</p>
          <div className="h-28 rounded-md bg-neutral-900 overflow-hidden mb-3">
            {user?.coverImage && (
              <img
                src={user.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="flex-1 min-w-0 text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
            />
            <button
              type="button"
              onClick={handleCoverUpload}
              disabled={!coverFile || coverBusy}
              className="rounded-md px-3 py-2 text-sm bg-brand hover:bg-brand-light transition-colors disabled:opacity-50 shrink-0"
            >
              {coverBusy ? "Uploading…" : "Save"}
            </button>
            {user?.coverImage && (
              <button
                type="button"
                onClick={handleCoverDelete}
                disabled={coverBusy}
                className="rounded-md px-3 py-2 text-sm border border-neutral-700 hover:bg-neutral-900 transition-colors disabled:opacity-50 shrink-0"
              >
                Remove
              </button>
            )}
          </div>
          {coverProgress !== null && (
            <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden mt-2">
              <div
                className="h-full bg-brand transition-all"
                style={{ width: `${coverProgress}%` }}
              />
            </div>
          )}
          {coverError && (
            <p className="text-red-400 text-sm mt-2">{coverError}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function AccountDetailsSection() {
  const { user, setUser } = useAuth();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");
    setSuccess(false);
    try {
      const updated = await updateAccountDetails(data);
      setUser(updated);
      setSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Couldn't update details. Try again."
      );
    }
  };

  return (
    <SectionCard title="Account details">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div>
          <label htmlFor="fullName" className="block text-sm mb-1 text-neutral-300">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("fullName", { required: "Full name is required" })}
          />
          {errors.fullName && (
            <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm mb-1 text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
        {success && (
          <p className="text-green-400 text-sm">Details updated.</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md px-4 py-2 text-sm bg-brand hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </SectionCard>
  );
}

function PasswordSection() {
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setServerError("");
    setSuccess(false);
    try {
      await changeCurrentPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          "Couldn't change password. Check your current password and try again."
      );
    }
  };

  return (
    <SectionCard title="Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm mb-1 text-neutral-300">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("currentPassword", { required: "Current password is required" })}
          />
          {errors.currentPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm mb-1 text-neutral-300">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("newPassword", {
              required: "New password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            })}
          />
          {errors.newPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm mb-1 text-neutral-300">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
            {...register("confirmPassword", {
              required: "Please confirm your new password",
              validate: (value) => value === newPassword || "Passwords don't match",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && <p className="text-red-400 text-sm">{serverError}</p>}
        {success && (
          <p className="text-green-400 text-sm">Password changed.</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md px-4 py-2 text-sm bg-brand hover:bg-brand-light transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Change password"}
        </button>
      </form>
    </SectionCard>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-lg font-semibold mb-6">Settings</h1>
      <div className="space-y-6">
        <ImagesSection />
        <AccountDetailsSection />
        <PasswordSection />
      </div>
    </div>
  );
}
