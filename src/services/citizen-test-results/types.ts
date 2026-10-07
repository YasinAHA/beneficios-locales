import type { MappedEvaluatableBenefit } from "@/services/eligibility/mapper";

export type CitizenBenefitResultStatus = "COMPATIBLE" | "POSSIBLE" | "NOT_COMPATIBLE";
export type StructuredCitizenResult = MappedEvaluatableBenefit["result"];
export type MissingInformation = {
    fieldKey: string;
    questionKey: string;
    question: string;
    reason: "SKIPPED" | "UNANSWERED";
};
export type UnresolvedCitizenResult = StructuredCitizenResult & {
    missingInformation: MissingInformation[];
};
export type CitizenBenefitResult = {
    municipalitySlug: string;
    tax: string;
    benefitSlug: string;
    exercise: number;
    status: CitizenBenefitResultStatus;
    matchedResults: StructuredCitizenResult[];
    unresolvedResults: UnresolvedCitizenResult[];
    // Only candidate-level gates, when no result can yet be identified reliably.
    missingInformation: MissingInformation[];
};
export type CitizenTestResultsSummary = {
    compatible: number;
    possible: number;
    notCompatible: number;
};
export type CitizenTestResults = {
    complete: boolean;
    summary: CitizenTestResultsSummary;
    benefits: CitizenBenefitResult[];
};
