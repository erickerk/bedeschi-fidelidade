import { supabase } from "./supabase";

export interface FidelityReview {
  id: string;
  client_id: string;
  appointment_id: string;
  staff_id: string | null; // ID do profissional avaliado
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function getReviews(): Promise<FidelityReview[]> {
  try {
    const { data, error } = await supabase
      .from("fidelity_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ReviewsAPI] Erro ao buscar avaliações:", error);
      return [];
    }

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
    const { data, error } = await supabase
      .from("fidelity_reviews")
      .select(`
        *,
        fidelity_clients (
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ReviewsAPI] Erro ao buscar avaliações para relatório:", error);
      return [];
    }

    return data.map(item => ({
      ...item,
      clientName: item.fidelity_clients?.name || "Cliente não encontrado",
      clientPhone: item.fidelity_clients?.phone || ""
    }));
  } catch (err) {
    console.error("[ReviewsAPI] Erro ao buscar avaliações para relatório:", err);
    return [];
  }
}
