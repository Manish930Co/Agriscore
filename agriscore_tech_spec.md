# AgriScore In-Depth Technical Specification

AgriScore is a real-time digital agricultural credit-scoring and loan underwriting platform connecting farmers and agricultural lenders. The system combines agronomic, soil, geofencing, and banking metrics to construct an automated agricultural credit score (AgriScore) while facilitating instantaneous loan application workflows.

---

## 1. System Overview & Architecture

The application is built on a split mobile-client and backend-server pattern:

```mermaid
graph TD
    subgraph Mobile Client (React Native + Expo SDK 54)
        UI[Screens & Components]
        Native[Expo Camera / Image Picker]
        State[Zustand Stores]
        WS_Client[WebSocket Service]
        API_Client[API Client]
    end

    subgraph Backend Server (FastAPI + Python)
        API_Route[REST API Endpoints]
        WS_Route[WebSocket Endpoints]
        CM[Connection Manager]
        MemDB[In-Memory Mock DB]
        Uploads[Static Uploads Folder]
    end

    subgraph Messaging Broker
        Redis[Redis Pub/Sub / MockRedis]
    end

    UI --> State
    UI --> Native
    State --> API_Client
    State --> WS_Client
    
    API_Client -- HTTP GET/POST/PUT --> API_Route
    WS_Client -- WS Conn / Messages --> WS_Route
    
    API_Route --> MemDB
    API_Route -- File Write --> Uploads
    API_Route -- Publish Event --> Redis
    
    WS_Route --> CM
    Redis -- Subscribe / Listen --> WS_Route
    CM -- Push Event --> UI
```

### Key Architectural Concepts
1. **Real-time Event Synchronization**: Changes in farmer profiles, KYC onboarding, and loan approvals are broadcast via standard REST requests to the FastAPI backend, which publishes messages onto a Redis Pub/Sub layer. A background listener task on FastAPI intercepts these messages and pushes them to active WebSocket connections managed by a `ConnectionManager`.
2. **Offline-first Hybrid Client**: The React Native application communicates with HTTP and WebSocket interfaces. In the event of backend network loss, the client falls back seamlessly to local mock storage synchronization to prevent UI crashes in rural network conditions.
3. **Optimized Multi-part Forms**: To verify crop fields, farmers can snap a photo via their device's native camera. The app compresses the image and transmits it as binary data in a multipart form request alongside form fields, allowing the backend to write the image file locally and serve it as static content.

---

## 2. Directory and File Tree

Below is the complete file structure of the AgriScore codebase, illustrating the division between the React Native frontend (`src/` and root configuration files) and the Python FastAPI backend (`backend/`):

```text
c:\agriscore\
├── App.tsx                     # Core Application Entry Point
├── app.json                    # Expo SDK 54 Configuration File
├── babel.config.js             # Babel Compiler Presets and NativeWind configuration
├── metro.config.js             # Metro Bundler NativeWind Bridge Configuration
├── package.json                # Pinned Node Package Dependencies
├── tailwind.config.js          # Tailwind CSS Theme & Styling Config
├── global.css                  # Core NativeWind global stylesheet imports
├── nativewind-env.d.ts         # TypeScript environment bindings for Tailwind classes
├── tsconfig.json               # TypeScript Compiler configuration
├── uploads/                    # Local storage directory for uploaded crop images
└── src/                        # Frontend Application Source Code
    ├── components/
    │   └── CreditScoreGauge.tsx # Custom Animated circular Credit Score SVG Gauge
    ├── hooks/
    │   └── useWebSockets.ts    # React Hook managing socket connection and store bindings
    ├── models/
    │   ├── models.py           # SQLAlchemy Data Models (Backend Reference Schema)
    │   └── schema.prisma       # Prisma Database Schema (Object-Relational Reference)
    ├── navigation/
    │   └── RootNavigator.tsx   # Navigation container controlling stacks & bottom tabs
    ├── screens/
    │   ├── admin/
    │   │   ├── AdminDashboard.tsx         # KPI analytics and stats overview screen
    │   │   └── VerificationPipelineScreen.tsx # Audit interface for reviewing KYC and loan offers
    │   ├── auth/
    │   │   ├── LoginScreen.tsx    # Auth input screen (lender and farmer entry)
    │   │   ├── RegisterScreen.tsx # New user registration screen
    │   │   └── SplashScreen.tsx   # Initial branding and session checks
    │   └── farmer/
    │       ├── AgriScoreReportScreen.tsx # Dynamic breakdowns of computed credit factors
    │       ├── CropUploadScreen.tsx      # Upload crop image log with AI-diagnosed diseases
    │       ├── FarmerDashboard.tsx       # Quick stats, current score and loan summaries
    │       ├── KYCOnboardingScreen.tsx   # 4-Step multi-step wizard for farmer profiles
    │       └── LoanMarketplaceScreen.tsx # View available loan products and application list
    ├── services/
    │   ├── api.ts              # Core API interface for HTTP requests and mock seed database
    │   ├── firebase.ts         # Mock authentication layer representing Firebase user state
    │   └── websocket.ts        # Singleton WebSocket manager with exponential backoff
    ├── store/
    │   ├── useAuthStore.ts     # Zustand Store managing session and user roles
    │   ├── useFarmerStore.ts   # Zustand Store managing KYC forms, diagnostics, and credit score
    │   ├── useLoanStore.ts     # Zustand Store managing loan requests, stats, and real-time syncing
    │   └── useOnboardingStore.ts # Zustand Store holding intermediate crop verification media URIs
    └── theme/
        └── colors.ts           # Hex color configuration mappings
```

---

## 3. Data Models and Database Schema

Database structures are defined via Prisma schema declarations (for object-relational mapping) and SQL-Alchemy structures on the backend. The core entities and relationships are:

### Database Diagram (Prisma Syntax)

#### Enums
- `Role`: `FARMER`, `ADMIN`
- `OwnershipType`: `OWNED`, `LEASED`, `SHARED`
- `KYCStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `LoanStatus`: `PENDING`, `OFFERED`, `APPROVED`, `REJECTED`, `DISBURSED`
- `Severity`: `LOW`, `MEDIUM`, `HIGH`

#### 1. User Model
Represents authorization credentials.
- `id` (String, PK): UUID.
- `email` (String, Unique): User's login address.
- `passwordHash` (String): Secure password representation.
- `role` (Role): Defaults to `FARMER`.
- `createdAt` / `updatedAt` (DateTime).
- Relationship: Has-One `Farmer` (`onDelete: Cascade`).

#### 2. Farmer Model
Main profile details of the farmer.
- `id` (String, PK): UUID.
- `userId` (String, Unique, FK): Maps to `User.id`.
- `fullName` (String): Onboarded legal name.
- `mobile` (String): 10-digit mobile number.
- `dob` (DateTime): Date of birth.
- `gender` / `address` / `village` / `district` / `state` (String).
- `gpsLat` / `gpsLon` (Float, Nullable): Geo-coordinates of crop land.
- `kycIdType` (String): E.g., "Aadhaar Card", "PAN Card".
- `kycIdNumber` (String, Unique): ID number.
- `kycStatus` (KYCStatus): Defaults to `PENDING`.
- Relationships:
  - Has-One `FarmDetails`.
  - Has-Many `CropImage`.
  - Has-Many `CreditScore`.
  - Has-Many `LoanApplication`.

#### 3. FarmDetails Model
Agricultural parameters mapping to crop lands.
- `id` (String, PK).
- `farmerId` (String, Unique, FK): Maps to `Farmer.id`.
- `sizeAcres` (Float): Area of land.
- `ownershipType` (OwnershipType).
- `cropType` (String): Primary crop (e.g. "Basmati Rice").
- `sowingDate` / `harvestDate` (DateTime).
- `soilType` (String): E.g. "Alluvial Soil", "Clayey".
- `irrigationType` (String): E.g. "Drip", "Tubewell".

#### 4. CropImage Model
ML diagnostic data logged from field crop pictures.
- `id` (String, PK).
- `farmerId` (String, FK): Maps to `Farmer.id`.
- `imageUrl` (String): Location URL on static filesystem.
- `diseaseDetected` (String): Plant disease name.
- `confidenceScore` (Float): AI diagnostic certainty.
- `severity` (Severity).
- `treatmentRecommendation` (String): Prescribed spray/treatment.

#### 5. CreditScore Model
Computed credit score details.
- `id` (String, PK).
- `farmerId` (String, FK): Maps to `Farmer.id`.
- `score` (Int): Calculated score from `0` to `100`.
- `grade` (String): A+ through D.
- `riskRating` (String): "LOW", "MEDIUM", "HIGH".
- `cropHealthScore` / `yieldStabilityScore` / `climateRiskScore` / `farmingPracticeScore` / `financialCapabilityScore` / `trustVerificationScore` (Float): Weighted parameters.

#### 6. LoanApplication Model
Credit applications submitted by the farmer.
- `id` (String, PK).
- `farmerId` (String, FK): Maps to `Farmer.id`.
- `amount` (Float): Requested loan amount.
- `tenureMonths` (Int): Number of repayment months.
- `interestRate` (Float): Annual percentage rate.
- `status` (LoanStatus): Defaults to `PENDING`.
- `emi` (Float): Calculated monthly installment.
- `bankName` (String): Target lender.
- `offeredInterestRate` / `offeredTenureMonths` (Float/Int, Nullable): Lender adjusted terms.
- `adminRemarks` (String, Nullable).

---

## 4. REST API Endpoints Details

All HTTP REST endpoints are exposed by FastAPI under `http://<ip>:8000`. 

| Method | Path | Authentication / Parameters | Request Payload | Response (200 OK) | Triggered Web Socket Broadcast |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | None | None | `{"message": "..."}` | None |
| **POST** | `/api/loans/apply` | None | `LoanApplicationSchema` (JSON) | `{"status": "success", "data": LoanApplicationData}` | `LOAN_SUBMITTED` |
| **POST** | `/api/loans/update` | None | `LoanStatusUpdateSchema` (JSON) | `{"status": "success", "data": LoanApplicationData}` | `LOAN_STATUS_UPDATED` |
| **PUT/PATCH** | `/api/farmer/profile` | None | `KYCFlowData` (JSON) | `{"status": "success", "data": KYCFlowData}` | `FARMER_PROFILE_UPDATED` |
| **POST** | `/api/farmer/profile-multipart` | Multipart Form Parameters | Form Data including `cropFieldImage` (File) | `{"status": "success", "data": KYCFlowData}` | `FARMER_PROFILE_UPDATED` |
| **PUT/PATCH** | `/api/farmer/farm-details` | None | `KYCFlowData` (JSON fields) | `{"status": "success", "data": KYCFlowData}` | `FARMER_PROFILE_UPDATED` |
| **GET** | `/api/loans` | None | None | `{"status": "success", "data": LoanApplicationData[]}` | None |
| **GET** | `/api/loans/farmer/{farmer_id}` | `farmer_id` (Path String) | None | `{"status": "success", "data": LoanApplicationData[]}` | None |
| **GET** | `/api/farmer/profile/{farmer_id}` | `farmer_id` (Path String) | None | `{"status": "success", "data": KYCFlowData}` | None |

### Multipart Parsing Logic (`/api/farmer/profile-multipart`)
Because React Native sends multipart parameters as strings (e.g. `bankAccountNumber: "987654321098"`, `gpsLat: "29.6857"`), the backend automatically casts numeric-only string inputs:
- Boolean inputs ("true"/"false") are parsed as native Python `True`/`False`.
- Decimals containing a period are parsed as `float` variables.
- Pure digit strings are parsed as `int` values.
  > [!IMPORTANT]
  > Since numeric account numbers (e.g. `bankAccountNumber`) are parsed into integers on the backend, the React Native client forces string conversion (`String(data.bankAccountNumber)`) prior to running `.slice()` or `.startsWith()` to prevent frontend application crashes.
- File uploads: The `cropFieldImage` binary payload is captured, written to `./uploads/` with a unique timestamp-appended name (`crop_field_{farmer_id}_{timestamp}_{original_name}`), and its static serving URL `/static/uploads/{filename}` is merged into the farmer's database profile.

---

## 5. WebSockets Real-Time Sync Protocol

AgriScore relies on a WebSocket bus to keep bankers and farmers updated without requiring manual screen refreshes.

### 1. Connection Handshake
WebSockets require handshake query tokens for authentication:
- **Lender Endpoint**: `ws://<ip>:8000/ws/bank/loans?token=mock-token-admin`
- **Farmer Endpoint**: `ws://<ip>:8000/ws/farmer/loans/{user_id}?token=mock-token-farmer-{user_id}`

### 2. Message Formats (JSON)
Messages must adhere to the structured payload:
```json
{
  "type": "EVENT_TYPE_STRING",
  "payload": { ... }
}
```

#### Event Schemas

* **`LOAN_SUBMITTED`** (Farmer -> Lenders):
  ```json
  {
    "type": "LOAN_SUBMITTED",
    "payload": {
      "id": "loan-app-farm-171800",
      "farmerId": "farmer-user-id-123",
      "farmerName": "Ramesh Kumar",
      "amount": 150000,
      "tenureMonths": 12,
      "interestRate": 6.8,
      "emi": 12970,
      "status": "PENDING",
      "createdAt": "2026-06-11T12:00:00Z"
    }
  }
  ```

* **`LOAN_STATUS_UPDATED`** (Lender -> Affected Farmer):
  ```json
  {
    "type": "LOAN_STATUS_UPDATED",
    "payload": {
      "id": "loan-app-farm-171800",
      "farmerId": "farmer-user-id-123",
      "bankName": "National Agri Development Bank",
      "status": "OFFERED",
      "offeredInterestRate": 7.2,
      "offeredTenureMonths": 18,
      "adminRemarks": "Approved under AgriScore subsidy criteria",
      "updatedAt": "2026-06-11T12:05:00Z"
    }
  }
  ```

* **`KYC_SUBMITTED`** (Farmer -> Lenders):
  ```json
  {
    "type": "KYC_SUBMITTED",
    "payload": {
      "farmerId": "farmer-user-id-123",
      "farmerName": "Ramesh Kumar",
      "details": { ...kycDetailsPayload... }
    }
  }
  ```

* **`FARMER_PROFILE_UPDATED`** (Farmer -> Lenders):
  ```json
  {
    "type": "FARMER_PROFILE_UPDATED",
    "payload": {
      "farmerId": "farmer-user-id-123",
      "details": { ...kycDetailsPayload... }
    }
  }
  ```

### 3. Redis Pub/Sub Pub-Sub Engine & Fallbacks
- **Broker Channel**: All servers publish/subscribe to the Redis channel `loan_events`.
- **Mock Fallback**: If connection to `redis://localhost:6379` fails, the backend falls back to `MockRedis`, utilizing an in-memory `asyncio.Queue` event broker. This ensures that single-node local servers retain full WebSocket routing functionality without requiring a running Redis instance.
- **ConnectionManager**: Tracks connections mapping:
  - `active_banks`: Dictionary mapping `WebSocket` objects of connected bankers to their parsed authentication payload.
  - `active_farmers`: Dictionary mapping `user_id` strings to arrays of active `WebSocket` client endpoints.
- **redis_listener Task**: Runs in the background (FastAPI startup lifecycle). It consumes events from Redis or `MockRedis` and directs messages:
  - If event is `LOAN_STATUS_UPDATED`, calls `manager.send_to_farmer(farmer_id, data)` (unicast).
  - If event is `LOAN_SUBMITTED`, `KYC_SUBMITTED`, or `FARMER_PROFILE_UPDATED`, calls `manager.broadcast_to_banks(data)` (multicast to all bank sockets).

---

## 6. Frontend State Management (Zustand Stores)

State variables and state actions are isolated into modular Zustand stores:

### 1. `useAuthStore.ts`
Manages user authentication lifecycle.
- **State Fields**:
  - `user` (FirebaseUser | null): Contains user properties (`uid`, `email`, `role`).
  - `isAuthenticated` (Boolean): Access authorization check.
  - `isLoading` (Boolean): Page-load blocker indicator.
  - `error` (String | null): Error text logging.
- **Actions**:
  - `login(email, password)`: Queries mock Firebase auth, configures session, and sets authentication keys.
  - `registerUser(email, password, role)`: Registers credential set inside mock DB.
  - `logout()`: Clears session user structure.
  - `checkSession()`: Restores current session state from active memory structure.

### 2. `useFarmerStore.ts`
Manages the active farmer's profile, diagnostics, and credit score.
- **State Fields**:
  - `kycDetails` (KYCFlowData | null): Active profile object.
  - `creditScore` (CreditScoreBreakdown | null): Factored parameters rating.
  - `diagnostics` (CropDiagnostic[]): ML diagnostic results array.
  - `isLoading` / `isSaving` (Boolean).
- **Actions**:
  - `fetchKYC(farmerId)`: Loads profile from api and triggers credit score fetch on success.
  - `submitKYC(farmerId, data)`: Dispatches API request (resolving JSON or multipart forms depending on crop image attachment availability) and triggers a `KYC_SUBMITTED` WebSocket event.
  - `fetchCreditScore(farmerId)`: Runs algorithmic evaluation client-side.
  - `uploadCropImage(farmerId, imageUri)`: Triggers mock ML analysis diagnostic logging.
  - `fetchDiagnostics(farmerId)`: Downloads historical crop diagnostics.

### 3. `useLoanStore.ts`
Synchronizes loan listings, statistics, and handles real-time message updates.
- **State Fields**:
  - `applications` (LoanApplicationData[]): Farmer's applied loans list.
  - `allApplications` (LoanApplicationData[]): Admin/lender global applications queue.
  - `loanProducts` (LoanProduct[]): Available bank loans.
  - `lenderFarmersList` (KYCFlowData[]): Admin view of all farmers.
  - `adminStats` (AdminStats object | null): Aggregated metrics for lender metrics grid.
  - `currentNotification` (Notification object | null): Holds temporary real-time push banners.
- **Actions**:
  - `applyForLoan(...)`: Submits request and sends `LOAN_SUBMITTED` socket message.
  - `adminSubmitOffer(...)`: Updates loan status and terms (interest rate, tenure, remarks) and pushes `LOAN_STATUS_UPDATED` notification.
  - `farmerActionOffer(...)`: Farmer response (accept/reject) targeting offered loans.
  - `handleRealTimeEvent(eventType, payload)`: Custom event interceptor. It updates local in-memory DB arrays immediately upon receiving socket broadcasts, modifies active Zustand lists, computes metric summaries, and flashes the screen-top `currentNotification` badge.

### 4. `useOnboardingStore.ts`
Saves intermediate media cache files.
- **State Fields**:
  - `cropFieldImage` (String | null): Local device caching URI of the verified crop photograph.
- **Actions**:
  - `setCropFieldImage(uri)` / `resetOnboardingStore()`.

---

## 7. Dynamic Credit Scoring Algorithm

The platform computes scores locally in `api.ts` using a weighted assessment model based on 6 agricultural parameter categories:

$$\text{AgriScore} = (CH \times 0.20) + (YS \times 0.20) + (CR \times 0.15) + (FP \times 0.15) + (FC \times 0.20) + (TV \times 0.10)$$

Where:
- $CH$ = **Crop Health Score (20% weight)**: Baseline `70`. Incremented if fertile soil types like *Alluvial* or *Black* are logged (`+10`). Modified by ML crop scans.
- $YS$ = **Yield Stability Score (20% weight)**: Baseline `65`. Incremented if land is `OWNED` (`+15`) or has high size (`+10`). Decremented if ownership is `SHARED` (`-10`) or irrigation depends purely on *Rainfed* (`-15`).
- $CR$ = **Climate Risk Score (15% weight)**: Baseline `80`. Incremented for micro-irrigation systems like *Drip* or *Sprinkler* (`+10`). Highly penalized if cultivation is purely *Rainfed* (`-25`).
- $FP$ = **Farming Practice Score (15% weight)**: Baseline `75`. Boosted if micro-irrigation systems are utilized (`+15`).
- $FC$ = **Financial Capability Score (20% weight)**: Baseline `60`. Adjusted positively for owned land (`+10`) and large landholdies (`+15`). Penalized heavily for small landholdings (`-10`), existing outstanding loans (`-25`), or large debt margins (`-15`).
- $TV$ = **Trust Verification Score (10% weight)**: Standardized to `95` once KYC identification cards are uploaded.

### Grading Scale & Risk Categories
The calculated numeric score maps directly to the following loan credit ratings:
- **$\ge 90$**: Grade `A+`, **LOW RISK**
- **$80 - 89$**: Grade `A`, **LOW RISK**
- **$70 - 79$**: Grade `B+`, **MEDIUM RISK**
- **$60 - 69$**: Grade `B`, **MEDIUM RISK**
- **$50 - 59$**: Grade `C`, **MEDIUM RISK**
- **$< 50$**: Grade `D`, **HIGH RISK**

---

## 8. Native Device Hardware Integration

Crop field verification uses native hardware APIs to capture and queue photos:

1. **Permissions Request**:
   - The user's camera permissions are requested using `ImagePicker.requestCameraPermissionsAsync()`.
   - Gallery access permissions are requested using `ImagePicker.requestMediaLibraryPermissionsAsync()`.
   - If denied, the user is presented with a native alert containing instructions to toggle permissions in system settings.
2. **Camera Launch**:
   - Spawns device camera using `ImagePicker.launchCameraAsync()`.
   - Parameters: `allowsEditing: true` (forces image cropping), `mediaTypes: Images` (prevents recording video).
3. **Bandwidth Compression**:
   - To accommodate poor rural network connectivity, images are compressed at source with `quality: 0.7`.
4. **Temporary Caching**:
   - The resulting image uri (e.g. `ph://...` on iOS or `file://...` on Android) is stored inside `useOnboardingStore` until the user completes Step 4 of onboarding and triggers profile submission.

---

## 9. Design System & Style Tokens

The application is styled with NativeWind (Tailwind CSS v3 for React Native), adhering to a premium emerald-theme palette:

```typescript
// Core styling palette from colors.ts
export const colors = {
  primary: '#10B981',      // Emerald 500 (Primary branding color)
  primaryDark: '#059669',  // Emerald 600 (Buttons, highlights)
  primaryLight: '#D1FAE5', // Emerald 100 (Badge backgrounds)
  primaryBg: '#F0FDF4',    // Emerald 50 (Screen/Card tint background)
  primaryDeep: '#064E3B',  // Emerald 900 (High-contrast text/cards)
  
  accent: '#F59E0B',       // Amber 500
  accentLight: '#FEF3C7',  // Amber 100
  accentDark: '#B45309',   // Amber 700
  
  charcoal: '#1F2937',     // Gray 800
  charcoalLight: '#374151',// Gray 700
  charcoalDark: '#111827', // Gray 900
  
  muted: '#6B7280',        // Gray 500
  lightGray: '#F3F4F6',    // Gray 100
  borderColor: '#E5E7EB',  // Gray 200
  
  white: '#FFFFFF',
  background: '#F9FAFB',
  card: '#FFFFFF',
  
  success: '#10B981',
  error: '#EF4444',
  info: '#3B82F6',
  warning: '#F59E0B',
};
```

### Styling Best Practices
- **Layouts**: Flexbox layouts are constructed with Tailwind utility wrappers (e.g. `className="flex-1 bg-gray-50 p-4"`).
- **Icons**: Managed via the `lucide-react-native` package with explicit `colors` mappings.
- **Typography**: Pinned to standardized font weights and styling colors (`charcoal`, `muted`) to ensure high contrast and readability on mobile screens.
- **UI Responsiveness**: Safe area margins are managed using `@react-navigation` header safe areas and `react-native-safe-area-context` providers to handle physical notches and status bars across screen aspect ratios.
