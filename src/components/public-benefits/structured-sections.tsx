import type { PublicBenefit } from "@/services/public-benefits/compose-public-benefit";

type StructuredData = PublicBenefit["structured"]["data"];

function formatTrancheResult(tranche: StructuredData["tramos"][number]): string | null {
  if (tranche.tipo === "EXENCION") return "Exención";
  if (tranche.valor === null) return null;

  const value = tranche.valor.toString();
  if (tranche.tipo === "PORCENTAJE") return `${value} %`;
  if (tranche.unidad) return `${value} ${tranche.unidad}`;
  return value;
}

function sourceTypeLabel(type: string): string {
  if (type === "NORMATIVA_OFICIAL") return " · Normativa oficial";
  if (type === "WEB_OFICIAL") return " · Web oficial";
  return "";
}

export function BenefitResult({ tranches }: Readonly<{ tranches: StructuredData["tramos"] }>) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {tranches.map((tranche) => (
        <div key={tranche.id.toString()} className="border-l-2 border-teal-700 pl-4">
          <dt className="font-medium text-stone-900">{tranche.nombre}</dt>
          <dd className="mt-2 text-3xl font-semibold text-teal-900">
            {formatTrancheResult(tranche)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BenefitSources({ sources }: Readonly<{ sources: StructuredData["fuentes"] }>) {
  return (
    <ul className="space-y-6">
      {sources.map(({ fuente, esPrincipal }) => (
        <li key={fuente.id.toString()}>
          <p className="mb-1 text-sm font-medium text-stone-900">
            {esPrincipal ? "Fuente principal" : "Fuente complementaria"}
            {sourceTypeLabel(fuente.tipo)}
          </p>
          <a href={fuente.url} className="wrap-break-word text-teal-800 underline underline-offset-4" rel="noopener noreferrer">{fuente.titulo}</a>
        </li>
      ))}
    </ul>
  );
}
