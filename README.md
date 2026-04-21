# Bali Events - Plataforma de Venta de Entradas

Este es un proyecto de venta de entradas premium para eventos, construido con **React + Vite + Tailwind CSS** y **Supabase**.

## 🚀 Despliegue en Vercel

1.  **Exportar a GitHub**: Usa la opción "Export to GitHub" en AI Studio.
2.  **Importar en Vercel**: Ve a [vercel.com](https://vercel.com) e importa el repositorio.
3.  **Configurar Variables de Entorno**: En Vercel, agrega las siguientes variables (basadas en `.env.example`):
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `GEMINI_API_KEY` (Opcional, si usas funciones de IA)

## 🗄️ Configuración de Base de Datos (Supabase)

Para que el panel de administración funcione correctamente, debes ejecutar el script SQL que se encuentra en `supabase_schema.sql` dentro del **SQL Editor** de tu proyecto en Supabase.

Esto creará las siguientes tablas y políticas:
- `events`: Almacena la información de los eventos.
- `admin_users`: Gestiona el acceso al panel de administración.
- `settings`: Configuración de marca y métodos de pago (Yape/QR).

## 🛠️ Desarrollo Local

1.  Instalar dependencias:
    ```bash
    npm install
    ```
2.  Configurar archivo `.env`:
    Copia `.env.example` a `.env` y rellena con tus credenciales.
3.  Ejecutar servidor de desarrollo:
    ```bash
    npm run dev
    ```

---
*Desarrollado originalmente en Google AI Studio Build.*
