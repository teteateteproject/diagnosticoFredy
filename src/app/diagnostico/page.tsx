import type { Metadata } from "next";
import { QuizFlow } from "@/components/quiz/QuizFlow";

export const metadata: Metadata = {
  title: "Responder diagnóstico",
  robots: { index: false, follow: false },
  alternates: { canonical: "/diagnostico" },
  openGraph: { url: "/diagnostico" },
};

export default function DiagnosticoPage() {
  return <QuizFlow />;
}
