import type { AnswerValue, FieldType } from "@/domain/eligibility/types";
import type { MappedEvaluatableBenefit } from "@/services/eligibility/mapper";
import {
    CitizenTestConfigurationError,
    CitizenTestResponseError,
    type CitizenTestData,
    type CitizenTestQuestion,
} from "./types";

type ResultDescriptor = MappedEvaluatableBenefit["trancheDetails"][string];

// Mapper values come from Prisma Decimal.toString(), its canonical decimal representation.
// Names and IDs describe pathways, not economic equivalence.
export function resultKey(result: ResultDescriptor): string {
    return JSON.stringify([result.type, result.value, result.unit]);
}

export function indexQuestionnaire(data: CitizenTestData) {
    const fields = new Map<string, FieldType>();
    const candidateKeys = new Set<string>();
    for (const candidate of data.candidates) {
        if (candidateKeys.has(candidate.key)) {
            throw new CitizenTestConfigurationError(`Duplicate candidate: ${candidate.key}`);
        }
        candidateKeys.add(candidate.key);
        const { benefit } = candidate;
        for (const tranche of benefit.tranches) {
            const result = benefit.trancheDetails[tranche.id];
            if (!result || !result.type ||
                (result.value !== null && typeof result.value !== "string") ||
                (result.unit !== null && typeof result.unit !== "string")) {
                throw new CitizenTestConfigurationError(`Missing structured result: ${candidate.key}/${tranche.id}`);
            }
        }
        const groups = [...benefit.eligibility.groups, ...benefit.tranches.flatMap(t => t.groups)];
        for (const rule of groups.flatMap(g => g.rules)) {
            const previous = fields.get(rule.field.key);
            if (previous && previous !== rule.field.type) {
                throw new CitizenTestConfigurationError(`Conflicting field type: ${rule.field.key}`);
            }
            fields.set(rule.field.key, rule.field.type);
        }
    }

    const byField = new Map<string, CitizenTestQuestion>();
    const byQuestion = new Map<string, CitizenTestQuestion>();
    for (const question of data.questions.filter(q => q.active)) {
        if (question.fields.length !== 1) {
            throw new CitizenTestConfigurationError(`Unsafe question mapping: ${question.key}`);
        }
        const field = question.fields[0];
        if (!fields.has(field.key) || fields.get(field.key) !== field.type) {
            throw new CitizenTestConfigurationError(`Inconsistent executable field: ${question.key}`);
        }
        const expected = question.responseType === "SELECT" || question.responseType === "TEXT"
            ? "STRING" : question.responseType;
        if (field.type !== expected) {
            throw new CitizenTestConfigurationError(`Incompatible question/field types: ${question.key}`);
        }
        if (!Number.isInteger(question.order) || !question.key) {
            throw new CitizenTestConfigurationError(`Invalid question identity/order: ${question.key}`);
        }
        if (question.responseType === "SELECT" && (
            !Array.isArray(question.options) || question.options.length === 0 ||
            !question.options.every(option => typeof option === "string") ||
            new Set(question.options).size !== question.options.length
        )) {
            throw new CitizenTestConfigurationError(`Malformed SELECT options: ${question.key}`);
        }
        if (byField.has(field.key) || byQuestion.has(question.key)) {
            throw new CitizenTestConfigurationError(`Ambiguous question mapping: ${question.key}/${field.key}`);
        }
        byField.set(field.key, question);
        byQuestion.set(question.key, question);
    }
    return { byField, byQuestion };
}

export function validateResponse(question: CitizenTestQuestion, value: unknown): AnswerValue {
    const valid = question.responseType === "BOOLEAN" ? typeof value === "boolean"
        : question.responseType === "NUMBER" ? typeof value === "number" && Number.isFinite(value)
        : question.responseType === "TEXT" ? typeof value === "string"
        : typeof value === "string" && (question.options as string[]).includes(value);
    if (!valid) {
        throw new CitizenTestResponseError(`Invalid response for question: ${question.key}`);
    }
    return value as AnswerValue;
}
