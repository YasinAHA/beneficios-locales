import { PrismaClient } from "../../../../src/generated/prisma/client";

export async function seedValladolidSources(prisma: PrismaClient) {
    const fechaConsulta = new Date("2026-10-03T00:00:00.000Z");

    const ibiFamiliaNumerosa = await prisma.fuente.create({
        data: {
            tipo: "WEB_OFICIAL",
            titulo:
                "Ayuntamiento de Valladolid - IBI - Familias numerosas",
            url: "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/familias-personas-vulnerables/impuesto-bienes-inmuebles-ibi/familias-numerosas",
            ejercicio: 2026,
            fechaConsulta,
        },
    });

    const ivtmMovilidad = await prisma.fuente.create({
        data: {
            tipo: "WEB_OFICIAL",
            titulo:
                "Ayuntamiento de Valladolid - IVTM - Movilidad sostenible",
            url: "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/movilidad-medio-ambiente/impuesto-vehiculos-traccion-mecanica-ivtm/movilidad-sostenible",
            ejercicio: 2026,
            fechaConsulta,
        },
    });

    const residuosCompostaje = await prisma.fuente.create({
        data: {
            tipo: "WEB_OFICIAL",
            titulo:
                "Ayuntamiento de Valladolid - Tasa por la recogida de residuos - Protección del medio ambiente",
            url: "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/movilidad-medio-ambiente/tasa-recogida-residuos/proteccion-medio-ambiente",
            ejercicio: 2026,
            fechaConsulta,
        },
    });

    const residuosFamiliaNumerosa = await prisma.fuente.create({
        data: {
            tipo: "WEB_OFICIAL",
            titulo:
                "Ayuntamiento de Valladolid - Tasa por la recogida de residuos - Viviendas",
            url: "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/familias-personas-vulnerables/tasa-recogida-residuos/viviendas",
            ejercicio: 2026,
            fechaConsulta,
        },
    });

    return {
        ibiFamiliaNumerosa,
        ivtmMovilidad,
        residuosFamiliaNumerosa,
        residuosCompostaje,
    };
}