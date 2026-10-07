export type BenefitContentKey = {
    municipalitySlug: string;
    tax: string;
    benefitSlug: string;
    exercise: number;
};

// References are resolved from structured data by the application layer.
export type EditorialText = readonly (string | {
    fact: "tranchePercentages" | "applicationDeadline";
})[];

export type BenefitEditorialContent = {
    title: string;
    seo: { title: string; description: EditorialText };
    summary: string;
    whatYouGet: EditorialText;
    requirements: readonly string[];
    keyDateExplanation: string;
    applicationDeadlineExplanation: EditorialText;
    documentation: {
        confirmed: readonly string[];
        checklistStatus: "confirmed" | "unconfirmed";
    };
    // Array order is the application sequence.
    applicationSteps: readonly EditorialText[];
    renewalExplanation: string;
    warnings: readonly string[];
    uncertainties: readonly { topic: string; explanation: string }[];
};
