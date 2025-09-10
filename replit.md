# MBU Smart Transport Platform

## Overview

This is a comprehensive ride-sharing platform designed for MBU (Mohan Babu University) that facilitates transportation services for students, drivers, and administrators. The application provides a modern, full-stack solution with real-time features including live ride tracking, driver management, student ride requests, and administrative analytics. The platform supports multiple user roles (student, driver, admin) with role-specific interfaces and features both solo and pool ride options.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system and CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js for the REST API server
- **Language**: TypeScript throughout for consistent type safety
- **Real-time Communication**: WebSocket server for live updates, driver location tracking, and notifications
- **Storage**: In-memory storage implementation with interface abstraction for future database integration
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **ORM**: Drizzle ORM with schema-first approach and type-safe queries
- **Schema Management**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations and schema evolution
- **Validation**: Zod schemas integrated with Drizzle for runtime validation

### Authentication and Authorization
- **Session-based Authentication**: Traditional session management with server-side storage
- **Role-based Access Control**: Three distinct user roles (student, driver, admin) with specific permissions
- **Mock Authentication**: Development-friendly mock login system for rapid prototyping

### External Dependencies
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud database
- **UI Components**: Extensive Radix UI component library for accessibility and customization
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Hookform Resolvers for validation
- **Date Handling**: Date-fns for date manipulation and formatting
- **Real-time**: Native WebSocket implementation for real-time features
- **Development Tools**: Replit-specific plugins for development environment integration

### Key Architectural Decisions

**Monorepo Structure**: Single repository with clear separation between client, server, and shared code for maintainability and type sharing.

**Real-time First**: WebSocket implementation enables live driver tracking, ride status updates, and instant notifications across all user types.

**Schema-driven Development**: Shared TypeScript schemas between frontend and backend ensure type consistency and reduce runtime errors.

**Component-based UI**: Modular React components with Shadcn/ui provide consistent design system and accessibility features.

**Role-based Interfaces**: Distinct UI components for each user role (StudentInterface, DriverInterface, AdminInterface) with role-specific features and workflows.

**Multi-language Support**: Built-in translation system supporting English, Hindi, and Telugu for regional accessibility.

**Cloud-native Design**: Configured for serverless deployment with Neon PostgreSQL and optimized for cloud environments.