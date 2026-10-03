import { evaluateGroup } from "./evaluate-group";
import type {
    Answers,
    Evaluation,
    RuleGroup,
} from "./types";

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

export function evaluateGroups(
    groups: RuleGroup[],
    answers: Answers,
): Evaluation {
    if (groups.length === 0) {
        return {
            status: "MATCH",
            missingFields: [],
        };
    }

    const evaluations = groups.map((group) =>
        evaluateGroup(group, answers),
    );

    if (evaluations.some(({ status }) => status === "NO_MATCH")) {
        return {
            status: "NO_MATCH",
            missingFields: [],
        };
    }

    const missingFields = unique(
        evaluations.flatMap(({ missingFields }) => missingFields),
    );

    if (missingFields.length > 0) {
        return {
            status: "UNKNOWN",
            missingFields,
        };
    }

    return {
        status: "MATCH",
        missingFields: [],
    };
}