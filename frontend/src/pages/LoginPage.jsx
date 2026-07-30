import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  const redirectTo = location.state?.from?.pathname || "/";

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await login(data);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Log in to VideoTube
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div>
            <label htmlFor="password" className="block text-sm mb-1 text-neutral-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 focus:outline-none focus:border-brand"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-red-400 text-sm">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand hover:bg-brand-light transition-colors py-2 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-neutral-400 mt-4 text-center">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-brand-light hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
