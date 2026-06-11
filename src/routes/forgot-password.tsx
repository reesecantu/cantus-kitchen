import { ForgotPassword } from "@/features/auth/pages/ForgotPassword";

export function meta() {
  return [{ title: "Forgot Password | Cantu's Kitchen" }];
}

export default function ForgotPasswordRoute() {
  return <ForgotPassword />;
}
