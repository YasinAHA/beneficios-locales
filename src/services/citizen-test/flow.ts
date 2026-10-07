import { evaluateBenefit } from "@/domain/eligibility/evaluate-benefit";
import { evaluateGroups } from "@/domain/eligibility/evaluate-groups";
import type { Answers } from "@/domain/eligibility/types";
import { evaluateBenefitEligibility } from "@/services/eligibility/evaluate-benefit-eligibility";
import { indexQuestionnaire, resultKey, validateResponse } from "./configuration";
import {
    CitizenTestConfigurationError,
    CitizenTestResponseError,
    type CitizenTestData,
    type CitizenTestFlow,
    type CitizenTestState,
    type NextCitizenTestQuestion,
} from "./types";

const compareKeys = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

export function evaluateCitizenTest(
    data: CitizenTestData,
    input: CitizenTestState = { answers: {}, skippedFields: [] },
): CitizenTestFlow {
    const { byField } = indexQuestionnaire(data);
    // Revalidate even restored/caller-supplied state before any fiscal evaluation.
    // A null prototype also prevents inherited properties from becoming fiscal answers.
    const answers: Answers = Object.create(null);
    for (const [field, value] of Object.entries(input.answers)) {
        const question = byField.get(field);
        if (!question) throw new CitizenTestConfigurationError(`No active usable question: ${field}`);
        answers[field] = validateResponse(question, value);
    }
    const skippedFields = [...new Set(input.skippedFields)].sort(compareKeys);
    for (const field of skippedFields) {
        if (!byField.has(field)) throw new CitizenTestConfigurationError(`No active usable question: ${field}`);
        if (Object.hasOwn(answers, field)) {
            throw new CitizenTestResponseError(`Field is both answered and skipped: ${field}`);
        }
    }
    const state = { answers, skippedFields };
    const reach = new Map<string, Set<string>>();
    function addFields(fields: string[], outcome: string) {
        for (const field of fields) {
            if (Object.hasOwn(answers, field) || skippedFields.includes(field)) continue;
            if (!byField.has(field)) throw new CitizenTestConfigurationError(`No active usable question: ${field}`);
            const outcomes = reach.get(field) ?? new Set<string>();
            outcomes.add(outcome);
            reach.set(field, outcomes);
        }
    }
    const candidates = data.candidates.map(candidate => {
        const { benefit, ...identity } = candidate;
        const evaluation = evaluateBenefitEligibility(benefit, answers);
        const general = evaluateBenefit(benefit.eligibility, answers);
        if (general.status === "UNKNOWN") {
            // General eligibility is one unresolved candidate gate. Tranche questions
            // and result outcomes are considered only after this gate matches.
            addFields(general.missingFields, JSON.stringify([candidate.key, "general"]));
        } else if (general.status === "MATCH") {
            const matchedResults = new Set(evaluation.matchedTrancheIds.map(id => resultKey(benefit.trancheDetails[id])));
            for (const tranche of benefit.tranches) {
                if (!evaluation.unknownTrancheIds.includes(tranche.id)) continue;
                const result = resultKey(benefit.trancheDetails[tranche.id]);
                if (matchedResults.has(result)) continue;
                const unresolved = evaluateGroups(tranche.groups, answers);
                addFields(unresolved.missingFields, JSON.stringify([candidate.key, "result", result]));
            }
        }
        return { ...identity, ...evaluation };
    });
    const questions = [...reach].map(([fieldKey, outcomes]) => {
        const question = byField.get(fieldKey)!;
        const next: NextCitizenTestQuestion = {
            key: question.key,
            text: question.text,
            responseType: question.responseType,
            options: question.responseType === "SELECT" ? [...question.options as string[]] : null,
            help: question.help,
            fieldKey,
            usefulnessReach: outcomes.size,
        };
        return { next, order: question.order };
    }).sort((a, b) => b.next.usefulnessReach - a.next.usefulnessReach ||
        a.order - b.order || compareKeys(a.next.key, b.next.key));
    return {
        state,
        candidates,
        usefulFields: [...reach.keys()].sort(compareKeys),
        complete: questions.length === 0,
        nextQuestion: questions[0]?.next ?? null,
    };
}

export type CitizenTestAction =
    | { type: "answer"; questionKey: string; value: unknown }
    | { type: "skip"; questionKey: string };

export function applyCitizenTestAction(
    data: CitizenTestData,
    state: CitizenTestState,
    action: CitizenTestAction,
): CitizenTestFlow {
    const { byQuestion } = indexQuestionnaire(data);
    const question = byQuestion.get(action.questionKey);
    if (!question) throw new CitizenTestResponseError(`Unknown active question: ${action.questionKey}`);
    const field = question.fields[0].key;
    const answers = { ...state.answers };
    const skipped = new Set(state.skippedFields);
    if (action.type === "skip") {
        delete answers[field];
        skipped.add(field);
    } else {
        Object.defineProperty(answers, field, {
            value: validateResponse(question, action.value), enumerable: true, configurable: true, writable: true,
        });
        skipped.delete(field);
    }
    return evaluateCitizenTest(data, { answers, skippedFields: [...skipped] });
}
