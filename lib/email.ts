import "server-only";

import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

async function sendEmail(to: string, subject: string, intro: string, url: string, button: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#10233f"><h1 style="color:#1769e0">GateHub</h1><p>Merhaba ${escapeHtml(intro)},</p><p>${escapeHtml(subject)}</p><p><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#1769e0;color:white;text-decoration:none;font-weight:700">${escapeHtml(button)}</a></p><p style="font-size:12px;color:#64748b">Bu isteği sen yapmadıysan e-postayı yok sayabilirsin.</p></div>`;

  if (gmailUser && gmailAppPassword) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_FROM ?? `GateHub <${gmailUser}>`,
      to,
      subject,
      html,
    });
    return;
  }

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Gmail SMTP veya Resend e-posta servisi yapılandırılmalıdır.");
    }
    console.info(`[GateHub e-posta önizleme] ${subject}: ${url}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`E-posta gönderilemedi (${response.status}).`);
  }
}

export function sendVerificationEmail(email: string, name: string, url: string) {
  return sendEmail(email, "E-posta adresini doğrula", name, url, "E-postamı doğrula");
}

export function sendPasswordResetEmail(email: string, name: string, url: string) {
  return sendEmail(email, "Parolanı sıfırla", name, url, "Yeni parola belirle");
}

export function sendNewDeviceAlert(email: string, name: string) {
  const url = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/account#sessions`;
  return sendEmail(email, "Yeni bir cihazdan giriş yapıldı", name, url, "Oturumları incele");
}
