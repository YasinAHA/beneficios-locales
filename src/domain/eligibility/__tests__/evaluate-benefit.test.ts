import { describe, expect, it } from "vitest";

import { evaluateBenefit } from "../evaluate-benefit";
import type { EvaluatableBenefit } from "../types";

describe("evaluateBenefit", () => {
    const ibiLargeFamilyBenefit: EvaluatableBenefit = {
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
                    {
                        field: {
                            key: "vivienda_habitual",
                            type: "BOOLEAN",
                        },
                        operator: "EQ",
                        value: true,
                    },
                ],
            },
        ],
    };

    it("returns MATCH when the Valladolid IBI eligibility conditions match", () => {
        expect(
            evaluateBenefit(ibiLargeFamilyBenefit, {
                familia_numerosa: true,
                vivienda_habitual: true,
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("returns NO_MATCH when one eligibility condition does not match", () => {
        expect(
            evaluateBenefit(ibiLargeFamilyBenefit, {
                familia_numerosa: false,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("returns UNKNOWN when an eligibility answer is missing", () => {
        expect(
            evaluateBenefit(ibiLargeFamilyBenefit, {
                familia_numerosa: true,
            }),
        ).toEqual({
            status: "UNKNOWN",
            missingFields: ["vivienda_habitual"],
        });
    });

    it("returns MATCH when a benefit has no rule groups", () => {
        expect(
            evaluateBenefit(
                {
                    groups: [],
                },
                {},
            ),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("combines sibling groups using AND semantics", () => {
        const benefit: EvaluatableBenefit = {
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
                {
                    operator: "OR",
                    rules: [
                        {
                            field: {
                                key: "vivienda_habitual",
                                type: "BOOLEAN",
                            },
                            operator: "EQ",
                            value: true,
                        },
                        {
                            field: {
                                key: "vehiculo_combustible",
                                type: "STRING",
                            },
                            operator: "EQ",
                            value: "glp",
                        },
                    ],
                },
            ],
        };

        expect(
            evaluateBenefit(benefit, {
                familia_numerosa: true,
                vivienda_habitual: false,
                vehiculo_combustible: "gasolina",
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("collects missing fields across sibling groups", () => {
        const benefit: EvaluatableBenefit = {
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
                {
                    operator: "AND",
                    rules: [
                        {
                            field: {
                                key: "vivienda_habitual",
                                type: "BOOLEAN",
                            },
                            operator: "EQ",
                            value: true,
                        },
                    ],
                },
            ],
        };

        expect(evaluateBenefit(benefit, {})).toEqual({
            status: "UNKNOWN",
            missingFields: [
                "familia_numerosa",
                "vivienda_habitual",
            ],
        });
    });

    it("does not request missing data when another sibling group already fails", () => {
        const benefit: EvaluatableBenefit = {
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
                {
                    operator: "AND",
                    rules: [
                        {
                            field: {
                                key: "vivienda_habitual",
                                type: "BOOLEAN",
                            },
                            operator: "EQ",
                            value: true,
                        },
                    ],
                },
            ],
        };

        expect(
            evaluateBenefit(benefit, {
                familia_numerosa: false,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });
});