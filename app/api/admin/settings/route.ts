import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get system settings (in a real app, these would be stored in database)
    const settings = {
      general: {
        siteName: 'Solar Connect',
        siteDescription: 'Plataforma de conexão para energia solar',
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true
      },
      email: {
        provider: 'smtp',
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || '587',
        smtpUser: process.env.SMTP_USER || '',
        smtpSecure: true,
        fromEmail: process.env.FROM_EMAIL || 'noreply@solarconnect.com',
        fromName: 'Solar Connect'
      },
      payments: {
        stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
        stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        paypalEnabled: !!process.env.PAYPAL_CLIENT_ID,
        currency: 'BRL',
        commissionRate: 5.0
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 24, // hours
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireStrongPassword: true
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        adminAlerts: true
      }
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    // In a real app, you would save these settings to database
    // For now, we'll just return the updated settings
    console.log('Settings updated by admin:', session.user.email, settings);

    return NextResponse.json({ 
      success: true, 
      message: 'Configurações atualizadas com sucesso',
      settings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}