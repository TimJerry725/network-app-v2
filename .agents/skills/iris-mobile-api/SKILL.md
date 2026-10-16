---
name: iris-mobile-api
description: Master API contract and integration guide for the Iris Mobile BFF API (mobile-openapi.json). Use when integrating live backend endpoints for stations, charging sessions, connectors, favorites, vehicles, profile, wallet, trip planning, and authentication. Strictly enforces using real API data instead of mock data.
risk: safe
source: internal
date_added: "2026-10-16"
---

# Iris Mobile BFF API Integration Skill

This skill governs all backend communication, data fetching, and state management for the Iris Network EV Mobile Application. It enforces real API consumption according to the official OpenAPI 3.0.3 specification located at `mobile-openapi.json`.

---

## 🚫 Primary Directive: No Mock Data

1. **Always connect to the real Iris Mobile BFF API.**
2. **Do not introduce, hardcode, or fall back to static mock arrays** (such as static station arrays, mock connectors, or placeholder session IDs) when building or modifying screens.
3. If an endpoint requires authentication or network headers, configure and send the appropriate headers via the centralized API client layer (`src/services/api/client.ts`).
4. If an endpoint is temporarily unreachable or offline, handle the error gracefully via defensive response unwrapping and error boundaries while keeping the real API client as the primary source of truth.

---

## 🌐 Server Environments & Base URLs

- **Development Base URL:**
  ```text
  https://4xx1pqey53.execute-api.ap-south-1.amazonaws.com/suite-network-dev
  ```
- **Forwarded Services (`/d2s`):**
  Paths starting with `/api/v1/d2s` are accepted by the BFF and forwarded directly to the network service.
- **Specification Source:**
  `mobile-openapi.json` at the project root.

---

## 🔑 Authentication & Headers

1. **Bearer Token:**
   All authenticated endpoints require an `Authorization` header containing a valid Cognito JWT:
   ```http
   Authorization: Bearer <token>
   ```
2. **Tenant Header & Parameter:**
   Multi-tenant discovery and configuration endpoints require a valid tenant UUID (`tenantid` or `tenantId`).
3. **Common Request Headers:**
   ```http
   Accept: application/json
   Content-Type: application/json
   ```

---

## 📦 Envelope Schema

All BFF responses use the unified `ApiResponse` envelope:

```typescript
export interface ApiResponse<T = any> {
    error: boolean;
    success?: boolean;
    code: number;
    message?: string;
    data: T;
}

export interface ErrorResponse {
    error: boolean;
    success?: boolean;
    code: number;
    message: string;
    details?: any;
}
```

---

## 🔌 API Endpoint Directory

### 1. Station Discovery (`Station discovery`)
- `GET /api/v1/discover-stations/open_list`
  - Public search for stations by coordinates (`device_lat`, `device_long`, `tenantid`, `search`, `connector_type`, `station_type`, `is_expand`).
- `GET /api/v1/discover-stations/open_list_withfilter`
  - Search public stations within map viewport bounds (`bound_lat_and_long`).
- `GET /api/v1/discover-stations/{stationId}`
  - Full station details for signed-in customer (`stationId`, `device_lat`, `device_long`, `tenantid`, `is_expand`).
- `GET /api/v1/discover-stations/open_single/{stationId}`
  - Public station details without authentication.
- `GET /api/v1/discover-stations/details/{stationId}`
  - Compact station map details.
- `GET /api/v1/discover-stations/get_single/chargepoint/{chargePointId}`
  - Resolve station and connector information directly from a Charge Point ID (CPID).
- `GET /api/v1/discover-stations/tariff_details/{stationId}`
  - Current pricing tariffs and peak/off-peak rates.

### 2. Charging Points & Hardware (`Charging`)
- `GET /api/v1/charging-points/{chargePointId}/{connectorId}/details`
  - Live dispenser and connector hardware status, power, tariff, and readiness prior to session initiation.
- `POST /api/v1/charging-sessions`
  - Start a live charging session.
  - Body:
    ```json
    {
      "charge_point_id": "CP1233",
      "connector_id": 1,
      "vehicle_details": { "id": "...", "number": "..." },
      "user_id": "usr_...",
      "source": "Mobile",
      "evse_uid": "...",
      "location_id": "..."
    }
    ```
- `GET /api/v1/charging-sessions/{sessionId}`
  - Live telemetry for an active charging session (SOC %, kWh delivered, current kW, voltage, elapsed time, cost).
- `POST /api/v1/charging-sessions/stop/{sessionId}`
  - Stop an active charging session (`closed_by: "Mobile"`, `is_ocpi_session: false`).
- `GET /api/v1/charging-sessions/customer_active_sessions/{userId}`
  - Fetch currently active sessions for the customer.
- `GET /api/v1/charging-history`
  - List past completed charging sessions and invoices.

### 3. Favourites (`Favourites`)
- `GET /api/v1/favorite-stations`
  - List customer's saved favourite stations.
- `POST /api/v1/favorite-stations`
  - Add station to favourites (`{ "stationid": "..." }`).
- `DELETE /api/v1/d2s/favorite-stations/{stationId}`
  - Remove station from favourites.

### 4. Vehicles (`Vehicles`)
- `GET /api/v1/d2s/vehicles`
  - List customer's registered electric vehicles.
- `POST /api/v1/d2s/vehicles`
  - Add an EV (`nickname`, `manufacturer`, `model`, `number`, `connectortype`, `power`, `range`, `is_default`).
- `GET /api/v1/d2s/vehicles/vehicledetails`
  - Master database of supported EV makes, models, and battery capacities.
- `PATCH /api/v1/d2s/vehicles/{vehicleId}`
  - Update vehicle registration or default status.
- `DELETE /api/v1/d2s/vehicles/{vehicleId}`
  - Remove a vehicle.

### 5. Profile & Settings (`Profile`)
- `GET /api/v1/users/profile`
  - Get full authenticated customer profile.
- `PATCH /api/v1/users/{userId}`
  - Update profile details (name, email, preferences).
- `GET /api/v1/d2s/idtag`
  - Customer's active RFID cards and Auto-Charge VIDs.

### 6. Wallet & Billing (`Wallet`)
- `GET /api/v1/wallet/transactions`
  - Paginated wallet ledger and payment transactions.
- `POST /api/v1/wallet/top-up`
  - Create a Razorpay / Paytm wallet recharge order.

### 7. Trip Planner (`Trip planner`)
- `POST /api/v1/trip-planner/getAllChargers`
  - Discover compatible charging stations along a Google Maps encoded polyline.
  - Body: `{ "encodedPolyline": "..." }`
- `POST /api/v1/trip-planner/getChargeStationsPlanOla`
  - Multi-stop EV route planner calculating battery SOC, charge duration, and elevation impact.
- `GET /api/v1/d2s/savedTrips`
  - Fetch customer's saved and recent journeys.

### 8. Authentication (`Authentication`)
- `POST /api/v1/auth/otp`
  - Send login OTP to E.164 phone (`{ "phone": "+919876543210", "tenantid": "..." }`).
- `POST /api/v1/auth/otp/verify`
  - Verify OTP and receive JWT session (`phone`, `otp`, `deviceType`, `deviceToken`, `tenantId`).
- `POST /api/v1/auth/signup`
  - New customer registration.

---

## 🏗️ Architecture in Codebase

All API logic must be routed through the dedicated modular service structure:

```text
src/services/api/
├── config.ts              # Base URL, tenant IDs, token store
├── types.ts               # OpenAPI request/response types & normalization
├── client.ts              # Core fetch client with automatic headers & error handling
├── stationService.ts      # Discover stations, CPID lookup, connector & tariff details
├── chargingService.ts     # Session start, live telemetry polling, stop session
├── favoritesService.ts    # Live favorites list, add, remove
├── vehicleService.ts      # Vehicles list, add, delete, model masters
├── profileService.ts      # Customer profile & account details
├── walletService.ts       # Transactions, top-up
├── tripPlannerService.ts  # Polyline chargers, route plans, saved trips
├── authService.ts         # Phone OTP, verify, registration
└── index.ts               # Unified export barrel
```

---

## 🛠️ Data Normalization Guidelines

Because the mobile UI expects clean frontend models (`Station`, `Connector`, `Vehicle`), service adapters convert raw BFF DTOs into application interfaces:

1. **Station Normalization:**
   - Map `station_id` / `id` -> `id`
   - Map `station_name` / `name` -> `name`
   - Map `lat` / `latitude` -> `latitude` (as number)
   - Map `long` / `longitude` -> `longitude` (as number)
   - Map `charge_points` / `connectors` -> clean `Connector[]` array with standard types (`CCS2`, `Type 2`, `CHAdeMO`, `GB/T`).
2. **CPID Normalization:**
   - Strip leading/trailing whitespaces, sanitize case for charge point lookups (`CP1233` -> `CP1233`).
3. **Session Telemetry:**
   - Ensure `current_soc`, `energy_delivered_kwh`, `charging_rate_kw`, `duration_seconds`, and `cost` are cleanly typed and fallback to zero instead of `NaN`.
