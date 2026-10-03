import { evaluateRule } from "./evaluate-rule";
import type {
    Answers,
    Evaluation,
    RuleGroup,
} from "./types";

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

export function evaluateGroup(
    group: RuleGroup,
    answers: Answers,
): Evaluation {
    if (group.rules.length === 0) {
        throw new Error("Rule group must contain at least one rule");
    }

    const evaluations = group.rules.map((rule) =>
        evaluateRule(rule, answers),
    );

    if (group.operator === "AND") {
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

    if (evaluations.some(({ status }) => status === "MATCH")) {
        return {
            status: "MATCH",
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
        status: "NO_MATCH",
        missingFields: [],
    };
}