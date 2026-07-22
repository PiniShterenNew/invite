// Minimal, RTL, table-free email templates. No guest PII beyond what the
// organizer already owns (their own event's data).

const shell = (title: string, body: string) => `
<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;background:#faf7f2;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #eee5d8">
    <p style="font-size:20px;font-weight:bold;margin:0 0 4px;color:#1f1b16">באים?</p>
    <h1 style="font-size:18px;margin:16px 0;color:#1f1b16">${title}</h1>
    ${body}
    <p style="font-size:12px;color:#8a8378;margin-top:24px">נשלח מ״באים?״ — הזמנות לאירועים חברתיים.</p>
  </div>
</div>`;

const btn = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#e85d4c;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold">${label}</a>`;

export const magicLinkEmail = (url: string) => ({
  subject: "הקישור שלך לבאים?",
  html: shell("התחברות לבאים?", `<p style="color:#4a4438">לחיצה אחת ואתם בפנים. הקישור תקף ל־24 שעות.</p><p style="margin:24px 0">${btn(url, "התחברות")}</p><p style="font-size:12px;color:#8a8378">לא ביקשתם? אפשר להתעלם מהמייל.</p>`),
  text: `התחברות לבאים?: ${url}`,
});

export const rsvpNotifyEmail = (eventName: string, lines: string[], dashboardUrl: string) => ({
  subject: `תשובות חדשות — ${eventName}`,
  html: shell(
    `תשובות חדשות ל${eventName}`,
    `<ul style="color:#4a4438;padding-inline-start:20px">${lines.map((l) => `<li>${l}</li>`).join("")}</ul><p style="margin:24px 0">${btn(dashboardUrl, "לדשבורד")}</p>`
  ),
  text: `תשובות חדשות ל${eventName}:\n${lines.join("\n")}\n${dashboardUrl}`,
});

export const dailyDigestEmail = (eventName: string, summary: string, dashboardUrl: string) => ({
  subject: `סיכום יומי — ${eventName}`,
  html: shell(`סיכום יומי — ${eventName}`, `<p style="color:#4a4438">${summary}</p><p style="margin:24px 0">${btn(dashboardUrl, "לדשבורד")}</p>`),
  text: `${eventName}: ${summary}\n${dashboardUrl}`,
});

export const preAnonWarningEmail = (eventName: string, exportUrl: string, days: number) => ({
  subject: `הנתונים של ${eventName} יימחקו בעוד ${days} ימים`,
  html: shell(
    `מחיקת נתונים מתקרבת`,
    `<p style="color:#4a4438">כחלק ממדיניות הפרטיות שלנו, פרטי האורחים של <b>${eventName}</b> יעברו אנונימיזציה בעוד ${days} ימים. הסיכומים יישמרו, אבל שמות ותשובות אישיות יימחקו.</p><p style="color:#4a4438">רוצים לשמור עותק? אפשר לייצא CSV מהדשבורד.</p><p style="margin:24px 0">${btn(exportUrl, "לייצוא הנתונים")}</p>`
  ),
  text: `פרטי האורחים של ${eventName} יימחקו בעוד ${days} ימים. ייצוא: ${exportUrl}`,
});
