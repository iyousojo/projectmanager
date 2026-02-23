# Project Management - Mobile App

A modern, high-performance mobile client built with Expo and NativeWind (Tailwind CSS) for tracking project progress on the go.

## 📱 Core Features
- **Dynamic Timeline**: Visual representation of project task history with specialized milestone badges.
- **Phase Management**: Admin-only horizontal scroll interface to advance project stages.
- **Contextual Chat**: Intelligent floating action button that initiates chat with the supervisor (for students) or the student (for admins).
- **Optimized Rendering**: Uses `React.memo` and `useCallback` for smooth scrolling and performance.

## 🔧 Technical Stack
- **Framework**: Expo (React Native)
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: Expo Router (File-based)
- **State Management**: React Hooks (useState, useEffect)
- **Networking**: Axios with Interceptors for JWT handling.

## 📂 Key Components
- `ProjectDetails`: The main engine of the app. Handles data fetching, phase logic, and conditional rendering based on user roles.
- `TaskItem`: A memoized component for displaying history logs.
- `PhaseButton`: Interactive button for timeline management.

## ⚙️ Configuration
Update the `API_URL` in `app/project-details.js` to point to your production server:
`https://projectmanagerapi-o885.onrender.com/api`