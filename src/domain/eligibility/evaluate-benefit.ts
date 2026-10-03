import { evaluateGroups } from "./evaluate-groups";
import type {
    Answers,
    EvaluatableBenefit,
    Evaluation,
} from "./types";

export function evaluateBenefit(
    benefit: EvaluatableBenefit,
    answers: Answers,
): Evaluation {
    return evaluateGroups(benefit.groups, answers);
}