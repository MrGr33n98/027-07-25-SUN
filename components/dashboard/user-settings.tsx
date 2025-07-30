'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PasswordChangeForm } from '@/components/auth/password-change-form'
import { 
  Settings, 
  Shield, 
  User, 
  Bell,
  ChevronRight
} from 'lucide-react'

type SettingsSection = 'overview' | 'password' | 'notifications' | 'account'

export function UserSettings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('overview')

  const sections = [
    {
      id: 'overview' as const,
      title: 'Overview',
      description: 'General account settings',
      icon: Settings,
    },
    {
      id: 'password' as const,
      title: 'Password & Security',
      description: 'Change password and security settings',
      icon: Shield,
    },
    {
      id: 'notifications' as const,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
    },
    {
      id: 'account' as const,
      title: 'Account',
      description: 'Account information and preferences',
      icon: User,
    },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'password':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Password & Security</h2>
              <p className="text-gray-600 mb-6">
                Keep your account secure by using a strong password and enabling security features.
              </p>
            </div>
            
            <div className="flex justify-center">
              <PasswordChangeForm />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Use a strong password</p>
                    <p className="text-sm text-gray-600">
                      Include uppercase, lowercase, numbers, and special characters
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Change passwords regularly</p>
                    <p className="text-sm text-gray-600">
                      Update your password every 3-6 months for better security
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Don't reuse passwords</p>
                    <p className="text-sm text-gray-600">
                      Use unique passwords for different accounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Notification Preferences</h2>
              <p className="text-gray-600 mb-6">
                Choose how you want to be notified about important updates.
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center py-8">
                  Notification settings will be available soon.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Information</h2>
              <p className="text-gray-600 mb-6">
                Manage your account details and preferences.
              </p>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center py-8">
                  Account settings will be available soon.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings Overview</h2>
              <p className="text-gray-600 mb-6">
                Manage your account settings and preferences from the sections below.
              </p>
            </div>
            
            <div className="grid gap-4">
              {sections.slice(1).map((section) => {
                const Icon = section.icon
                return (
                  <Card 
                    key={section.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setActiveSection(section.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{section.title}</h3>
                            <p className="text-sm text-gray-600">{section.description}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-gray-500'}`} />
                      <span className="font-medium">{section.title}</span>
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}