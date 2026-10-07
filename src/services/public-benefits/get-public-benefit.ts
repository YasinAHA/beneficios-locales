import type { BenefitContentKey } from "@/content/benefits/types";
import { prisma } from "@/lib/prisma";
import { composePublicBenefit } from "./compose-public-benefit";
import { publicBenefitInclude } from "./types";

// Missing database benefit => null; missing editorial => structured data with
// editorialStatus "missing" and editorial null, without substitute content.
export async function getPublicBenefit(key: BenefitContentKey) {
    const benefit = await prisma.beneficio.findFirst({
        where: {
            municipio: { slug: key.municipalitySlug },
            tributo: key.tax,
            slug: key.benefitSlug,
            ejercicioDesde: { lte: key.exercise },
            OR: [{ ejercicioHasta: null }, { ejercicioHasta: { gte: key.exercise } }],
        },
        include: publicBenefitInclude,
        orderBy: { ejercicioDesde: "desc" },
    });
    return benefit ? composePublicBenefit(benefit, key.exercise) : null;
}
