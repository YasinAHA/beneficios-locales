import type { ReactNode } from "react";
import Link from "next/link";
import type { PublicBenefit } from "@/services/public-benefits/compose-public-benefit";
import { BenefitResult, BenefitSources } from "./structured-sections";

type Props = Readonly<{
  benefit: PublicBenefit & { editorial: NonNullable<PublicBenefit["editorial"]> };
  exercise: number;
}>;

function Section({ id, title, children }: Readonly<{ id: string; title: string; children: ReactNode }>) {
  return (
    <section aria-labelledby={id} className="border-t border-stone-200 py-8 sm:py-10">
      <h2 id={id} className="mb-4 text-2xl font-semibold tracking-tight text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function TextList({ items }: Readonly<{ items: readonly string[] }>) {
  return <ul className="list-disc space-y-3 pl-5">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

export function PublicBenefitPage({ benefit, exercise }: Props) {
  const { editorial, structured: { data } } = benefit;
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 text-base leading-7 text-stone-700 sm:px-8 sm:py-12">
      <nav aria-label="Ruta de navegación" className="mb-10 text-sm">
        <ol className="flex flex-wrap gap-x-2 gap-y-1">
          <li><Link href="/" className="text-teal-800 underline underline-offset-4">Beneficios Locales</Link></li>
          <li><span aria-hidden="true">/ </span>{data.municipio.nombre}</li>
          <li><span aria-hidden="true">/ </span>{data.tributo}</li>
          <li aria-current="page"><span aria-hidden="true">/ </span>{editorial.title}</li>
        </ol>
      </nav>
      <article>
        <header className="pb-10">
          <p className="mb-3 text-sm font-medium text-teal-800">{data.municipio.nombre} · {data.tributo} · Ejercicio {exercise}</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-stone-950 sm:text-4xl">{editorial.title}</h1>
          <p className="mt-6 text-lg leading-8">{editorial.summary}</p>
        </header>
        <Section id="resultado" title="Qué puedes obtener">
          <BenefitResult tranches={data.tramos} />
          {editorial.whatYouGet && <p className="mt-5">{editorial.whatYouGet}</p>}
        </Section>
        {editorial.requirements.length > 0 && <Section id="requisitos" title="Requisitos"><TextList items={editorial.requirements} /></Section>}
        {(editorial.keyDateExplanation || editorial.applicationDeadlineExplanation) && (
          <Section id="fechas" title="Fechas que debes tener en cuenta">
            {editorial.keyDateExplanation && <div><h3 className="font-semibold text-stone-900">Fecha clave</h3><p className="mt-2">{editorial.keyDateExplanation}</p></div>}
            {editorial.applicationDeadlineExplanation && <div className="mt-5"><h3 className="font-semibold text-stone-900">Plazo de solicitud</h3><p className="mt-2">{editorial.applicationDeadlineExplanation}</p></div>}
          </Section>
        )}
        <Section id="documentacion" title="Documentación">
          {editorial.documentation.confirmed.length > 0 && <><h3 className="mb-3 font-semibold text-stone-900">Documentación confirmada</h3><TextList items={editorial.documentation.confirmed} /></>}
          <p className="mt-5 border-l-2 border-stone-400 pl-4">
            {editorial.documentation.checklistStatus === "unconfirmed"
              ? "El listado completo de documentos no está confirmado. Esta documentación no constituye una lista completa para presentar la solicitud."
              : "El listado de documentación está confirmado."}
          </p>
        </Section>
        {editorial.applicationSteps.length > 0 && <Section id="solicitud" title="Cómo solicitarla"><ol className="list-decimal space-y-3 pl-6">{editorial.applicationSteps.map((step) => <li key={step} className="pl-1">{step}</li>)}</ol></Section>}
        {editorial.renewalExplanation && <Section id="renovacion" title="Continuidad y renovación"><p>{editorial.renewalExplanation}</p></Section>}
        {editorial.warnings.length > 0 && <Section id="advertencias" title="Ten en cuenta"><div className="border-l-2 border-amber-700 pl-4"><TextList items={editorial.warnings} /></div></Section>}
        {editorial.uncertainties.length > 0 && <Section id="incertidumbres" title="Información pendiente de confirmar"><ul className="space-y-3">{editorial.uncertainties.map((item) => <li key={item.topic}>{item.explanation}</li>)}</ul></Section>}
        {data.fuentes.length > 0 && <Section id="fuentes" title="Fuentes"><BenefitSources sources={data.fuentes} /></Section>}
      </article>
    </main>
  );
}
