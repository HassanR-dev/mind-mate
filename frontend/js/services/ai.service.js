import { auth } from "./auth.service.js";

// Set to your Vercel deployment URL after deploying
const API_BASE = "https://magical-wu-rho.vercel.app/api";

async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

export async function analyzeMood(text) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/analyzeMood`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to analyze mood");
  }
  return res.json();
}

export async function predictStress() {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/predictStress`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to predict stress");
  }
  return res.json();
}

export async function triggerAnalytics() {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/analytics`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to compute analytics");
  }
  return res.json();
}

export async function parseTranscript(pdfBase64) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/parseTranscript`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64 })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to parse transcript");
  }
  return res.json();
}

export async function chat(message, history = [], userContext = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, userContext })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send message");
  }
  return res.json();
}
