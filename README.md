## Inventory Manager Frontend

This Next.js (App Router + TypeScript + Tailwind) UI sits on top of the `InventoryManagerServer` backend. Every available REST/WebSocket endpoint from the backend is surfaced in the UI so managers and staff can manage authentication, users, stores, SKUs, inventory, and live alerts.

### Environment Variables

Create a `.env.local` file inside `inventory-manager-frontend/`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/api/ws
```

`NEXT_PUBLIC_WS_URL` is optional—if omitted, it is derived from `NEXT_PUBLIC_API_BASE_URL`.

### Scripts

```bash
npm install          # install dependencies
npm run dev          # start Next.js dev server on http://localhost:3000
npm run build        # production build
npm run start        # run the production build
npm run lint         # lint TypeScript + Tailwind files
npm test             # run tests in watch mode
npm run test:ui      # run tests with UI
npm run test:coverage # run tests with coverage report
```

### Feature Matrix (UI → Backend Endpoint)

| UI Area | Endpoint(s) |
| --- | --- |
| Sign-in | `POST /api/auth/login` |
| Profile page | `GET /api/profile`, `PUT /api/profile/password` |
| Dashboard metrics | `GET /api/manager/skus`, `GET /api/inventory`, `GET /api/manager/users` |
| Items list | `GET /api/manager/skus`, `GET /api/manager/skus/categories`, `DELETE /api/manager/skus/:id` |
| Item detail | `GET /api/manager/skus/:id`, `GET /api/inventory?sku_id=`, `POST /api/manager/inventory`, `PUT /api/manager/inventory/:id`, `DELETE /api/manager/inventory/:id`, `POST /api/inventory/:id/adjust` |
| Inventory explorer | `GET /api/inventory`, `GET /api/inventory/:id`, `POST /api/inventory/:id/adjust` |
| Alerts | `GET /api/inventory`, `POST /api/inventory/:id/adjust` |
| Audit log | `GET /api/inventory` |
| User admin | `GET/POST/PUT/DELETE /api/manager/users` |
| Store admin | `GET/POST/DELETE /api/manager/stores`, `GET/POST/DELETE /api/manager/stores/staff` |
| WebSocket banner | `GET /api/ws?token=...` (live inventory events) |

Staff accounts automatically respect backend authorization: staff can view inventory and adjust assigned stores only, while managers see the full suite of admin tools.

### Architecture Notes

- App Router with route groups: `/login` is public, `/dashboard/*` is protected.
- `AuthProvider` stores JWTs (localStorage for “remember me”, sessionStorage otherwise) and exposes the typed API client.
- `InventoryUpdatesProvider` opens the documented `ws://…/api/ws?token=` socket and surfaces connection status + last broadcast.
- Shared hooks and primitives live under `src/lib/` and `src/hooks/`.
- All forms are declarative client components calling the backend directly via fetch with the JWT bearer header.

### Testing Checklist

1. Start the backend (`docker compose up --build --wait` inside `InventoryManagerServer/`).
2. Run `npm run dev` from `inventory-manager-frontend/`.
3. Visit `http://localhost:3000`:
   - Login with `admin/adminadmin`.
   - Exercise dashboard metrics, items CRUD, user/store management, and inventory adjustments.
   - Observe low-stock alerts and the live WebSocket banner when inventory changes on another tab/instance.

The UI strictly mirrors backend capabilities—no extra mock features are rendered. If you extend the backend API, update the corresponding screen and the table above.

---

## Testing

This project uses **Vitest + React Testing Library** for unit testing.

### Running Tests

```bash
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage report
```

### Test Structure

Tests are located in `src/__tests__/` following the same structure as the source code:

```text
src/
  __tests__/
    lib/
      api-client.test.ts
    hooks/
      useApiQuery.test.ts
    context/
      auth-context.test.tsx
```

### Writing Tests

**Testing Utilities:**

- `@testing-library/react` - For rendering components and hooks
- `@testing-library/jest-dom` - For additional matchers
- `@testing-library/user-event` - For simulating user interactions
- `vitest` - Test runner and assertion library

**Example Test:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('MyComponent', () => {
  it('should render successfully', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

**Mocking:**

```typescript
// Mocking fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});

// Mocking modules
vi.mock('@/lib/api-client', () => ({
  loginRequest: vi.fn(),
}));
```

**Configuration:**

- `vitest.config.ts` - Vitest configuration with React plugin and path aliases
- `vitest.setup.ts` - Global test setup (mocks, environment variables)
