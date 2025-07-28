# EmergencyPay - Offline UPI Payment System

## Overview

EmergencyPay is a React-based web application simulating an offline payment system that works during UPI outages in India. The system provides both merchant and customer interfaces with offline transaction capabilities using simulated Bluetooth Low Energy for device-to-device payments.

**IMPORTANT: Backend has been converted to Flask (Python) instead of Express.js (Node.js). The application now uses a Flask server with SQLite database.**

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API with custom AppContext provider
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack Query for server state management
- **Animations**: Framer Motion for smooth transitions and micro-interactions

### Backend Architecture
- **Runtime**: Python with Flask framework
- **Language**: Python 3.11
- **Database**: SQLite with direct SQL operations
- **Session Management**: Flask sessions
- **Real-time Communication**: Flask-SocketIO for live updates
- **Authentication**: Firebase Auth integration (optional)

## Key Components

### Core Features
1. **Connection Status Management**: Dynamic switching between online, offline, and emergency modes
2. **Transaction Processing**: Both online and offline transaction capabilities with reconciliation
3. **Bluetooth Simulation**: Mock BLE device discovery and peer-to-peer payments
4. **Digital Signatures**: Cryptographic transaction signing for security
5. **Emergency Mode**: Special offline payment capabilities for essential services

### Database Schema
- **Users**: Store user profiles, keypairs, and balances
- **Transactions**: Track all payment transactions with status and metadata
- **Merchants**: Manage merchant profiles and essential service flags
- **Pending Sync**: Queue offline transactions for later reconciliation

### UI Components
- **Status Bar**: Connection status indicator with emergency mode toggle
- **Balance Card**: User wallet display with regular and emergency balances
- **Transaction History**: Comprehensive transaction listing with filtering
- **QR Scanner**: Simulated QR code scanning for payments
- **Bluetooth Interface**: Device discovery and connection management

## Data Flow

### Online Transaction Flow
1. User initiates payment through QR scan or merchant selection
2. Frontend validates amount and user balance
3. Backend processes payment through banking API simulation
4. Real-time updates via Socket.IO
5. Transaction status updated in database

### Offline Transaction Flow
1. Emergency mode activated (manual or automatic)
2. Bluetooth device discovery initiated
3. Peer-to-peer connection established
4. Transaction signed with digital signature
5. Local storage with pending sync status
6. Reconciliation when connectivity restored

### State Management
- **AppContext**: Global application state including user data, transactions, and connection status
- **React Query**: Caching and synchronization of server state
- **Socket.IO**: Real-time updates for transaction status changes

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe SQL query builder
- **socket.io**: Real-time bidirectional communication
- **@radix-ui/***: Accessible UI primitives
- **framer-motion**: Animation library
- **react-hook-form**: Form state management

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### Optional Integrations
- **Firebase Auth**: User authentication (configurable)
- **Supabase**: Alternative backend services (configurable)
- **Stripe**: Payment processing simulation

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Database**: Neon PostgreSQL serverless instance
- **Hot Reload**: Full-stack TypeScript compilation with live updates

### Production Build
- **Frontend**: Static assets built with Vite and served by Express
- **Backend**: ESBuild bundled Node.js application
- **Database**: PostgreSQL with connection pooling
- **Session Store**: PostgreSQL-backed session storage

### Environment Configuration
The application requires the following environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session encryption key
- Optional Firebase and Supabase credentials for extended functionality

### Deployment Considerations
- The application is designed for Replit deployment with automatic environment setup
- Database migrations are handled through Drizzle Kit
- Static assets are served from the Express server in production
- WebSocket support required for real-time features

The architecture emphasizes offline-first capabilities while maintaining compatibility with traditional online payment flows, making it suitable for emergency scenarios where network connectivity is unreliable.