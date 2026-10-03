import type {
    AnswerValue,
    Evaluation,
    FieldType,
    Rule,
    RuleOperator,
} from "./types";

const OPERATORS_BY_FIELD_TYPE: Record<FieldType, readonly RuleOperator[]> = {
    BOOLEAN: ["EQ", "NEQ"],
    NUMBER: ["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN", "NOT_IN"],
    STRING: ["EQ", "NEQ", "IN", "NOT_IN"],
};

function matchesFieldType(
    value: unknown,
    fieldType: FieldType,
): value is AnswerValue {
    switch (fieldType) {
        case "BOOLEAN":
            return typeof value === "boolean";
        case "NUMBER":
            return typeof value === "number" && Number.isFinite(value);
        case "STRING":
            return typeof value === "string";
    }
}

function validateRule(rule: Rule): void {
    if (!OPERATORS_BY_FIELD_TYPE[rule.field.type].includes(rule.operator)) {
        throw new Error(
            `Operator ${rule.operator} is not valid for field type ${rule.field.type}`,
        );
    }

    if (rule.operator === "IN" || rule.operator === "NOT_IN") {
        if (
            !Array.isArray(rule.value) ||
            !rule.value.every((value) =>
                matchesFieldType(value, rule.field.type),
            )
        ) {
            throw new Error(
                `Rule value is not valid for field ${rule.field.key}`,
            );
        }

        return;
    }

    if (!matchesFieldType(rule.value, rule.field.type)) {
        throw new Error(
            `Rule value is not valid for field ${rule.field.key}`,
        );
    }
}

export function evaluateRule(
    rule: Rule,
    answers: Record<string, AnswerValue | undefined>,
): Evaluation {
    validateRule(rule);

    const answer = answers[rule.field.key];

    if (answer === undefined) {
        return {
            status: "UNKNOWN",
            missingFields: [rule.field.key],
        };
    }

    if (!matchesFieldType(answer, rule.field.type)) {
        throw new Error(
            `Answer value is not valid for field ${rule.field.key}`,
        );
    }

    let matches: boolean;

    switch (rule.operator) {
        case "EQ":
            matches = answer === rule.value;
            break;

        case "NEQ":
            matches = answer !== rule.value;
            break;

        case "GT":
            matches = (answer as number) > (rule.value as number);
            break;

        case "GTE":
            matches = (answer as number) >= (rule.value as number);
            break;

        case "LT":
            matches = (answer as number) < (rule.value as number);
            break;

        case "LTE":
            matches = (answer as number) <= (rule.value as number);
            break;

        case "IN":
            matches = (rule.value as AnswerValue[]).includes(answer);
            break;

        case "NOT_IN":
            matches = !(rule.value as AnswerValue[]).includes(answer);
            break;
    }

    return {
        status: matches ? "MATCH" : "NO_MATCH",
        missingFields: [],
    };
}