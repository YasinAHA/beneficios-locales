import { PrismaClient } from "../../../../src/generated/prisma/client";

export const ordenanzas2026Url = "https://www.valladolid.es/es/ayuntamiento/organizacion-administrativa/areas/area-hacienda-personal-modernizacion-administrativa/utilidad/ordenanzas-fiscales/ordenanzas-fiscales-2026.ficheros/1179593-V2%20TEXTO%20INTEGRO%20ORDENANZA%20GENERAL%20%20Y%20OOFF%202026.pdf";

export async function seedValladolidSources(prisma: PrismaClient) {
    const fechaConsulta = new Date("2026-10-03T00:00:00.000Z");

    const ordenanzas2026 = await prisma.fuente.create({
        data: {
            tipo: "NORMATIVA_OFICIAL",
            titulo: "Ayuntamiento de Valladolid - Texto íntegro Ordenanzas Fiscales 2026, actualizado conforme al BOP nº 238 de 15/12/2025",
            url: ordenanzas2026Url,
            ejercicio: 2026,
            fechaConsulta,
        },
    });

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
        ordenanzas2026,
        ibiFamiliaNumerosa,
        ivtmMovilidad,
        residuosFamiliaNumerosa,
        residuosCompostaje,
    };
}
