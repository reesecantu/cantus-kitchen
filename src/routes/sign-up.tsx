import { SignUp } from "@/features/auth/pages/SignUp";

export function meta() {
  return [{ title: "Sign Up | Cantu's Kitchen" }];
}

export default function SignUpRoute() {
  return <SignUp />;
}
