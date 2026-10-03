import { PrismaClient } from "../../../../src/generated/prisma/client";
import { seedValladolidSources } from "./sources";
import { seedValladolidIbi } from "./ibi";
import { seedValladolidIvtm } from "./ivtm";
import { seedValladolidWaste } from "./waste";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolid(
    prisma: PrismaClient,
    fields: FieldMap,
) {
    const municipio = await prisma.municipio.upsert({
        where: {
            codigoIne: "47186",
        },
        update: {
            nombre: "Valladolid",
            provincia: "Valladolid",
            comunidad: "Castilla y León",
            slug: "valladolid",
            activo: true,
        },
        create: {
            codigoIne: "47186",
            nombre: "Valladolid",
            provincia: "Valladolid",
            comunidad: "Castilla y León",
            slug: "valladolid",
            activo: true,
        },
    });

    /*
     * Durante V0 reconstruimos el dataset editorial de Valladolid.
     * Los cascades eliminan sus grupos, reglas, tramos,
     * relaciones con fuentes y trámites.
     */
    await prisma.beneficio.deleteMany({
        where: {
            municipioId: municipio.id,
        },
    });

    /*
     * Eliminamos únicamente las fuentes concretas gestionadas
     * actualmente por este seed.
     *
     * Fuente todavía no tiene una clave natural única, por lo que
     * durante V0 las recreamos de forma controlada.
     */
    await prisma.fuente.deleteMany({
        where: {
            url: {
                in: [
                    "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/familias-personas-vulnerables/impuesto-bienes-inmuebles-ibi/familias-numerosas",
                    "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/movilidad-medio-ambiente/impuesto-vehiculos-traccion-mecanica-ivtm/movilidad-sostenible",
                    "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/familias-personas-vulnerables/tasa-recogida-residuos/viviendas",
                    "https://www.valladolid.es/es/temas/hacemos/beneficios-fiscales-ayuntamiento-valladolid/movilidad-medio-ambiente/tasa-recogida-residuos/proteccion-medio-ambiente",
                ],
            },
        },
    });

    const sources = await seedValladolidSources(prisma);

    await seedValladolidIbi(
        prisma,
        municipio.id,
        fields,
        sources.ibiFamiliaNumerosa.id,
    );

    await seedValladolidIvtm(
        prisma,
        municipio.id,
        fields,
        sources.ivtmMovilidad.id,
    );

    await seedValladolidWaste(
        prisma,
        municipio.id,
        fields,
        sources.residuosFamiliaNumerosa.id,
        sources.residuosCompostaje.id,
    );
}