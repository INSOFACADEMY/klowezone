import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuthMiddleware, hasPermission } from '@/middleware/admin-auth'
import { z } from 'zod'

// Validation schema for blog post
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  publishedAt: z.string().datetime().optional()
})

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authRequest = await adminAuthMiddleware(request)
    if (authRequest instanceof NextResponse) return authRequest

    const user = (authRequest as any).user
    if (!hasPermission(user, 'posts.read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blogPost.count({ where })
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user
    const authRequest = await adminAuthMiddleware(request)
    if (authRequest instanceof NextResponse) return authRequest

    const user = (authRequest as any).user
    if (!hasPermission(user, 'posts.create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = blogPostSchema.parse(body)

    // Generate slug if not provided
    let slug = validatedData.slug
    if (!slug) {
      slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Check if slug is unique
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })

    if (existingPost) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      )
    }

    // Create blog post
    const post = await prisma.blogPost.create({
      data: {
        ...validatedData,
        slug,
        authorId: user.id,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'create',
        resource: 'post',
        resourceId: post.id,
        newValues: { title: post.title, status: post.status },
        userId: user.id
      }
    })

    return NextResponse.json(post, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



