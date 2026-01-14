# BISHL App

## Overview

BISHL App is a Next.js-based web application for managing ice hockey leagues in Germany. The app provides comprehensive functionality for league management, including team registration, player management, match scheduling, referee assignments, and document management. It serves as a central platform for the Berliner Inline-Skaterhockey Liga (BISHL) community.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

### PlayerForm Refactoring
- **Section 1 (Non-editable master data)**: Read-only display of ISHD-managed data (name, birthdate, sex, age group, full face requirement). Removed `managedByISHD` from this section as it's now editable.
- **Section 2 (Editable master data)**: View/Edit mode pattern with Edit/Cancel/Save buttons. Fields include image upload, image visibility, display names, and `managedByISHD` toggle (ISHD/BISHL dropdown in edit mode, colored badge in view mode).
- **Section 3 (Licence table)**: Full licence management with Auto-Optimize (Fix), Revalidate (Check), and Add (Neu) buttons. Context menu per row with Edit and Remove actions. Invalid reason codes displayed with human-readable descriptions.

### New Components
- **TeamAssignmentSelect** (`components/ui/TeamAssignmentSelect.tsx`): Dropdown for selecting teams from `/players/:id/possible-teams` API, with time-window restriction from `PLAYERASSIGNMENTWINDOW` config.
- **AssignmentModal** (refactored): HeadlessUI dialog with TeamAssignmentSelect, jerseyNo input, and active toggle. Supports both add and edit modes.

### API Integration
- All API calls use `lib/apiClient.tsx` (no direct axios usage)
- Licence operations: Auto-optimize (POST `/players/:id/auto_optimize`), Revalidate (POST `/players/:id/revalidate`), PATCH `/players/:id` for assignments
- Master data saved via PATCH `/players/:id` with FormData (only section 2 fields)

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 12.1.6 with React 18.2.0
- **Styling**: TailwindCSS 3.4.14 for utility-first CSS styling
- **UI Components**: Headless UI v2.2.0 for accessible components and Heroicons for iconography
- **Image Management**: Next Cloudinary integration for cloud-based image storage and optimization
- **Form Handling**: Formik 2.4.2 with Yup validation for form management
- **State Management**: React Context API for authentication state
- **PDF Generation**: React-PDF for generating roster PDFs
- **Date Handling**: React DatePicker with date-fns for date manipulation

### Backend Integration
- **API Communication**: Axios for HTTP requests to external API
- **Environment Configuration**: Separate API URLs for development and production environments
- **Cookie Management**: cookies-next for client-side cookie handling
- **Authentication**: JWT-based authentication with custom auth context

### Application Structure
- **Pages**: Next.js file-based routing with TypeScript support
- **Components**: Modular component architecture organized by functionality:
  - Admin components for administrative functions
  - League manager components for tournament management
  - UI components for reusable interface elements
  - Form components for data input
- **Layout System**: Flexible layout components (Layout, LayoutAdm) with header/footer structure
- **Type Safety**: Comprehensive TypeScript interfaces for all data structures

### Data Management
- **API Integration**: RESTful API integration with external BISHL backend
- **Data Types**: Strongly typed interfaces for all entities (clubs, teams, players, matches, etc.)
- **State Persistence**: Cookie-based session management
- **Image Assets**: Cloudinary integration for logos, player photos, and venue images

### Internationalization
- **Locale**: German (de-DE) as default and only locale
- **Date Formatting**: German date formats and locale-specific formatting

### Performance Optimizations
- **Image Optimization**: Next.js Image component with Cloudinary integration
- **Static Generation**: Configurable static page generation timeout
- **Bundle Optimization**: SWC minification disabled for compatibility

## External Dependencies

### Core Technologies
- **Next.js**: React-based web framework for production applications
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Static type checking for JavaScript

### UI and Styling
- **TailwindCSS**: Utility-first CSS framework for styling
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: SVG icon library
- **React Spinners**: Loading spinner components

### Form and Data Management
- **Formik**: Form library for React applications
- **Yup**: Schema validation library
- **Axios**: HTTP client for API requests
- **cookies-next**: Cookie management for Next.js

### Media and Content
- **Cloudinary**: Cloud-based image and video management
- **Next Cloudinary**: Cloudinary integration for Next.js
- **React Quill**: Rich text editor component
- **PrismJS**: Syntax highlighting library
- **React PDF**: PDF generation for React applications

### Date and Time
- **date-fns**: Date utility library
- **React DatePicker**: Date picker component with German locale support

### Development Tools
- **ESLint**: Code linting with Next.js configuration
- **PostCSS**: CSS processing with Autoprefixer
- **TypeScript**: Static type checking and enhanced development experience

### External API
- **BISHL Backend API**: Custom REST API for league data management
- **Production API**: https://api.bishl.de
- **Development API**: Configurable via environment variables