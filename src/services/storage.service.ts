import { api } from "@/lib/axios";

type ResourceType = "obra" | "item" | "financeiro" | "mural";

export const storageService = {
  getUploadUrl: (params: {
    resource_type: ResourceType;
    resource_id: string;
    file_name: string;
    content_type: string;
  }) =>
    api
      .post<{ upload_url: string; path: string; expires_in: number }>("/storage/upload-url", params)
      .then((r) => r.data),

  getDownloadUrl: (path: string) =>
    api
      .post<{ download_url: string; expires_in: number }>("/storage/download-url", { path })
      .then((r) => r.data),

  upload: async (
    resourceType: ResourceType,
    resourceId: string,
    file: File
  ): Promise<string> => {
    const { upload_url, path } = await storageService.getUploadUrl({
      resource_type: resourceType,
      resource_id: resourceId,
      file_name: file.name,
      content_type: file.type,
    });

    // Auditoria: Supabase exige o prefixo /storage/v1/ em produção para CORS correto.
    // Algumas configurações de backend retornam a URL sem este prefixo.
    let finalUrl = upload_url;
    if (!upload_url.includes("/storage/v1/")) {
      finalUrl = upload_url.replace(".co/object/", ".co/storage/v1/object/");
    }

    await fetch(finalUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      mode: "cors",
      body: file,
    });

    return path;
  },
};
