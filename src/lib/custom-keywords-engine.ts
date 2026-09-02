/**
 * ═══════════════════════════════════════════════════════════════════
 * CUSTOM TARGET KEYWORDS ENGINE & SEPARATE TAB ROUTER
 * ═══════════════════════════════════════════════════════════════════
 * 1. Target_Keywords_Master: Stores Master Keyword Inventory
 * 2. Live_Backlinks_Log: ONLY logged when an ACTUAL live backlink is published!
 */

import { syncBacklinkToGoogleSheet } from "./backlink-exporter";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

export interface CustomKeywordTarget {
  keyword: string;
  targetUrl: string;
  category: "State Hub" | "Category Pillar" | "Brand Homepage";
}

/**
 * User's 32 Target Keywords Inventory
 */
export const TARGET_KEYWORDS: CustomKeywordTarget[] = [
  // State-Wise High Intent Keywords
  { keyword: "Govt job in bihar", targetUrl: `${BASE_URL}/state/bihar`, category: "State Hub" },
  { keyword: "Govt job in uttarpradesh", targetUrl: `${BASE_URL}/state/up`, category: "State Hub" },
  { keyword: "Govt job in delhi", targetUrl: `${BASE_URL}/state/delhi`, category: "State Hub" },
  { keyword: "Govt job in Madhya pradesh", targetUrl: `${BASE_URL}/state/mp`, category: "State Hub" },
  { keyword: "Govt job in Punjab", targetUrl: `${BASE_URL}/state/punjab`, category: "State Hub" },
  { keyword: "Govt job in Haryana", targetUrl: `${BASE_URL}/state/haryana`, category: "State Hub" },
  { keyword: "Govt job in Chandigarh", targetUrl: `${BASE_URL}/state/chandigarh`, category: "State Hub" },
  { keyword: "Govt job in Telangana", targetUrl: `${BASE_URL}/state/telangana`, category: "State Hub" },
  { keyword: "Govt job in bengaluru", targetUrl: `${BASE_URL}/state/karnataka`, category: "State Hub" },
  { keyword: "Govt job in Jharkhand", targetUrl: `${BASE_URL}/state/jharkhand`, category: "State Hub" },
  { keyword: "Govt job in goa", targetUrl: `${BASE_URL}/state/goa`, category: "State Hub" },
  { keyword: "Govt job in Himachal Pradesh", targetUrl: `${BASE_URL}/state/hp`, category: "State Hub" },
  { keyword: "Govt job in Karnataka", targetUrl: `${BASE_URL}/state/karnataka`, category: "State Hub" },
  { keyword: "Govt job in Kerala", targetUrl: `${BASE_URL}/state/kerala`, category: "State Hub" },
  { keyword: "Govt job in Maharashtra", targetUrl: `${BASE_URL}/state/maharashtra`, category: "State Hub" },
  { keyword: "Govt job in Manipur", targetUrl: `${BASE_URL}/state/manipur`, category: "State Hub" },
  { keyword: "Govt job in Meghalaya", targetUrl: `${BASE_URL}/state/meghalaya`, category: "State Hub" },
  { keyword: "Govt job in Mizoram", targetUrl: `${BASE_URL}/state/mizoram`, category: "State Hub" },
  { keyword: "Govt job in Nagaland", targetUrl: `${BASE_URL}/state/nagaland`, category: "State Hub" },
  { keyword: "Govt job in Odisha", targetUrl: `${BASE_URL}/state/odisha`, category: "State Hub" },
  { keyword: "Govt job in Rajasthan", targetUrl: `${BASE_URL}/state/rj`, category: "State Hub" },
  { keyword: "Govt job in Sikkim", targetUrl: `${BASE_URL}/state/sikkim`, category: "State Hub" },
  { keyword: "Govt job in Tamil Nadu", targetUrl: `${BASE_URL}/state/tn`, category: "State Hub" },
  { keyword: "Govt job in Tripura", targetUrl: `${BASE_URL}/state/tripura`, category: "State Hub" },
  { keyword: "Govt job in Uttarakhand", targetUrl: `${BASE_URL}/state/uk`, category: "State Hub" },
  { keyword: "Govt job in West Bengal", targetUrl: `${BASE_URL}/state/wb`, category: "State Hub" },
  { keyword: "Govt job in Andhra Pradesh", targetUrl: `${BASE_URL}/state/ap`, category: "State Hub" },
  { keyword: "Govt job in Arunachal Pradesh", targetUrl: `${BASE_URL}/state/arunachal`, category: "State Hub" },
  { keyword: "Govt job in Assam", targetUrl: `${BASE_URL}/state/assam`, category: "State Hub" },
  
  // Pillar & Brand Head Keywords
  { keyword: "Sarkari Result", targetUrl: `${BASE_URL}/sarkari-result`, category: "Category Pillar" },
  { keyword: "sarkari result info", targetUrl: `${BASE_URL}/sarkari-result`, category: "Category Pillar" },
  { keyword: "sarkarisuvidha", targetUrl: BASE_URL, category: "Brand Homepage" },
];

/**
 * Push Master Keyword Inventory to dedicated 'Target_Keywords_Master' tab in Google Sheet
 */
export async function syncMasterKeywordsTab(): Promise<boolean> {
  console.log("📋 Syncing 32 Master Keywords to 'Target_Keywords_Master' Tab in Google Sheet...");
  
  for (const item of TARGET_KEYWORDS) {
    await syncBacklinkToGoogleSheet({
      type: "master_keyword",
      page_type: item.category === "State Hub" ? "State Hub" : item.category === "Category Pillar" ? "Category Pillar" : "Homepage",
      job_title: item.keyword,
      target_url: item.targetUrl,
      platform: "N/A (Master List)",
      backlink_url: "Pending Drip",
      anchor_text: item.keyword,
      status: "Active Drip Target",
    });
  }
  return true;
}

/**
 * Triggers ONLY when an ACTUAL live backlink is published!
 */
export async function logLiveBacklinkToGoogleSheet(params: {
  keywordOrTitle: string;
  targetUrl: string;
  platform: string;
  tier?: string;
  realLiveBacklinkUrl: string;
  anchorText: string;
  pageType?: "Job Article" | "Category Pillar" | "State Hub" | "Utility Tool" | "Homepage";
}): Promise<boolean> {
  return syncBacklinkToGoogleSheet({
    type: "live_backlink",
    page_type: params.pageType || "Job Article",
    job_title: params.keywordOrTitle,
    target_url: params.targetUrl,
    platform: params.platform,
    tier: params.tier,
    backlink_url: params.realLiveBacklinkUrl,
    anchor_text: params.anchorText,
    status: "Published Live",
  });
}
