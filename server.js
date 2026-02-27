import express from "express";
import crypto from "crypto";
import { Resend } from "resend";

const app = express();
app.use(express.json());
app.use(express.static("."));

const PORT = process.env.PORT || 3000;
const DRM_API_KEY = process.env.DRM_API_KEY;
const USERCHECK_API_KEY = process.env.USERCHECK_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store: email → { code, expiresAt, verified }
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

function cleanExpiredOTPs() {
  const now = Date.now();
  for (const [email, entry] of otpStore) {
    if (now > entry.expiresAt) otpStore.delete(email);
  }
}

// ---------- POST /api/check-email ----------
app.post("/api/check-email", async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
  }

  try {
    const resp = await fetch(`https://api.usercheck.com/email/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${USERCHECK_API_KEY}` },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("UserCheck error:", resp.status, text);
      return res.status(502).json({ ok: false, message: "Email validation service unavailable. Please try again." });
    }

    const data = await resp.json();

    if (data.disposable) {
      return res.json({ ok: false, message: "Disposable email addresses are not allowed. Please use a real email." });
    }
    if (data.mx === false) {
      return res.json({ ok: false, message: "This email domain does not accept mail. Please check for typos." });
    }

    const suggestion = data.did_you_mean ? `Did you mean ${data.did_you_mean}?` : null;
    return res.json({ ok: true, suggestion });
  } catch (err) {
    console.error("UserCheck fetch error:", err);
    return res.status(502).json({ ok: false, message: "Email validation service unavailable." });
  }
});

// ---------- POST /api/send-otp ----------
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: "Email is required." });

  cleanExpiredOTPs();

  const code = generateOTP();
  otpStore.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS, verified: false });

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your Danke TV Verification Code",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fffaf5;border-radius:16px;">
          <h1 style="margin:0 0 8px;font-size:24px;color:#2d2d3f;">Welcome to Danke TV</h1>
          <p style="margin:0 0 24px;color:#6b7280;">Enter this code to verify your email and activate your account:</p>
          <div style="text-align:center;padding:20px;background:#fff3e8;border-radius:12px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#ff6b35;">${code}</span>
          </div>
          <p style="margin:0;color:#9ca3af;font-size:13px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
    });

    if (error) {
      console.error("Resend error:", error);
      return res.status(502).json({ ok: false, message: "Failed to send verification email. Please try again." });
    }

    return res.json({ ok: true, message: "Verification code sent! Check your inbox." });
  } catch (err) {
    console.error("Resend fetch error:", err);
    return res.status(502).json({ ok: false, message: "Email service unavailable." });
  }
});

// ---------- POST /api/verify-otp ----------
app.post("/api/verify-otp", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ ok: false, message: "Email and code are required." });

  cleanExpiredOTPs();

  const entry = otpStore.get(email);
  if (!entry) {
    return res.json({ ok: false, message: "Code expired or not found. Please request a new one." });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return res.json({ ok: false, message: "Code has expired. Please request a new one." });
  }
  if (entry.code !== code) {
    return res.json({ ok: false, message: "Invalid code. Please try again." });
  }

  entry.verified = true;
  return res.json({ ok: true, message: "Email verified!" });
});

// ---------- POST /api/create-account ----------
app.post("/api/create-account", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ ok: false, message: "Email is required." });

  const entry = otpStore.get(email);
  if (!entry?.verified) {
    return res.status(403).json({ ok: false, message: "Email not verified. Please complete verification first." });
  }

  try {
    const params = new URLSearchParams({
      action: "user",
      type: "create",
      note: email,
      country: "all",
      package_id: "101",
      template_id: "1",
      api_key: DRM_API_KEY,
    });

    const resp = await fetch(`http://api.drm-cloud.com/dev_api.php?${params}`);
    const text = await resp.text();

    if (!resp.ok) {
      console.error("DRM API HTTP error:", resp.status, text);
      return res.status(502).json({ ok: false, message: `Account service returned HTTP ${resp.status}. Please try again later.` });
    }

    let data;
    try { data = JSON.parse(text); } catch {
      console.error("DRM API invalid JSON:", text);
      return res.status(502).json({ ok: false, message: "Unexpected response from account service." });
    }

    const account = Array.isArray(data) ? data[0] : data;

    if (!account?.status) {
      console.error("DRM API error:", data);
      return res.status(502).json({ ok: false, message: account?.message || "Failed to create account. Please try again." });
    }

    otpStore.delete(email);

    // Send credentials via email
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Your Danke TV Account Is Ready!",
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#fffaf5;border-radius:16px;">
            <h1 style="margin:0 0 8px;font-size:24px;color:#2d2d3f;">Your Danke TV account is live!</h1>
            <p style="margin:0 0 24px;color:#6b7280;">Here are your credentials. Save them somewhere safe.</p>
            <div style="padding:20px;background:#fff3e8;border-radius:12px;margin-bottom:16px;">
              <table style="width:100%;border-collapse:collapse;color:#2d2d3f;font-size:14px;">
                <tr><td style="padding:6px 0;font-weight:600;">Username</td><td style="padding:6px 0;">${account.username}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Password</td><td style="padding:6px 0;">${account.password}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Server</td><td style="padding:6px 0;">${account.dns}</td></tr>
                <tr><td style="padding:6px 0;font-weight:600;">Port</td><td style="padding:6px 0;">${account.port}</td></tr>
              </table>
            </div>
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Your playlist URL:</p>
            <div style="padding:12px;background:#ffffff;border:1px solid #f0e4d8;border-radius:8px;word-break:break-all;font-size:13px;color:#ff6b35;">
              ${account.url}
            </div>
            <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Need help? Our support team is available 24/7.</p>
          </div>`,
      });
    } catch (emailErr) {
      console.error("Credential email error (non-blocking):", emailErr);
    }

    return res.json({
      ok: true,
      message: "Account created! Credentials also sent to your email.",
      account: {
        username: account.username,
        password: account.password,
        dns: account.dns,
        port: account.port,
        url: account.url,
      },
    });
  } catch (err) {
    console.error("DRM API fetch error:", err);
    return res.status(502).json({ ok: false, message: "Account creation service unavailable." });
  }
});

app.listen(PORT, () => {
  console.log(`Danke TV server running on http://localhost:${PORT}`);
});
