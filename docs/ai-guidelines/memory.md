# Memoria persistente (Engram)

> [Engram](https://github.com/Gentleman-Programming/engram) le da a los asistentes de IA memoria entre sesiones: SQLite local + MCP. Esta guía define qué se guarda, cómo y dónde.

## Jerarquía de fuentes de conocimiento

| Fuente                                                     | Qué contiene                                                                          | Manda sobre      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- |
| **Specs** (`specs/`)                                       | Qué se construye y cómo. Decisiones de diseño aprobadas.                              | Todo lo demás    |
| **Guías** (`docs/ai-guidelines/`)                          | Cómo trabajamos. Reglas del proyecto.                                                 | Engram           |
| **Engram** (`.engram/`)                                    | Contexto de trabajo: descubrimientos, gotchas, bugs resueltos, estado entre sesiones. | Memoria personal |
| **Memoria del asistente** (ej. auto-memory de Claude Code) | Solo preferencias personales de cada dev.                                             | —                |

Si una memoria de Engram contradice un spec o una guía, **gana el spec/guía** y la memoria se corrige (`mem_update`). Si un descubrimiento cambia el diseño, se actualiza el spec: Engram no reemplaza a la documentación.

## Protocolo para el asistente

1. **Al iniciar sesión**: `mem_current_project` para confirmar el proyecto, luego `mem_context` para recuperar el trabajo reciente.
2. **Antes de decidir algo ya discutido**: `mem_search` con términos concretos. Si hace falta más detalle, `mem_timeline` o `mem_get_observation`.
3. **Al completar algo relevante**: `mem_save` (ver qué guardar abajo).
4. **Al cerrar la sesión**: `mem_session_summary` con objetivo, trabajo hecho, descubrimientos, próximos pasos y archivos relevantes.
5. **Después de una compactación de contexto**: `mem_session_summary` primero, luego `mem_context` para retomar.

## Qué guardar

- Bugs resueltos y su causa raíz.
- Descubrimientos no obvios (comportamientos raros de una librería, límites de una API).
- Cambios de configuración y por qué.
- Decisiones tomadas durante la implementación que **no** ameritan cambiar el spec.

Formato de cada memoria:

- **What**: qué se hizo o descubrió.
- **Why**: por qué.
- **Where**: archivos o módulos involucrados.
- **Learned**: lo que hay que recordar la próxima vez.

## Qué NO guardar

- Secretos, tokens, credenciales, datos personales de usuarios (ver `security.md`).
- Salida cruda de comandos o logs.
- Lo que ya está en el código, en git o en un spec.

## Claves de tema

Usar claves estables para que las memorias de un mismo tema se actualicen en lugar de duplicarse (`mem_suggest_topic_key` ayuda):

```
architecture/<tema>     # architecture/auth-model
feature/<spec-slug>     # feature/quote-flow
bug/<descripcion>       # bug/hydration-mismatch-header
config/<herramienta>    # config/next-images
```

## Git Sync (memoria versionada)

La memoria del proyecto se **versiona** en `.engram/` para compartirla entre máquinas y con el equipo.

```bash
engram sync            # exporta memorias nuevas a .engram/
git add .engram/
git commit -m "chore(memory): sync engram memories"

engram sync --import   # en otra máquina, después de un pull
engram sync --status   # ver qué falta exportar/importar
```

> ⚠️ El sync incluye **los prompts** y se guarda **comprimido**: los scanners de secretos del CI no ven su contenido. Nunca pegar secretos en un prompt.

## Instalación

**Windows**: descargar el binario desde [GitHub Releases](https://github.com/Gentleman-Programming/engram/releases) y ubicarlo en una carpeta del `PATH`. Alternativa con Go: `go install github.com/Gentleman-Programming/engram/cmd/engram@latest`.

**macOS / Linux**: `brew install gentleman-programming/tap/engram`.

**Claude Code** (plugin):

```bash
claude plugin marketplace add Gentleman-Programming/engram
claude plugin install engram
```

Desde la extensión de VS Code, lo mismo con `/plugin`.
