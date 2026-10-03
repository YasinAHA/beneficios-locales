import { evaluateBenefit } from "@/domain/eligibility/evaluate-benefit";
import { evaluateTranches } from "@/domain/eligibility/evaluate-tranches";
import type {
    Answers,
    EvaluationStatus,
} from "@/domain/eligibility/types";

import type { MappedEvaluatableBenefit } from "./mapper";

export type BenefitEvaluationResult = {
    benefitId: string;
    status: EvaluationStatus;
    missingFields: string[];
    matchedTrancheIds: string[];
    unknownTrancheIds: string[];
};

export function evaluateBenefitEligibility(
    benefit: MappedEvaluatableBenefit,
    answers: Answers,
): BenefitEvaluationResult {
    const eligibility = evaluateBenefit(
        benefit.eligibility,
        answers,
    );

    if (eligibility.status !== "MATCH") {
        return {
            benefitId: benefit.id,
            status: eligibility.status,
            missingFields: eligibility.missingFields,
            matchedTrancheIds: [],
            unknownTrancheIds: [],
        };
    }

    if (benefit.tranches.length === 0) {
        return {
            benefitId: benefit.id,
            status: "MATCH",
            missingFields: [],
            matchedTrancheIds: [],
            unknownTrancheIds: [],
        };
    }

    const tranches = evaluateTranches(
        benefit.tranches,
        answers,
    );

    const matchedTrancheIds = tranches.matches.map(
        ({ tranche }) => tranche.id,
    );

    const unknownTrancheIds = tranches.unknown.map(
        ({ tranche }) => tranche.id,
    );

    const missingFields = [
        ...new Set(
            tranches.unknown.flatMap(
                ({ evaluation }) => evaluation.missingFields,
            ),
        ),
    ];

    return {
        benefitId: benefit.id,
        status:
            matchedTrancheIds.length > 0
                ? "MATCH"
                : unknownTrancheIds.length > 0
                    ? "UNKNOWN"
                    : "NO_MATCH",
        missingFields,
        matchedTrancheIds,
        unknownTrancheIds,
    };
}