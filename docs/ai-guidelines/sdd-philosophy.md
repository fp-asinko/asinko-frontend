# Filosofía Spec-Driven Development (SDD)

> "El SDD es la póliza de seguros contra la alucinación de la IA y el desorden técnico."

## SDD vs Vibe Coding

| Característica     | Vibe Coding (puro flow)                                              | Spec Driven Development                                           |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Definición**     | Programar por intuición y lenguaje natural sin documentación previa. | El código es el resultado de una especificación técnica validada. |
| **Velocidad**      | Alta al inicio, genera deuda técnica exponencial.                    | Constante y sostenible. Menos retrabajo.                          |
| **Mantenibilidad** | Baja ("black box" generado por IA).                                  | Alta (existe una spec explicativa).                               |
| **Seguridad**      | Vulnerable a alucinaciones y prompt injection.                       | Seguridad por diseño definida en la spec.                         |

**Trabajamos con SDD. El Vibe Coding no está permitido para features.**

## El ciclo de software con IA

```
1. Negocio + UX  →  2. IA + Spec  →  3. Dev humano  →  4. QA IA
   (intención)       (estructura y     (construye        (valida contra
                      documenta)         guiado)           la spec)
```

- **Negocio + UX**: captura de intención, requerimientos visuales y de negocio.
- **IA + Spec**: la IA analiza la intención, documenta la spec, detecta contradicciones y casos borde.
- **Dev humano**: el ingeniero construye guiado estrictamente por la spec (fuente de verdad), sin desvíos.
- **QA IA**: audita el código contra la spec original. Cumplimiento total + ausencia de vulnerabilidades.

## Las tres fases de cada spec

### Fase 1: Requirements (qué)

Define **qué** se va a construir:

- User stories (formato `As a <user>, I want <goal>, so that <benefit>` o EARS)
- Criterios de aceptación concretos y verificables (checklist)
- Stakeholders involucrados
- Fuera de alcance explícito
- Dependencias

**Archivo**: `specs/<feature>/requirements.md`
**Aprobación**: Product Owner + Tech Lead

### Fase 2: Design (cómo)

Define **cómo** se va a construir:

- Decisiones de arquitectura con trade-offs
- Modelo de datos (tipos + validación de esquema)
- Componentes / interfaces / contratos de API
- Estados y manejo de errores
- Consideraciones de performance y accesibilidad

**Archivo**: `specs/<feature>/design.md`
**Aprobación**: Tech Lead

### Fase 3: Tasks (en qué orden)

Define **el orden** de implementación:

- Checklist atómica
- Cada tarea implementable y testeable de forma independiente, e incluye sus tests (ver `testing.md`)
- Cada criterio de aceptación de `requirements.md` mapeado al test que lo verifica
- Dependencias entre tareas claras
- Estimación de complejidad (S/M/L)

**Archivo**: `specs/<feature>/tasks.md`
**Aprobación**: Tech Lead

## Reglas inviolables

1. **No se escribe código de feature sin spec aprobado.** Excepciones: bugfixes menores y experiments en ramas que no mergean a la integradora.
2. **El spec vive con el código.** Si durante la implementación cambia el alcance, se actualiza el spec en el mismo PR. Si el cambio es grande, se abre un nuevo spec.
3. **Una rama por spec**, nombrada `feature/<carpeta-del-spec>-<descripcion>`.
4. **Congelamiento de specs por sprint.** Una vez validada, no se aceptan cambios hasta la siguiente iteración. Cambios urgentes van al backlog.
5. **La IA no improvisa.** Si la spec es ambigua, pregunta. No completa con suposiciones.

## Cuándo se permite saltarse el flujo

| Caso                                          | Spec requerido               | Notas                           |
| --------------------------------------------- | ---------------------------- | ------------------------------- |
| Typo en copy                                  | No                           | Commit directo a la integradora |
| Bugfix < 30 min, sin cambio de comportamiento | No, pero el PR linkea el bug | Reportar en daily               |
| Spike técnico (rama no mergeable)             | No                           | Rama `spike/*`, no mergea       |
| Hotfix de producción                          | Spec retroactivo en 24h      | Se documenta después            |
| Feature nuevo                                 | Sí, las 3 fases              | Sin excepciones                 |
| Refactor con cambio de comportamiento         | Sí                           | Aunque sea "pequeño"            |
| Cambio de schema o API contract               | Sí                           | Coordinar con consumidores      |

## Beneficios medibles

- Mayor velocidad sostenida: se construye desde specs, no desde cero.
- Menor time-to-market: la spec elimina retrabajo.
- Menos bugs en producción: el QA valida contra la spec, no contra interpretación.

## Para el equipo

Si te encuentras pensando "voy a construir esto rápido sin spec porque ya sé qué hacer", **detente**. Ese es el momento exacto en que el SDD aporta más valor: forzar a escribir lo que ya sabes, para que tu yo del futuro (o un compañero) lo encuentre.
