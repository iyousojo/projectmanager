# Project Manager - Mobile App [![Expo](https://img.shields.io/badge/Expo-54.0.33-black.svg)](https://expo.dev) [![React Native](https://img.shields.io/badge/React_Native-0.81.5-blue.svg)](https://reactnative.dev)

A modern, high-performance mobile app built with **Expo** and **NativeWind (Tailwind CSS)** for managing academic projects, tasks, chats, and notifications on the go.

## 📱 Core Features
- **Authentication**: Secure login, registration, forgot password flows.
- **Tabbed Navigation**: Home, Projects, Tasks, Notifications, Create new project.
- **Dynamic Timeline & Phase Management**: Visual task history with milestone badges; admin-only phase advancement via horizontal scroll.
- **Contextual & Group Chat**: FAB for personal chat (student-supervisor); group workspaces with real-time chat (Socket.io) and tasks tab.
- **Task Management**: Submit/approve tasks, status updates, details view.
- **Notifications**: Push notifications, mark as read, delete.
- **Admin Dashboard**: Project oversight, profiles.
- **Optimized Performance**: `React.memo`, `useCallback`, Reanimated for smooth UI.

## 🔧 Tech Stack
- **Framework**: Expo SDK ~54 (React Native 0.81)
- **Styling**: NativeWind v4 (Tailwind CSS)
- **Navigation**: Expo Router v6 (file-based)
- **State**: React Hooks (useState/useEffect)
- **Networking**: Axios (JWT interceptors), Socket.io-client (real-time chat)
- **Other**: Expo Notifications, AsyncStorage, Reanimated, Gesture Handler, Image, Font, Haptics

## 📂 Project Structure
```
app/
├── _layout.js          # Root layout with notifications
├── (auth)/             # Login, Register, Forgot Password
├── (admin)/            # Dashboard, Profile
├── (tabs)/             # Home, Projects, Tasks, Notifications, Create
├── project/[id].js     # Individual project view
├── group-project/[id].js
├── project-details.js  # Core project engine (timeline, chat FAB)
├── group-workspace.js  # Group chat + tasks
├── personal-chat.js    # 1:1 chat
├── task-details.js     # Task actions
├── notification-details.js
└── profile-details.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Expo CLI: `npm i -g @expo/cli`
- Android Studio / Xcode (for native builds)
- Google Services JSON (for FCM notifications)

### Installation
1. Clone/Fork the repo.
2. `cd projectmanager`
3. `npm install`

### Environment Setup
- Update `API_URL` in `app/project-details.js` (and others): `https://your-api.com/api`
- Place `google-services.json` in root (Android FCM).
- Optional: Firebase Admin SDK for backend.

### Run the App
```bash
npm start    # Expo dev server (web/tunnel)
npm run android
npm run ios
npm run web
```

## 🔌 Backend Integration
- **Auth**: `/auth/login`, `/auth/register`
- **Projects**: `/projects/${id}`, `/projects/${id}/tasks`
- **Tasks**: `/tasks/${id}/submit`, `/tasks/${id}/approve`
- **Chat**: `/chat/${id}` (personal/project), POST `/chat`
- **Notifications**: `/notifications`, `/notifications/${id}/read`

## 📱 Screenshots
*(Add screenshots of tabs, timeline, chat here)*

## 🚀 Build & Deploy
```bash
eas login
eas build --platform android  # or ios
eas build:configure
```

## 🤝 Contributing
1. Fork & PR.
2. Run `npm run lint`.
3. Follow Tailwind/NativeWind conventions.

## 📄 License
MIT

**API Production**: `https://projectmanagerapi-o885.onrender.com/api`

