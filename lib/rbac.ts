import { UserRole } from '@prisma/client'

/**
 * Role-based access control (RBAC) system
 * Defines permissions and access control for different user roles
 */

export interface Permission {
    resource: string
    action: string
    conditions?: Record<string, any>
}

export interface PermissionContext {
    userId?: string
    companyId?: string
    resourceOwnerId?: string
    [key: string]: any
}

export interface RolePermissions {
    role: UserRole
    permissions: Permission[]
    inherits?: UserRole[]
}

/**
 * Define permissions for each resource and action
 */
export const PERMISSIONS = {
    // User management
    USER_READ: { resource: 'user', action: 'read' },
    USER_UPDATE: { resource: 'user', action: 'update' },
    USER_DELETE: { resource: 'user', action: 'delete' },
    USER_LIST: { resource: 'user', action: 'list' },

    // Company management
    COMPANY_READ: { resource: 'company', action: 'read' },
    COMPANY_CREATE: { resource: 'company', action: 'create' },
    COMPANY_UPDATE: { resource: 'company', action: 'update' },
    COMPANY_DELETE: { resource: 'company', action: 'delete' },
    COMPANY_LIST: { resource: 'company', action: 'list' },
    COMPANY_VERIFY: { resource: 'company', action: 'verify' },

    // Product management
    PRODUCT_READ: { resource: 'product', action: 'read' },
    PRODUCT_CREATE: { resource: 'product', action: 'create' },
    PRODUCT_UPDATE: { resource: 'product', action: 'update' },
    PRODUCT_DELETE: { resource: 'product', action: 'delete' },
    PRODUCT_LIST: { resource: 'product', action: 'list' },
    PRODUCT_MODERATE: { resource: 'product', action: 'moderate' },

    // Review management
    REVIEW_READ: { resource: 'review', action: 'read' },
    REVIEW_CREATE: { resource: 'review', action: 'create' },
    REVIEW_UPDATE: { resource: 'review', action: 'update' },
    REVIEW_DELETE: { resource: 'review', action: 'delete' },
    REVIEW_MODERATE: { resource: 'review', action: 'moderate' },

    // Project management
    PROJECT_READ: { resource: 'project', action: 'read' },
    PROJECT_CREATE: { resource: 'project', action: 'create' },
    PROJECT_UPDATE: { resource: 'project', action: 'update' },
    PROJECT_DELETE: { resource: 'project', action: 'delete' },
    PROJECT_MODERATE: { resource: 'project', action: 'moderate' },

    // Lead management
    LEAD_READ: { resource: 'lead', action: 'read' },
    LEAD_CREATE: { resource: 'lead', action: 'create' },
    LEAD_UPDATE: { resource: 'lead', action: 'update' },
    LEAD_DELETE: { resource: 'lead', action: 'delete' },

    // Quote management
    QUOTE_READ: { resource: 'quote', action: 'read' },
    QUOTE_CREATE: { resource: 'quote', action: 'create' },
    QUOTE_UPDATE: { resource: 'quote', action: 'update' },
    QUOTE_DELETE: { resource: 'quote', action: 'delete' },

    // Appointment management
    APPOINTMENT_READ: { resource: 'appointment', action: 'read' },
    APPOINTMENT_CREATE: { resource: 'appointment', action: 'create' },
    APPOINTMENT_UPDATE: { resource: 'appointment', action: 'update' },
    APPOINTMENT_DELETE: { resource: 'appointment', action: 'delete' },

    // Message management
    MESSAGE_READ: { resource: 'message', action: 'read' },
    MESSAGE_CREATE: { resource: 'message', action: 'create' },
    MESSAGE_UPDATE: { resource: 'message', action: 'update' },
    MESSAGE_DELETE: { resource: 'message', action: 'delete' },

    // Admin functions
    ADMIN_DASHBOARD: { resource: 'admin', action: 'dashboard' },
    ADMIN_USERS: { resource: 'admin', action: 'users' },
    ADMIN_COMPANIES: { resource: 'admin', action: 'companies' },
    ADMIN_MODERATION: { resource: 'admin', action: 'moderation' },
    ADMIN_SECURITY: { resource: 'admin', action: 'security' },
    ADMIN_SYSTEM: { resource: 'admin', action: 'system' },
} as const

/**
 * Role definitions with their permissions
 */
export const ROLE_PERMISSIONS: RolePermissions[] = [
    {
        role: UserRole.CUSTOMER,
        permissions: [
            PERMISSIONS.USER_READ,
            PERMISSIONS.USER_UPDATE,
            PERMISSIONS.COMPANY_READ,
            PERMISSIONS.COMPANY_LIST,
            PERMISSIONS.PRODUCT_READ,
            PERMISSIONS.PRODUCT_LIST,
            PERMISSIONS.REVIEW_READ,
            PERMISSIONS.REVIEW_CREATE,
            PERMISSIONS.PROJECT_READ,
            PERMISSIONS.LEAD_CREATE,
            PERMISSIONS.QUOTE_READ,
            PERMISSIONS.APPOINTMENT_READ,
            PERMISSIONS.APPOINTMENT_CREATE,
            PERMISSIONS.MESSAGE_READ,
            PERMISSIONS.MESSAGE_CREATE,
        ],
    },
    {
        role: UserRole.COMPANY,
        permissions: [
            PERMISSIONS.USER_READ,
            PERMISSIONS.USER_UPDATE,
            PERMISSIONS.COMPANY_READ,
            PERMISSIONS.COMPANY_CREATE,
            PERMISSIONS.COMPANY_UPDATE,
            PERMISSIONS.COMPANY_LIST,
            PERMISSIONS.PRODUCT_READ,
            PERMISSIONS.PRODUCT_CREATE,
            PERMISSIONS.PRODUCT_UPDATE,
            PERMISSIONS.PRODUCT_DELETE,
            PERMISSIONS.PRODUCT_LIST,
            PERMISSIONS.REVIEW_READ,
            PERMISSIONS.PROJECT_READ,
            PERMISSIONS.PROJECT_CREATE,
            PERMISSIONS.PROJECT_UPDATE,
            PERMISSIONS.PROJECT_DELETE,
            PERMISSIONS.LEAD_READ,
            PERMISSIONS.LEAD_UPDATE,
            PERMISSIONS.QUOTE_READ,
            PERMISSIONS.QUOTE_CREATE,
            PERMISSIONS.QUOTE_UPDATE,
            PERMISSIONS.QUOTE_DELETE,
            PERMISSIONS.APPOINTMENT_READ,
            PERMISSIONS.APPOINTMENT_CREATE,
            PERMISSIONS.APPOINTMENT_UPDATE,
            PERMISSIONS.APPOINTMENT_DELETE,
            PERMISSIONS.MESSAGE_READ,
            PERMISSIONS.MESSAGE_CREATE,
            PERMISSIONS.MESSAGE_UPDATE,
        ],
    },
    {
        role: UserRole.ADMIN,
        permissions: [
            // All user permissions
            PERMISSIONS.USER_READ,
            PERMISSIONS.USER_UPDATE,
            PERMISSIONS.USER_DELETE,
            PERMISSIONS.USER_LIST,

            // All company permissions
            PERMISSIONS.COMPANY_READ,
            PERMISSIONS.COMPANY_CREATE,
            PERMISSIONS.COMPANY_UPDATE,
            PERMISSIONS.COMPANY_DELETE,
            PERMISSIONS.COMPANY_LIST,
            PERMISSIONS.COMPANY_VERIFY,

            // All product permissions
            PERMISSIONS.PRODUCT_READ,
            PERMISSIONS.PRODUCT_CREATE,
            PERMISSIONS.PRODUCT_UPDATE,
            PERMISSIONS.PRODUCT_DELETE,
            PERMISSIONS.PRODUCT_LIST,
            PERMISSIONS.PRODUCT_MODERATE,

            // All review permissions
            PERMISSIONS.REVIEW_READ,
            PERMISSIONS.REVIEW_CREATE,
            PERMISSIONS.REVIEW_UPDATE,
            PERMISSIONS.REVIEW_DELETE,
            PERMISSIONS.REVIEW_MODERATE,

            // All project permissions
            PERMISSIONS.PROJECT_READ,
            PERMISSIONS.PROJECT_CREATE,
            PERMISSIONS.PROJECT_UPDATE,
            PERMISSIONS.PROJECT_DELETE,
            PERMISSIONS.PROJECT_MODERATE,

            // All lead permissions
            PERMISSIONS.LEAD_READ,
            PERMISSIONS.LEAD_CREATE,
            PERMISSIONS.LEAD_UPDATE,
            PERMISSIONS.LEAD_DELETE,

            // All quote permissions
            PERMISSIONS.QUOTE_READ,
            PERMISSIONS.QUOTE_CREATE,
            PERMISSIONS.QUOTE_UPDATE,
            PERMISSIONS.QUOTE_DELETE,

            // All appointment permissions
            PERMISSIONS.APPOINTMENT_READ,
            PERMISSIONS.APPOINTMENT_CREATE,
            PERMISSIONS.APPOINTMENT_UPDATE,
            PERMISSIONS.APPOINTMENT_DELETE,

            // All message permissions
            PERMISSIONS.MESSAGE_READ,
            PERMISSIONS.MESSAGE_CREATE,
            PERMISSIONS.MESSAGE_UPDATE,
            PERMISSIONS.MESSAGE_DELETE,

            // Admin-specific permissions
            PERMISSIONS.ADMIN_DASHBOARD,
            PERMISSIONS.ADMIN_USERS,
            PERMISSIONS.ADMIN_COMPANIES,
            PERMISSIONS.ADMIN_MODERATION,
            PERMISSIONS.ADMIN_SECURITY,
            PERMISSIONS.ADMIN_SYSTEM,
        ],
    },
]

/**
 * RBAC service for checking permissions
 */
export class RBACService {
    private static rolePermissionsMap: Map<UserRole, Permission[]> = new Map()

    static {
        // Initialize role permissions map
        ROLE_PERMISSIONS.forEach(rolePermission => {
            this.rolePermissionsMap.set(rolePermission.role, rolePermission.permissions)
        })
    }

    /**
     * Check if a user role has a specific permission
     */
    static hasPermission(userRole: UserRole, permission: Permission): boolean {
        const rolePermissions = this.rolePermissionsMap.get(userRole)
        if (!rolePermissions) return false

        return rolePermissions.some(p =>
            p.resource === permission.resource && p.action === permission.action
        )
    }

    /**
     * Check if a user role can access a specific resource with an action
     */
    static canAccess(userRole: UserRole, resource: string, action: string): boolean {
        return this.hasPermission(userRole, { resource, action })
    }

    /**
     * Get all permissions for a role
     */
    static getRolePermissions(userRole: UserRole): Permission[] {
        return this.rolePermissionsMap.get(userRole) || []
    }

    /**
     * Check if user role can access admin features
     */
    static isAdmin(userRole: UserRole): boolean {
        return userRole === UserRole.ADMIN
    }

    /**
     * Check if user role can access company features
     */
    static isCompany(userRole: UserRole): boolean {
        return userRole === UserRole.COMPANY || userRole === UserRole.ADMIN
    }

    /**
     * Check if user role can access customer features
     */
    static isCustomer(userRole: UserRole): boolean {
        return userRole === UserRole.CUSTOMER || userRole === UserRole.ADMIN
    }

    /**
     * Check if user can access dashboard based on role
     */
    static canAccessDashboard(userRole: UserRole): boolean {
        return userRole === UserRole.COMPANY || userRole === UserRole.ADMIN
    }

    /**
     * Check if user can access admin panel
     */
    static canAccessAdmin(userRole: UserRole): boolean {
        return userRole === UserRole.ADMIN
    }

    /**
     * Get required role for a specific route pattern
     */
    static getRequiredRole(routePath: string): UserRole | null {
        if (routePath === '/admin' || routePath.startsWith('/admin/')) {
            return UserRole.ADMIN
        }
        if (routePath === '/dashboard' || routePath.startsWith('/dashboard/')) {
            return UserRole.COMPANY
        }
        // Public routes don't require specific roles
        return null
    }

    /**
     * Check if user can access a specific route
     */
    static canAccessRoute(userRole: UserRole, routePath: string): boolean {
        const requiredRole = this.getRequiredRole(routePath)

        if (!requiredRole) {
            return true // Public route
        }

        if (requiredRole === UserRole.ADMIN) {
            return userRole === UserRole.ADMIN
        }

        if (requiredRole === UserRole.COMPANY) {
            return userRole === UserRole.COMPANY || userRole === UserRole.ADMIN
        }

        return false
    }

    /**
     * Check permission with context (for conditional permissions)
     */
    static hasPermissionWithContext(
        userRole: UserRole,
        permission: Permission,
        context?: PermissionContext
    ): boolean {
        const rolePermissions = this.rolePermissionsMap.get(userRole)
        if (!rolePermissions) return false

        const matchingPermission = rolePermissions.find(p =>
            p.resource === permission.resource && p.action === permission.action
        )

        if (!matchingPermission) return false

        // If no conditions, permission is granted
        if (!matchingPermission.conditions || !context) {
            return true
        }

        // Check conditions
        return this.evaluateConditions(matchingPermission.conditions, context)
    }

    /**
     * Evaluate permission conditions
     */
    private static evaluateConditions(
        conditions: Record<string, any>,
        context: PermissionContext
    ): boolean {
        for (const [key, value] of Object.entries(conditions)) {
            switch (key) {
                case 'owner':
                    if (value === true && context.userId !== context.resourceOwnerId) {
                        return false
                    }
                    break
                case 'sameCompany':
                    if (value === true && context.companyId !== context.resourceOwnerId) {
                        return false
                    }
                    break
                case 'roles':
                    if (Array.isArray(value) && !value.includes(context.userId)) {
                        return false
                    }
                    break
                default:
                    if (context[key] !== value) {
                        return false
                    }
            }
        }
        return true
    }

    /**
     * Check if user can perform action on specific resource with context
     */
    static canAccessWithContext(
        userRole: UserRole,
        resource: string,
        action: string,
        context?: PermissionContext
    ): boolean {
        return this.hasPermissionWithContext(userRole, { resource, action }, context)
    }
}

/**
 * Route protection configuration
 */
export const PROTECTED_ROUTES = {
    // Admin routes - require ADMIN role
    ADMIN: [
        '/admin',
        '/admin/dashboard',
        '/admin/users',
        '/admin/companies',
        '/admin/moderation',
        '/admin/security',
        '/admin/system',
    ],

    // Company dashboard routes - require COMPANY role (or ADMIN)
    COMPANY: [
        '/dashboard',
        '/dashboard/profile',
        '/dashboard/products',
        '/dashboard/projects',
        '/dashboard/leads',
        '/dashboard/quotes',
        '/dashboard/appointments',
        '/dashboard/messages',
        '/dashboard/analytics',
    ],

    // Routes that require email verification
    EMAIL_VERIFIED: [
        '/dashboard',
        '/admin',
        '/marketplace/create',
        '/company/create',
        '/messages',
        '/appointments',
        '/quotes',
    ],
} as const

/**
 * Check if route requires email verification
 */
export function requiresEmailVerification(routePath: string): boolean {
    return PROTECTED_ROUTES.EMAIL_VERIFIED.some(route =>
        routePath === route || routePath.startsWith(route + '/')
    )
}

/**
 * Check if route is protected and requires authentication
 */
export function isProtectedRoute(routePath: string): boolean {
    const allProtectedRoutes = [
        ...PROTECTED_ROUTES.ADMIN,
        ...PROTECTED_ROUTES.COMPANY,
        ...PROTECTED_ROUTES.EMAIL_VERIFIED,
    ]

    return allProtectedRoutes.some(route =>
        routePath === route || routePath.startsWith(route + '/')
    )
}