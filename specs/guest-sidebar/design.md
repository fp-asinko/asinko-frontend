# Invitación a unirse en la columna izquierda — Design

## 1. Componentes

- **`JoinCard`** pasa de `components/organisms/right-column/` a `components/organisms/auth-gate/join-card.tsx`, porque es parte de la invitación a tener cuenta. Es un Server Component, salvo `ComingSoon`, que ya es cliente.
- **`InterestsSections`** (feature interests): en la rama sin sesión renderiza `<JoinCard />` arriba de "Comunidades". El panel ☰ usa la misma columna, así que lo hereda.
- **`RightColumn`** deja de recibir `signedIn`: ya no tiene nada que dependa de la sesión. El layout lo deja de pasar.

## 2. Tarjeta

```
┌──────────────────────────┐  bg-surface, rounded-xl, sin borde
│   ¿Nuevo en Asinko?      │  text-[1.25rem] bold, centrado
│ Construye un historial…  │  type-meta muted, centrado
│ [(r)  Continuar con Reddit ]   h-11 rounded-full bg-background border
│ [(ig) Continuar con Instagram]  logo a la izquierda, texto centrado
│ [(x)  Continuar con X      ]
│ [(✉)  Continuar con correo ]
│ Al continuar, aceptas…   │  text-[0.6875rem] muted, links subrayados
│   $ETH     #defi         │  fondo de menciones (§ 3), ~120 px
│ @maria  $BTC   #macro    │
└──────────────────────────┘
```

- **Botones:** `ComingSoon` con `placement="below"`.
  - Las marcas salen de `brand-marks.tsx` (las del modal) y el correo de `MailIcon` de lucide.
  - Llevan `bg-background` y borde, como Reddit: sobre la tarjeta gris, la píldora blanca es la que se distingue. Una píldora gris (`bg-muted`) casi no se vería sobre `bg-surface`.
- **Texto legal:** `t.rich` con `<terms>` y `<privacy>`, cada uno un `ComingSoon` en línea.

## 3. Fondo de menciones

- Un `div` con `aria-hidden`, `relative h-30 overflow-hidden` y una máscara `mask-image: linear-gradient(to top, black 40%, transparent)`.
- Adentro hay 8 píldoras `rounded-full bg-background px-2 py-0.5 type-meta text-muted-foreground`, con posiciones fijas en un array (`left`/`top` en %) y una leve rotación (−6° a 6°).
- Las menciones son símbolos, no texto traducible: `$BTC`, `$ETH`, `$SOL`, `#defi`, `#macro`, `#latam`, `@maria`, `@jeppe`.
- Sin animación (menos es más, y nada que respete o no `prefers-reduced-motion`).
- Las posiciones van en `style` (permitido por la CSP en `style-src-attr`). Tailwind no genera clases que se arman en tiempo de ejecución.

## 4. Mensajes

| Clave                     | en                                                                                                  | es                                                                                                             | pt                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `authGate.joinCard.email` | Continue with email                                                                                 | Continuar con correo                                                                                           | Continuar com e-mail                                                                                           |
| `authGate.joinCard.legal` | By continuing, you agree to our `<terms>`Terms`</terms>` and `<privacy>`Privacy Policy`</privacy>`. | Al continuar, aceptas nuestros `<terms>`Términos`</terms>` y la `<privacy>`Política de privacidad`</privacy>`. | Ao continuar, você aceita nossos `<terms>`Termos`</terms>` e a `<privacy>`Política de privacidade`</privacy>`. |

- "Continuar con {provider}" reusa `authGate.continueWith`.
- `authGate` ya está en `CLIENT_NAMESPACES`.

## 5. Tests

| Qué                                                                                                                                            | Dónde                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Título, 4 botones "Próximamente", legal, fondo oculto a lectores                                                                               | `join-card.test.tsx` (se mueve)     |
| Sin sesión: la tarjeta arriba de Comunidades; con sesión no está                                                                               | `interests-sections.test.tsx`       |
| La columna derecha ya no la tiene                                                                                                              | `right-column.test.tsx`             |
| E2E: visitante ve la tarjeta a la izquierda (desktop) y en el panel (mobile), 360 px sin scroll, axe claro y oscuro; la derecha sin la tarjeta | `guest.spec.ts` (G-03 se actualiza) |

## 6. Ajustes de la implementación (2026-10-05)

- **Botones:** ícono y texto en línea, desde la izquierda, en 13 px (`type-action`). Con el ícono absoluto y el texto centrado, en los ~220 px de la tarjeta el ícono pisaba el texto. La tarjeta va sin margen lateral y con `px-3`.
- **Separador** de borde a borde entre la tarjeta y "Comunidades" (pedido del PO): `<hr>` con `-mx-3` en el panel mobile y `-mx-2` desde `md`.
- **`shrink-0`** en la tarjeta: en el panel mobile (columna flex de alto fijo) se encogía y quedaba cortada.
