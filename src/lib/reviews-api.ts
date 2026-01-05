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
    const { data, error } = await supabase
      .from("fidelity_reviews")
      .insert({
        client_id: review.client_id,
        appointment_id: review.appointment_id,
        staff_id: review.staff_id || null,
        rating: review.rating,
        comment: review.comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[ReviewsAPI] Erro ao criar avaliação:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("[ReviewsAPI] Erro ao criar avaliação:", err);
    return null;
  }
}
