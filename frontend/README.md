# Campus Cart Frontend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will run on `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

## Features
- 🏠 Landing Page with features showcase
- 🔐 User Authentication (Login/Register)
- ✉️ Email Verification
- 📊 Dashboard with user stats
- 📱 Fully Responsive Design
- 🎨 Modern UI with smooth animations

## Tech Stack
- React 19
- Vite
- React Router DOM
- Axios
- CSS3 (Custom styling)

## API Configuration
The frontend connects to the backend API at `http://localhost:5000/api`

If you need to change the API URL, edit `src/config/axios.js`
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
