import type { Prisma } from "@/generated/prisma/client";

export const evaluatableBenefitInclude = {
    gruposReglas: {
        orderBy: {
            orden: "asc",
        },
        include: {
            reglas: {
                orderBy: {
                    orden: "asc",
                },
                include: {
                    campo: true,
                },
            },
        },
    },
    tramos: {
        orderBy: {
            orden: "asc",
        },
        include: {
            gruposReglas: {
                orderBy: {
                    orden: "asc",
                },
                include: {
                    reglas: {
                        orderBy: {
                            orden: "asc",
                        },
                        include: {
                            campo: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.BeneficioInclude;

export type BenefitWithEvaluationData =
    Prisma.BeneficioGetPayload<{
        include: typeof evaluatableBenefitInclude;
    }>;