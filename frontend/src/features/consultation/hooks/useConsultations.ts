"use client";

import { useQuery } from "@tanstack/react-query";
import { listConsultations } from "../api/consultation-api";

export function useConsultations(offset = 0, limit = 20) {
  return useQuery({
    queryKey: ["consultations", offset, limit],
    queryFn: () => listConsultations(offset, limit),
  });
}
