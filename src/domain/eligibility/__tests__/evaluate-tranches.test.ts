import { describe, expect, it } from "vitest";

import { evaluateTranches } from "../evaluate-tranches";
import type { EvaluatableTranche } from "../types";

describe("evaluateTranches", () => {
    const ibiTranches: EvaluatableTranche[] = [
        {
            id: "ibi-general",
            groups: [
                {
                    operator: "AND",
                    rules: [
                        {
                            field: {
                                key: "categoria_familia_numerosa",
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
            id: "ibi-especial",
            groups: [
                {
                    operator: "AND",
                    rules: [
                        {
                            field: {
                                key: "categoria_familia_numerosa",
                                type: "STRING",
                            },
                            operator: "EQ",
                            value: "especial",
                        },
                    ],
                },
            ],
        },
    ];

    it("selects the general Valladolid IBI tranche", () => {
        const result = evaluateTranches(ibiTranches, {
            categoria_familia_numerosa: "general",
        });

        expect(result.matches.map(({ tranche }) => tranche.id)).toEqual([
            "ibi-general",
        ]);

        expect(result.unknown).toEqual([]);
    });

    it("selects the special Valladolid IBI tranche", () => {
        const result = evaluateTranches(ibiTranches, {
            categoria_familia_numerosa: "especial",
        });

        expect(result.matches.map(({ tranche }) => tranche.id)).toEqual([
            "ibi-especial",
        ]);

        expect(result.unknown).toEqual([]);
    });

    it("keeps unresolved tranches when required data is missing", () => {
        const result = evaluateTranches(ibiTranches, {});

        expect(result.matches).toEqual([]);

        expect(result.unknown.map(({ tranche }) => tranche.id)).toEqual([
            "ibi-general",
            "ibi-especial",
        ]);

        expect(result.unknown[0]?.evaluation).toEqual({
            status: "UNKNOWN",
            missingFields: ["categoria_familia_numerosa"],
        });
    });

    it("allows multiple tranches to match", () => {
        const ivtmTranches: EvaluatableTranche[] = [
            {
                id: "ivtm-glp",
                groups: [
                    {
                        operator: "AND",
                        rules: [
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
            },
            {
                id: "ivtm-bajas-emisiones",
                groups: [
                    {
                        operator: "AND",
                        rules: [
                            {
                                field: {
                                    key: "vehiculo_combustible",
                                    type: "STRING",
                                },
                                operator: "NEQ",
                                value: "diesel",
                            },
                            {
                                field: {
                                    key: "vehiculo_emisiones_co2",
                                    type: "NUMBER",
                                },
                                operator: "LTE",
                                value: 120,
                            },
                        ],
                    },
                ],
            },
        ];

        const result = evaluateTranches(ivtmTranches, {
            vehiculo_combustible: "glp",
            vehiculo_emisiones_co2: 100,
        });

        expect(result.matches.map(({ tranche }) => tranche.id)).toEqual([
            "ivtm-glp",
            "ivtm-bajas-emisiones",
        ]);

        expect(result.unknown).toEqual([]);
    });

    it("can return matches and unresolved tranches at the same time", () => {
        const ivtmTranches: EvaluatableTranche[] = [
            {
                id: "ivtm-glp",
                groups: [
                    {
                        operator: "AND",
                        rules: [
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
            },
            {
                id: "ivtm-bajas-emisiones",
                groups: [
                    {
                        operator: "AND",
                        rules: [
                            {
                                field: {
                                    key: "vehiculo_emisiones_co2",
                                    type: "NUMBER",
                                },
                                operator: "LTE",
                                value: 120,
                            },
                        ],
                    },
                ],
            },
        ];

        const result = evaluateTranches(ivtmTranches, {
            vehiculo_combustible: "glp",
        });

        expect(result.matches.map(({ tranche }) => tranche.id)).toEqual([
            "ivtm-glp",
        ]);

        expect(result.unknown.map(({ tranche }) => tranche.id)).toEqual([
            "ivtm-bajas-emisiones",
        ]);
    });

    it("returns no matches or unknown tranches when all tranches fail", () => {
        const result = evaluateTranches(ibiTranches, {
            categoria_familia_numerosa: "otra",
        });

        expect(result).toEqual({
            matches: [],
            unknown: [],
        });
    });
});