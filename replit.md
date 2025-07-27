# EmergencyPay - Offline Payment System

## Overview

EmergencyPay is a comprehensive offline payment system designed to work during UPI outages in India. The application provides emergency payment capabilities using Bluetooth Low Energy for device-to-device communication, with a robust synchronization system for when connectivity is restored.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project follows a full-stack monorepo pattern with clear separation of concerns:
- **Client**: React-based mobile-first web application
- **Server**: Express.js REST API server with Socket.IO for real-time updates
- **Shared**: Common schemas, types, and utilities shared between client and server

### Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Framer Motion, TanStack Query
- **Backend**: Express.js with TypeScript, Socket.IO for real-time communication
- **Database**: PostgreSQL with Drizzle ORM (configured for Neon serverless)
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Authentication**: Firebase Auth (optional, with fallback mock system)
- **External Services**: Stripe (configured), Supabase (optional)

## Key Components

### Frontend Architecture
1. **Context-Based State Management**: Uses React Context (`AppContext`) for global state including connection status, user data, and emergency mode
2. **Component-Based UI**: Modular components with consistent design patterns using Shadcn/ui
3. **Page-Based Routing**: Wouter for lightweight client-side routing
4. **Real-time Updates**: Socket.IO client integration for live transaction updates
5. **Mobile-First Design**: Responsive design optimized for mobile devices with bottom navigation

### Backend Architecture
1. **RESTful API Design**: Express.js with structured route handlers
2. **Database Abstraction**: Storage interface pattern with Drizzle ORM implementation
3. **Real-time Communication**: Socket.IO server for broadcasting transaction updates
4. **Banking API Simulation**: Mock banking integration for transaction processing
5. **Session Management**: Express sessions with PostgreSQL store

### Database Schema
The system uses four main tables:
- **Users**: Core user information with public/private keys for offline transactions
- **Transactions**: Transaction records with offline capability flags
- **Merchants**: Business entities with essential service categorization
- **Pending Sync**: Queue for offline transactions awaiting reconciliation

## Data Flow

### Online Transaction Flow
1. User initiates payment through QR scan or direct transfer
2. Frontend validates input and sends request to backend
3. Backend processes through banking API simulation
4. Real-time updates sent via Socket.IO
5. Transaction stored in database with 'completed' status

### Offline Transaction Flow
1. Emergency mode activated (manual or automatic during outages)
2. Bluetooth device discovery for nearby merchants/users
3. Local transaction creation with digital signatures
4. Storage in local state and database with 'pending' status
5. Automatic reconciliation when connectivity restored

### Connection Status Management
The system tracks three connection states:
- **Online**: Full functionality with real-time banking integration
- **Offline**: Limited functionality with local storage only
- **Emergency**: Bluetooth-enabled offline payments for essential services

## External Dependencies

### Required Services
- **PostgreSQL Database**: Primary data storage (configured for Neon)
- **Node.js Runtime**: Server execution environment

### Optional Services
- **Firebase**: Authentication and user management
- **Supabase**: Alternative authentication and storage
- **Stripe**: Payment processing integration (configured but not actively used)

### Development Dependencies
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the stack
- **Drizzle Kit**: Database migration and schema management

## Deployment Strategy

### Development Mode
- Vite dev server for frontend with HMR
- Express server with TypeScript compilation via tsx
- Concurrent development with proper proxy configuration

### Production Build
1. **Frontend**: Vite builds static assets to `dist/public`
2. **Backend**: esbuild compiles TypeScript to `dist/index.js`
3. **Database**: Migrations applied via Drizzle Kit
4. **Deployment**: Single server serving both API and static files

### Environment Configuration
Key environment variables:
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Optional Supabase integration
- Firebase configuration variables: Optional for authentication

### Scaling Considerations
- Stateless server design allows horizontal scaling
- Database connection pooling for concurrent users
- Socket.IO can be scaled with Redis adapter if needed
- Static assets can be served via CDN

The architecture prioritizes offline-first functionality while maintaining compatibility with standard payment flows, making it suitable for emergency situations while being robust enough for regular use.