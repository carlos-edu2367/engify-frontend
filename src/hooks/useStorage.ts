import { useMutation } from "@tanstack/react-query";
import { storageService } from "@/services/storage.service";

type ResourceType = "obra" | "item" | "financeiro";

export function useUploadFile() {
  return useMutation({
    mutationFn: ({
      file,
      resourceType,
      resourceId,
    }: {
      file: File;
      resourceType: ResourceType;
      resourceId: string;
    }) => storageService.upload(resourceType, resourceId, file),
  });
}

export function useDownloadUrl() {
  return useMutation({
    mutationFn: (path: string) => storageService.getDownloadUrl(path),
  });
}
