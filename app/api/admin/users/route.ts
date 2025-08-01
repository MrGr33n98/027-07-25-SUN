import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthContext } from '@/lib/middleware/auth-middleware'
import { RBACService, PERMISSIONS } from '@/lib/rbac'

/**
 * GET /api/admin/users - List all users (Admin only)
 */
export const GET = withAdminAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    // Additional permission check (optional, since withAdminAuth already checks admin role)
    if (!RBACService.hasPermission(context.user!.role, PERMISSIONS.ADMIN_USERS)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Your business logic here
    // const users = await getUsersList()
    
    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      // data: users
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/admin/users - Create new user (Admin only)
 */
export const POST = withAdminAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const body = await req.json()
    
    // Validate request body
    if (!body.email || !body.role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Your business logic here
    // const newUser = await createUser(body)
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      // data: newUser
    }, { status: 201 })
  } catch (error) {
    console.error('Create user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})