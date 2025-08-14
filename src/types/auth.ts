export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export interface SupabaseError {
  message: string;
  status?: number;
}

export const isSupabaseError = (error: unknown): error is SupabaseError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseError).message === "string"
  );
};