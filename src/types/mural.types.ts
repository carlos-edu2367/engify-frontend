export interface MuralAttachmentResponse {
  id: string;
  post_id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
}

export interface MuralPostResponse {
  id: string;
  obra_id: string;
  author_id: string | null;
  author_nome: string | null;
  content: string;
  mentions: string[];
  attachments: MuralAttachmentResponse[];
  created_at: string;
}

export interface CreateMuralPostRequest {
  content: string;
  mentions?: string[];
}

export interface CreateMuralAttachmentRequest {
  file_path: string;
  file_name: string;
  content_type: string;
}
