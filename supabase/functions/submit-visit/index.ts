import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwwE3fw-hv1lzFyea_uE1giP95qa4moGoSSUOwRQ4j9qgSu6V-8MWEOi-hBKacRdRhp/exec";

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

  try {
    const body = await req.json();
    const {
      corretor = "",
      equipe = "",
      cliente = "",
      data = "",
      mes = "",
      ano = "",
      valorMedio = "",
      setores = "",
      cidades = "",
      feedback = "",
      foto = "",
      nomeArquivo = "",
    } = body;

    if (!corretor || !equipe || !cliente || !data || !feedback) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const spreadsheetId = TEAM_SPREADSHEET_IDS[equipe];
    if (!spreadsheetId) {
      return new Response(
        JSON.stringify({ error: `Planilha não encontrada para equipe: ${equipe}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send valor as raw number (no currency formatting)
    const valorNumerico = parseFloat(valorMedio) || 0;

    // Format date as dd/mm/aaaa
    const [yyyy, mm, dd] = data.split("-");
    const dataFormatted = `${dd}/${mm}/${yyyy}`;

    // Build folder path: Visitas Class/Equipe/Ano/Mês/Dia
    const diaNum = String(parseInt(dd, 10)).padStart(2, "0");
    const folderPath = `Visitas Class/${equipe}/${ano}/${mes}/${diaNum}`;

    // Build payload for Apps Script
    const payload: Record<string, string | number> = {
      spreadsheetId,
      corretor,
      equipe,
      cliente,
      data: dataFormatted,
      mes,
      ano,
      valor: valorNumerico,
      setor: setores,
      cidade: cidades,
      feedback,
      driveFolderId: DRIVE_ROOT_FOLDER_ID,
      folderPath,
      nomeArquivo,
    };

    // Add photo URL if present
    if (foto) {
      payload.foto = foto;
    }

    console.log("Payload to Apps Script:", JSON.stringify(payload));

    // Send to Google Apps Script webhook
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
      throw new Error(result.error || `Apps Script returned status ${response.status}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Visita registrada com sucesso!", result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in submit-visit:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
