import { ROUTES } from "./constants";

type RouteValue = (typeof ROUTES)[keyof typeof ROUTES];

export const isAuthRoute = (pathname: string): boolean => {
  const authRoutes: RouteValue[] = [
    ROUTES.SIGN_IN,
    ROUTES.SIGN_UP,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
  ];

  return authRoutes.includes(pathname as RouteValue);
};
