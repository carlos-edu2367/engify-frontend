export interface CategoriaObraResponse {
  id: string;
  team_id: string;
  title: string;
  descricao?: string | null;
  cor?: string | null;
  created_at: string;
}

export interface CategoriaObraListItem {
  id: string;
  title: string;
  descricao?: string | null;
  cor?: string | null;
}

export interface CreateCategoriaObraRequest {
  title: string;
  descricao?: string;
  cor?: string;
}

export interface UpdateCategoriaObraRequest {
  title?: string;
  descricao?: string;
  cor?: string;
}
