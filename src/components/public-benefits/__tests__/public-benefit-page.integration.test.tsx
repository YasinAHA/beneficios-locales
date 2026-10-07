import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { composePublicBenefit } from "@/services/public-benefits/compose-public-benefit";
import { getPublicBenefit } from "@/services/public-benefits/get-public-benefit";
import Page, { generateMetadata } from "@/app/valladolid/ibi/familia-numerosa/page";
import { PublicBenefitPage } from "../public-benefit-page";

vi.mock("@/services/public-benefits/get-public-benefit", () => ({ getPublicBenefit: vi.fn() }));

const key = { municipalitySlug: "valladolid", tax: "IBI", benefitSlug: "familia-numerosa", exercise: 2026 };
type PresentableBenefit = Parameters<typeof PublicBenefitPage>[0]["benefit"];
let pilot: PresentableBenefit;

beforeAll(async () => {
  const service = await vi.importActual<typeof import("@/services/public-benefits/get-public-benefit")>("@/services/public-benefits/get-public-benefit");
  const benefit = await service.getPublicBenefit(key);
  if (!benefit?.editorial) throw new Error("Expected seeded pilot with editorial content");
  pilot = { ...benefit, editorial: benefit.editorial };
});
beforeEach(() => {
  vi.mocked(getPublicBenefit).mockReset().mockResolvedValue(pilot);
});
afterAll(async () => { await prisma.$disconnect(); });

const textHtml = (text: string) => renderToStaticMarkup(<>{text}</>);

describe("public benefit pilot page", () => {
  it("loads the route identifiers through the public service and renders the seeded categories", async () => {
    const html = renderToStaticMarkup(await Page());
    expect(getPublicBenefit).toHaveBeenCalledWith(key);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain(textHtml(pilot.editorial.title));
    for (const tranche of pilot.structured.data.tramos) {
      expect(html).toContain(textHtml(tranche.nombre));
      expect(html).toContain(`${tranche.valor!.toString()} %`);
    }
  });

  it("renders changed structured percentages and already-composed facts without fixed pilot values", async () => {
    const changed = composePublicBenefit({
      ...pilot.structured.data,
      tramos: pilot.structured.data.tramos.map((tranche, index) => ({ ...tranche, valor: new Prisma.Decimal(index ? "63" : "17") })),
    }, key.exercise);
    vi.mocked(getPublicBenefit).mockResolvedValue(changed);
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("17 %");
    expect(html).toContain("63 %");
    expect(html).not.toContain("40 %");
    expect(html).not.toContain("90 %");
  });

  it("derives metadata from editorial SEO and supplies the pilot canonical path", async () => {
    const seo = { title: "Título editorial de prueba", description: "Descripción editorial de prueba" };
    vi.mocked(getPublicBenefit).mockResolvedValue({ ...pilot, editorial: { ...pilot.editorial, seo } });
    expect(await generateMetadata()).toMatchObject({ ...seo, alternates: { canonical: "/valladolid/ibi/familia-numerosa" } });
    expect(getPublicBenefit).toHaveBeenCalledWith(key);
  });

  it.each(["absent", "without editorial"])("uses Next not-found behavior for a benefit %s", async (state) => {
    vi.mocked(getPublicBenefit).mockResolvedValue(state === "absent" ? null : { ...pilot, editorial: null, editorialStatus: "missing" });
    await expect(Page()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    await expect(generateMetadata()).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("preserves editorial guidance, ordered steps, warnings and uncertainty", async () => {
    const html = renderToStaticMarkup(await Page());
    for (const text of [
      pilot.editorial.summary, pilot.editorial.keyDateExplanation,
      pilot.editorial.applicationDeadlineExplanation, pilot.editorial.renewalExplanation,
      ...pilot.editorial.requirements, ...pilot.editorial.documentation.confirmed,
      ...pilot.editorial.warnings, ...pilot.editorial.uncertainties.map((item) => item.explanation),
    ]) expect(html).toContain(textHtml(text));
    const steps = [...html.matchAll(/<ol\b[^>]*>(.*?)<\/ol>/g)].at(-1)?.[1] ?? "";
    let lastPosition = -1;
    for (const step of pilot.editorial.applicationSteps) {
      const position = steps.indexOf(textHtml(step));
      expect(position).toBeGreaterThan(lastPosition);
      lastPosition = position;
    }
    expect(html).toContain("El listado completo de documentos no está confirmado");
  });

  it("distinguishes a confirmed checklist from an unconfirmed one", () => {
    const benefit = { ...pilot, editorial: { ...pilot.editorial, documentation: { ...pilot.editorial.documentation, checklistStatus: "confirmed" as const } } };
    const html = renderToStaticMarkup(<PublicBenefitPage benefit={benefit} exercise={key.exercise} />);
    expect(html).toContain("El listado de documentación está confirmado");
    expect(html).not.toContain("El listado completo de documentos no está confirmado");
  });

  it("renders source titles and URLs, distinguishes the primary official source, and has no test CTA", async () => {
    const html = renderToStaticMarkup(await Page());
    for (const { fuente, esPrincipal } of pilot.structured.data.fuentes) {
      expect(html).toContain(`href="${textHtml(fuente.url)}"`);
      expect(html).toContain(textHtml(fuente.titulo));
      expect(html).toContain(esPrincipal ? "Fuente principal" : "Fuente complementaria");
    }
    expect(html).toContain("Normativa oficial");
    expect(html).not.toMatch(/<button\b|href="[^"]*\btest\b|gradoCerteza/);
    expect([...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1])).toEqual([
      "/", ...pilot.structured.data.fuentes.map(({ fuente }) => textHtml(fuente.url)),
    ]);
  });
});
