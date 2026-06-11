import { SignIn } from "@/features/auth/pages/SignIn";

export function meta() {
  return [{ title: "Sign In | Cantu's Kitchen" }];
}

export default function SignInRoute() {
  return <SignIn />;
}
