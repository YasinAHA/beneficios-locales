import { describe, expect, it } from "vitest";

import { evaluateRule } from "../evaluate-rule";
import type { Rule } from "../types";

describe("evaluateRule", () => {
    it("returns MATCH when a boolean EQ rule matches", () => {
        const rule: Rule = {
            field: {
                key: "familia_numerosa",
                type: "BOOLEAN",
            },
            operator: "EQ",
            value: true,
        };

        expect(
            evaluateRule(rule, {
                familia_numerosa: true,
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("returns NO_MATCH when a boolean EQ rule does not match", () => {
        const rule: Rule = {
            field: {
                key: "familia_numerosa",
                type: "BOOLEAN",
            },
            operator: "EQ",
            value: true,
        };

        expect(
            evaluateRule(rule, {
                familia_numerosa: false,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("returns UNKNOWN and reports the field when the answer is missing", () => {
        const rule: Rule = {
            field: {
                key: "vehiculo_emisiones_co2",
                type: "NUMBER",
            },
            operator: "LTE",
            value: 120,
        };

        expect(evaluateRule(rule, {})).toEqual({
            status: "UNKNOWN",
            missingFields: ["vehiculo_emisiones_co2"],
        });
    });

    it("evaluates numeric comparison operators", () => {
        const rule: Rule = {
            field: {
                key: "vehiculo_emisiones_co2",
                type: "NUMBER",
            },
            operator: "LTE",
            value: 120,
        };

        expect(
            evaluateRule(rule, {
                vehiculo_emisiones_co2: 100,
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });

        expect(
            evaluateRule(rule, {
                vehiculo_emisiones_co2: 130,
            }),
        ).toEqual({
            status: "NO_MATCH",
            missingFields: [],
        });
    });

    it("evaluates IN rules", () => {
        const rule: Rule = {
            field: {
                key: "vehiculo_combustible",
                type: "STRING",
            },
            operator: "IN",
            value: ["glp", "otro"],
        };

        expect(
            evaluateRule(rule, {
                vehiculo_combustible: "glp",
            }),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });
    });

    it("rejects an operator incompatible with the field type", () => {
        const rule: Rule = {
            field: {
                key: "familia_numerosa",
                type: "BOOLEAN",
            },
            operator: "LTE",
            value: true,
        };

        expect(() =>
            evaluateRule(rule, {
                familia_numerosa: true,
            }),
        ).toThrow(/Operator LTE is not valid/);
    });

    it("rejects a rule value with the wrong type", () => {
        const rule: Rule = {
            field: {
                key: "vehiculo_emisiones_co2",
                type: "NUMBER",
            },
            operator: "LTE",
            value: "120",
        };

        expect(() =>
            evaluateRule(rule, {
                vehiculo_emisiones_co2: 100,
            }),
        ).toThrow(/Rule value is not valid/);
    });

    it("rejects an answer with the wrong type", () => {
        const rule: Rule = {
            field: {
                key: "vehiculo_emisiones_co2",
                type: "NUMBER",
            },
            operator: "LTE",
            value: 120,
        };

        expect(() =>
            evaluateRule(rule, {
                vehiculo_emisiones_co2: "100",
            }),
        ).toThrow(/Answer value is not valid/);
    });
});