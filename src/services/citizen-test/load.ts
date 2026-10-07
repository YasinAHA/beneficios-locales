import { prisma } from "@/lib/prisma";
import { mapBenefitToEvaluatable } from "@/services/eligibility/mapper";
import { evaluatableBenefitInclude } from "@/services/eligibility/types";
import { indexQuestionnaire } from "./configuration";
import { CitizenTestConfigurationError, type CitizenTestData } from "./types";

export async function loadValladolidCitizenTest(): Promise<CitizenTestData> {
    const municipalitySlug = "valladolid";
    const exercise = 2026;
    const benefits = await prisma.beneficio.findMany({
        where: {
            municipio: { slug: municipalitySlug, activo: true },
            estado: "VIGENTE",
            ejercicioDesde: { lte: exercise },
            OR: [{ ejercicioHasta: null }, { ejercicioHasta: { gte: exercise } }],
        },
        include: evaluatableBenefitInclude,
        orderBy: [{ tributo: "asc" }, { slug: "asc" }],
    });
    if (benefits.length !== 8) {
        throw new CitizenTestConfigurationError(`Expected eight Valladolid 2026 candidates, found ${benefits.length}`);
    }
    const candidates = benefits.map(benefit => ({
        key: JSON.stringify([municipalitySlug, benefit.tributo, benefit.slug, exercise]),
        municipalitySlug,
        tax: benefit.tributo,
        benefitSlug: benefit.slug,
        exercise,
        benefit: mapBenefitToEvaluatable(benefit),
    }));
    const fieldKeys = [...new Set(candidates.flatMap(({ benefit }) =>
        [...benefit.eligibility.groups, ...benefit.tranches.flatMap(t => t.groups)]
            .flatMap(g => g.rules.map(r => r.field.key))))];
    const questions = await prisma.preguntaTest.findMany({
        where: { activa: true, campos: { some: { campo: { clave: { in: fieldKeys } } } } },
        // Load ALL links, so a hidden extra link cannot masquerade as a safe mapping.
        include: { campos: { include: { campo: true } } },
        orderBy: [{ orden: "asc" }, { clave: "asc" }],
    });
    const data: CitizenTestData = {
        candidates,
        questions: questions.map(question => ({
            key: question.clave,
            text: question.pregunta,
            responseType: question.tipo,
            options: question.opciones,
            help: question.ayuda,
            order: question.orden,
            active: question.activa,
            fields: question.campos.map(({ campo }) => ({ key: campo.clave, type: campo.tipo })),
        })),
    };
    indexQuestionnaire(data);
    return data;
}
