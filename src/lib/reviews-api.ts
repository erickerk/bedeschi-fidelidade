import { supabase } from "./supabase";

export interface FidelityReview {
  id: string;
  client_id: string;
  appointment_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  professional_id?: string;
  professional_name?: string;
}

export async function getReviews(): Promise<FidelityReview[]> {
  try {
    // Usar endpoint API com service role para bypass RLS
    const response = await fetch("/api/reviews");
    
    if (!response.ok) {
      console.error("[ReviewsAPI] Erro ao buscar avaliações via API:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (err) {
    console.error("[ReviewsAPI] Erro ao buscar avaliações:", err);
    return [];
  }
}

export async function createReview(review: {
  client_id: string;
  appointment_id: string;
  staff_id?: string; // Profissional avaliado
  rating: number;
  comment?: string;
}): Promise<FidelityReview | null> {
  try {
    // Usar endpoint da API para criar avaliação com privilégios admin (bypass RLS)
    const response = await fetch("/api/reviews/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(review),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[ReviewsAPI] Erro ao criar avaliação via API:", errorData);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[ReviewsAPI] Erro ao criar avaliação:", err);
    return null;
  }
}

export async function getReviewsForReport() {
  try {
    // Usar endpoint API server-side para bypass RLS e obter dados completos
    const response = await fetch("/api/reviews/report");
    
    if (!response.ok) {
      console.error("[ReviewsAPI] Erro ao buscar avaliações para relatório via API:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data || [];
  } catch (err) {
    console.error("[ReviewsAPI] Erro ao buscar avaliações para relatório:", err);
    return [];
  }
}
