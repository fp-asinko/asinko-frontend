# Tasks: flujo de "Editar perfil"

- [x] **T-01 (M)** Imágenes que se guardan al aplicar o quitar.
  - `onApply` asíncrono en `ImageCropper`, con su error.
  - El diálogo guarda la imagen con `updateProfile`, la guarda en su propio estado (fuera del formulario) y anuncia.
  - Remove con confirmación.
  - Tests: EF-02, EF-03, EF-04, EF-05.
- [x] **T-02 (S)** Botones de cámara con menú en `ProfileImages`, y el foco desde los avisos. Tests: EF-01, EF-10.
- [x] **T-03 (S)** Cabecera con ×, pie fijo con Cancel y Save, y Save atenuado sin cambios. Tests: EF-06, EF-07, EF-08.
- [x] **T-04 (S)** Tres secciones con título. Mensajes en en/es/pt. Tests: EF-09, EF-11 (claves).
- [x] **T-05 (S)** e2e: foto sin Save, pie a 360 px, axe con el menú. ui-reviewer. Notas de cambio en `specs/profile-presentation` (PP-07, PP-08). Tests: EF-02, EF-06, EF-11.
- [x] **T-06 (S)** Dos columnas desde `md`, ventana de 880 px y fondo sin difuminado. Tests: EF-09 (e2e sin scroll), EF-12.

Depende: T-02 antes de T-01 (Remove sale del menú). T-03 y T-04 son independientes.
