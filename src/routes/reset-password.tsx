import { ResetPassword } from "@/features/auth/pages/ResetPassword";

export function meta() {
  return [{ title: "Reset Password | Cantu's Kitchen" }];
}

export default function ResetPasswordRoute() {
  return <ResetPassword />;
}
