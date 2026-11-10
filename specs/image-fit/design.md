# Imágenes enteras en las tarjetas — Design

## 1. Dos capas en el mismo recuadro

```tsx
<div className="relative aspect-video overflow-hidden rounded-lg border bg-surface">
  {/* Fondo: la misma imagen, llena el recuadro, ampliada y desenfocada (IF-02) */}
  <PostImage
    src={url}
    alt=""
    aria-hidden
    fill
    sizes={SIZES}
    className="scale-110 object-cover blur-2xl brightness-90"
  />
  {/* Imagen: entera, encima (IF-01) */}
  <PostImage src={url} alt={alt} fill sizes={SIZES} priority={detail} className="object-contain" />
</div>
```

- **Mismo archivo (IF-04):** las dos capas usan el mismo `src`, `sizes` y `unoptimized`, así `next/image` arma el mismo `srcset` y el navegador baja un solo archivo. El fondo no lleva `priority` (la imagen sí, en el detalle).
- **`scale-110`:** el desenfoque aclara los bordes; ampliando un poco el fondo, los bordes quedan fuera del recuadro (`overflow-hidden`).
- **`brightness-90`:** separa apenas la imagen de su fondo, como Reddit. Es un filtro sobre la propia imagen, no un color nuevo: no hace falta token.
- **Accesibilidad (IF-05):** el fondo va con `alt=""` y `aria-hidden`.
- **CLS (IF-03):** el recuadro no cambia (`aspect-video`).
- **Movimiento (IF-06):** con `fadeImage`, las dos capas son `FadeImage` y entran con el mismo fundido.
- **Rendimiento:** `blur` en un elemento que no se anima se pinta una vez. Sin JS nuevo (IF-07).

## 2. Dónde

Solo `post-card.tsx` (feed, detalle y perfiles usan la misma tarjeta). Las dos capas se extraen a una molécula `BlurFillImage` en `src/components/molecules/` si otra pieza la necesita (regla de tres); por ahora viven en la tarjeta.

## 3. Tests

- **Unitario (`post-card.test.tsx`):** con imagen, hay una sola imagen con nombre accesible y su `alt`; el fondo es decorativo; las dos tienen el mismo `src`.
- **e2e:** los de feed y detalle con imagen siguen pasando; axe en claro y oscuro; presupuesto de JS.

## 4. Al cerrar (2026-11-10)

- **Revisado por el PO** en el navegador con los posts reales del dev (capturas verticales y gráficos).
- **e2e:** Home, imagen, detalle, accesibilidad y presupuesto de JS en verde, en mobile y desktop.
- **Pendiente:** los mocks son todas imágenes 16:9, así que el e2e no ve el fondo desenfocado. Si hace falta cubrirlo, se suma una imagen vertical a los fixtures. `priority` está deprecado en Next 16 (`preload`): va aparte.
