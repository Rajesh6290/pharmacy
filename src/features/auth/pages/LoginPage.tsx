"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/shared/hooks/useAuth";
import CustomButton from "@/shared/common/CustomButton";
import { loginSchema } from "@/features/auth/schema/authSchema";

const LoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: { setSubmitting: (v: boolean) => void }
  ) => {
    const result = await login(values.email, values.password);
    setSubmitting(false);
    if (result.success) {
      toast.success("Welcome back!");
      const role = result.user?.role;
      if (role === "admin" || role === "pharmacist") {
        router.push("/admin/dashboard");
      } else {
        router.push("/store");
      }
    } else {
      toast.error(result.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="bg-accent-50 flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="border-accent-200 rounded-2xl border bg-white px-8 py-10 shadow-sm">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <Image
              src="/logo.svg"
              alt="Sidheswar Drugs House"
              width={140}
              height={48}
              className="h-12 w-auto object-contain"
            />
            <h1 className="text-accent-900 mt-3 text-2xl font-bold">
              Welcome Back
            </h1>
            <p className="text-accent-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-accent-700 mb-1.5 block text-sm font-medium"
                  >
                    Email Address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-accent-700 text-sm font-medium"
                    >
                      Password
                    </label>
                    <Link
                      href="#"
                      className="text-primary-600 text-xs hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm transition-colors outline-none focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-accent-400 hover:text-accent-600 absolute top-1/2 right-3 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                <CustomButton
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  loadingText="Signing in..."
                  endIcon={<LogIn size={16} />}
                >
                  Sign In
                </CustomButton>
              </Form>
            )}
          </Formik>

          <p className="text-accent-500 mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary-600 font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
