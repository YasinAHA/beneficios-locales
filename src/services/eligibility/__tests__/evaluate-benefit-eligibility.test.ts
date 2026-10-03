import { describe, expect, it } from "vitest";

import type { MappedEvaluatableBenefit } from "../mapper";
import { evaluateBenefitEligibility } from "../evaluate-benefit-eligibility";

function createBenefit(
    overrides: Partial<MappedEvaluatableBenefit> = {},
): MappedEvaluatableBenefit {
    return {
        id: "benefit-1",
        eligibility: {
            groups: [],
        },
        tranches: [],
        trancheDetails: {},
        ...overrides,
    };
}

describe("evaluateBenefitEligibility", () => {
    it("returns NO_MATCH without evaluating tranches when general eligibility does not match", () => {
        const benefit = createBenefit({
            eligibility: {
                groups: [
                    {
                        operator: "AND",
                        rules: [
                            {
                                field: {
                                    key: "familia_numerosa",
                                    type: "BOOLEAN",
                                },
                                operator: "EQ",
                                value: true,
                            },
                        ],
                    },
                ],
            },
            tranches: [
                {
                    id: "special",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "especial",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {
                familia_numerosa: false,
            }),
        ).toEqual({
            benefitId: "benefit-1",
            status: "NO_MATCH",
            missingFields: [],
            matchedTrancheIds: [],
            unknownTrancheIds: [],
        });
    });

    it("returns UNKNOWN without asking tranche fields when general eligibility is unknown", () => {
        const benefit = createBenefit({
            eligibility: {
                groups: [
                    {
                        operator: "AND",
                        rules: [
                            {
                                field: {
                                    key: "familia_numerosa",
                                    type: "BOOLEAN",
                                },
                                operator: "EQ",
                                value: true,
                            },
                        ],
                    },
                ],
            },
            tranches: [
                {
                    id: "special",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "especial",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {}),
        ).toEqual({
            benefitId: "benefit-1",
            status: "UNKNOWN",
            missingFields: ["familia_numerosa"],
            matchedTrancheIds: [],
            unknownTrancheIds: [],
        });
    });

    it("returns MATCH for an eligible benefit without tranches", () => {
        const benefit = createBenefit();

        expect(
            evaluateBenefitEligibility(benefit, {}),
        ).toEqual({
            benefitId: "benefit-1",
            status: "MATCH",
            missingFields: [],
            matchedTrancheIds: [],
            unknownTrancheIds: [],
        });
    });

    it("returns the matching tranche", () => {
        const benefit = createBenefit({
            tranches: [
                {
                    id: "general",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "general",
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "special",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "especial",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {
                categoria: "especial",
            }),
        ).toEqual({
            benefitId: "benefit-1",
            status: "MATCH",
            missingFields: [],
            matchedTrancheIds: ["special"],
            unknownTrancheIds: [],
        });
    });

    it("preserves multiple matching tranches", () => {
        const benefit = createBenefit({
            tranches: [
                {
                    id: "glp",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "combustible",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "glp",
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "low-emissions",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "emisiones",
                                        type: "NUMBER",
                                    },
                                    operator: "LTE",
                                    value: 120,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {
                combustible: "glp",
                emisiones: 100,
            }),
        ).toEqual({
            benefitId: "benefit-1",
            status: "MATCH",
            missingFields: [],
            matchedTrancheIds: ["glp", "low-emissions"],
            unknownTrancheIds: [],
        });
    });

    it("returns UNKNOWN and the missing fields when no tranche can yet be determined", () => {
        const benefit = createBenefit({
            tranches: [
                {
                    id: "general",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "general",
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "special",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "categoria",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "especial",
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {}),
        ).toEqual({
            benefitId: "benefit-1",
            status: "UNKNOWN",
            missingFields: ["categoria"],
            matchedTrancheIds: [],
            unknownTrancheIds: ["general", "special"],
        });
    });
    it("returns MATCH while preserving unresolved additional tranches", () => {
        const benefit = createBenefit({
            tranches: [
                {
                    id: "confirmed",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "combustible",
                                        type: "STRING",
                                    },
                                    operator: "EQ",
                                    value: "glp",
                                },
                            ],
                        },
                    ],
                },
                {
                    id: "possible",
                    groups: [
                        {
                            operator: "AND",
                            rules: [
                                {
                                    field: {
                                        key: "emisiones",
                                        type: "NUMBER",
                                    },
                                    operator: "LTE",
                                    value: 120,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(
            evaluateBenefitEligibility(benefit, {
                combustible: "glp",
            }),
        ).toEqual({
            benefitId: "benefit-1",
            status: "MATCH",
            missingFields: ["emisiones"],
            matchedTrancheIds: ["confirmed"],
            unknownTrancheIds: ["possible"],
        });
    });
});