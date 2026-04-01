# Pharmacy Project - Coding Guidelines

## Code Structure & Architecture

### Feature Organization

- **All features must have complete, production-ready code** - no placeholders or incomplete implementations
- **Components belong in feature folders**, not directly in `src/app/`
- Feature structure is organized under `src/features/` with the following categories:
  - `admin/` - Administrator features
  - `auth/` - Authentication features
  - `public/` - Public-facing features
  - `store/` - Store/shopping features
  - `user/` - User account features
- Each feature folder contains:
  - `components/` - Feature-specific React components
  - `hooks/` - Feature-specific custom hooks
  - `pages/` - Page components
  - `schema/` - Validation schemas (Yup)
  - `store/` - State management
  - `types/` - TypeScript type definitions

### App Directory Usage

- **Do not create components directly in `src/app/`**
- The `app/` directory is for Next.js routing only (pages, layouts, route handlers)
- Business logic and UI components belong in `src/features/` or `src/shared/`

### Layout System

- **All layouts are located in `src/shared/layouts/`** and wrap children pages
- **Layout Types:**
  - **Public Layout** (`src/shared/layouts/public/`) - Has Navbar and Footer only (no sidebar)
    - Used for: Landing pages, marketing content, public-facing pages
  - **User Layout** (`src/shared/layouts/user/`) - Has Navbar and Sidebar
    - Used for: User dashboard, user account pages, user-specific features
  - **Store/Pharmacy Layout** (`src/shared/layouts/store/`) - Has Navbar and Sidebar
    - Used for: Store pages, pharmacy browsing, product listings
  - **Admin Layout** (`src/shared/layouts/Admin/`) - Has Navbar and Sidebar
    - Used for: Admin dashboard, inventory management, admin features
- **Each layout wraps children pages** and provides consistent navigation structure
- **Do not create new layouts** - use the existing layout system
- **All children pages are rendered inside the appropriate layout wrapper**

### Branding & Assets

- **Always use `logo.svg` from `/public/logo.svg`** in all Navbar, Sidebar, and Footer components
- Do not use different logos or create custom branding elements
- Maintain consistent logo placement and styling across all layouts
- Example:

  ```tsx
  import Image from "next/image";

  <Image src="/logo.svg" alt="Pharmacy Logo" width={150} height={50} />;
  ```

### Code Splitting & Performance

- **Always use Next.js dynamic imports** for components in the `app/` directory to enable code chunking
- This improves performance by loading components only when needed
- Example:

  ```typescript
  import dynamic from "next/dynamic";

  const DynamicComponent = dynamic(
    () => import("@/features/admin/pages/Dashboard"),
    {
      loading: () => <div>Loading...</div>,
      ssr: false, // Optional: disable server-side rendering if needed
    }
  );
  ```

- Use dynamic imports for:
  - Heavy feature components
  - Components not needed on initial page load
  - Admin panels and dashboards
  - Large third-party libraries

## API Integration

### Data Fetching Rules

- **GET requests**: Always use the custom `useSwr` hook from `src/shared/hooks/useSwr.ts`

  ```typescript
  import useSwr from "@/shared/hooks/useSwr";
  const { data, error, isLoading, mutate } = useSwr("endpoint-path");
  ```

- **POST, PUT, PATCH, DELETE requests**: Always use the custom `useMutation` hook from `src/shared/hooks/useMutation.ts`
  ```typescript
  import useMutation from "@/shared/hooks/useMutation";
  const { mutation, isLoading } = useMutation();
  await mutation("endpoint-path", { method: "POST", body: data });
  ```

### File Uploads

- **Always use MediaService** from `src/shared/hooks/mediaService.ts` for all file uploads
- Do not implement custom file upload logic
- MediaService handles validation, size limits, and Cloudinary integration

## Document Generation

### Invoice & Receipt Generation

- **Always implement invoice generation functionality** when working with orders, sales, or transactions
- Invoices must include:
  - Company logo (`/public/logo.svg`)
  - Invoice number and date
  - Customer details
  - Itemized list of products/medicines with prices
  - Subtotal, tax, and total amounts
  - Payment method and status
- **Use a dedicated invoice template component** for consistency
- Support PDF generation and printing capabilities
- Store invoice records in the database with proper audit trails
- Example endpoint: `POST /api/orders/[id]/invoice`

## Forms & Validation

### Form Implementation

- **Always use Formik and Yup** for forms and validation
- **Use Formik components**: `<Formik>`, `<Form>`, `<Field>`, `<ErrorMessage>`
- **Do NOT use** the `useFormik` hook - use the component-based approach instead
- Example structure:

  ```tsx
  import { Formik, Form, Field, ErrorMessage } from "formik";
  import * as Yup from "yup";

  const validationSchema = Yup.object({ /* schema */ });

  <Formik initialValues={...} validationSchema={validationSchema} onSubmit={...}>
    <Form>
      <Field name="fieldName" />
      <ErrorMessage name="fieldName" component="div" />
    </Form>
  </Formik>
  ```

## UI/UX Guidelines

### Design System

- **Use custom primary, secondary, and tertiary colors** for a smooth, consistent UI/UX
- **All colors are defined in `src/app/globals.css`** based on the logo color palette
- **Color System:**
  - **Primary (Emerald Green)**: `primary-50` to `primary-900` - Main brand color from logo (#26834F)
  - **Secondary (Teal)**: `secondary-50` to `secondary-900` - Complementary color
  - **Tertiary (Cyan Blue)**: `tertiary-50` to `tertiary-900` - Accent color from logo (#74c9d5)
  - **Accent (Light Gray)**: `accent-50` to `accent-900` - Neutral color from logo (#E8E9E8)
  - **Error (Red)**: `error-50` to `error-900` - For error states and cancel actions
- **Use Tailwind color classes**: `bg-primary-500`, `text-secondary-600`, `border-tertiary-300`, etc.
- **Maintain design consistency** across the entire platform
- **Avoid creating many card designs** - keep UI components simple and reusable
- Reference existing components in `src/shared/layouts/` and `src/features/*/components/` for design patterns

### Custom Components

- **Always use CustomButton** from `src/shared/common/CustomButton.tsx` for all buttons
  - Supports variants: `primary`, `secondary`, `cancel`, `tertiary`, `refresh`
  - Built with Tailwind CSS for consistent styling
  - Do not create custom button components or use native `<button>` tags

  ```tsx
  import CustomButton from "@/shared/common/CustomButton";

  <CustomButton variant="primary" loading={isLoading}>
    Submit
  </CustomButton>;
  ```

- **Always use CustomTable** from `src/shared/common/CustomTable.tsx` for all data tables
  - Feature-rich table with sorting, pagination, search, and export
  - Supports expandable rows and custom cell rendering
  - Do not create custom table components

  ```tsx
  import CustomTable from "@/shared/common/CustomTable";

  <CustomTable data={records} columns={columns} onRowClick={handleRowClick} />;
  ```

### CSS & Styling

- **Always use `dvh` (dynamic viewport height)** instead of `h-screen` or `vh`
  - Correct: `h-[100dvh]`, `min-h-[50dvh]`
  - Incorrect: `h-screen`, `min-h-screen`, `100vh`
- Follow Tailwind CSS conventions as configured in the project

## Data Management

### Static Data Rules

- **Do not add static/mock data** unless it's for:
  - Public content (landing pages, marketing content)
  - Design demonstrations
  - Default UI states
- All dynamic content must come from API endpoints or database

## Development Workflow

### Error Handling

- **Fix all errors before moving to the next task**
- When creating or modifying files:
  1. Make the change
  2. Check for TypeScript/ESLint errors
  3. Fix all errors completely
  4. Only then proceed to the next step
- Do not leave any incomplete or broken code

### Quality Standards

- Write TypeScript with proper type definitions
- Follow the existing code style and structure
- Ensure all imports use the correct paths (`@/` alias for src directory)
- Test API integrations before marking work complete
- **Code is automatically formatted on save** using Prettier
- **Pre-commit hooks** run ESLint and Prettier checks before each commit

## Code Formatting & Linting

### Automatic Formatting

- Files are automatically formatted on save (VS Code)
- Prettier is configured with Tailwind CSS plugin
- ESLint fixes are applied on save

### Pre-commit Hooks

- **Husky** runs pre-commit checks automatically
- **lint-staged** validates only staged files
- ESLint and Prettier run on all staged `.js`, `.jsx`, `.ts`, `.tsx` files
- Prettier runs on `.json`, `.css`, `.md` files
- Commits are blocked if linting or formatting fails

## Project Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Format code
pnpm format
```

## Key Dependencies

- **Form handling**: Formik + Yup
- **Data fetching**: SWR (via custom useSwr hook)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React, React Icons
- **Animations**: Framer Motion
- **Notifications**: React Toastify
- **File uploads**: Cloudinary (via MediaService)
- **Utilities**: Lodash

---

**Remember**: Always read and follow these guidelines before generating any code for this project.
