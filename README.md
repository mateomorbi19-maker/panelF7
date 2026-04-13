# Panel F7 Automotriz

CRM interno para F7-Automotriz: gestión de conversaciones del bot de WhatsApp y administración de precios.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **Supabase** (Auth + Postgres) — consume `conversation_log`, `fundas_a_medida`, `termoformadas`, `fundas_tipo_tapizado`
- **Chatwoot API** — para agregar/quitar labels (incluye toggle del bot por conversación)
- **n8n webhook proxy** para servir imágenes/videos desde Google Drive
- **Docker** para deploy en EasyPanel

## Secciones

- **Login** (email + password via Supabase Auth)
- **Conversaciones**: lista agrupada por teléfono, filtro por label (butacas, turno, combo, cuotas, venta, bot_disabled), búsqueda
- **Conversación detalle**: vista tipo WhatsApp con todos los mensajes (texto + imágenes + videos) en orden cronológico, toggle "apagar agente" (agrega/quita label `bot_disabled` en Chatwoot)
- **Precios**: tabs por producto (fundas a medida, alfombras termoformadas, tipo tapizado), CRUD completo

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con las credenciales reales (ver sección Variables)
npm run dev
```

Abrir http://localhost:3000

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (SOLO servidor) |
| `CHATWOOT_API_URL` | Ej: `https://chatwoot.teotec.org/api/v1/accounts/1` |
| `CHATWOOT_API_TOKEN` | Token de API de Chatwoot |
| `NEXT_PUBLIC_N8N_MEDIA_PROXY_URL` | URL del webhook n8n `f7-media` |

## Crear usuarios en Supabase Auth

Usando el Dashboard de Supabase → Authentication → Users → Invite:

| Usuario | Email | Contraseña inicial |
|---------|-------|-------------------|
| Mateo | `mateo@f7-automotriz.com` | `G9VgMnuiuyE9kN5F` |
| Alan | `alan@f7-automotriz.com` | `$wCm*2Te7r28#Wd2` |
| Melanie | `melanie@f7-automotriz.com` | `RZRBJVms3YL8HvCe` |

> Los usuarios pueden cambiar la contraseña después desde la UI de Supabase o resetearla vía email.

## Deploy en EasyPanel (VPS)

1. **Crear repositorio privado en GitHub** (ej: `f7-crm`) y subir este código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: F7 CRM MVP"
   git branch -M main
   git remote add origin git@github.com:TU_USUARIO/f7-crm.git
   git push -u origin main
   ```

2. **En EasyPanel:**
   - Crear un nuevo servicio tipo **App**
   - Source: **GitHub** (conectar tu repo privado)
   - Build type: **Dockerfile** (EasyPanel detecta el `Dockerfile` automáticamente)
   - Puerto: `3000`
   - **Environment variables**: copiar desde `.env.example` y poner los valores reales
   - **Dominio**: `panelf7.teotec.org` → agregar en EasyPanel → Domains
   - **Deploy**

3. **DNS** (en tu proveedor de dominio):
   - Registro **A** para `panelf7.teotec.org` apuntando a la IP del VPS.

4. **Verificar** en `https://panelf7.teotec.org`. Iniciar sesión con uno de los usuarios.

## Estructura del proyecto

```
src/
├── app/
│   ├── login/              # Página de login
│   ├── (dashboard)/
│   │   ├── layout.tsx      # Sidebar + protected layout
│   │   ├── conversaciones/
│   │   │   ├── page.tsx    # Lista con filtros
│   │   │   └── [telefono]/page.tsx  # Vista detalle WhatsApp-style
│   │   └── precios/page.tsx
│   ├── api/
│   │   ├── chatwoot/label/route.ts  # Toggle label (bot_disabled, etc.)
│   │   └── precios/route.ts         # CRUD precios
│   ├── layout.tsx
│   └── page.tsx            # redirect a /conversaciones
├── components/
│   ├── Sidebar.tsx
│   ├── ConversationFilter.tsx
│   ├── MessageBubble.tsx
│   ├── BotToggle.tsx
│   └── PriceTable.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server components + admin client
│   │   └── middleware.ts   # Auth session refresh
│   └── chatwoot.ts         # Chatwoot API helpers
├── types/database.ts
└── middleware.ts            # Auth guard
```

## Datos que lee la app

- **`conversation_log`** (Supabase): todos los mensajes (entrantes y salientes) loggeados por los workflows de n8n. Agrupados por `telefono`.
- **Chatwoot API**: labels actuales de cada conversación (para filtro y toggle del bot).
- **`fundas_a_medida`, `termoformadas`, `fundas_tipo_tapizado`** (Supabase): tablas de precios CRUD.

## Media (imágenes y videos)

El CRM usa el webhook `f7-media` en n8n como proxy. El flujo:

1. Herramienta fotos guarda en `conversation_log.media_url` el **Drive file ID**.
2. El frontend construye la URL: `${NEXT_PUBLIC_N8N_MEDIA_PROXY_URL}?id={drive_file_id}`
3. El webhook en n8n baja el archivo desde Google Drive y lo sirve como binary.

## Toggle del agente por conversación

- Click en "🟢 Bot activo — Pausar" → agrega label `bot_disabled` a la conversación en Chatwoot
- Memory Manager F7 v3 verifica los labels antes de procesar y deja de responder cuando `bot_disabled` está presente
- Click en "🔴 Bot pausado — Reactivar" → quita el label y el bot vuelve a responder

## Limitaciones conocidas (MVP)

- No hay historial de cambios de precios (por ahora no se requería)
- Lista de conversaciones carga hasta 2000 mensajes recientes y agrupa en memoria (ok para volumen actual, si crece mucho conviene crear una función SQL `get_conversation_summaries`)
- Labels se leen on-demand por conversación (una llamada a Chatwoot por fila). Si la lista crece, cachear.

## Próximos pasos sugeridos

- Vista de analytics (conversaciones por día, % handoff, conversión)
- Exportar conversaciones a PDF/CSV
- Notificaciones en tiempo real cuando hay handoff nuevo
- Historial de cambios de precios (auditoría)
