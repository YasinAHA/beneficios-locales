import { describe, expect, it } from "vitest";

import { evaluateGroup } from "../evaluate-group";
import type { RuleGroup } from "../types";

describe("evaluateGroup", () => {
    const andGroup: RuleGroup = {
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
    };

    it("returns MATCH when every AND rule matches", () => {
        expect(
            evaluateGroup(andGroup, {
                familia_numerosa: true,
                vivienda_habitual: true,
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("returns NO_MATCH when one AND rule does not match", () => {
        expect(
            evaluateGroup(andGroup, {
                familia_numerosa: false,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("returns UNKNOWN for AND when nothing fails but data is missing", () => {
        expect(
            evaluateGroup(andGroup, {
                familia_numerosa: true,
            }),
        ).toEqual({
            status: "UNKNOWN",
            missingFields: ["vivienda_habitual"],
        });
    });

    it("collects missing fields without duplicates", () => {
        const group: RuleGroup = {
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
                {
                    field: {
                        key: "vehiculo_combustible",
                        type: "STRING",
                    },
                    operator: "NEQ",
                    value: "diesel",
                },
            ],
        };

        expect(evaluateGroup(group, {})).toEqual({
            status: "UNKNOWN",
            missingFields: ["vehiculo_combustible"],
        });
    });

    it("returns MATCH for OR as soon as one rule matches", () => {
        const group: RuleGroup = {
            operator: "OR",
            rules: [
                {
                    field: {
                        key: "vehiculo_combustible",
                        type: "STRING",
                    },
                    operator: "EQ",
                    value: "glp",
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
        };

        expect(
            evaluateGroup(group, {
                vehiculo_combustible: "glp",
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("returns UNKNOWN for OR when no rule matches and one is unknown", () => {
        const group: RuleGroup = {
            operator: "OR",
            rules: [
                {
                    field: {
                        key: "vehiculo_combustible",
                        type: "STRING",
                    },
                    operator: "EQ",
                    value: "glp",
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
        };

        expect(
            evaluateGroup(group, {
                vehiculo_combustible: "gasolina",
            }),
        ).toEqual({
            status: "UNKNOWN",
            missingFields: ["vehiculo_emisiones_co2"],
        });
    });

    it("returns NO_MATCH for OR when every rule does not match", () => {
        const group: RuleGroup = {
            operator: "OR",
            rules: [
                {
                    field: {
                        key: "vehiculo_combustible",
                        type: "STRING",
                    },
                    operator: "EQ",
                    value: "glp",
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
        };

        expect(
            evaluateGroup(group, {
                vehiculo_combustible: "gasolina",
                vehiculo_emisiones_co2: 150,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("rejects an empty group", () => {
        const group: RuleGroup = {
            operator: "AND",
            rules: [],
        };

        expect(() => evaluateGroup(group, {})).toThrow(
            "Rule group must contain at least one rule",
        );
    });
});