import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PublicBenefitPage } from "@/components/public-benefits/public-benefit-page";
import { getPublicBenefit } from "@/services/public-benefits/get-public-benefit";

const loadBenefit = cache(async () => {
  const benefit = await getPublicBenefit({
    municipalitySlug: "valladolid",
    tax: "IBI",
    benefitSlug: "familia-numerosa",
    exercise: 2026,
  });
  if (!benefit?.editorial) notFound();
  return { ...benefit, editorial: benefit.editorial };
});

export async function generateMetadata(): Promise<Metadata> {
  const { editorial } = await loadBenefit();
  return {
    title: editorial.seo.title,
    description: editorial.seo.description,
    alternates: { canonical: "/valladolid/ibi/familia-numerosa" },
  };
}

export default async function Page() {
  const benefit = await loadBenefit();
  return <PublicBenefitPage benefit={benefit} exercise={2026} />;
}
