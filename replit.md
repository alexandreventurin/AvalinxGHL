# Avalinx - GoHighLevel OAuth Integration

## Overview

Avalinx is a plugin for GoHighLevel (GHL) that provides OAuth2 authentication integration. This MVP (Etapa 1) focuses exclusively on establishing secure connections between the Avalinx system and GoHighLevel accounts through OAuth2 flow, with token management and account validation capabilities.

The application is built as a full-stack TypeScript web application with React frontend and Express backend, designed to handle the complete OAuth2 authorization flow including token exchange, storage, and refresh capabilities.

## Current Status

**MVP Etapa 1: ✅ COMPLETED AND TESTED (October 5, 2025)**

Successfully implemented and tested end-to-end OAuth2 flow with real GoHighLevel account:
- OAuth2 authorization flow working with code exchange and token storage
- Account information retrieval from GHL API (`/locations/{locationId}` endpoint)
- UI displaying connection status, account details, and action buttons
- Tested with GHL agency subaccount (iLeveX) - confirmed multi-location support
- All TypeScript errors resolved, schemas validated with Zod

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark mode support
- **State Management**: TanStack Query (React Query) for server state management
- **Forms**: React Hook Form with Zod validation

**Design Decisions:**
- Component-based architecture using functional React components with hooks
- Centralized API client using fetch with credential management
- Toast notifications for user feedback
- Responsive design with mobile-first approach
- Path aliases (@, @shared, @assets) for clean imports

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API
- **Database ORM**: Drizzle ORM configured for PostgreSQL (via Neon serverless)
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: tsx for TypeScript execution, Nodemon for hot reload

**API Structure:**
- `/api/status` - Health check endpoint returning API version and status
- `/auth/ghl` - Initiates OAuth2 flow by redirecting to GoHighLevel
- `/auth/callback` - Handles OAuth2 callback and token exchange
- `/me` - Returns authenticated user account information
- `/auth/disconnect` - Revokes authentication and clears stored tokens

**Core Services:**
- **GHLService** (`server/services/ghl.ts`): Handles all GoHighLevel API interactions including:
  - OAuth URL generation with proper scopes
  - Authorization code to token exchange
  - Token refresh logic
  - Account information retrieval

**Storage Layer:**
- **IStorage Interface**: Abstract storage interface for flexibility
- **MemStorage Implementation**: In-memory token and account storage for MVP
- Token management utilities providing save, retrieve, validate, and delete operations
- Designed to be easily swapped with database persistence

**Data Models (Shared Schemas):**
- `GhlToken`: OAuth token data including access_token, refresh_token, expiry, and location/company IDs
- `GhlAccount`: Account metadata including name, address, timezone, country
- Response schemas for API endpoints with Zod validation

### Authentication Flow

**OAuth2 Implementation:**
1. User initiates connection via `/auth/ghl` endpoint
2. Backend generates authorization URL with client credentials and redirects to GoHighLevel
3. User authorizes in GoHighLevel's interface
4. GoHighLevel redirects back to `/auth/callback` with authorization code
5. Backend exchanges code for access and refresh tokens
6. Tokens and account info stored in-memory (MemStorage)
7. Frontend receives confirmation and displays connection status

**Token Management:**
- Access tokens stored with expiration timestamps
- Token validation checks expiry before use
- Refresh token logic prepared but not yet implemented in flow
- Location-based token storage (keyed by locationId)

### Development Environment

**Vite Integration:**
- Custom Vite middleware setup for development
- HMR (Hot Module Replacement) support
- Replit-specific plugins for error handling and development banners
- Production build separates client bundle and server bundle

**Build Process:**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles Express server to `dist/index.js`
- TypeScript compilation checking without emit

## External Dependencies

### Third-Party Services

**GoHighLevel (Primary Integration):**
- OAuth2 Provider: `https://marketplace.gohighlevel.com/oauth/chooselocation`
- API Base URL: `https://services.leadconnectorhq.com`
- Required Scopes: `locations.readonly`, `contacts.readonly`
- Authentication: OAuth2 with client credentials (CLIENT_ID, CLIENT_SECRET)

**Neon Database:**
- PostgreSQL serverless provider via `@neondatabase/serverless`
- Drizzle ORM configured for schema management
- Migration system ready (schema in `shared/schema.ts`)
- Note: Currently using in-memory storage; database integration prepared for future use

### NPM Dependencies

**Core Runtime:**
- `express` - Web server framework
- `axios` - HTTP client for GoHighLevel API calls
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing

**Frontend Libraries:**
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `react-hook-form` + `@hookform/resolvers` - Form handling
- `zod` - Runtime type validation
- Comprehensive Radix UI component library for accessible primitives
- `tailwindcss` + `class-variance-authority` + `clsx` - Styling utilities

**Development Tools:**
- `tsx` - TypeScript execution
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `drizzle-kit` - Database migration tools
- Replit-specific Vite plugins for enhanced development experience

**Session Management:**
- `connect-pg-simple` - PostgreSQL session store (prepared for future use)
- `express-session` - Session middleware (dependency present)

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `GHL_CLIENT_ID` - GoHighLevel OAuth client ID
- `GHL_CLIENT_SECRET` - GoHighLevel OAuth client secret
- `GHL_REDIRECT_URI` - OAuth callback URL (defaults to `http://localhost:5000/auth/callback`)
- `NODE_ENV` - Environment mode (development/production)