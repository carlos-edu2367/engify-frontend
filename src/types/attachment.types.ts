export interface ItemAttachmentResponse {
  id: string;
  item_id: string;
  file_path: string;
  file_name: string;
  content_type: string;
  created_at: string;
}

export interface CreateAttachmentRequest {
  file_path: string;
  file_name: string;
  content_type: string;
}

export interface ObraImageResponse {
  id: string;
  file_name: string;
  file_path: string;
  created_at?: string;
}
