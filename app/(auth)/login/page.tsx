import type { Metadata } from "next";
import { LoginPageClient } from "@/components/auth/login-client";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to Quill - Connect to your PostgreSQL database securely. Your connection details are encrypted and stored locally in your browser.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginPageClient />;
}

