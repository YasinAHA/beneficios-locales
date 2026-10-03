Estamos trabajando en la rama `feat/valladolid-v0-data` del proyecto beneficios-locales.

Quiero que implementes la siguiente iteración del dataset Valladolid V0.

IMPORTANTE:

- Antes de modificar nada, inspecciona el schema Prisma, los seeds actuales y los tests existentes.
- NO modifiques `prisma/schema.prisma`.
- NO crees migraciones.
- NO rediseñes el motor de reglas.
- NO modifiques `src/domain/eligibility`.
- NO modifiques la semántica de `evaluateBenefitEligibility`.
- NO implementes todavía compatibilidad/acumulación entre beneficios.
- NO implementes cálculos dinámicos de IPREM.
- NO inventes requisitos fiscales.
- Mantén el patrón y estilo de los seeds actuales.
- Mantén el seed idempotente/repetible según el mecanismo actual.
- Si descubres que un requisito no puede representarse correctamente con el modelo actual, NO fuerces una solución: indícalo al terminar.

Objetivo de esta iteración:
cerrar el dataset fiscal computable de Valladolid V0 para 2026 a partir de los requisitos que te doy abajo.

Actualmente existen:

- IBI / familia numerosa
- IVTM / movilidad sostenible
- Tasa residuos / familia numerosa
- Tasa residuos / compostaje domiciliario

Hay que corregir/enriquecer esos casos y añadir:

- Tasa residuos / renta <= 1,5 × IPREM
- ORA / familias
- IVTM / discapacidad
- IVTM / vehículo histórico/de época

REGLA DE MODELADO IMPORTANTE

El motor actual trabaja con:

CampoEvaluable -> Regla -> GrupoRegla

y los campos admiten BOOLEAN, NUMBER y STRING.

Representa únicamente requisitos que puedan expresarse de forma fiable con este modelo.

No intentes modelar dentro del rules engine:

- compatibilidad/acumulación entre beneficios;
- límites conjuntos de bonificaciones;
- workflows administrativos;
- devoluciones posteriores;
- persistencia de resoluciones;
- cardinalidades entre personas, vehículos o viviendas;
- referencias externas dinámicas;
- hechos jurídicos para los que no tengamos un criterio computable fiable.

Cuando sea razonable en V0, un hecho jurídico temporal ya comprobado puede representarse mediante un booleano explícito cuyo nombre deje claro el momento temporal. No reutilices un booleano ambiguo como `familia_numerosa` para expresar simultáneamente situación actual y situación en fecha de devengo.

REQUISITOS 2026

1. IBI — familia numerosa

Beneficio:

- categoría general: 40 %.
- categoría especial: 90 %.
- unidad: cuota.

Elegibilidad computable:

- vivienda habitual.
- título de familia numerosa válido en la fecha de devengo del 1 de enero de 2026.
- categoría general/especial determina el tramo.

El campo/pregunta actual `familia_numerosa` / "¿Tienes actualmente título..." es temporalmente ambiguo.
Adapta el dataset para representar explícitamente que el título era válido en el devengo correspondiente.

No intentes modelar todavía los casos complejos de copropiedad, garajes o trasteros como reglas automáticas.

Trámite:

- requiere solicitud.
- plazo ordinario 2026: antes de finalizar el período voluntario del IBI, 5 de junio de 2026.
- conserva esta información editorial en los campos que permita el modelo actual sin cambiar schema.

2. IVTM — movilidad sostenible

Mantén los tramos existentes:

- eléctrico: 75 %.
- híbrido no diésel: 50 %.
- GLP: 40 %.
- vehículo no diésel con emisiones <= 120 g CO2/km: 40 %.

Mantén la posibilidad de múltiples tramos coincidentes: NO conviertas los tramos en exclusivos.

Mejora el texto del trámite si el modelo actual lo permite:

- padrón ordinario: período voluntario hasta 6 de abril de 2026.
- existe una regla específica para nuevas matriculaciones que permite solicitar estas bonificaciones durante el ejercicio.

No intentes representar esa excepción temporal como regla de elegibilidad si el modelo actual no lo permite correctamente.

3. Tasa de residuos — familia numerosa

Beneficio:

- 50 % de la parte variable.

Elegibilidad computable:

- vivienda habitual.
- título de familia numerosa válido en el devengo del 1 de enero de 2026.

Plazo:

- hasta final del período voluntario: 5 de noviembre de 2026.
- fuera de plazo puede producir efectos en el período siguiente.

Existe compatibilidad expresa con la bonificación de renta, con máximo conjunto del 100 % de la parte variable.
NO implementes esa compatibilidad ni el cap en el rules engine. Déjalo fuera de esta iteración.

4. Tasa de residuos — renta <= 1,5 × IPREM

Añade un beneficio nuevo.

Beneficio:

- 75 % de la parte variable.

Requisitos:

- vivienda habitual.
- renta familiar del ejercicio anterior <= 1,5 × IPREM.
- "renta familiar" se refiere a la unidad de convivencia/personas empadronadas en la vivienda.
- requisitos en la fecha de devengo, 1 de enero.

IMPORTANTE:
NO hardcodees 10.800 €.
No tenemos verificado que ése sea el umbral monetario administrativo exacto utilizado por Valladolid.

Por tanto NO crees una regla numérica falsa contra 10800.

Para V0 puedes representar de forma explícita un hecho ya determinado, por ejemplo un BOOLEAN con semántica equivalente a:
`renta_familiar_ejercicio_anterior_dentro_limite_iprem`

La pregunta al ciudadano debe expresar claramente:

- renta de la unidad de convivencia;
- ejercicio anterior;
- límite de 1,5 × IPREM;
  sin convertirlo a una cifra no verificada.

Plazo:

- 5 de noviembre de 2026.
- fuera de plazo: efectos en período siguiente.

5. Tasa de residuos — compostaje domiciliario

Beneficio:

- 75 % de la parte variable.

El campo actual `participa_programa_compostaje` es insuficiente.

La condición fiscal relevante para 2026 exige:

- estar acogido al programa municipal;
- alta en el censo antes de finalizar el ejercicio anterior;
- una vivienda vinculada;
- cumplimiento efectivo del programa.

Para V0 representa sólo los hechos que podamos preguntar de manera fiable.

Como mínimo sustituye/refina la condición actual para distinguir que el alta relevante debía existir en el ejercicio anterior.

No intentes modelar como elegibilidad:
alta -> censo -> solicitud fiscal -> pago íntegro -> inspección -> devolución.

Pero añade `Tramite` al beneficio de compostaje, que actualmente no tiene.

Información de trámite:

- requiere solicitud fiscal separada.
- plazo 2026: 5 de noviembre.
- se paga inicialmente el 100 % de la tasa.
- tras comprobación, se devuelve el 75 % de la parte variable.
- devolución durante el primer trimestre del año siguiente.

Usa `plazoDescripcion` para conservar lo esencial que permita el modelo actual. No cambies schema.

6. ORA — familias

Añade un beneficio nuevo.

Tributo/categoría:
usa una denominación coherente y estable, preferiblemente `ORA`, salvo que el proyecto ya tenga otra convención.

Tipo:
EXENCION.
Valor puede ser null si ése es el patrón admitido por el modelo.

Hay dos vías alternativas:

A)

- unidad familiar con hijo de 0 a 3 años.
- solicitante empadronado en Valladolid.

B)

- familia numerosa categoría especial.
- solicitante empadronado en Valladolid.
- título vigente.

Ambas producen la misma exención.

Representa las dos vías mediante la semántica existente de GrupoRegla:

- reglas dentro de grupo según corresponda;
- recuerda que grupos hermanos son AND, por lo que NO crees dos grupos hermanos pensando que representan OR.
- utiliza un único grupo OR si ésa es la forma correcta de expresar las alternativas con el modelo actual.
- si cada alternativa necesita varias condiciones y el modelo plano actual no puede representar `(A AND B) OR (C AND D)` correctamente, NO falsees la lógica. Detente en esa parte e informa de la limitación.

Otros requisitos conocidos:

- sólo un vehículo.
- titularidad/vínculo del vehículo según vía.
- autorización hasta 31 de diciembre.
- renovación anual en enero.
- exclusiones operativas de determinadas zonas/situaciones.

NO fuerces estas cardinalidades, relaciones o restricciones de uso dentro del rules engine si no son representables.

7. IVTM — discapacidad

Añade un beneficio nuevo.

Tipo:
EXENCION.

Supuestos:

- vehículo para persona de movilidad reducida; o
- vehículo matriculado a nombre de persona con discapacidad para uso exclusivo.

Para el segundo supuesto:

- discapacidad >= 33 %.

Sólo un vehículo puede disfrutar simultáneamente de esta exención por beneficiario.

No fuerces la cardinalidad "un vehículo" dentro del motor.

El certificado, seguro y demás documentación deben ser válidos/referirse al momento del devengo.
Si representas esa condición en V0, hazlo mediante campos explícitos y no mediante un ambiguo "actualmente".

Trámite:

- requiere solicitud.
- padrón ordinario 2026: hasta 6 de abril.
- una vez reconocida persiste mientras no cambien las circunstancias, pero NO implementes esa persistencia como elegibilidad.

Si la lógica de las dos vías requiere una expresión que nuestro GrupoRegla plano no puede representar sin perder exactitud, no la simplifiques incorrectamente. Indica la limitación.

8. IVTM — vehículo histórico/de época

Añade un beneficio nuevo.

Beneficio:

- bonificación 100 %.

Dos vías:
A) vehículo matriculado oficialmente como histórico.
B) vehículo que pueda ser considerado "de época" Y antigüedad de fabricación superior a 30 años.

IMPORTANTE:
No reduzcas la vía B a `antiguedad > 30`.
La condición "de época" también existe y no tenemos un criterio municipal completo para inferirla automáticamente.

Una solución V0 válida puede utilizar un booleano explícito para la condición acreditada de vehículo de época y, si resulta útil, un número para la antigüedad, pero no inventes criterios para decidir por tu cuenta qué vehículo es "de época".

Plazo ordinario:

- hasta 6 de abril de 2026.

No afirmes persistencia automática ni documentación concreta no verificada.

FUENTES

Revisa `prisma/seed/municipalities/valladolid/sources.ts`.

Mantén las fuentes actuales si siguen siendo útiles, pero el dataset debe tener como fuente primaria para estos beneficios la normativa oficial 2026 cuando corresponda.

Fuente normativa principal:
Texto íntegro Ordenanzas Fiscales 2026 del Ayuntamiento de Valladolid, actualizado conforme al BOP nº 238 de 15/12/2025.

No hace falta implementar un sistema editorial nuevo.
Utiliza el modelo `Fuente` / `BeneficioFuente` existente.

Si necesitas nuevas fuentes para ORA u otros beneficios, añádelas siguiendo el patrón existente y actualiza la limpieza controlada de `index.ts`.

TESTS Y VALIDACIÓN

Después de implementar:

1. Ejecuta el seed.
2. Ejecútalo una segunda vez para comprobar que los conteos permanecen estables.
3. Añade/actualiza tests de integración que prueben al menos:
   - IBI general y especial.
   - residuos familia numerosa.
   - residuos renta/IPREM sin usar un umbral monetario inventado.
   - compostaje con la condición temporal refinada.
   - IVTM movilidad sostenible sigue permitiendo múltiples tramos.
   - IVTM histórico.
   - los casos que sí sean representables correctamente de ORA/discapacidad.
4. No uses IDs autoincrementales concretos en assertions.
5. Ejecuta:
   pnpm exec vitest run
   pnpm exec tsc --noEmit
   pnpm lint
   pnpm build
   git diff --check

NO HAGAS COMMIT.
NO HAGAS PUSH.
NO CAMBIES DE RAMA.

Al terminar quiero un resumen con:

- archivos modificados/creados;
- campos evaluables añadidos/cambiados;
- preguntas añadidas/cambiadas;
- beneficios finales sembrados;
- conteos de las tablas relevantes después de ejecutar el seed dos veces;
- tests añadidos/modificados;
- cualquier requisito fiscal que deliberadamente hayas dejado fuera porque el modelo actual no puede representarlo fielmente;
- cualquier decisión en la que hayas tenido que elegir entre dos alternativas.

Antes de editar, muéstrame brevemente tu plan. Después puedes realizar los cambios.
