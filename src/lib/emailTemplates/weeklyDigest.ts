// src/lib/emailTemplates/weeklyDigest.ts
// Generates premium weekly digest email HTML for Rojgar Suvidha subscribers

interface JobItem {
  title: string;
  slug: string;
  last_date?: string | null;
  total_posts?: string | number | null;
  category?: string;
}

interface ResultItem {
  title: string;
  slug: string;
}

export function buildWeeklyDigestHtml(
  topJobs: JobItem[],
  results: ResultItem[],
  aiTip: string
): string {
  const jobListHtml = topJobs.length > 0 
    ? topJobs.map(job => `
        <div style="background-color: #ffffff; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="font-size: 11px; font-weight: 850; text-transform: uppercase; color: #4f46e5; margin-bottom: 4px; letter-spacing: 0.5px;">
            ${(job.category || "latest-jobs").replace(/-/g, " ")}
          </div>
          <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 800; color: #111827; line-height: 1.4;">
            <a href="https://www.rojgarsuvidha.com/job/${job.slug}" style="color: #111827; text-decoration: none;">${job.title}</a>
          </h3>
          <div style="font-size: 12px; color: #6b7280; font-weight: 500;">
            ${job.total_posts ? `📋 Vacancies: <strong style="color: #4f46e5;">${job.total_posts} posts</strong> &nbsp;|&nbsp; ` : ""}
            ⏰ Last Date: <strong style="color: #ef4444;">${job.last_date || "Soon"}</strong>
          </div>
          <div style="margin-top: 12px;">
            <a href="https://www.rojgarsuvidha.com/job/${job.slug}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 850; padding: 6px 16px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">View Details & Apply →</a>
          </div>
        </div>
      `).join("")
    : `<p style="color: #6b7280; font-size: 13px; text-align: center; padding: 12px;">Is hafte koi nai naukri update nahi hui.</p>`;

  const resultListHtml = results.length > 0
    ? `<div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin-top: 16px; border: 1px dashed #e5e7eb;">
        <h4 style="margin: 0 0 10px; font-size: 13px; font-weight: 850; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">🔥 Results Declared:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 13px; font-weight: 600; line-height: 1.6;">
          ${results.map(r => `
            <li style="margin-bottom: 6px;">
              <a href="https://www.rojgarsuvidha.com/job/${r.slug}" style="color: #4f46e5; text-decoration: underline;">${r.title}</a>
            </li>
          `).join("")}
        </ul>
      </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rojgar Suvidha Weekly Digest</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 0; -webkit-text-size-adjust: none;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">Rojgar Suvidha 🎯</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Weekly Sunday Digest Bulletin</p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #374151; line-height: 1.6; font-weight: 500;">
              Bhaiya, is hafte ki top government job notifications, admit cards aur results ki complete summary niche ready hai. Kisi bhi post ka details check karne ke liye button par click karein.
            </p>

            <!-- Jobs List -->
            <div>
              <h2 style="font-size: 14px; font-weight: 850; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">
                💼 Active Recruitment Notifications
              </h2>
              ${jobListHtml}
            </div>

            <!-- Results -->
            ${resultListHtml}

            <!-- AI Tip Box -->
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 16px; margin-top: 24px;">
              <h4 style="margin: 0 0 6px; font-size: 12px; font-weight: 850; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">💡 Bhaiya Ki Preparation Tip:</h4>
              <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.6; font-style: italic; font-weight: 500;">
                "${aiTip}"
              </p>
            </div>

            <!-- Apply For Me Banner -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px; padding: 20px; margin-top: 24px; text-align: center; color: #ffffff;">
              <h4 style="margin: 0 0 4px; font-size: 16px; font-weight: 900;">Cyber Cafe Ki Bheed Se Bachein! 💻</h4>
              <p style="margin: 0 0 14px; font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 500;">Hamare experts bina kisi galti ke aapka online form ghar baithe bhar denge.</p>
              <a href="https://www.rojgarsuvidha.com/apply-for-me" style="display: inline-block; background-color: #ffffff; color: #059669; font-weight: 850; font-size: 12px; padding: 10px 24px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">Book Apply For Me Now →</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 24px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 11px; color: #9ca3af; font-weight: 500; line-height: 1.5;">
            <p style="margin: 0 0 8px;">Aapko ye email mila kyunki aapne <a href="https://www.rojgarsuvidha.com" style="color: #4f46e5; text-decoration: none;">Rojgar Suvidha</a> par register kiya hai.</p>
            <p style="margin: 0 0 8px;">© ${new Date().getFullYear()} Rojgar Suvidha. All Rights Reserved.</p>
            <p style="margin: 0;">Weekly email notifications nahi chahiye? <a href="https://www.rojgarsuvidha.com/profile-setup?mode=edit" style="color: #ef4444; text-decoration: underline;">Yahan click karke unsubcribe karein</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
