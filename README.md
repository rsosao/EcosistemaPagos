# Ecosistema de Pagos Interconectados

Proyecto Final de **Programación III** (UMG) — emula un ecosistema financiero donde un Banco y tres Empresas de Servicio (Universidad, Telefonía e Internet, Energía Eléctrica) coexisten como sistemas independientes que se comunican exclusivamente vía **APIs HTTP/JSON**.

> Cada API es una **"isla"**: tiene su propia base de datos y nunca lee tablas de otra. Toda interacción es por HTTP.

## Microservicios

| Proyecto | API (puerto) | UI dev (puerto Vite) | Base de datos | Empresa | Identificador | Color UI |
|---|---|---|---|---|---|---|
| `src/BancoApi` + `src/BancoApi.Web` | 5001 | 5170 | `banco_db` | Banco | DPI | azul |
| `src/UniversidadApi` + `src/UniversidadApi.Web` | 5002 | 5171 | `uni_db` | Universidad | Carné | emerald |
| `src/TelefoniaApi` + `src/TelefoniaApi.Web` | 5003 | 5172 | `tel_db` | Telefonía e Internet | Número telefónico | violet |
| `src/EnergiaApi` + `src/EnergiaApi.Web` | 5004 | 5173 | `ee_db` | Energía Eléctrica | Número de contador | amber |

Cada API expone:
- **`/`** — SPA React (UI completa)
- **`/scalar/v1`** — Documentación interactiva (Scalar)
- Resto de rutas → endpoints HTTP/JSON

## Stack

### Backend (4 APIs)
- **.NET 10** SDK (10.0.103) — ASP.NET Core Minimal API
- **EF Core** + **Pomelo.EntityFrameworkCore.MySql 9.0.0**
- **MySQL 8** (local o **Azure Database for MySQL Flexible Server**)
- **Scalar.AspNetCore 2.14.x** (documentación interactiva)

### Frontend (4 SPAs)
- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS v4** (vía `@tailwindcss/vite`)
- **shadcn/ui** sobre Radix UI (componentes accesibles)
- **lucide-react** (iconos) + **sonner** (toasts) + **next-themes** (dark/light)

### Despliegue
- **Azure App Service** — 4 Web Apps en 1 plan B1 Basic
- Cada Web App sirve API + SPA en el mismo dominio (sin CORS)

## Ejecución local

Guía completa paso a paso: **[`docs/desarrollo-local.md`](docs/desarrollo-local.md)** (MySQL, dos modos de arranque, seed, flujos de prueba y solución de problemas).

Resumen rápido:

1. Requisitos: .NET 10, Node.js 20+, MySQL 8 en `localhost:3306` (por defecto `root` / `root`).
2. **Modo A** — `npm run build` en cada `*.Web/`, luego `dotnet run` en las 4 APIs (`5001`–`5004`); UI en el mismo puerto.
3. **Modo B** — 4× `dotnet run` + 4× `npm run dev` (`5170`–`5173`); hot-reload vía proxy Vite.
4. Seed: `curl -X POST http://localhost:500X/seed` en cada API.

## Documentación adicional

- [`plan/PLAN.md`](plan/PLAN.md) — Especificación completa del sistema (modelos, endpoints, flujos).
- [`plan/Enunciado.md`](plan/Enunciado.md) — Enunciado original del proyecto.
- [`plan/UMG-PrograII-ProyectoFinal.pdf`](plan/UMG-PrograII-ProyectoFinal.pdf) — Documento fuente del curso (PDF).
- [`docs/desarrollo-local.md`](docs/desarrollo-local.md) — Guía paso a paso para ejecución local (MySQL, APIs, SPAs, demo).
- [`docs/contratos-api.md`](docs/contratos-api.md) — Contratos JSON de comunicación entre servicios.
- [`docs/despliegue-azure.md`](docs/despliegue-azure.md) — Guía paso a paso para desplegar en Azure App Service + Azure Database for MySQL.

## Compilar todo

```bash
# Frontends (genera wwwroot/ en cada API)
for app in BancoApi UniversidadApi TelefoniaApi EnergiaApi; do
  (cd src/$app.Web && npm install && npm run build)
done

# Backends
dotnet build ProyectoFinal.slnx
```

## Estructura del repositorio

```
ProyectoFinal/
├── src/
│   ├── BancoApi/                Microservicio del banco (ASP.NET)
│   ├── BancoApi.Web/            SPA React del banco (Vite)
│   ├── UniversidadApi/
│   ├── UniversidadApi.Web/
│   ├── TelefoniaApi/
│   ├── TelefoniaApi.Web/
│   ├── EnergiaApi/
│   └── EnergiaApi.Web/
├── docs/
│   ├── desarrollo-local.md
│   ├── contratos-api.md
│   └── despliegue-azure.md
├── plan/
│   ├── PLAN.md
│   ├── Enunciado.md
│   └── UMG-PrograII-ProyectoFinal.pdf
├── ProyectoFinal.slnx
└── README.md
```

Cada `*.Web/` builda hacia `../*/wwwroot/` (gitignored). La API sirve la SPA con `UseStaticFiles + MapFallbackToFile("index.html")`.

## Reglas de negocio clave

- **Comisión obligatoria 95% / 5%**: en cada pago de servicio, el banco acredita el 95% a la cuenta transitoria de la empresa y retiene el 5% en la cuenta de comisiones del banco.
- **Cuenta transitoria**: cada empresa tiene una cuenta en el banco donde recibe sus pagos. La empresa puede consultar su saldo vía `GET /tesoreria/saldo-banco`.
- **No compartir BD**: toda comunicación entre sistemas es estrictamente HTTP/JSON.
- **Retiro en cajero**: Q5 adicionales de comisión si la red ≠ Red 5B.
