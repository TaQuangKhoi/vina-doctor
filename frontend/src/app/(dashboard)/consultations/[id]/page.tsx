"use client";

import { use } from "react";
import { ConsultationDetailPage } from "@/features/soap-report";

export default function ConsultationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ConsultationDetailPage id={id} />;
}
