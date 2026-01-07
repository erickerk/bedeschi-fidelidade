
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { client_id, appointment_id, staff_id, rating, comment } = body;

    // Validação básica
    if (!client_id || !appointment_id || !rating) {
      return NextResponse.json(
        { error: "Dados incompletos para avaliação" },
        { status: 400 }
      );
    }

    console.log(`[API] Criando avaliação para atendimento ${appointment_id}...`);

    // Usar supabaseAdmin para bypassar RLS
    const { data, error } = await supabaseAdmin
      .from("fidelity_reviews")
      .insert({
        client_id,
        appointment_id,
        staff_id: staff_id || null,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[API] Erro ao criar avaliação:", error);
      return NextResponse.json(
        { error: "Erro ao salvar avaliação no banco de dados" },
        { status: 500 }
      );
    }

    console.log(`[API] Avaliação criada com sucesso: ${data.id}`);

    // Atualizar o agendamento para marcar como avaliado
    const { error: updateError } = await supabaseAdmin
      .from("fidelity_appointments")
      .update({ 
        has_review: true,
        review_rating: rating,
        review_comment: comment || null
      })
      .eq("id", appointment_id);

    if (updateError) {
      console.error("[API] Erro ao atualizar agendamento:", updateError);
      // Não falhar a request principal se apenas a flag falhar, mas logar
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[API] Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
