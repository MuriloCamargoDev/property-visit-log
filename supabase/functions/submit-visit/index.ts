import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Team → Spreadsheet ID mapping
const TEAM_SPREADSHEET_IDS: Record<string, string> = {
  Aventador: Deno.env.get("SPREADSHEET_AVENTADOR") || "",
  "Red Eagles": Deno.env.get("SPREADSHEET_RED_EAGLES") || "",
  Fênix: Deno.env.get("SPREADSHEET_FENIX") || "",
  Rota: Deno.env.get("SPREADSHEET_ROTA") || "",
  Sharks: Deno.env.get("SPREADSHEET_SHARKS") || "",
};

const DRIVE_FOLDER_ID = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID") || "";

// --- Google Auth via Service Account ---

async function getAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKeyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  if (!email || !privateKeyRaw) {
    throw new Error("Google Service Account credentials not configured");
  }

  const privateKeyPem = privateKeyRaw.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope:
      "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Import private key
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsignedToken}.${sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(
      `Failed to get access token: ${JSON.stringify(tokenData)}`
    );
  }

  return tokenData.access_token;
}

// --- Google Drive helpers ---

async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Failed to create folder '${name}': ${JSON.stringify(createData)}`);
  }
  return createData.id;
}

async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  folderId: string,
  fileData: Uint8Array,
  mimeType: string
): Promise<string> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = "----boundary" + Date.now();
  const metadataStr = JSON.stringify(metadata);

  const body = new Uint8Array(
    await new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataStr}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      fileData,
      `\r\n--${boundary}--`,
    ]).arrayBuffer()
  );

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Failed to upload file: ${JSON.stringify(uploadData)}`);
  }

  // Make file publicly readable
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    }
  );

  return uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`;
}

// --- Google Sheets helper ---

async function appendToSheet(
  accessToken: string,
  spreadsheetId: string,
  values: string[]
): Promise<void> {
  const range = "Visitas!A:K";
  const res = await fetch(
    `https://www.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to append to sheet: ${JSON.stringify(data)}`);
  }
}

// --- Month names in Portuguese ---
const MONTH_NAMES: Record<number, string> = {
  1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
  5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
  9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
};

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        corretor: formData.get("corretor") as string,
        equipe: formData.get("equipe") as string,
        cliente: formData.get("cliente") as string,
        data: formData.get("data") as string,
        mes: formData.get("mes") as string,
        ano: formData.get("ano") as string,
        valorMedio: formData.get("valorMedio") as string,
        setores: formData.get("setores") as string,
        cidades: formData.get("cidades") as string,
        feedback: formData.get("feedback") as string,
        photo: formData.get("photo") as File | null,
      };
    } else {
      body = await req.json();
    }

    const {
      corretor, equipe, cliente, data, mes, ano,
      valorMedio, setores, cidades, feedback,
    } = body;

    // Validate required fields
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

    const accessToken = await getAccessToken();

    // Handle photo upload
    let photoLink = "";
    const photo = body.photo;

    if (photo && photo instanceof File && photo.size > 0) {
      // Parse date for folder structure
      const [year, month, day] = data.split("-");
      const monthNum = parseInt(month);
      const monthName = MONTH_NAMES[monthNum] || mes;
      const dayStr = day; // e.g. "03"

      // Create folder structure: Visitas Class → Mês → Dia → Equipe
      const monthFolderId = await findOrCreateFolder(accessToken, monthName, DRIVE_FOLDER_ID);
      const dayFolderId = await findOrCreateFolder(accessToken, dayStr, monthFolderId);
      const teamFolderId = await findOrCreateFolder(accessToken, equipe, dayFolderId);

      // Rename file
      const dateFormatted = `${day}-${month}-${year}`;
      const ext = photo.name?.split(".").pop() || "jpg";
      const fileName = `Visita - ${corretor} - ${cliente} - ${dateFormatted}.${ext}`;

      const fileBytes = new Uint8Array(await photo.arrayBuffer());
      photoLink = await uploadFileToDrive(
        accessToken,
        fileName,
        teamFolderId,
        fileBytes,
        photo.type || "image/jpeg"
      );
    }

    // Format value as currency
    const valorFormatted = parseFloat(valorMedio).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // Append to Google Sheet
    // Columns: Corretor | Equipe | Nome do Cliente | Data | Mês | Ano | Valor do Imóvel | Setor | Cidade | Feedback | Foto
    const row = [
      corretor,
      equipe,
      cliente,
      data,
      mes,
      ano,
      valorFormatted,
      setores,
      cidades,
      feedback,
      photoLink || "",
    ];

    await appendToSheet(accessToken, spreadsheetId, row);

    return new Response(
      JSON.stringify({ success: true, message: "Visita registrada com sucesso!" }),
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
