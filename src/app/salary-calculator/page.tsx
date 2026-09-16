import type { Metadata } from "next";
import SalaryCalcClient from "./SalaryCalcClient";

export const metadata: Metadata = {
  title: { absolute: "Sarkari Job Salary Calculator 2026 — 7th Pay Commission In-Hand | Rojgar Suvidha" },
  description: "Calculate your exact government job in-hand salary 2026 after 7th Pay Commission. Enter Pay Level and city — get Basic Pay, DA, HRA, TA, NPS deductions and net take-home salary instantly.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/salary-calculator" },
  keywords: [
    "sarkari job salary calculator", "7th pay commission salary calculator",
    "government job salary calculator 2026", "in-hand salary calculator",
    "sarkari naukri salary kitni milti hai", "basic pay da hra ta calculator",
    "central government salary calculator", "pay matrix calculator",
  ],
  openGraph: {
    title: "Sarkari Job Salary Calculator — 7th Pay Commission 2026",
    description: "Enter your Pay Level and city → get exact in-hand salary. DA, HRA, TA, NPS included.",
    url: "https://www.rojgarsuvidha.com/salary-calculator",
  },
};

export default function SalaryCalculatorPage() {
  return <SalaryCalcClient />;
}
