import { beforeEach, describe, expect, it, vi } from "vitest";

const queries = vi.hoisted(() => ({ benefits: vi.fn(), questions: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
    beneficio: { findMany: queries.benefits },
    preguntaTest: { findMany: queries.questions },
} }));

import { loadValladolidCitizenTest } from "../load";
import { evaluateCitizenTest } from "../flow";

const benefits = () => Array.from({ length: 8 }, (_, i) => ({
    id: BigInt(i + 1), tributo: "TEST", slug: `candidate-${i}`,
    gruposReglas: [{ operador: "AND", reglas: [{
        campo: { clave: "shared", tipo: "BOOLEAN" }, operador: "EQ", valor: true,
    }] }],
    tramos: [],
}));
const question = () => ({
    clave: "citizen-question", pregunta: "Configured question", tipo: "BOOLEAN", opciones: null,
    ayuda: null, orden: 10, activa: true,
    campos: [{ campo: { clave: "shared", tipo: "BOOLEAN" } }],
});

beforeEach(() => {
    vi.resetAllMocks();
    queries.benefits.mockResolvedValue(benefits());
    queries.questions.mockResolvedValue([question()]);
});

describe("citizen test set-based loader", () => {
    it("loads all candidate graphs and active question mappings in two set-based calls", async () => {
        const data = await loadValladolidCitizenTest();
        expect(queries.benefits).toHaveBeenCalledTimes(1);
        expect(queries.questions).toHaveBeenCalledTimes(1);
        expect(queries.benefits).toHaveBeenCalledWith(expect.objectContaining({ where: {
            municipio: { slug: "valladolid", activo: true }, estado: "VIGENTE",
            ejercicioDesde: { lte: 2026 }, OR: [{ ejercicioHasta: null }, { ejercicioHasta: { gte: 2026 } }],
        } }));
        expect(queries.questions).toHaveBeenCalledWith(expect.objectContaining({
            where: { activa: true, campos: { some: { campo: { clave: { in: ["shared"] } } } } },
            include: { campos: { include: { campo: true } } },
        }));
        expect(data.candidates).toHaveLength(8);
        expect(data.candidates[0].benefit.id).toBe("1");
        expect(data.candidates[0].key).not.toBe("1");
        expect(evaluateCitizenTest(data).nextQuestion).toMatchObject({ key: "citizen-question", fieldKey: "shared", usefulnessReach: 8 });
        evaluateCitizenTest(data);
        expect(queries.benefits).toHaveBeenCalledTimes(1);
        expect(queries.questions).toHaveBeenCalledTimes(1);
    });

    it.each([0, 7, 9])("fails when structured candidate count is %s instead of eight", async count => {
        const rows = benefits();
        queries.benefits.mockResolvedValue(count === 9 ? [...rows, rows[0]] : rows.slice(0, count));
        await expect(loadValladolidCitizenTest()).rejects.toThrow(/Expected eight/);
        expect(queries.questions).not.toHaveBeenCalled();
    });

    it("rejects overlapping duplicate logical candidates without using DB IDs to choose one", async () => {
        const rows = benefits();
        rows[1].slug = rows[0].slug;
        queries.benefits.mockResolvedValue(rows);
        await expect(loadValladolidCitizenTest()).rejects.toThrow(/Duplicate candidate/);
    });

    it("detects an extra question link outside the queried executable field set", async () => {
        const row = question();
        row.campos.push({ campo: { clave: "unrelated", tipo: "BOOLEAN" } });
        queries.questions.mockResolvedValue([row]);
        await expect(loadValladolidCitizenTest()).rejects.toThrow(/Unsafe question mapping/);
    });

    it("exposes missing active question coverage when that field becomes useful", async () => {
        queries.questions.mockResolvedValue([]);
        const data = await loadValladolidCitizenTest();
        expect(() => evaluateCitizenTest(data)).toThrow(/No active usable question: shared/);
    });
});
