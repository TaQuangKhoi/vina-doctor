export interface AudioUploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
}
