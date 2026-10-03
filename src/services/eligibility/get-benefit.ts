import { prisma } from "@/lib/prisma";

import { mapBenefitToEvaluatable } from "./mapper";
import { evaluatableBenefitInclude } from "./types";

type GetEvaluatableBenefitInput = {
    municipalitySlug: string;
    tax: string;
    benefitSlug: string;
    exercise: number;
};

export async function getEvaluatableBenefit({
    municipalitySlug,
    tax,
    benefitSlug,
    exercise,
}: GetEvaluatableBenefitInput) {
    const benefit = await prisma.beneficio.findFirst({
        where: {
            municipio: {
                slug: municipalitySlug,
            },
            tributo: tax,
            slug: benefitSlug,
            ejercicioDesde: {
                lte: exercise,
            },
            OR: [
                {
                    ejercicioHasta: null,
                },
                {
                    ejercicioHasta: {
                        gte: exercise,
                    },
                },
            ],
        },
        include: evaluatableBenefitInclude,
        orderBy: {
            ejercicioDesde: "desc",
        },
    });

    if (!benefit) {
        return null;
    }

    return mapBenefitToEvaluatable(benefit);
}