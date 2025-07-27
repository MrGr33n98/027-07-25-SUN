import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Mock content data (in a real app, this would come from database)
    const content = {
      pages: [
        {
          id: '1',
          title: 'Sobre Nós',
          slug: 'sobre',
          content: 'Conteúdo da página sobre...',
          status: 'published',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-02-01')
        },
        {
          id: '2',
          title: 'Termos de Uso',
          slug: 'termos',
          content: 'Termos de uso da plataforma...',
          status: 'published',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20')
        }
      ],
      banners: [
        {
          id: '1',
          title: 'Banner Principal',
          image: '/images/banner-home.jpg',
          link: '/marketplace',
          position: 'home-hero',
          status: 'active',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
        {
          id: '2',
          title: 'Promoção Painéis',
          image: '/images/banner-promo.jpg',
          link: '/marketplace?category=paineis',
          position: 'marketplace-top',
          status: 'active',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-31')
        }
      ],
      announcements: [
        {
          id: '1',
          title: 'Nova funcionalidade disponível',
          content: 'Agora você pode comparar produtos diretamente...',
          type: 'info',
          status: 'active',
          startDate: new Date('2024-02-15'),
          endDate: new Date('2024-03-15')
        }
      ]
    };

    if (type === 'all') {
      return NextResponse.json(content);
    } else {
      return NextResponse.json({ [type]: content[type as keyof typeof content] || [] });
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data } = await request.json();

    // In a real app, you would save to database
    const newContent = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log(`New ${type} created:`, newContent);

    return NextResponse.json({ 
      success: true, 
      message: `${type} criado com sucesso`,
      data: newContent 
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}