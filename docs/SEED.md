# Seed de contactos ficticios

Endpoint de un solo uso para poblar la tabla `contactos` con 100 registros ficticios realistas (clientes y leads argentinos con vehículos, ciudades, etiquetas, etc.).

Pensado para la demo del panel de F7 Automotriz: una vez lo corrés, queda bloqueado.

## 1) Setear `SEED_SECRET` en EasyPanel

1. Entrá al servicio `panelF7` en EasyPanel.
2. Abrí **Environment** (variables de entorno).
3. Agregá:

   ```
   SEED_SECRET=algo-largo-y-random
   ```

   Usá algo único y difícil de adivinar (ej. un UUID o una frase larga). Esta variable **no** es pública.

4. Guardá y hacé **Deploy** para que el contenedor tome el nuevo env.

## 2) Ejecutar el seed

Desde cualquier navegador, andá una vez a:

```
https://panelf7.teotec.org/api/seed/contactos?secret=EL_SECRET
```

Reemplazá `EL_SECRET` por el valor exacto que pusiste en `SEED_SECRET`.

Respuestas posibles:

- `{ "ok": true, "inserted": 100 }` — se insertaron los 100 contactos.
- `{ "ok": false, "message": "Ya hay contactos en la DB, seed cancelado" }` con status `409` — la tabla ya tenía datos, no se toca nada.
- `{ "error": "unauthorized" }` con status `401` — el `secret` no matchea.

## 3) Correrlo solo una vez

El endpoint chequea `COUNT(*) FROM contactos` antes de insertar. Si hay al menos un registro, aborta. Para correrlo de nuevo (dev/staging) tenés que truncar manualmente la tabla desde el SQL Editor de Supabase:

```sql
truncate public.contactos cascade;
```

> ⚠️ `cascade` borra también los `campana_contactos` que referencien esos contactos. No lo uses en prod con datos reales.
