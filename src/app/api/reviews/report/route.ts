import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("fidelity_reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        client_id,
        appointment_id,
        fidelity_clients (
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[API Reviews Report] Erro ao buscar avaliações:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mapear dados para o formato esperado pelo relatório
    const reviews = (data || []).map((review: any) => ({
      id: review.id,
      client_id: review.client_id,
      appointment_id: review.appointment_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      clientName: review.fidelity_clients?.name || "Cliente não encontrado",
      clientPhone: review.fidelity_clients?.phone || "",
    }));

    return NextResponse.json(reviews);
  } catch (err) {
    console.error("[API Reviews Report] Erro inesperado:", err);
    return NextResponse.json(
      { error: "Erro ao buscar avaliações para relatório" },
      { status: 500 }
    );
  }
}
