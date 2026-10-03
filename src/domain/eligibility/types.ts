export type EvaluationStatus = "MATCH" | "NO_MATCH" | "UNKNOWN";

export type Evaluation = {
    status: EvaluationStatus;
    missingFields: string[];
};

export type FieldType = "BOOLEAN" | "NUMBER" | "STRING";

export type RuleOperator =
    | "EQ"
    | "NEQ"
    | "GT"
    | "GTE"
    | "LT"
    | "LTE"
    | "IN"
    | "NOT_IN";

export type AnswerValue = boolean | number | string;

export type Answers = Record<string, AnswerValue | undefined>;

export type EvaluatableField = {
    key: string;
    type: FieldType;
};

export type Rule = {
    field: EvaluatableField;
    operator: RuleOperator;
    value: unknown;
};

export type LogicalOperator = "AND" | "OR";

export type RuleGroup = {
    operator: LogicalOperator;
    rules: Rule[];
};

export type EvaluatableBenefit = {
    groups: RuleGroup[];
};

export type EvaluatableTranche = {
    id: string;
    groups: RuleGroup[];
};

export type TrancheEvaluation = {
    tranche: EvaluatableTranche;
    evaluation: Evaluation;
};

export type TranchesEvaluation = {
    matches: TrancheEvaluation[];
    unknown: TrancheEvaluation[];
};
