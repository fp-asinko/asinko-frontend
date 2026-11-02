# Fechas en la zona de quien mira — Requirements

> **Estado:** aprobado por el PO el 2026-11-02 ("dale"), con L1 a L4 como se recomendaron.
> **Fuente:** `specs/thesis-create` T-09. Contra `dev`, una tesis con fecha límite el 3 de noviembre (23:59 en UTC−3) se mostraba "Nov 4": el sitio formatea todas las fechas en UTC (`src/i18n/request.ts`). El PO eligió mostrar las fechas en la zona de quien mira en todo el sitio (opción 2), en lugar de cerrar las tesis a las 23:59 UTC.
> **Hoy:** el servidor y el navegador formatean en UTC, para que la hidratación no vea dos fechas distintas. Solo el calendario de un grupo (`specs/community-widgets` CW-06, `LocalTime`) pasa a la hora local, y recién en el navegador.

## Objetivo

Que toda fecha y hora absoluta del sitio se lea en la zona horaria de quien la mira, desde el servidor, sin saltos al cargar.

## Decisiones (2026-11-02)

| #   | Decisión                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1  | El navegador guarda su zona en una cookie (`asinko-tz`) y el servidor formatea con ella. Sin la cookie (la primera visita), la página se ve en UTC y se refresca sola una vez. Cuesta unos 0,3 KB de JS en todas las rutas. |
| L2  | Aplica a todas las fechas y horas absolutas del sitio. Las relativas ("hace 2 horas") no cambian.                                                                                                                           |
| L3  | Sin opción para elegir la zona a mano.                                                                                                                                                                                      |
| L4  | La fecha límite de una tesis sigue cerrando a las 23:59 de la zona de quien la escribe (`specs/thesis-create` Q4): quien la publica ve el día que eligió.                                                                   |

## Criterios de aceptación

- [x] **LT-01** (L1) Al cargar cualquier página, si la cookie `asinko-tz` no tiene la zona del navegador, se escribe (`path=/`, un año, `SameSite=Lax`, `Secure` con https) y la página se refresca una vez. Con la cookie al día, no se refresca.
- [x] **LT-02** (L1) El servidor valida la cookie (una zona IANA que `Intl` conoce, de hasta 64 caracteres) y formatea con ella; sin cookie o con una inválida, en UTC. El navegador recibe la misma zona: la hidratación no ve dos fechas distintas.
- [x] **LT-03** (L1) Una zona que el servidor rechaza no hace refrescar en bucle: se refresca solo cuando la cookie cambia.
- [x] **LT-04** (L2) Las fechas absolutas salen en la zona de quien mira: la fecha límite de una tesis, "miembro desde", logros, la actualización del precio de un activo, el calendario de un grupo y el resto que use `useFormatter`/`getFormatter`. El calendario (`LocalTime`) deja de pasar a la hora local por su cuenta y usa la zona configurada; un evento de todo el día sigue siendo una fecha, igual en todas partes.
- [x] **LT-05** (L4) Una tesis con fecha límite el día D, publicada desde una zona UTC−3, se muestra "D" a su autor.
- [x] **LT-06** El presupuesto de JS se respeta (`e2e/performance.spec.ts`).

## Fuera de alcance

- Elegir la zona a mano (L3).
- Fechas dentro de textos que escribe la gente.
