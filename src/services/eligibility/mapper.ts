import type {
    EvaluatableBenefit,
    EvaluatableTranche,
    FieldType,
    LogicalOperator,
    Rule,
    RuleOperator,
} from "@/domain/eligibility/types";

import type { BenefitWithEvaluationData } from "./types";

function mapRule(
    rule: BenefitWithEvaluationData["gruposReglas"][number]["reglas"][number],
): Rule {
    return {
        field: {
            key: rule.campo.clave,
            type: rule.campo.tipo as FieldType,
        },
        operator: rule.operador as RuleOperator,
        value: rule.valor,
    };
}

function mapGroups(
    groups: BenefitWithEvaluationData["gruposReglas"],
) {
    return groups.map((group) => ({
        operator: group.operador as LogicalOperator,
        rules: group.reglas.map(mapRule),
    }));
}

export type MappedEvaluatableBenefit = {
    id: string;
    result: {
        type: string;
        value: string | null;
        unit: string | null;
    };
    eligibility: EvaluatableBenefit;
    tranches: EvaluatableTranche[];
    trancheDetails: Record<
        string,
        {
            name: string;
            type: string;
            value: string | null;
            unit: string | null;
        }
    >;
};

export function mapBenefitToEvaluatable(
    benefit: BenefitWithEvaluationData,
): MappedEvaluatableBenefit {
    return {
        id: benefit.id.toString(),
        result: {
            type: benefit.tipo,
            value: benefit.valor?.toString() ?? null,
            unit: benefit.unidad,
        },

        eligibility: {
            groups: mapGroups(benefit.gruposReglas),
        },

        tranches: benefit.tramos.map((tranche) => ({
            id: tranche.id.toString(),
            groups: mapGroups(tranche.gruposReglas),
        })),
        trancheDetails: Object.fromEntries(
            benefit.tramos.map((tranche) => [
                tranche.id.toString(),
                {
                    name: tranche.nombre,
                    type: tranche.tipo,
                    value: tranche.valor?.toString() ?? null,
                    unit: tranche.unidad,
                },
            ]),
        ),
    };
}
