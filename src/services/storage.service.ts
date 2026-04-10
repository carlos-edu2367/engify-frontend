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

    // Auditoria Robusta: Garantir prefixo /storage/v1/ via API URL nativa
    let finalUrl = upload_url;
    try {
      const urlObj = new URL(upload_url);
      if (!urlObj.pathname.startsWith("/storage/v1/")) {
        urlObj.pathname = "/storage/v1" + urlObj.pathname;
        finalUrl = urlObj.toString();
        console.log("[Storage Audit] URL normalizada para:", finalUrl);
      }
    } catch (e) {
      console.error("[Storage Audit] Falha ao normalizar URL:", e);
    }

    const uploadResponse = await fetch(finalUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      mode: "cors",
      credentials: "omit", // Garante que nenhum cookie/auth header interfira no signed URL
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(
        `Falha no upload: HTTP ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    return path;
  },
};
