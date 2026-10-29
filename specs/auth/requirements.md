# Login y registro — Requirements

> **Estado:** aprobado por el PO el 2026-10-29. Tarea **MVP-210** (sprint MVP-3), la primera del sprint: sin login no se puede probar contra la API real nada de lo que pide sesión (tesis, comentar, notificaciones, crear comunidad).
> **Decisiones del PO (2026-10-29):**
>
> - Registro con email **en un solo paso**: email, contraseña, username y la confirmación de edad y términos en el mismo formulario. Con Google, primero Google y después una pantalla para elegir el username y aceptar.
> - En el modal, **"Continuar con Google"** funciona y **Reddit** queda "Próximamente" (MVP-206). Se sacan Instagram y X.
> - **"Olvidé mi contraseña" queda afuera:** va en otra tarea.
> - **El botón "Dev login" se queda** como atajo de desarrollo (`specs/dev-login`).
>
> Viene de `specs/guest-experience`: el modal de cuenta y la página `/login` para los links directos (decisión del PO del 2026-10-05), y su base G-09 (`next`).
>
> **Fuente:** el backend (`asinko-app` dev, `9924924`), verificado en su código, y `HANDOFF-frontend.md` del 22/10:
>
> - La API acepta `Authorization: Bearer <access_token>` de Supabase Auth (P-002). Con Bearer ignora la cookie, y un token inválido es `401`.
> - La cuenta se crea en Supabase Auth (email y contraseña, o Google). La confirmación por email está **desactivada**: queda con sesión al instante. El dominio del front y sus previews ya están en las Redirect URLs de Supabase.
> - El perfil se crea con `POST /api/v1/users` `{ username, ageConfirmed: true, termsAccepted: true, countryCode?, language? }`. Errores: `422 INVALID_USERNAME` (3 a 30 letras, números o `_`), `409 USERNAME_TAKEN`, `422 TERMS_NOT_ACCEPTED`. Crea también el canal personal.
> - Con sesión pero sin perfil (por ejemplo, después de Google), `GET /users/{id}` responde `404`.
> - No hay un endpoint para saber si un username está libre: se sabe al crear el perfil.

## Objetivo

Que cualquiera pueda crear su cuenta o entrar a Asinko, con email o con Google, sin salir de lo que estaba mirando, y que desde ahí todo lo que pide sesión funcione contra la API real.

## User stories

1. Como **visitante**, quiero crear mi cuenta con email o con Google desde el mismo modal que me invita a participar, para votar, comentar o publicar sin perder la página.
2. Como **usuario con cuenta**, quiero entrar con mi email y contraseña o con Google, y seguir con sesión hasta que la cierre.
3. Como **usuario nuevo con Google**, quiero elegir mi username una sola vez, para que mi perfil y mi canal tengan mi nombre.
4. Como **usuario**, quiero cerrar sesión cuando quiera.

## Criterios de aceptación

### Entrar

- [x] **AU-01** Los botones "Log in" y "Create account" del modal de cuenta (`guest-experience`), de la barra superior y de la tarjeta "Join Asinko" **dejan de ser "Próximamente"** y abren el formulario correspondiente **dentro del modal**, sin cambiar de página. Se puede pasar de uno al otro ("¿No tenés cuenta? Creá una").
- [x] **AU-02** **Log in** pide email y contraseña. Con datos correctos, el modal se cierra y la misma página se ve con sesión: la campana, el perfil, la columna con sus intereses y la caja de publicar con su inicial.
- [x] **AU-03** **`/login`** (con su prefijo de idioma) muestra el mismo formulario como página, para los links directos y para cuando no hay JavaScript. Con `?next=` vuelve a esa ruta al entrar; sin él, al Home. `next` solo acepta rutas internas que empiezan con `/` y no con `//` (`security.md § 5`).
- [x] **AU-04** **Errores de log in**, en el formulario, sin el mensaje de Supabase:
  - email o contraseña incorrectos: un mensaje que no dice cuál de los dos falló;
  - demasiados intentos (`429`): que espere y pruebe de nuevo;
  - Supabase o el backend caídos: que pruebe en un rato.

### Crear la cuenta

- [x] **AU-05** **Create account** pide, en un solo paso: email, contraseña, username, y un checkbox "Tengo 18 años o más y acepto los Términos y la Privacidad", con sus links (Q1). El botón principal queda bloqueado hasta marcar el checkbox.
- [x] **AU-06** Antes de enviar, el formulario valida lo que se puede saber sin la red: email con formato válido, contraseña de 8 caracteres o más, username de 3 a 30 letras, números o `_`. Cada error va al lado de su campo.
- [x] **AU-07** Con datos válidos se crea la cuenta y el perfil, y se entra con sesión, como en AU-02.
- [x] **AU-08** **Errores del registro**, cada uno en su campo:
  - email ya registrado;
  - username tomado (`409 USERNAME_TAKEN`);
  - username inválido (`422 INVALID_USERNAME`).
- [x] **AU-09** Si la cuenta de Supabase se creó y el perfil no (por ejemplo, el username se ocupó en ese instante), la persona **no queda trabada**: entra con sesión y se le pide elegir otro username (AU-11).

### Google

- [x] **AU-10** **"Continuar con Google"** está en el modal y en `/login`, para entrar y para crear la cuenta. Al volver de Google, quien ya tiene perfil entra con sesión y vuelve a la página donde estaba.
- [x] **AU-11** **Elegir username:** con sesión pero sin perfil (Google por primera vez, o AU-09), se ve una pantalla para elegir el username y marcar edad y términos, con los mismos errores de AU-06 y AU-08. Hasta completarla:
  - la persona puede leer, pero toda acción que pide cuenta la lleva a esa pantalla;
  - puede cerrar sesión desde ahí.

  Al completarla, vuelve a donde estaba.

- [x] **AU-12** **Reddit** queda como botón "Próximamente" (MVP-206). Instagram y X se sacan del modal (G-13).

### Sesión

- [x] **AU-13** La sesión **dura hasta que se cierra**: se renueva sola mientras la persona use el sitio, sin pedirle que entre de nuevo cada hora. Si ya no se puede renovar (por ejemplo, la cuenta se borró), la persona vuelve a estar sin sesión sin ver errores, y la próxima acción abre el modal.
- [x] **AU-14** **Cerrar sesión** está en el menú **"⋯"** de la barra superior, junto al idioma y el tema: el perfil de la barra es un link a tu página, sin menú (`design.md § 8`). Cierra la sesión y deja la misma página sin sesión.
- [x] **AU-15** Toda llamada del servidor a la API lleva `Authorization: Bearer` mientras haya sesión. El `userId` de las escrituras sale de la sesión, nunca del navegador (`api-integration.md § userId explícito`).
- [x] **AU-16** **Seguridad** (`security.md § 3`):
  - los tokens viven en cookies `HttpOnly`, `SameSite=Lax` y `Secure` con https;
  - nunca llegan a `localStorage` ni al JavaScript del navegador;
  - el navegador no llama a la API.
- [x] **AU-17** Con `API_MOCKS=true` todo sigue como hoy (el usuario demo y la cookie de invitado). El "Dev login" convive con el login real fuera de producción.

### Calidad

- [x] **AU-18** Textos en en, es y pt. A 360 px sin scroll horizontal. Teclado y lector de pantalla:
  - cada campo tiene su label;
  - los errores se anuncian y quedan asociados a su campo;
  - al abrir un formulario, el foco va al primer campo.

  Axe sin violaciones en claro y oscuro.

- [x] **AU-19** Presupuesto de JS dentro de 240 KB en todas las rutas: el formulario se carga recién al abrirlo (`seo.md`).
- [x] **AU-20** En producción el sitio no arranca sin la configuración de Supabase (la URL y la clave pública), y nunca usa la `service_role`.

## Fuera de alcance

- **Olvidé mi contraseña** y cambiar el email o la contraseña: otra tarea.
- **Reddit** (MVP-206) y otros proveedores.
- El **onboarding** de intereses y sugerencias (MVP-152): empieza después de AU-07 y AU-11.
- **Repetir la acción** que abrió el modal (por ejemplo, el voto): al entrar se vuelve a la página, y la persona la repite.
- **Borrar la cuenta.**
- Las **páginas de Términos y Privacidad:** los links quedan como hoy hasta que exista el texto legal.

## Preguntas resueltas

- **Q1. Edad mínima: 18** (PO, 2026-10-29). El checkbox dice "Tengo 18 años o más y acepto los Términos y la Privacidad". El backend solo guarda que se confirmó (`ageConfirmed`): que la edad quede en sus Términos y en el contrato se le propone en **P-033**.
- **Q2. Contraseña de 8 caracteres o más** (PO, 2026-10-29). El front la exige (AU-06). Supabase acepta desde 6 por defecto: que lo exija también se le propone en **P-033**.
