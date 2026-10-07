import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { mapBenefitToEvaluatable } from "../mapper";
import type { BenefitWithEvaluationData } from "../types";

describe("structured benefit result mapper contract", () => {
    it.each([
        ["PORCENTAJE", new Prisma.Decimal("50.00"), "parte_variable", "50"],
        ["IMPORTE", new Prisma.Decimal("0.00"), "EUR", "0"],
        ["REDUCCION", new Prisma.Decimal("12.50"), null, "12.5"],
        ["EXENCION", null, "cuota", null],
        ["OTRO", null, null, null],
    ] as const)("preserves fixed %s result, decimal strings and nulls", (tipo, valor, unidad, expected) => {
        const row = { id: BigInt(123), tipo, valor, unidad, gruposReglas: [], tramos: [] } as unknown as BenefitWithEvaluationData;
        const mapped = mapBenefitToEvaluatable(row);
        expect(mapped.result).toEqual({ type: tipo, value: expected, unit: unidad });
        expect(mapped.tranches).toEqual([]);
        expect(JSON.parse(JSON.stringify(mapped)).result).toEqual(mapped.result);
        expect(row.valor).toBe(valor);
    });

    it("uses the same conversion for benefit and tranche descriptors", () => {
        const row = {
            id: BigInt(1), tipo: "PORCENTAJE", valor: new Prisma.Decimal("40.00"), unidad: "cuota", gruposReglas: [],
            tramos: [{ id: BigInt(2), nombre: "Route", tipo: "PORCENTAJE", valor: new Prisma.Decimal("40.00"), unidad: "cuota", gruposReglas: [] }],
        } as unknown as BenefitWithEvaluationData;
        const mapped = mapBenefitToEvaluatable(row);
        expect(mapped.trancheDetails["2"]).toEqual({ name: "Route", ...mapped.result });
    });
});
