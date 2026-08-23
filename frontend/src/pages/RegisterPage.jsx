import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError("");

    const avatarFile = data.avatar?.[0];
    const coverImageFile = data.coverImage?.[0];

    if (!avatarFile) {
      setServerError("Avatar is required.");
      return;
    }

    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("email", data.email);
    formData.append("fullName", data.fullName);
    formData.append("password", data.password);
    formData.append("avatar", avatarFile);
    if (coverImageFile) {
      formData.append("coverImage", coverImageFile);
    }

    try {
      await registerUser(formData);
      // Send user to dedicated email verification pending page
      navigate("/verify-email", { state: { email: data.email } });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Create your VisionTube account
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          encType="multipart/form-data"
        >
          <div>
            <label htmlFor="username" className="block text-sm mb-1 text-neutral-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="nickname"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm mb-1 text-neutral-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

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
            <label htmlFor="password" className="block text-sm mb-1 text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "At least 6 characters" },
              })}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="avatar" className="block text-sm mb-1 text-neutral-300">
              Avatar (required)
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
              {...register("avatar", { required: "Avatar is required" })}
            />
            {errors.avatar && (
              <p className="text-red-400 text-sm mt-1">{errors.avatar.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm mb-1 text-neutral-300">
              Cover image (optional)
            </label>
            <input
              id="coverImage"
              type="file"
              accept="image/*"
              className="w-full text-sm text-neutral-400 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200 hover:file:bg-neutral-700"
              {...register("coverImage")}
            />
          </div>

          {serverError && (
            <p className="text-red-400 text-sm">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand hover:bg-brand-light transition-colors py-2 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-neutral-400 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-light hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
