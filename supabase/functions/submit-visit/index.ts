import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxS3h9scxcpmMp1MUgGnCdc9BlBmXo5m0_zJ94Lzd6OiAXAamuk4XaL1Oj49wJvAOpe/exec";

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
    const contentType = req.headers.get("content-type") || "";
    let corretor = "", equipe = "", cliente = "", data = "", mes = "", ano = "";
    let valorMedio = "", setores = "", cidades = "", feedback = "";
    let photoBase64 = "";
    let photoName = "";
    let photoMimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      corretor = formData.get("corretor") as string || "";
      equipe = formData.get("equipe") as string || "";
      cliente = formData.get("cliente") as string || "";
      data = formData.get("data") as string || "";
      mes = formData.get("mes") as string || "";
      ano = formData.get("ano") as string || "";
      valorMedio = formData.get("valorMedio") as string || "";
      setores = formData.get("setores") as string || "";
      cidades = formData.get("cidades") as string || "";
      feedback = formData.get("feedback") as string || "";

      const photo = formData.get("photo") as File | null;
      if (photo && photo.size > 0) {
        const bytes = new Uint8Array(await photo.arrayBuffer());
        photoBase64 = btoa(String.fromCharCode(...bytes));
        photoName = photo.name || "foto.jpg";
        photoMimeType = photo.type || "image/jpeg";
      }
    } else {
      const body = await req.json();
      corretor = body.corretor || "";
      equipe = body.equipe || "";
      cliente = body.cliente || "";
      data = body.data || "";
      mes = body.mes || "";
      ano = body.ano || "";
      valorMedio = body.valorMedio || "";
      setores = body.setores || "";
      cidades = body.cidades || "";
      feedback = body.feedback || "";
      photoBase64 = body.photoBase64 || "";
      photoName = body.photoName || "";
      photoMimeType = body.photoMimeType || "";
    }

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

    // Format value as currency
    const valorFormatted = parseFloat(valorMedio).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // Build payload for Apps Script
    const payload: Record<string, string> = {
      spreadsheetId,
      corretor,
      equipe,
      cliente,
      data,
      mes,
      ano,
      valor: valorFormatted,
      setor: setores,
      cidade: cidades,
      feedback,
    };

    if (photoBase64) {
      payload.photoBase64 = photoBase64;
      payload.photoName = `Visita - ${corretor} - ${cliente} - ${data.split("-").reverse().join("-")}.${photoName.split(".").pop() || "jpg"}`;
      payload.photoMimeType = photoMimeType;
    }

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
