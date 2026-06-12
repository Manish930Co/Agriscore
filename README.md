# AgriScore

AgriScore is a real-time digital agricultural credit-scoring and loan underwriting platform connecting farmers and agricultural lenders. The platform combines agronomic data, soil attributes, climate resilience, and banking parameters to construct an automated agricultural credit score (AgriScore) and facilitates instantaneous real-time loan application and offer workflows.

## 🚀 Key Features

* **Multi-Step Onboarding (KYC & Farm Details)**: A 4-step wizard that captures personal, agronomic (crop type, sowing date, soil/irrigation details), financial, and GPS location details.
* **Crop Field Verification**: Native camera and photo attachment integration, letting farmers capture or upload photos of their crop fields with automatic bandwidth optimization (0.7 quality compression).
* **AI-Driven Dynamic Credit Score**: Calculates real-time credit grades (A+ to D) using a weighted parameter assessment engine (Crop Health, Yield Stability, Climate Risk, Financial Capability, Farming Practices, and Trust Verification).
* **Crop Disease AI Diagnostics**: Allows farmers to upload field photos for quick simulated crop disease diagnostics and treatment recommendations.
* **Lender & Loan Marketplace**: Farmers can view customized credit products and apply. Lenders can adjust terms (interest rate, tenure, remarks) in real-time.
* **Real-time Synchronization**: Powered by FastAPI WebSockets and Redis Pub/Sub (with an automatic in-memory queue fallback). Status modifications propagate instantly across dashboards.

---

## 🛠️ Technology Stack

### Frontend Mobile App
* **Core Framework**: React Native (Expo SDK 54)
* **Styling**: NativeWind (Tailwind CSS v3 for React Native)
* **State Management**: Zustand
* **Icons**: Lucide React Native
* **Navigation**: React Navigation (Bottom Tabs and Native Stacks)

### Backend API Server
* **Framework**: FastAPI (Python 3)
* **Real-Time Layer**: WebSockets + Redis Pub/Sub (with MockRedis fallback)
* **Database Models**: SQLAlchemy & Prisma schemas (PostgreSQL / SQLite ready)
* **Server**: Uvicorn

---

## 📂 Project Structure

```text
c:\agriscore\
├── App.tsx                     # React Native App entry point
├── app.json                    # Expo configuration
├── babel.config.js             # Babel presets with NativeWind integration
├── metro.config.js             # Metro bundler with NativeWind
├── package.json                # Frontend package dependencies
├── tailwind.config.js          # Tailwind theme definitions
├── global.css                  # CSS stylesheet imports for NativeWind
├── backend/
│   ├── main.py                 # FastAPI API router & server logic
│   └── websocket.py            # WebSocket Connection Manager & Redis Subscriber
└── src/
    ├── components/
    │   └── CreditScoreGauge.tsx # Circular animated SVG credit gauge
    ├── hooks/
    │   └── useWebSockets.ts    # React state Hook for WebSocket listener bindings
    ├── models/
    │   ├── models.py           # SQLAlchemy Data Models
    │   └── schema.prisma       # Prisma DB schemas
    ├── navigation/
    │   └── RootNavigator.tsx   # Screen navigation and real-time banners
    ├── screens/
    │   ├── admin/              # Lender overview and pipeline screens
    │   ├── auth/               # Login, register, and splash screens
    │   └── farmer/             # Dashboard, KYC, Crop AI, and Marketplace screens
    ├── services/
    │   ├── api.ts              # API client methods and credit calculations
    │   ├── firebase.ts         # Authentication simulator
    │   └── websocket.ts        # Singleton WebSocket manager with exponential backoff
    ├── store/                  # Zustand store modules
    └── theme/
        └── colors.ts           # Emerald theme color mappings
```

---

## ⚙️ Setup and Installation

### Backend Server Setup
1. Navigate to the backend directory and set up a Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate  # On Windows: venv\Scripts\activate
   pip install fastapi uvicorn redis pydantic sqlalchemy websockets
   ```
2. Start the FastAPI server:
   ```bash
   python main.py
   ```
   The backend will run on `http://localhost:8000`. If Redis is not running locally, the server automatically switches to an in-memory queue fallback.

### Frontend Mobile Setup
1. Install node dependencies in the root directory:
   ```bash
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```

---

## 📊 Dynamic Credit Scoring Formula

AgriScore uses a weighted scoring engine:

$$\text{AgriScore} = (CH \times 0.20) + (YS \times 0.20) + (CR \times 0.15) + (FP \times 0.15) + (FC \times 0.20) + (TV \times 0.10)$$

* **Crop Health ($CH$, 20%)**: Base 70, adjusted by soil suitability.
* **Yield Stability ($YS$, 20%)**: Base 65, increased for owned land and larger acreage, penalized for rainfed crops.
* **Climate Risk ($CR$, 15%)**: Penalized heavily for rainfed reliance (`-25`), boosted for drip irrigation.
* **Farming Practice ($FP$, 15%)**: Assesses modern agronomic techniques.
* **Financial Capability ($FC$, 20%)**: Based on income, existing loans, and outstanding debt.
* **Trust Verification ($TV$, 10%)**: Fixed to 95 upon KYC document submission.

---

## 🔒 Authentication & Test Credentials
The simulator includes mock accounts for direct login and testing:
* **Farmer Account**:
  * Email: `farmer@agriscore.com`
  * Password: `password123`
* **Lender/Admin Account**:
  * Email: `admin@agriscore.com`
  * Password: `password123`
