"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/ky-client";
import { ensureOk, type ApiResponse, type ApiSuccess } from "@/lib/api-response";

const queryKey = (name: string) => ["test-greeting", name] as const;

interface GreetingData {
  message: string;
  time: string;
}

export function useTestGreeting(name: string) {
  return useQuery<ApiSuccess<GreetingData>>({
    queryKey: queryKey(name),
    queryFn: async () => {
      const response = await http.get<ApiResponse<GreetingData>>("api/test", {
        searchParams: { name },
        throwHttpErrors: false,
      });
      return ensureOk(response);
    },
    staleTime: 30_000,
  });
}
