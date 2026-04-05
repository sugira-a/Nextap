import { apiRequest } from "@/lib/api";

export type AuthMeResponse = {
  user: {
    id: string;
    role: string;
    company_id?: string | null;
  };
  company?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export async function getAuthContext(): Promise<AuthMeResponse> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("Authentication required");
  }

  return apiRequest<AuthMeResponse>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getCurrentCompanyId(): Promise<string> {
  const context = await getAuthContext();
  const companyId = context.user.company_id || context.company?.id;

  if (!companyId) {
    throw new Error("No company assigned to this account");
  }

  return companyId;
}