import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz-d6rWSs7tNSi73LG8BtIapF7mZ8s4ls0pY86A5YeGrFq_eYTKsdS3NU4W8Zac2ahv/exec";

const DRIVE_ROOT_FOLDER_ID = "1iImsnrUnvwHCjnR_7-HlCOhMhYiNTcJV";

const TEAM_SPREADSHEET_IDS: Record<string, string> = {
  Aventador: "1JwVmSefjfEPCba9UmMf1HYxh44WoF1yl_1DSnAm4TL8",
  "Red Eagles": "1P1MtSUy9qTUrAyiwNoiEBWKpyt01TqUF9JaM0uI-vvw",
  "Fênix": "1_470SJy1LVsm1JNnpKS4AlHi3trBhS9_PvLLWZVzDqs",
  Rota: "1rBqiEnuzifdYH-4yOpbyJvlHGzjPmiqgSgJuR1KzO-o",
  Sharks: "142nnhG4zDX0pBarrbvFqQcHZxPqr8DmcSM5HCZSx5OI",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { visit_id } = await req.json();

    if (!visit_id) {
      return new Response(
        JSON.stringify({ error: "visit_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch visit from DB
    const { data: visit, error: fetchError } = await supabase
      .from("visits")
      .select("*")
      .eq("id", visit_id)
      .single();

    if (fetchError || !visit) {
      return new Response(
        JSON.stringify({ error: "Visita não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const spreadsheetId = TEAM_SPREADSHEET_IDS[visit.equipe];
    if (!spreadsheetId) {
      await supabase.from("visits").update({ sync_status: "error", sync_error: `Planilha não encontrada para equipe: ${visit.equipe}` }).eq("id", visit_id);
      return new Response(
        JSON.stringify({ error: `Planilha não encontrada para equipe: ${visit.equipe}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format date
    const [yyyy, mm, dd] = visit.data_visita.split("-");
    const dataFormatted = `${dd}/${mm}/${yyyy}`;
    const diaNum = String(parseInt(dd, 10)).padStart(2, "0");
    const folderPath = `Visitas Class/${visit.equipe}/${visit.ano}/${visit.mes}/${diaNum}`;

    // Build file name
    const dataFileName = `${dd}-${mm}-${yyyy}`;
    let nomeArquivo = "";
    if (visit.foto_url) {
      nomeArquivo = `Visita - ${visit.corretor} - ${visit.equipe} - ${visit.cliente} - ${dataFileName}.jpg`;
    }

    const payload: Record<string, string | number> = {
      spreadsheetId,
      corretor: visit.corretor,
      equipe: visit.equipe,
      cliente: visit.cliente,
      data: dataFormatted,
      mes: visit.mes,
      ano: visit.ano,
      valor: Number(visit.valor_medio) || 0,
      setor: visit.setores,
      cidade: visit.cidades,
      feedback: visit.feedback,
      driveFolderId: DRIVE_ROOT_FOLDER_ID,
      folderPath,
      nomeArquivo,
    };

    if (visit.foto_url) {
      payload.foto = visit.foto_url;
    }

    console.log("Processing visit:", visit_id, "Payload:", JSON.stringify(payload));

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const resultText = await response.text();
    let result: any;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    if (!response.ok && response.status !== 302 && response.status !== 200) {
      await supabase.from("visits").update({ sync_status: "error", sync_error: result.error || `Status ${response.status}` }).eq("id", visit_id);
      throw new Error(result.error || `Apps Script returned status ${response.status}`);
    }

    // Mark as synced
    await supabase.from("visits").update({ sync_status: "synced", sync_error: null }).eq("id", visit_id);

    return new Response(
      JSON.stringify({ success: true, message: "Visita processada com sucesso!", result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in process-visit:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
