export interface JobLinkItem {
  label: string;
  url: string;
  type: "apply" | "notification" | "website" | "admit" | "result" | "answer" | "other";
}

/**
 * Universal helper to extract, deduplicate, and categorize official links
 * for any job post from structured fields OR raw HTML content.
 */
export function parseJobLinks(job: any): JobLinkItem[] {
  if (!job) return [];

  const rawLinks: { label: string; url: string }[] = [];

  // 1. Collect from structured job.links array
  if (Array.isArray(job.links)) {
    job.links.forEach((l: any) => {
      if (l && l.url && typeof l.url === "string" && l.url.startsWith("http")) {
        rawLinks.push({
          label: l.label || "Official Direct Link",
          url: l.url.trim(),
        });
      }
    });
  } else if (typeof job.links === "string" && job.links.startsWith("http")) {
    rawLinks.push({ label: "Official Application / Notification Link", url: job.links.trim() });
  }

  // 2. Collect from direct job fields
  if (job.official_link && typeof job.official_link === "string" && job.official_link.startsWith("http")) {
    rawLinks.push({ label: "Official Board / Commission Website", url: job.official_link.trim() });
  }
  if (job.apply_link && typeof job.apply_link === "string" && job.apply_link.startsWith("http")) {
    rawLinks.push({ label: "Apply Online Registration Portal", url: job.apply_link.trim() });
  }

  // 3. Fallback: Parse anchors inside raw HTML content if fewer than 2 links found
  if (rawLinks.length < 2 && job.content && typeof job.content === "string") {
    const anchorRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorRegex.exec(job.content)) !== null) {
      const url = match[1].trim();
      const rawLabel = match[2].replace(/<[^>]+>/g, "").trim();
      
      // Ignore internal site links, social media, or generic apply-for-me text
      if (
        url.includes("rojgarsuvidha.com") ||
        url.includes("t.me") ||
        url.includes("whatsapp.com") ||
        url.includes("youtube.com") ||
        url.includes("instagram.com")
      ) {
        continue;
      }

      if (rawLabel.length > 2 && !rawLinks.some(l => l.url === url)) {
        rawLinks.push({ label: rawLabel, url });
      }
    }
  }

  // 4. Categorize and Filter
  const categorized: JobLinkItem[] = [];
  const seenUrls = new Set<string>();

  rawLinks.forEach(item => {
    if (seenUrls.has(item.url)) return;
    seenUrls.add(item.url);

    const lbl = item.label.toLowerCase();
    let type: JobLinkItem["type"] = "other";

    if (lbl.includes("apply") || lbl.includes("registration") || lbl.includes("online form") || lbl.includes("login")) {
      type = "apply";
    } else if (lbl.includes("pdf") || lbl.includes("notification") || lbl.includes("advt") || lbl.includes("bulletin") || lbl.includes("circular")) {
      type = "notification";
    } else if (lbl.includes("admit") || lbl.includes("hall ticket") || lbl.includes("call letter")) {
      type = "admit";
    } else if (lbl.includes("result") || lbl.includes("merit") || lbl.includes("scorecard") || lbl.includes("cutoff")) {
      type = "result";
    } else if (lbl.includes("answer") || lbl.includes("key") || lbl.includes("objection")) {
      type = "answer";
    } else if (lbl.includes("official website") || lbl.includes("board") || lbl.includes("commission") || lbl.includes("portal") || lbl.includes("home")) {
      type = "website";
    }

    categorized.push({ label: item.label, url: item.url, type });
  });

  return categorized;
}
