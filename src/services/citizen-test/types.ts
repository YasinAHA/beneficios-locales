import type { Answers, EvaluatableField } from "@/domain/eligibility/types";
import type { BenefitEvaluationResult } from "@/services/eligibility/evaluate-benefit-eligibility";
import type { MappedEvaluatableBenefit } from "@/services/eligibility/mapper";

export type CitizenTestCandidate = {
    key: string;
    municipalitySlug: string;
    tax: string;
    benefitSlug: string;
    exercise: number;
    benefit: MappedEvaluatableBenefit;
};

// Keep every link until configuration validation: the database relation is many-to-many.
export type CitizenTestQuestion = {
    key: string;
    text: string;
    responseType: "BOOLEAN" | "NUMBER" | "SELECT" | "TEXT";
    options: unknown;
    help: string | null;
    order: number;
    active: boolean;
    fields: EvaluatableField[];
};

export type CitizenTestData = {
    candidates: CitizenTestCandidate[];
    questions: CitizenTestQuestion[];
};

export type CitizenTestState = {
    answers: Answers;
    skippedFields: string[];
};

export type NextCitizenTestQuestion = {
    key: string;
    text: string;
    responseType: CitizenTestQuestion["responseType"];
    options: string[] | null;
    help: string | null;
    fieldKey: string;
    usefulnessReach: number;
};

export type CitizenTestFlow = {
    state: CitizenTestState;
    candidates: (Omit<CitizenTestCandidate, "benefit"> & BenefitEvaluationResult)[];
    usefulFields: string[];
    complete: boolean;
    nextQuestion: NextCitizenTestQuestion | null;
};

export class CitizenTestConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CitizenTestConfigurationError";
    }
}

export class CitizenTestResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CitizenTestResponseError";
    }
}
