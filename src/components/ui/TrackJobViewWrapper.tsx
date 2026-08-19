"use client";

// Direct import is safe — TrackJobView renders null and only uses useEffect(browser APIs)
// Previously used dynamic({ssr:false}) which caused "Bail out to client-side rendering" crash in Next.js 15 production
import TrackJobView from "./TrackJobView";

interface Props {
  slug: string;
  title: string;
  category: string;
}

export default function TrackJobViewWrapper({ slug, title, category }: Props) {
  return <TrackJobView slug={slug} title={title} category={category} />;
}
