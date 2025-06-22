# TheNetwork

A full-stack web application for managing and joining organizations (similar to WhatsApp groups), with role-based dashboards for users and admins. Authentication is exclusively via LinkedIn OIDC. The app ensures all user profiles are complete before granting dashboard access.

---

## Project Overview
- Users can join organizations created by admins.
- All users can see all organizations, but only see members of organizations they belong to.
- Admins can see all organizations and all members in every organization.
- Onboarding flow ensures all required user info is collected after LinkedIn sign-in.
- Users can leave organizations they have joined.
- Admins can accept or reject join requests, and promote users to admin status.

---

## Tech Stack
- **Frontend:** Next.js (React, TypeScript, Tailwind CSS) Built with v0
- **Backend:** Supabase (SupabasePostgres,SupabaseAuth, API to manage users and organizations)
- **Authentication:** LinkedIn OIDC (OAuth 2.0 scopes: openid, profile image, email) using **Supabase Auth** 
- **Deployment:** Vercel

---

## Features
- LinkedIn-only sign-in (no other login methods)
- Onboarding page if missing user info (first name, last name, email, job title, LinkedIn URL)
- Role-based dashboards:
  - **User:** Sees all orgs, but only members of their orgs

  - **Admin:** Sees all orgs 
- Organization management (admins create orgs, users join/leave orgs)
- Join requests: users request to join orgs, admins accept/reject
- Admins can promote users to admin status (only admins can update user status)
- Profile management (view/update profile)

---

## Authentication & Onboarding Flow
1. **User visits login page:**
   - Only LinkedIn OIDC is available.
   - OAuth 2.0 scopes: `openid`, `profile`, `email`.

2. **After sign-in:**
   - App checks if user profile is complete (first name, last name, email, job title, LinkedIn URL).
   - If incomplete, user is redirected to `/onboarding` to fill missing info.
   - On completion, user is redirected to their dashboard.

---

## Organization and Member Visibility
- **All users** can view a list of all organizations in the system.
- For each organization:
  - If the user is a member, they can view the list of members in that organization.
  - If the user is not a member, the member list is hidden.
- **Admins** can view all organizations and all members, regardless of their own memberships in the organization.

---

## Organization Membership Management

### For Users
- Users can request to join any organization.
- Users can leave organizations they are members of.
- Users can only see the member list of organizations they have joined.

### For Admins
- Admins can view all organizations and all members.
- Admins can see and manage pending join requests for each organization.
- Admins can accept or reject join requests.
- Admins can promote users to admin status within an organization.
- Only admins can update a user's status from 'user' to 'admin'.

### Permissions Table

| Action                  | User | Admin |
|-------------------------|------|-------|
| Join org                | Yes  | Yes   |
| Leave org               | Yes  | Yes   |
| See all orgs            | Yes  | Yes   |
| See all members         | No   | Yes   |
| See members (joined org)| Yes  | Yes   |
| Accept/reject requests  | No   | Yes   |
| Promote to admin        | No   | Yes   |

---

## Database Structure

- **profiles:**
  - `id`
  - `first_name`
  - `last_name`
  - `email`
  - `job_title`
  - `linkedin_account`
  - `avatar_url`
  - `role` **Admin or User**
- **organizations:**
  - `id` 
  - `name`
- **user_orgs:** (junction table for many-to-many relationship)
  - `user_id` -> foreign key to profiles table
  - `org_id` -> foreign key to organizations table
  - `status` **'pending', 'approved', 'rejected'**

---

## API Endpoints

The application primarily uses a database service pattern for data operations, with REST API endpoints that include role-based access control. Admin users have enhanced capabilities across all endpoints.

### REST API Endpoints

- **`/api/organizations`**
  - `GET`: List all organizations 

- **`/api/users`**
  - `GET`: Get filtered user information with role-based access:
    - **Admin users**: Can filter by any organization and see all users
    - **Regular users**: Can only filter by organizations they are approved members of
    - Query parameters:
      - `query`: Search by first name or last name
      - `roles`: Filter by user roles (array)
      - `jobTitles`: Filter by job titles (array)
      - `organizationIds`: Filter by organization membership (array)
  - **No PATCH endpoint** - Profile updates are handled through database service

- **`/api/users/filters`**
  - `GET`: Get available filter options (job titles and roles) for users
    - **Admin users**: Can get filter options for any organization
    - **Regular users**: Can only get filter options for organizations they belong to
    - Query parameters:
      - `organizationIds`: Filter options by organization membership (array)

- **`/auth/callback`**
  - `GET`: OAuth callback handler for LinkedIn authentication
  - Redirects to dashboard or onboarding based on profile completion

### Database Service Operations

Most application operations are handled through the `databaseService` in `lib/database.ts`:

#### Profile Management
- `getAllProfiles()`: Get all user profiles (admin only - uses RPC function `get_all_profiles_admin`)
- `getPaginatedProfiles()`: Get paginated user profiles (admin only - uses RPC function `get_all_profiles_admin`)
- `getProfile(userId)`: Get single user profile
- `updateProfile(userId, profileData)`: Create or update user profile

#### Organization Management
- `getAllOrganizations()`: Get all organizations
- `createOrganization(name)`: Create new organization (admin only - enforced by RLS)
- `deleteOrganization(id)`: Delete organization and relationships (admin only - enforced by RLS)

#### User-Organization Relationships
- `requestToJoin(userId, organizationId)`: Request to join organization
  - **Admin users**: Automatically approved
  - **Regular users**: Status set to pending
- `cancelJoinRequest(userId, organizationId)`: Cancel pending join request
- `leaveOrganization(userId, organizationId)`: Leave approved organization
- `approveMembershipRequest(userId, organizationId)`: Approve join request (admin only)
- `rejectMembershipRequest(userId, organizationId)`: Reject join request (admin only)
- `getUserMemberships(userId)`: Get user's organization memberships
- `getOrganizationMembers(orgId)`: Get organization members
  - **Admin users**: Can view members of any organization
  - **Regular users**: Can only view members of organizations they are approved members of
- `getPendingRequests(orgId)`: Get pending join requests (admin only)

#### User Management (Admin Only)
- `updateUserRole(userId, role)`: Update user role (admin only - uses RPC function `update_user_role_admin`)
- `getOrganizationMemberCounts()`: Get member counts per organization
- `getOrganizationPendingCounts()`: Get pending request counts per organization

### Database Schema

Based on the code analysis, the actual database schema includes fields not reflected in the generated types:

#### Profiles Table
- `id` (string, primary key)
- `email` (string)
- `first_name` (string, nullable)
- `last_name` (string, nullable)
- `job_title` (string, nullable)
- `linkedin_account` (string, nullable)
- `avatar_url` (string, nullable)
- `role` (string, nullable)

#### Organizations Table
- `id` (number, primary key)
- `name` (string)

#### User_Organizations Table
- `user_id` (string, foreign key to profiles.id)
- `organization_id` (number, foreign key to organizations.id)
- `status` (enum: 'pending' | 'approved') - **Missing from generated types**

### RPC Functions Used

The application uses several Supabase RPC functions for admin operations:

- `get_all_profiles_admin()`: Bypasses RLS to get all user profiles (admin only)
- `update_user_role_admin(target_user_id, new_role)`: Updates user roles (admin only)
- `get_memberships_by_org_ids(org_ids)`: Gets memberships for multiple organizations

### Admin-Specific Features

#### Enhanced API Access
- **User Filtering**: Admins can filter users by any organization, while regular users are restricted to their own organizations
- **Filter Options**: Admins can get filter options for all organizations
- **Member Visibility**: Admins can view members of any organization

#### Database Service Admin Operations
- **User Role Management**: Update user roles between 'user' and 'admin'
- **Organization Management**: Create and delete organizations (no REST API endpoints)
- **Request Management**: Approve/reject join requests for any organization
- **Full Profile Access**: Access all user profiles through RPC functions
- **Automatic Approval**: Admin join requests are automatically approved

### Important Notes

#### Organization Creation
- **No REST API endpoint exists** for creating organizations
- Organization creation is handled exclusively through the `databaseService.createOrganization()` method
- This method is called directly from the frontend components (e.g., `AdminOrganizationManagement`)
- Admin-only access is enforced through Supabase Row Level Security (RLS)

#### API Endpoint Limitations
- The application uses a **hybrid approach**: REST API endpoints for data retrieval and filtering, database service for mutations
- This design choice provides better security through RLS enforcement and reduces API endpoint complexity
- All admin operations that modify data (create/delete organizations, update roles, approve/reject requests) are handled through the database service

#### Database Types Discrepancy
- The generated `database.types.ts` file is incomplete and missing several fields:
  - `role` field in profiles table
  - `status` field in user_organizations table
- The application uses a custom `types.ts` file that includes these missing fields
- RPC functions used by the application are not documented in the generated types

### Authentication & Authorization
- LinkedIn OIDC authentication via Supabase Auth
- All API endpoints require authentication
- Role-based access control enforced through:
  - Row Level Security (RLS) in Supabase
  - RPC functions for admin-only operations
  - Client-side role checks in API endpoints

---

## Folder Structure
- `app/` – Next.js app directory (routes, pages, API)
- `components/` – Reusable UI components
- `components/ui/` – Atomic UI components
- `hooks/` – Custom React hooks
- `lib/` – Utility libraries (auth, database, types, supabase client)
- `public/` – Static assets
- `styles/` – Global styles (Tailwind)

---

## How to Run Locally
1. Clone the repo.
2. Install dependencies: `npm install` 
3. Set up Supabase project and tables as described above.
4. Configure environment variables for Supabase and LinkedIn OIDC.
5. Run the dev server: `npm run dev`
6. Visit `/login` to sign in with LinkedIn.

---

## Deployment
- Deployed on Vercel.
- Ensure environment variables are set in Vercel dashboard.

---

## Security & Best Practices
- All sensitive info is stored securely in Supabase.
- Only admins can create orgs and view all members.
- Users can only see members of orgs they belong to.
- All API routes are protected and check user roles.
- Only admins can update user status (user to admin) and manage join requests.

---

