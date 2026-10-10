import type { Role } from "./enums";

// =====================================================================
//  Role-based access control
// =====================================================================

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ALL_LEADS: "view_all_leads",
  EDIT_LEADS: "edit_leads",
  DELETE_LEADS: "delete_leads",
  IMPORT_LEADS: "import_leads",
  RUN_AI_CALLS: "run_ai_calls",
  MANAGE_CAMPAIGNS: "manage_campaigns",
  MANAGE_USERS: "manage_users",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_TICKETS: "manage_tickets",
  MANAGE_BILLING: "manage_billing",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL: Permission[] = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: ALL,
  MANAGER: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.IMPORT_LEADS,
    PERMISSIONS.RUN_AI_CALLS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_TICKETS,
    PERMISSIONS.MANAGE_BILLING,
  ],
  TEAM_LEAD: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.IMPORT_LEADS,
    PERMISSIONS.RUN_AI_CALLS,
    PERMISSIONS.MANAGE_TICKETS,
  ],
  AGENT: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.RUN_AI_CALLS,
    PERMISSIONS.MANAGE_TICKETS,
  ],
  TECHNICIAN: [PERMISSIONS.VIEW_DASHBOARD],
  ACCOUNTANT: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.MANAGE_BILLING,
  ],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
