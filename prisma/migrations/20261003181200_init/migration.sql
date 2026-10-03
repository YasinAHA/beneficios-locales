-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('VIGENTE', 'PENDIENTE_REVISION', 'DESACTUALIZADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "TipoBonificacion" AS ENUM ('PORCENTAJE', 'IMPORTE', 'EXENCION', 'REDUCCION', 'OTRO');

-- CreateEnum
CREATE TYPE "OperadorLogico" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "OperadorRegla" AS ENUM ('EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN');

-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('BOOLEAN', 'NUMBER', 'STRING');

-- CreateEnum
CREATE TYPE "TipoRespuesta" AS ENUM ('BOOLEAN', 'SELECT', 'NUMBER', 'TEXT');

-- CreateEnum
CREATE TYPE "OrigenSolicitudMunicipio" AS ENUM ('PORTADA', 'TEST', 'FICHA_SEO');

-- CreateTable
CREATE TABLE "municipios" (
    "id" BIGSERIAL NOT NULL,
    "codigo_ine" VARCHAR(10) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "provincia" VARCHAR(150) NOT NULL,
    "comunidad" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficios" (
    "id" BIGSERIAL NOT NULL,
    "municipio_id" BIGINT NOT NULL,
    "tributo" VARCHAR(30) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "titulo" VARCHAR(250) NOT NULL,
    "descripcion_corta" TEXT,
    "descripcion" TEXT,
    "ejercicio_desde" SMALLINT NOT NULL,
    "ejercicio_hasta" SMALLINT,
    "tipo" "TipoBonificacion" NOT NULL,
    "valor" DECIMAL(12,2),
    "unidad" VARCHAR(30),
    "estado" "EstadoRevision" NOT NULL DEFAULT 'PENDIENTE_REVISION',
    "fecha_ultima_revision" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "beneficios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos_evaluables" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "tipo" "TipoCampo" NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "campos_evaluables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos_reglas" (
    "id" BIGSERIAL NOT NULL,
    "beneficio_id" BIGINT,
    "tramo_id" BIGINT,
    "operador" "OperadorLogico" NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "grupos_reglas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas" (
    "id" BIGSERIAL NOT NULL,
    "grupo_id" BIGINT NOT NULL,
    "campo_id" BIGINT NOT NULL,
    "operador" "OperadorRegla" NOT NULL,
    "valor" JSONB NOT NULL,
    "descripcion_usuario" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "reglas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramos_beneficio" (
    "id" BIGSERIAL NOT NULL,
    "beneficio_id" BIGINT NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "tipo" "TipoBonificacion" NOT NULL,
    "valor" DECIMAL(12,2),
    "unidad" VARCHAR(30),
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tramos_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuentes" (
    "id" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "titulo" VARCHAR(300) NOT NULL,
    "url" TEXT NOT NULL,
    "ejercicio" SMALLINT,
    "fecha_consulta" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficios_fuentes" (
    "beneficio_id" BIGINT NOT NULL,
    "fuente_id" BIGINT NOT NULL,
    "referencia" VARCHAR(250),
    "articulo" VARCHAR(100),
    "pagina" VARCHAR(50),
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "beneficios_fuentes_pkey" PRIMARY KEY ("beneficio_id","fuente_id")
);

-- CreateTable
CREATE TABLE "tramites" (
    "id" BIGSERIAL NOT NULL,
    "beneficio_id" BIGINT NOT NULL,
    "requiere_solicitud" BOOLEAN NOT NULL DEFAULT true,
    "plazo_descripcion" TEXT,
    "plazo_desde" DATE,
    "plazo_hasta" DATE,
    "documentacion" JSONB,
    "procedimiento" TEXT,
    "url_tramite" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_test" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "pregunta" TEXT NOT NULL,
    "tipo" "TipoRespuesta" NOT NULL,
    "opciones" JSONB,
    "ayuda" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "preguntas_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preguntas_campos" (
    "pregunta_id" BIGINT NOT NULL,
    "campo_id" BIGINT NOT NULL,

    CONSTRAINT "preguntas_campos_pkey" PRIMARY KEY ("pregunta_id","campo_id")
);

-- CreateTable
CREATE TABLE "solicitudes_municipio" (
    "id" BIGSERIAL NOT NULL,
    "municipio_solicitado" VARCHAR(150) NOT NULL,
    "municipio_normalizado" VARCHAR(150) NOT NULL,
    "provincia" VARCHAR(150),
    "origen" "OrigenSolicitudMunicipio",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_municipio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipios_codigo_ine_key" ON "municipios"("codigo_ine");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_slug_key" ON "municipios"("slug");

-- CreateIndex
CREATE INDEX "beneficios_municipio_id_idx" ON "beneficios"("municipio_id");

-- CreateIndex
CREATE INDEX "beneficios_municipio_id_estado_idx" ON "beneficios"("municipio_id", "estado");

-- CreateIndex
CREATE INDEX "beneficios_tributo_idx" ON "beneficios"("tributo");

-- CreateIndex
CREATE INDEX "beneficios_ejercicio_desde_ejercicio_hasta_idx" ON "beneficios"("ejercicio_desde", "ejercicio_hasta");

-- CreateIndex
CREATE UNIQUE INDEX "beneficios_municipio_id_tributo_slug_ejercicio_desde_key" ON "beneficios"("municipio_id", "tributo", "slug", "ejercicio_desde");

-- CreateIndex
CREATE UNIQUE INDEX "campos_evaluables_clave_key" ON "campos_evaluables"("clave");

-- CreateIndex
CREATE INDEX "grupos_reglas_beneficio_id_idx" ON "grupos_reglas"("beneficio_id");

-- CreateIndex
CREATE INDEX "grupos_reglas_tramo_id_idx" ON "grupos_reglas"("tramo_id");

-- CreateIndex
CREATE INDEX "reglas_grupo_id_idx" ON "reglas"("grupo_id");

-- CreateIndex
CREATE INDEX "reglas_campo_id_idx" ON "reglas"("campo_id");

-- CreateIndex
CREATE INDEX "tramos_beneficio_beneficio_id_idx" ON "tramos_beneficio"("beneficio_id");

-- CreateIndex
CREATE INDEX "beneficios_fuentes_fuente_id_idx" ON "beneficios_fuentes"("fuente_id");

-- CreateIndex
CREATE UNIQUE INDEX "tramites_beneficio_id_key" ON "tramites"("beneficio_id");

-- CreateIndex
CREATE UNIQUE INDEX "preguntas_test_clave_key" ON "preguntas_test"("clave");

-- CreateIndex
CREATE INDEX "preguntas_campos_campo_id_idx" ON "preguntas_campos"("campo_id");

-- CreateIndex
CREATE INDEX "solicitudes_municipio_municipio_normalizado_idx" ON "solicitudes_municipio"("municipio_normalizado");

-- CreateIndex
CREATE INDEX "solicitudes_municipio_created_at_idx" ON "solicitudes_municipio"("created_at");

-- AddForeignKey
ALTER TABLE "beneficios" ADD CONSTRAINT "beneficios_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_reglas" ADD CONSTRAINT "grupos_reglas_beneficio_id_fkey" FOREIGN KEY ("beneficio_id") REFERENCES "beneficios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos_reglas" ADD CONSTRAINT "grupos_reglas_tramo_id_fkey" FOREIGN KEY ("tramo_id") REFERENCES "tramos_beneficio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas" ADD CONSTRAINT "reglas_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos_reglas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas" ADD CONSTRAINT "reglas_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_evaluables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramos_beneficio" ADD CONSTRAINT "tramos_beneficio_beneficio_id_fkey" FOREIGN KEY ("beneficio_id") REFERENCES "beneficios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficios_fuentes" ADD CONSTRAINT "beneficios_fuentes_beneficio_id_fkey" FOREIGN KEY ("beneficio_id") REFERENCES "beneficios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficios_fuentes" ADD CONSTRAINT "beneficios_fuentes_fuente_id_fkey" FOREIGN KEY ("fuente_id") REFERENCES "fuentes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_beneficio_id_fkey" FOREIGN KEY ("beneficio_id") REFERENCES "beneficios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_campos" ADD CONSTRAINT "preguntas_campos_pregunta_id_fkey" FOREIGN KEY ("pregunta_id") REFERENCES "preguntas_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preguntas_campos" ADD CONSTRAINT "preguntas_campos_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_evaluables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "beneficios"
ADD CONSTRAINT "beneficios_ejercicio_valido_check"
CHECK (
    "ejercicio_hasta" IS NULL
    OR "ejercicio_hasta" >= "ejercicio_desde"
);

-- AddCheckConstraint
ALTER TABLE "grupos_reglas"
ADD CONSTRAINT "grupos_reglas_propietario_check"
CHECK (
    ("beneficio_id" IS NOT NULL AND "tramo_id" IS NULL)
    OR
    ("beneficio_id" IS NULL AND "tramo_id" IS NOT NULL)
);

-- AddCheckConstraint
ALTER TABLE "tramites"
ADD CONSTRAINT "tramites_plazo_valido_check"
CHECK (
    "plazo_desde" IS NULL
    OR "plazo_hasta" IS NULL
    OR "plazo_hasta" >= "plazo_desde"
);
