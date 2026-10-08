import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const SHEET_ID = "1y1nJvVQOkGfeuBDbZVXmwqGpblv2pVWBQdKISMjKRLE";

function headers() {
  const lk = Deno.env.get("LOVABLE_API_KEY");
  const sk = Deno.env.get("GOOGLE_SHEETS_API_KEY");
  if (!lk || !sk) throw new Error("Credenciais da planilha ausentes");
  return { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": sk, "Content-Type": "application/json" };
}

async function gs(path: string, init: RequestInit = {}) {
  const r = await fetch(`${GATEWAY}/spreadsheets/${SHEET_ID}${path}`, { ...init, headers: headers() });
  const t = await r.text();
  if (!r.ok) throw new Error(`Planilha [${r.status}]: ${t}`);
  return t ? JSON.parse(t) : {};
}

async function readAll() {
  const d = await gs(`/values:batchGet?ranges=Itens!A:D&ranges=Reajustes!A:P&ranges=Config!A:B`);
  const [itens, reaj, cfg] = d.valueRanges.map((v: any) => v.values || []);
  const config: Record<string, string> = {};
  cfg.slice(1).forEach((r: string[]) => { if (r[0]) config[r[0].trim()] = (r[1] || "").trim(); });
  return { itens, reaj, config, cfg };
}

const destinatarios = (config: Record<string, string>) =>
  [...new Set([config["Email diretor"], config["Email comercial"]].filter(Boolean)
    .flatMap((s) => s.split(/[,;\s]+/)).map((s) => s.trim()).filter((s) => s.includes("@")))];

const nowBR = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
const num = (s: string) => Number(String(s || "0").replace(/\./g, "").replace(",", ".")) || 0;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---- Envio de e-mail via Gmail ----
const GMAIL_GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const CONFIRM_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/reajustes`;

const b64 = (s: string) =>
  btoa(Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(""));
const mimeHeader = (v: string) => (/^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`);

async function sendEmail(to: string, subject: string, body: string) {
  const lk = Deno.env.get("LOVABLE_API_KEY");
  const mk = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!lk || !mk) throw new Error("Credenciais de e-mail ausentes");
  const raw = [
    `To: ${to}`,
    `Subject: ${mimeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    body,
  ].join("\r\n");
  const r = await fetch(`${GMAIL_GATEWAY}/users/me/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": mk, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: b64(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`E-mail [${r.status}]: ${t}`);
}

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.method === "GET") {
      const u = new URL(req.url);
      const lote = (u.searchParams.get("lote") || "").slice(0, 40);
      const email = (u.searchParams.get("email") || "").slice(0, 200);
      const txt = (m: string, st = 200) => new Response(m, { status: st, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      if (!lote) return txt("Link inválido.", 400);
      const { reaj } = await readAll();
      const data: any[] = [];
      reaj.forEach((r: string[], i: number) => {
        if (i > 0 && r[0] === lote && (r[11] || "") === "Pendente") {
          data.push({ range: `Reajustes!L${i + 1}:O${i + 1}`, values: [["Recebido", r[12] || "", email, nowBR()]] });
        }
      });
      if (!reaj.some((r: string[], i: number) => i > 0 && r[0] === lote)) return txt("Reajuste não encontrado.", 404);
      if (data.length) await gs(`/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }) });
      return txt(`✅ Recebimento confirmado!\n\nReajuste ${lote} — obrigado. Você já pode fechar esta página.`);
    }
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const { itens, reaj, config, cfg } = await readAll();

    // Public: recipient confirms receipt via email link
    if (action === "confirm") {
      const lote = String(body.lote || "").slice(0, 40);
      const email = String(body.email || "").slice(0, 200);
      if (!lote) return json({ error: "Lote inválido" }, 400);
      const data: any[] = [];
      reaj.forEach((r: string[], i: number) => {
        if (i > 0 && r[0] === lote && (r[11] || "") === "Pendente") {
          data.push({ range: `Reajustes!L${i + 1}:O${i + 1}`, values: [["Recebido", r[12] || "", email, nowBR()]] });
        }
      });
      const found = reaj.some((r: string[], i: number) => i > 0 && r[0] === lote);
      if (!found) return json({ error: "Reajuste não encontrado" }, 404);
      if (data.length) await gs(`/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }) });
      return json({ ok: true, already: data.length === 0 });
    }


    if (action === "login" || action === "list") {
      return json({
        itens: itens.slice(1).filter((r: string[]) => r[0]).map((r: string[]) => ({ codigo: r[0], nome: r[1], tipo: r[2], valor: num(r[3]) })),
        reajustes: reaj.slice(1).map((r: string[], i: number) => ({
          row: i + 2, lote: r[0], tipoReajuste: r[1], codigo: r[2], item: r[3], anterior: num(r[4]), novo: num(r[5]),
          percentual: r[6], data: r[7], vigencia: r[8], responsavel: r[9], obs: r[10], status: r[11],
          comunicado: r[12], recebidoPor: r[13], recebidoEm: r[14], implantadoEm: r[15],
        })).reverse(),
        destinatarios: destinatarios(config),
        sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`,
      });
    }

    if (action === "create") {
      const codigos: string[] = Array.isArray(body.codigos) ? body.codigos.map(String) : [];
      const modo = body.modo === "fixo" ? "fixo" : "percentual";
      const valor = Number(body.valor);
      const vigencia = String(body.vigencia || "").slice(0, 20);
      const obs = String(body.obs || "").slice(0, 500);
      if (!codigos.length || !isFinite(valor) || valor === 0) return json({ error: "Dados inválidos" }, 400);
      const lote = "R" + crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
      const dest = destinatarios(config).join(", ");
      const rows: string[][] = [];
      for (const c of codigos) {
        const it = itens.find((r: string[]) => r[0] === c);
        if (!it) continue;
        const ant = num(it[3]);
        const novo = Math.round((modo === "fixo" ? ant + valor : ant * (1 + valor / 100)) * 100) / 100;
        const pct = ant ? ((novo - ant) / ant) * 100 : 0;
        rows.push([lote, codigos.length > 1 ? "Reajuste em lote" : "Reajuste individual", c, it[1], String(ant), String(novo),
          pct.toFixed(2).replace(".", ",") + "%", nowBR(), vigencia, config["Responsável"] || "", obs, "Pendente", dest]);
      }
      if (!rows.length) return json({ error: "Nenhum item válido" }, 400);
      await gs(`/values/Reajustes!A:P:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: "POST", body: JSON.stringify({ values: rows }) });

      // Envia e-mail de aviso com link de confirmação para cada destinatário
      let emailEnviado = false;
      let emailErro = "";
      const destList = destinatarios(config);
      if (destList.length) {
        const linhas = rows.map((r) => `• ${r[3]} (${r[2]}): de ${fmtBRL(num(r[4]))} para ${fmtBRL(num(r[5]))} (${r[6]})`).join("\n");
        try {
          for (const d of destList) {
            const link = `${CONFIRM_URL}?lote=${lote}&email=${encodeURIComponent(d)}`;
            const linhasHtml = rows.map((r) => `<li>${r[3]} (${r[2]}): de ${fmtBRL(num(r[4]))} para <b>${fmtBRL(num(r[5]))}</b> (${r[6]})</li>`).join("");
            await sendEmail(
              d,
              `ATENÇÃO - REAJUSTE FIRMINO`,
              `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><h2 style="color:#b91c1c;margin:0 0 12px">ATENÇÃO - REAJUSTE FIRMINO</h2><p>Um novo reajuste de preços foi registrado:</p><ul>${linhasHtml}</ul><p>Vigência: ${vigencia || "a definir"}<br>Responsável: ${config["Responsável"] || "-"}${obs ? `<br>Observações: ${obs.replace(/</g, "&lt;")}` : ""}</p><p style="margin:24px 0"><a href="${link}" style="background:#0e7490;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">✅ Confirmar recebimento</a></p><p>— DATAPONTO</p></div>`,
            );
          }
          emailEnviado = true;
        } catch (e) {
          console.error(e);
          emailErro = e instanceof Error ? e.message : "Falha no envio";
        }
      }
      return json({ ok: true, lote, itens: rows.length, destinatarios: dest, emailEnviado, emailErro });
    }

    if (action === "implant") {
      const row = Number(body.row);
      const r = reaj[row - 1];
      if (!row || row < 2 || !r) return json({ error: "Linha inválida" }, 400);
      if (r[11] === "Implantado") return json({ ok: true, already: true });
      const itemIdx = itens.findIndex((x: string[], i: number) => i > 0 && x[0] === r[2]);
      const data: any[] = [
        { range: `Reajustes!L${row}`, values: [["Implantado"]] },
        { range: `Reajustes!P${row}`, values: [[nowBR()]] },
      ];
      if (itemIdx > 0) data.push({ range: `Itens!D${itemIdx + 1}`, values: [[r[5]]] });
      await gs(`/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data }) });
      return json({ ok: true });
    }

    if (action === "setEmails") {
      const list: string[] = Array.isArray(body.emails) ? body.emails.map((e: unknown) => String(e).trim().slice(0, 200)) : [];
      const valid = [...new Set(list.filter((e) => /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(e)))];
      if (!valid.length) return json({ error: "Informe pelo menos um e-mail válido" }, 400);
      const idx = (k: string) => cfg.findIndex((r: string[], i: number) => i > 0 && (r[0] || "").trim() === k);
      const di = idx("Email diretor"), ci = idx("Email comercial");
      const data: any[] = [];
      if (di > 0) data.push({ range: `Config!B${di + 1}`, values: [[valid.join(", ")]] });
      else data.push({ range: `Config!A${cfg.length + 1}:B${cfg.length + 1}`, values: [["Email diretor", valid.join(", ")]] });
      if (ci > 0) data.push({ range: `Config!B${ci + 1}`, values: [[""]] });
      await gs(`/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data }) });
      return json({ ok: true, emails: valid });
    }

    if (action === "reset") {
      if (body.confirm !== "APAGAR") return json({ error: "Confirmação necessária" }, 400);
      await gs(`/values/Reajustes!A2:P:clear`, { method: "POST", body: "{}" });
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
});
