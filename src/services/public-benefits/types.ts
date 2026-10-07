import type { Prisma } from "@/generated/prisma/client";
import { evaluatableBenefitInclude } from "@/services/eligibility/types";

export const publicBenefitInclude = {
    ...evaluatableBenefitInclude,
    municipio: true,
    tramite: true,
    fuentes: { include: { fuente: true } },
} satisfies Prisma.BeneficioInclude;

export type BenefitWithPublicData = Prisma.BeneficioGetPayload<{
    include: typeof publicBenefitInclude;
}>;
