# Citizen test results

## 1. Objetivo

Implementar la capa de aplicación que transforma las evaluaciones producidas por
`CitizenTestFlow` en resultados estructurados y útiles para el ciudadano.

Esta feature NO implementa UI.

Debe producir un contrato reutilizable por una futura pantalla de resultados sin:

- modificar la semántica del motor fiscal;
- modificar la semántica adaptativa del cuestionario;
- duplicar contenido editorial;
- inventar conclusiones fiscales;
- elegir el beneficio "mejor";
- estimar ahorro económico;
- afirmar concesión o derecho definitivo.

La cadena conceptual es:

```text
Eligibility engine
      ↓
CitizenTestFlow
      ↓
CitizenTestResults
      ↓
future results UI
```

`CitizenTestResults` interpreta la evaluación existente. No constituye un nuevo
motor de reglas.

---

## 2. Alcance V0

La feature debe funcionar con los ocho beneficios Valladolid V0 2026 ya
existentes y con los contratos genéricos del motor y del citizen test.

Debe cubrir correctamente los patrones actuales:

- beneficio con resultado fijo;
- beneficio con tramos económicos diferentes;
- múltiples vías jurídicas que producen el mismo resultado estructurado;
- beneficio `MATCH` con otros resultados diferentes todavía `UNKNOWN`;
- beneficio `UNKNOWN`;
- beneficio `NO_MATCH`;
- información omitida mediante `skippedFields`;
- evaluación antes de completar el cuestionario;
- revisión de respuestas y reevaluación posterior.

La implementación debe ser genérica respecto a las reglas fiscales.

No se debe codificar lógica específica de:

- IBI;
- IVTM;
- ORA;
- tasa de residuos;
- familia numerosa;
- discapacidad;
- movilidad sostenible;
- vehículo histórico;
- compostaje;
- IPREM;

ni de claves concretas de campos, preguntas, beneficios, tributos o tramos.

Valladolid 2026 se utilizará para pruebas de integración, no para definir el
algoritmo.

---

## 3. Fuera de alcance

No implementar en esta feature:

- React;
- páginas Next.js;
- componentes visuales;
- navegación del cuestionario;
- persistencia de respuestas;
- sesiones;
- cuentas;
- analytics;
- Madrid;
- ejercicio 2027;
- nuevas reglas fiscales;
- nuevos beneficios;
- modificaciones del seed fiscal;
- modificaciones del schema Prisma;
- ranking económico;
- cálculo de ahorro;
- agregación monetaria;
- selección de "mejor beneficio";
- compatibilidad entre beneficios;
- copy final de interfaz;
- CTA;
- reapertura visual del cuestionario;
- sitemap/SEO;
- cambios en `PublicBenefit` salvo que exista una necesidad técnica material
  previamente identificada y reportada.

---

## 4. Fuentes de verdad existentes

La implementación debe reutilizar los contratos y comportamiento existentes.

### Motor fiscal

La evaluación fiscal existente continúa siendo la única fuente de verdad para:

- `MATCH`;
- `UNKNOWN`;
- `NO_MATCH`;
- `matchedTrancheIds`;
- `unknownTrancheIds`;
- `missingFields`.

No recalcular manualmente las reglas fiscales en Results.

### Citizen test flow

`CitizenTestFlow` continúa siendo la fuente de verdad para:

- estado actual;
- respuestas;
- `skippedFields`;
- evaluaciones de candidatos;
- utilidad de preguntas;
- finalización del cuestionario.

Results no debe decidir qué pregunta hacer a continuación.

### Structured fiscal result

Los resultados estructurados existentes en el mapper son la fuente de verdad
para:

- tipo de resultado;
- valor;
- unidad.

No duplicar porcentajes, importes o exenciones mediante constantes.

### PublicBenefit / editorial

La información editorial existente continúa siendo la fuente de verdad para:

- título público;
- resumen;
- requisitos explicativos;
- fechas;
- documentación;
- pasos de solicitud;
- renovación/persistencia;
- advertencias;
- incertidumbres;
- fuentes;
- SEO.

Esta feature NO debe copiar ese contenido dentro de un nuevo registro paralelo.

---

## 5. Estado público principal

Cada beneficio debe obtener exactamente uno de estos estados de aplicación:

```ts
type CitizenBenefitResultStatus =
  | "COMPATIBLE"
  | "POSSIBLE"
  | "NOT_COMPATIBLE";
```

Mapeo base:

```text
MATCH     -> COMPATIBLE
UNKNOWN   -> POSSIBLE
NO_MATCH  -> NOT_COMPATIBLE
```

Estos nombres son estados de aplicación, no afirmaciones jurídicas.

`COMPATIBLE` significa que, según las respuestas disponibles, existe al menos
un resultado que el motor considera compatible.

NO significa:

- beneficio concedido;
- derecho reconocido;
- solicitud aprobada;
- cumplimiento documental;
- cumplimiento de condiciones no representadas por el motor;
- validación administrativa definitiva.

No introducir en esta capa textos que afirmen lo contrario.

---

## 6. Resultado principal y resultados internos

El estado principal de un beneficio y sus resultados estructurados son conceptos
diferentes.

Un beneficio puede ser:

```text
COMPATIBLE
```

y simultáneamente contener:

- uno o más resultados estructurados compatibles;
- cero o más resultados estructurados diferentes todavía sin resolver.

Ejemplo conceptual:

```text
Beneficio: COMPATIBLE

matched:
- 40 %

unresolved:
- 90 %
```

Esto NO debe degradarse a `POSSIBLE`.

Existe ya al menos un resultado compatible, por lo que el beneficio permanece
`COMPATIBLE`.

La incertidumbre adicional debe conservarse en los resultados estructurados
pendientes.

---

## 7. Identidad de resultado estructurado

Debe reutilizarse exactamente la misma definición conceptual aprobada para
`citizen-test-flow`:

```text
[type, value, unit]
```

La equivalencia debe comparar los tres elementos incluyendo `null`.

No utilizar para equivalencia:

- ID de tramo;
- nombre de tramo;
- nombre de beneficio;
- descripción;
- texto editorial;
- orden;
- ID de base de datos.

Dos vías con diferente ID o nombre pero mismo:

```text
type
value
unit
```

representan el mismo resultado económico/de aplicación para esta capa.

Debe reutilizarse la función existente `resultKey()` o una abstracción compartida
equivalente. No implementar una segunda semántica diferente.

---

## 8. Agrupación de vías equivalentes

Results debe representar resultados estructurados, no todas las vías jurídicas
internas que llevan al mismo resultado.

Si existen:

```text
route A -> MATCH   -> EXENCION
route B -> UNKNOWN -> EXENCION
```

el resultado público debe contener una única exención compatible.

La vía B no debe generar además:

```text
unresolved EXENCION
```

porque no aportaría un resultado distinto al ciudadano.

Esto aplica, entre otros patrones actuales, a vías alternativas de:

- discapacidad;
- histórico/de época cuando el resultado estructurado sea equivalente;
- ORA familias.

Esta enumeración es únicamente explicativa.

El algoritmo NO debe reconocer estos beneficios por nombre o slug.

---

## 9. Resultados distintos pendientes

Si un beneficio ya tiene un resultado `MATCH`, pero existe un tramo `UNKNOWN`
con un resultado estructurado diferente, ese resultado pendiente debe
conservarse.

Ejemplo conceptual:

```text
MATCH -> 40 %
UNKNOWN -> 90 %
```

Resultado:

```text
status: COMPATIBLE
matchedResults:
  - 40 %
unresolvedResults:
  - 90 %
```

No ocultar el 90 % únicamente porque el beneficio ya sea `MATCH`.

Esto es especialmente importante para beneficios con varios resultados
económicamente distintos.

---

## 10. Deduplificación

`matchedResults` debe contener resultados estructurados únicos por:

```text
[type, value, unit]
```

`unresolvedResults` también debe contener resultados estructurados únicos.

Además:

```text
unresolvedResults
```

no debe contener ningún resultado equivalente a uno ya presente en:

```text
matchedResults
```

La deduplicación es de presentación/aplicación.

NO modificar:

- `matchedTrancheIds`;
- `unknownTrancheIds`;
- resultado del eligibility engine;
- resultado de `CitizenTestFlow`.

---

## 11. Orden determinista de resultados

El resultado no debe depender del orden accidental de:

- consultas;
- IDs de base de datos;
- inserción;
- `Set`;
- locale del sistema.

Definir y documentar un orden determinista para los resultados estructurados.

No utilizar valor económico como ranking de preferencia.

No asumir:

```text
90 % > 40 % -> mostrar primero porque es "mejor"
```

como decisión de negocio.

El orden puede derivarse de un orden estructural estable ya existente o de una
comparación determinista del descriptor, siempre que no implique ranking fiscal.

La elección exacta debe quedar cubierta por tests.

---

## 12. Información pendiente

Un resultado puede necesitar explicar qué información falta.

No exponer únicamente claves técnicas como:

```text
categoria_familia_numerosa
vehiculo_emisiones_co2
```

Debe existir un contrato seguro que permita relacionar la información pendiente
con la pregunta configurada correspondiente.

Conceptualmente:

```ts
type MissingInformation = {
  fieldKey: string;
  questionKey: string;
  question: string;
  reason: "SKIPPED" | "UNANSWERED";
};
```

Los nombres exactos pueden ajustarse durante implementación si existe una razón
técnica clara, pero la semántica debe mantenerse.

No incluir objetos Prisma completos.

No incluir reglas fiscales completas.

---

## 13. SKIPPED no es una respuesta fiscal

Los campos presentes en:

```text
skippedFields
```

representan:

```text
el ciudadano decidió no aportar actualmente ese dato
```

No representan:

- `false`;
- `0`;
- string vacío;
- `"unknown"`;
- ausencia del requisito;
- respuesta negativa.

Results debe conservar esta distinción.

Cuando un campo pendiente relevante está en `skippedFields`, su razón debe ser:

```text
SKIPPED
```

Nunca inferir una respuesta fiscal.

---

## 14. UNANSWERED

Puede generarse un resultado antes de que el cuestionario esté completo.

Por tanto un campo útil pendiente puede no haber sido omitido explícitamente,
sino simplemente no haberse preguntado/respondido todavía.

Ese caso debe poder representarse como:

```text
UNANSWERED
```

No confundirlo con `SKIPPED`.

---

## 15. No exponer missingFields irrelevantes

No transformar ciegamente:

```ts
evaluation.missingFields
```

en información pendiente pública.

Un `missingField` puede pertenecer a una vía alternativa que:

- produce exactamente el mismo resultado que una vía ya `MATCH`;
- fue correctamente considerada no útil por `CitizenTestFlow`;
- no necesita ser preguntada al ciudadano.

Esos campos NO deben aparecer como información pendiente del resultado público.

Ejemplo:

```text
discapacidad route A -> MATCH -> EXENCION
discapacidad route B -> UNKNOWN -> EXENCION
```

No mostrar:

```text
Compatible: exención
Información pendiente: demostrar también route B
```

La información pendiente debe estar relacionada con resultados todavía
relevantes.

---

## 16. Relación missing information -> resultado pendiente

Cuando sea posible a partir del modelo existente, preservar qué información
pendiente afecta a qué resultado estructurado pendiente.

Evitar un único saco global ambiguo si el modelo actual permite conservar la
relación de manera segura.

Ejemplo conceptual:

```text
unresolved result 90 %
  missing:
    - categoría familia numerosa
```

frente a:

```text
unresolved result 40 %
  missing:
    - emisiones CO2
```

No inventar esa relación si los contratos existentes no permiten demostrarla.

Si durante la auditoría previa se detecta que el mapper/flow pierde información
necesaria para construirla de forma fiable, STOP y reportar antes de modificar
contratos existentes.

---

## 17. Beneficio UNKNOWN

Un beneficio cuyo engine status sea:

```text
UNKNOWN
```

debe producir:

```text
POSSIBLE
```

Debe conservar:

- resultados estructurados todavía posibles cuando puedan determinarse de forma
  fiable;
- información relevante pendiente;
- identidad del beneficio.

No convertir `UNKNOWN` en `NOT_COMPATIBLE`.

No afirmar que el ciudadano cumple las condiciones.

---

## 18. Beneficio NO_MATCH

Un beneficio:

```text
NO_MATCH
```

debe producir:

```text
NOT_COMPATIBLE
```

Debe conservarse en el output.

No eliminar los beneficios descartados.

La futura UI decidirá si:

- mostrarlos;
- colapsarlos;
- agruparlos;
- ponerlos al final.

Esta feature debe permitir saber que fueron evaluados.

No es necesario producir explicación jurídica del motivo de descarte salvo que
el motor existente ya proporcione de forma inequívoca un contrato apropiado.

No implementar un nuevo sistema de "failure reasons" en esta feature.

---

## 19. Beneficio MATCH sin tramos

Un beneficio con resultado fijo y sin tramos puede estar `MATCH`.

El resultado estructurado principal debe proceder exclusivamente de los datos
estructurados existentes del beneficio.

Antes de implementar, verificar exactamente cómo representa actualmente
`MappedEvaluatableBenefit` el resultado fijo.

No inventar el resultado a partir de texto editorial.

Si el mapper actual no expone de forma suficiente el resultado fijo necesario
para Results, STOP durante la auditoría y reportar la carencia antes de editar.

---

## 20. Beneficio MATCH con tramos

Para beneficios con tramos:

- los `matchedTrancheIds` determinan qué vías están `MATCH`;
- `trancheDetails` aporta sus resultados estructurados;
- los `unknownTrancheIds` determinan vías pendientes;
- los resultados equivalentes se agrupan según `[type, value, unit]`.

No volver a ejecutar reglas para sustituir la evaluación existente salvo que sea
estrictamente necesario para asociar missing information a un resultado y dicha
reevaluación use exclusivamente los evaluadores existentes sin cambiar
semántica.

Preferir reutilizar información ya calculada.

---

## 21. Resultado fijo vs tramos

La implementación debe soportar ambos:

```text
beneficio con resultado fijo
beneficio con resultados definidos por tramos
```

sin hardcodear qué beneficios pertenecen a cada grupo.

Debe existir un contrato uniforme para la futura UI.

---

## 22. PublicBenefit

No duplicar `PublicBenefit`.

Results debe devolver identidad suficiente para que una capa posterior pueda
componer:

```text
CitizenBenefitResult
        +
PublicBenefit
        ↓
future public result view model
```

No es obligatorio implementar esa composición editorial completa en esta
feature si introduce acoplamiento innecesario.

La decisión debe tomarse durante la auditoría previa:

- si existe una composición sencilla y natural reutilizando servicios actuales,
  puede implementarse como capa separada;
- si no, devolver identidad estable y dejar la composición para la feature de UI.

No copiar manualmente contenido editorial.

---

## 23. Resultados parciales

Debe ser válido construir resultados cuando:

```text
flow.complete === false
```

No lanzar error por cuestionario incompleto.

Esto permite reutilizar la capa en el futuro para experiencias como:

```text
ya hemos descartado 2
ya hemos encontrado 1 compatible
quedan otros por resolver
```

aunque la primera UI no utilice esa capacidad.

---

## 24. Completion

El output general debe conservar:

```text
complete
```

procedente del flow.

Results NO redefine cuándo termina el cuestionario.

No inferir completion mirando únicamente los estados de beneficios.

Es legítimo:

```text
complete === true
```

y que existan beneficios:

```text
POSSIBLE
```

por respuestas omitidas.

---

## 25. Summary

El contrato general debe incluir un resumen determinista de estados.

Conceptualmente:

```ts
type CitizenTestResultsSummary = {
  compatible: number;
  possible: number;
  notCompatible: number;
};
```

Debe cumplirse siempre:

```text
compatible + possible + notCompatible
=
number of candidate benefits
```

Contar beneficios, no tramos.

No contar un beneficio dos veces porque tenga:

```text
MATCH + unresolved result
```

Ese beneficio cuenta como:

```text
compatible += 1
```

---

## 26. Contrato conceptual esperado

La forma exacta puede ajustarse tras inspeccionar los tipos existentes, pero el
contrato debe ser equivalente a:

```ts
type CitizenTestResults = {
  complete: boolean;

  summary: {
    compatible: number;
    possible: number;
    notCompatible: number;
  };

  benefits: CitizenBenefitResult[];
};

type CitizenBenefitResult = {
  municipalitySlug: string;
  tax: string;
  benefitSlug: string;
  exercise: number;

  status:
    | "COMPATIBLE"
    | "POSSIBLE"
    | "NOT_COMPATIBLE";

  matchedResults: StructuredCitizenResult[];
  unresolvedResults: StructuredCitizenResult[];

  missingInformation: MissingInformation[];
};
```

Si resulta más seguro asociar `missingInformation` directamente dentro de cada
`unresolvedResult`, se puede preferir esa estructura.

Debe evitarse duplicación inconsistente.

---

## 27. StructuredCitizenResult

Debe contener únicamente información estructurada necesaria para representar el
resultado.

Como mínimo debe preservar:

```text
type
value
unit
```

Puede conservar metadatos estructurados adicionales existentes si son necesarios
y seguros.

No incluir:

- Prisma Decimal;
- BigInt;
- objetos Prisma;
- reglas completas;
- texto fiscal inventado;
- labels generados a partir de heurísticas.

Debe ser serializable.

---

## 28. Serialización

Todo el output de Results debe poder cruzar una frontera server -> client en una
futura UI.

No exponer:

- `BigInt`;
- `Decimal`;
- `Map`;
- `Set`;
- instancias Prisma;
- prototipos especiales;
- funciones.

Arrays y objetos planos.

---

## 29. Determinismo

Con el mismo:

```text
CitizenTestData
CitizenTestFlow
```

el resultado debe ser idéntico independientemente del orden accidental de datos
equivalentes cuando el contrato no declare dicho orden significativo.

Cubrir mediante tests:

- candidatos reordenados;
- tramos equivalentes reordenados cuando proceda;
- missing fields reordenados cuando proceda.

No utilizar `localeCompare()` si el comportamiento pudiera depender del locale.

Puede reutilizarse comparación code-unit estable.

---

## 30. Revisiones

Results debe ser una proyección pura del estado/evaluación actual.

Si el ciudadano cambia una respuesta:

```text
state A
↓
flow A
↓
results A

state B
↓
flow B
↓
results B
```

No mantener memoria interna del resultado anterior.

No mutar el flow.

No borrar respuestas.

No persistir resultados.

---

## 31. Errores de configuración

Los errores estructurales deben fallar explícitamente.

Ejemplos:

- `matchedTrancheId` sin `trancheDetails`;
- `unknownTrancheId` sin `trancheDetails`;
- resultado estructurado inválido;
- identidad de candidato duplicada si el contrato la exige única;
- missing information relevante sin pregunta segura cuando debería existir;
- contradicción entre contratos existentes que impida construir un resultado
  fiable.

Preferir reutilizar `CitizenTestConfigurationError` cuando semánticamente
corresponda.

No convertir errores de configuración en `POSSIBLE`.

`POSSIBLE` es incertidumbre fiscal/de respuesta, no configuración rota.

---

## 32. Errores de respuesta

Results no debe revalidar respuestas con una semántica distinta.

La validación de respuestas pertenece a `citizen-test-flow`.

Si Results recibe un `CitizenTestFlow` válido, debe tratarlo como evaluación
válida.

No introducir una segunda implementación de validación BOOLEAN/NUMBER/SELECT.

---

## 33. Seguridad fiscal

Prohibido:

- inferir `false` de ausencia;
- inferir `0` de ausencia;
- inferir categoría;
- inferir combustible;
- inferir emisiones;
- inferir discapacidad;
- inferir antigüedad;
- inferir título;
- inferir residencia;
- inferir empadronamiento;
- inferir IPREM;
- inferir cumplimiento administrativo;
- inferir documentos;
- inferir compatibilidades entre beneficios.

Results solamente proyecta hechos/evaluaciones existentes.

---

## 34. Wording

Esta feature no debe ser responsable del copy final de UI.

Evitar strings como:

```text
"Tienes derecho"
"Te corresponde"
"Te concederán"
"Ahorrarás"
```

El contrato debe permitir que la UI posteriormente construya copy prudente como:

```text
"Compatible según tus respuestas"
"Podría aplicarte"
"No encaja según tus respuestas"
```

pero dichos textos no tienen por qué formar parte de esta feature.

---

## 35. No ranking económico

No implementar:

```text
bestResult
bestBenefit
recommendedBenefit
saving
estimatedSaving
priorityByPercentage
```

Un porcentaje mayor no implica necesariamente mayor ahorro absoluto.

Una exención no debe ordenarse automáticamente por encima de otro beneficio como
recomendación.

El resumen agrupa por estado, no por supuesto valor.

---

## 36. No agregación cross-benefit

No sumar beneficios.

No decidir compatibilidad jurídica entre:

- IBI;
- IVTM;
- residuos;
- ORA;
- cualquier otro beneficio.

Las compatibilidades documentadas editoriales pertenecen a otra capa.

---

## 37. Separación de capas

Preferir una estructura pequeña dentro de:

```text
src/services/citizen-test-results/
```

o ubicación equivalente coherente con el repositorio.

Ejemplo orientativo, NO obligatorio:

```text
src/services/citizen-test-results/
  types.ts
  build-results.ts
  configuration.ts
  __tests__/
```

No crear arquitectura ceremonial.

No crear clases si funciones puras son suficientes.

No introducir un framework interno.

---

## 38. API de aplicación

Debe existir un entry point pequeño y explícito.

Conceptualmente:

```ts
buildCitizenTestResults(...)
```

Debe aceptar datos ya disponibles del citizen test en vez de volver a consultar
la base de datos durante cada proyección.

Evitar N+1.

La función central debe ser pura.

Si se necesita composición con preguntas/configuración, reutilizar el
`CitizenTestData` ya cargado.

No volver a cargar preguntas desde Prisma dentro de un loop por beneficio.

---

## 39. Candidate identity

Preservar identidad lógica estable:

```text
municipalitySlug
tax
benefitSlug
exercise
```

No usar IDs de base de datos como identidad pública.

El `candidate.key` interno puede reutilizarse para consistencia/determinismo, pero
no debe convertirse en requisito de UI si los campos lógicos ya están
disponibles.

---

## 40. Casos mínimos de tests unitarios

Como mínimo cubrir:

1. `MATCH -> COMPATIBLE`.
2. `UNKNOWN -> POSSIBLE`.
3. `NO_MATCH -> NOT_COMPATIBLE`.
4. summary cuenta beneficios exactamente una vez.
5. `MATCH` con un resultado compatible.
6. múltiples tramos MATCH equivalentes -> un solo matched result.
7. MATCH + UNKNOWN equivalente -> no unresolved duplicado.
8. MATCH + UNKNOWN diferente -> conservar unresolved.
9. varios UNKNOWN equivalentes -> un solo unresolved result.
10. mismo valor pero tipo distinto -> resultados distintos.
11. mismo tipo/valor pero unidad distinta -> resultados distintos.
12. `null` participa en equivalencia.
13. skipped relevante -> missing information `SKIPPED`.
14. unanswered relevante -> `UNANSWERED`.
15. missing de vía equivalente ya satisfecha -> no mostrar.
16. cuestionario incompleto -> results válido.
17. complete true + UNKNOWN por skip -> válido.
18. revisión de respuesta cambia results sin estado interno residual.
19. orden determinista.
20. output serializable.
21. missing question/configuration inconsistency -> error explícito.
22. missing tranche detail -> error explícito.
23. no mutación del flow/data de entrada.
24. candidatos reordenados no cambian la semántica del output.

---

## 41. Tests de integración Valladolid V0

Añadir pruebas con el dataset real Valladolid 2026 para cubrir al menos:

### IBI familia numerosa

- categoría general -> `COMPATIBLE` + 40 %;
- categoría especial -> `COMPATIBLE` + 90 %;
- gates satisfechos + categoría skipped -> `POSSIBLE` con resultados pendientes
  relevantes.

### IVTM movilidad sostenible

- eléctrico compatible;
- resultados económicos distintos pendientes se conservan cuando corresponda;
- dos vías equivalentes del 40 % no generan duplicados;
- múltiples matches del mismo resultado no generan duplicados.

### Tasa residuos familia numerosa

- resultado fijo compatible.

### Tasa residuos renta/IPREM

- resultado fijo compatible;
- UNKNOWN por información omitida permanece `POSSIBLE`.

### Compostaje

- resultado fijo compatible;
- condición fallida -> `NOT_COMPATIBLE`.

### IVTM histórico/de época

- una vía compatible -> 100 % una sola vez;
- otra vía equivalente UNKNOWN no aparece como resultado pendiente duplicado.

### IVTM discapacidad

- una vía compatible -> una única exención;
- otra vía equivalente UNKNOWN no genera falsa información pendiente.

### ORA familias

- una vía compatible -> una única exención;
- otra vía equivalente UNKNOWN no genera falsa información pendiente.

### Full test

- exactamente 8 beneficios en results;
- summary suma 8;
- todos rechazados -> 8 `NOT_COMPATIBLE`;
- skips pueden producir `POSSIBLE` con `complete === true`;
- no falsos `NOT_COMPATIBLE` por skip.

---

## 42. Pruebas de invariantes

Añadir tests explícitos de que:

```text
results no cambia eligibility output
results no cambia CitizenTestFlow
results no muta answers
results no muta skippedFields
results no muta candidate evaluations
```

Si es útil, congelar objetos de entrada en tests.

---

## 43. No modificar tests existentes para hacerlos pasar

Los tests existentes representan contratos ya aceptados.

No debilitar ni borrar tests existentes.

Si un test existente contradice materialmente esta task:

STOP.

Reportar la contradicción antes de modificarlo.

---

## 44. No schema / seed changes

Esta feature debe implementarse sin:

- migration;
- cambio de `schema.prisma`;
- cambio de seed;
- cambio de reglas fiscales;
- cambio de preguntas fiscales.

Si durante la auditoría parece imprescindible alguno:

STOP.

No editar.

Reportar primero.

---

## 45. Reutilización del citizen-test-flow

Antes de crear nuevas utilidades, revisar:

```text
src/services/citizen-test/
```

En especial:

- tipos;
- `resultKey`;
- indexación pregunta/campo;
- output de `evaluateCitizenTest`;
- identidad de candidatos;
- representación de skips.

No duplicar funciones existentes innecesariamente.

Si una utilidad es conceptualmente compartida, evaluar si debe permanecer donde
está o extraerse de forma mínima.

No hacer refactor amplio.

---

## 46. Compatibilidad con PublicBenefit

Inspeccionar:

```text
src/services/public-benefits/
src/content/benefits/
```

para verificar cómo una futura UI podrá resolver la identidad:

```text
municipalitySlug
tax
benefitSlug
exercise
```

hacia contenido público.

No implementar nuevas consultas si no son necesarias para esta feature.

Reportar cualquier incompatibilidad real de identidad.

---

## 47. Performance

La construcción de results debe ser principalmente transformación en memoria.

No query por:

- beneficio;
- tramo;
- missing field;
- pregunta.

Si el caller ya dispone de `CitizenTestData` + `CitizenTestFlow`, aprovecharlos.

No optimización prematura, pero evitar N+1 evidente.

---

## 48. README

Documentar brevemente:

- propósito;
- input;
- output;
- significado de `COMPATIBLE/POSSIBLE/NOT_COMPATIBLE`;
- equivalencia `[type,value,unit]`;
- tratamiento de vías equivalentes;
- `SKIPPED` vs `UNANSWERED`;
- results parciales;
- ausencia de ranking/agregación;
- relación con `CitizenTestFlow`;
- relación futura con `PublicBenefit`.

No convertir README en duplicado de esta task.

---

## 49. Validación obligatoria

Antes de terminar:

```bash
pnpm validate
```

Debe pasar:

- Vitest;
- TypeScript;
- ESLint;
- production build;
- `git diff --check`.

Si el entorno Codex vuelve a sufrir el problema CRLF conocido de
`scripts/validate.sh`, NO modificar el script únicamente para resolver una
limitación del entorno.

En ese caso:

- ejecutar individualmente las comprobaciones posibles;
- informar exactamente del fallo;
- dejar que el usuario ejecute `pnpm validate` en Git Bash nativo.

---

## 50. Auditoría obligatoria antes de editar

ANTES de modificar o crear código de implementación, inspeccionar el repositorio
y responder internamente estas preguntas:

1. ¿Cómo representa exactamente `MappedEvaluatableBenefit` el resultado fijo de
   un beneficio sin tramos?
2. ¿Cómo representa exactamente los resultados de tramos?
3. ¿`CitizenTestFlow` conserva suficiente relación entre candidato,
   `matchedTrancheIds`, `unknownTrancheIds` y `missingFields`?
4. ¿Puede determinarse de forma fiable qué missing fields pertenecen a cada
   resultado UNKNOWN sin inventar lógica?
5. ¿Puede distinguirse correctamente un missing relevante de un missing de vía
   equivalente ya satisfecha?
6. ¿Puede mapearse cada missing field relevante a exactamente una pregunta
   segura reutilizando `CitizenTestData`?
7. ¿Existe algún caso actual donde una pregunta tenga mapping distinto de 1:1
   tras las validaciones de citizen-test-flow?
8. ¿`resultKey()` es reutilizable directamente sin introducir dependencia
   circular?
9. ¿La identidad del candidato permite futura composición inequívoca con
   `PublicBenefit`?
10. ¿Puede implementarse toda esta feature sin cambiar schema, seed, reglas o
    semántica de eligibility/citizen-test-flow?
11. ¿El output puede mantenerse completamente serializable?
12. ¿Hay algún beneficio Valladolid V0 cuyo resultado fijo no esté disponible
    de forma estructurada?

### Regla de STOP

Si cualquiera de estas preguntas revela una contradicción material con la task,
NO implementar parcialmente.

STOP.

No modificar código.

Reportar:

- hallazgo;
- archivos implicados;
- por qué contradice la task;
- cambio mínimo que habría que decidir.

No resolver unilateralmente una decisión fiscal o de producto.

---

## 51. Criterios de aceptación

La feature está terminada solamente si:

1. existe una API pura para construir citizen results;
2. soporta los tres estados públicos;
3. conserva `complete`;
4. produce summary correcto;
5. preserva identidad lógica del beneficio;
6. soporta resultado fijo y tramos;
7. deduplica resultados equivalentes;
8. conserva resultados distintos pendientes;
9. no muestra vía equivalente UNKNOWN como pendiente tras MATCH equivalente;
10. distingue `SKIPPED` y `UNANSWERED`;
11. no expone missing irrelevante;
12. no convierte skip en respuesta;
13. no cambia eligibility semantics;
14. no cambia citizen-test-flow semantics;
15. funciona con flow incompleto;
16. funciona con complete + POSSIBLE;
17. output serializable;
18. orden determinista;
19. no ranking económico;
20. no agregación cross-benefit;
21. no lógica fiscal hardcodeada;
22. no schema changes;
23. no seed changes;
24. no UI;
25. tests unitarios suficientes;
26. integración real Valladolid V0;
27. todos los tests existentes continúan pasando;
28. TypeScript pasa;
29. lint pasa;
30. build pasa;
31. `git diff --check` pasa;
32. `pnpm validate` pasa en entorno compatible;
33. README breve actualizado/creado;
34. no commit creado por Codex.

---

## 52. Informe final obligatorio

Al terminar, informar explícitamente:

1. resultado de la auditoría previa;
2. archivos creados;
3. archivos modificados;
4. API pública final;
5. contrato final de Results;
6. mapeo de estados;
7. representación de resultado fijo;
8. representación de tramos;
9. equivalencia de resultados;
10. deduplicación;
11. tratamiento MATCH + UNKNOWN;
12. tratamiento de vías equivalentes;
13. cálculo de missing information;
14. `SKIPPED` vs `UNANSWERED`;
15. results parciales;
16. summary;
17. orden determinista;
18. serialización;
19. composición futura con PublicBenefit;
20. errores explícitos;
21. escenarios Valladolid cubiertos;
22. número de tests nuevos;
23. número total de tests;
24. TypeScript;
25. lint;
26. build;
27. `git diff --check`;
28. `pnpm validate`;
29. confirmación de que no hubo schema/seed/fiscal/UI changes;
30. cualquier desviación respecto a esta task.

No hacer commit.