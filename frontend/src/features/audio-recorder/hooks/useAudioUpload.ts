"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadAudio } from "../api/upload-audio";

export function useAudioUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, model }: { file: File; model?: string }) =>
      uploadAudio(file, model),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
