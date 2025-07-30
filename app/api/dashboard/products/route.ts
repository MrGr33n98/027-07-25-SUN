import { NextRequest } from 'next/server'
import { withCompanyAuth, AuthContext } from '@/lib/middleware/auth-middleware'
import { withPermission } from '@/lib/middleware/auth-middleware'

/**
 * GET /api/dashboard/products - List company products
 */
export const GET = withCompanyAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const user = context.user!
    
    // Your business logic here - filter products by company
    // const products = await getProductsByCompany(user.companyId)
    
    return Response.json({
      success: true,
      message: 'Products retrieved successfully',
      // data: products
    })
  } catch (error) {
    console.error('Products API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/dashboard/products - Create new product (Company only)
 */
export const POST = withPermission('product', 'create', async (req: NextRequest, context: AuthContext) => {
  try {
    const body = await req.json()
    const user = context.user!
    
    // Validate request body
    if (!body.name || !body.description) {
      return Response.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    // Your business logic here
    // const newProduct = await createProduct({
    //   ...body,
    //   companyId: user.companyId
    // })
    
    return Response.json({
      success: true,
      message: 'Product created successfully',
      // data: newProduct
    }, { status: 201 })
  } catch (error) {
    console.error('Create product API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})