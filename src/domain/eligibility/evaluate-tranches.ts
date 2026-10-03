import { evaluateGroups } from "./evaluate-groups";
import type {
    Answers,
    EvaluatableTranche,
    TrancheEvaluation,
    TranchesEvaluation,
} from "./types";

export function evaluateTranches(
    tranches: EvaluatableTranche[],
    answers: Answers,
): TranchesEvaluation {
    const matches: TrancheEvaluation[] = [];
    const unknown: TrancheEvaluation[] = [];

    for (const tranche of tranches) {
        const evaluation = evaluateGroups(
            tranche.groups,
            answers,
        );

        if (evaluation.status === "MATCH") {
            matches.push({
                tranche,
                evaluation,
            });
        }

        if (evaluation.status === "UNKNOWN") {
            unknown.push({
                tranche,
                evaluation,
            });
        }
    }

    return {
        matches,
        unknown,
    };
}