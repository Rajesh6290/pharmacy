"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import useMutation from "@/shared/hooks/useMutation";
import CustomButton from "@/shared/common/CustomButton";
import { registerSchema } from "@/features/auth/schema/authSchema";

const RegisterPage = () => {
  const router = useRouter();
  const { mutation, isLoading } = useMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (values: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) => {
    const { confirmPassword, ...body } = values;
    void confirmPassword;
    const res = await mutation("auth/register", {
      method: "POST",
      body,
      isAlert: true,
    });
    if (res?.results?.success) {
      router.push("/login");
    }
  };

  return (
    <div className="bg-accent-50 flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
              Create Account
            </h1>
            <p className="text-accent-500 text-sm">
              Sign up to start ordering medicines online
            </p>
          </div>

          <Formik
            initialValues={{
              name: "",
              email: "",
              phone: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className="space-y-4">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="text-accent-700 mb-1.5 block text-sm font-medium"
                  >
                    Full Name
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Ravi Kumar"
                    className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2"
                  />
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

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
                    placeholder="you@example.com"
                    className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2"
                  />
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="text-accent-700 mb-1.5 block text-sm font-medium"
                  >
                    Mobile Number
                  </label>
                  <Field
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2"
                  />
                  <ErrorMessage
                    name="phone"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="text-accent-700 mb-1.5 block text-sm font-medium"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
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

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="text-accent-700 mb-1.5 block text-sm font-medium"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="border-accent-300 text-accent-900 placeholder-accent-400 focus:border-primary-500 focus:ring-primary-100 w-full rounded-lg border bg-white px-3.5 py-2.5 pr-10 text-sm transition-colors outline-none focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-accent-400 hover:text-accent-600 absolute top-1/2 right-3 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="p"
                    className="text-error-500 mt-1 text-xs"
                  />
                </div>

                <div className="pt-1">
                  <CustomButton
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                    loadingText="Creating account..."
                    endIcon={<UserPlus size={16} />}
                  >
                    Create Account
                  </CustomButton>
                </div>
              </Form>
            )}
          </Formik>

          <p className="text-accent-500 mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
