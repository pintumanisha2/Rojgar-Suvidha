"use client";

import dynamic from "next/dynamic";

// ssr:false must live inside a Client Component in Next.js 15
const TrackJobView = dynamic(() => import("./TrackJobView"), { ssr: false });

interface Props {
  slug: string;
  title: string;
  category: string;
}

export default function TrackJobViewWrapper({ slug, title, category }: Props) {
  return <TrackJobView slug={slug} title={title} category={category} />;
}
