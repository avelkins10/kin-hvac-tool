"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Code, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface APIRoute {
  method: string
  path: string
  description: string
  requiresAuth: boolean
  requiresAdmin: boolean
}

const apiRoutes: APIRoute[] = [
  // Company Settings
  { method: 'GET', path: '/api/company/settings', description: 'Get company settings', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/settings', description: 'Update company settings', requiresAuth: true, requiresAdmin: true },
  
  // HVAC Systems
  { method: 'GET', path: '/api/company/hvac-systems', description: 'List all HVAC systems', requiresAuth: true, requiresAdmin: false },
  { method: 'POST', path: '/api/company/hvac-systems', description: 'Create HVAC system', requiresAuth: true, requiresAdmin: true },
  { method: 'GET', path: '/api/company/hvac-systems/[id]', description: 'Get HVAC system by ID', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/hvac-systems/[id]', description: 'Update HVAC system', requiresAuth: true, requiresAdmin: true },
  { method: 'DELETE', path: '/api/company/hvac-systems/[id]', description: 'Delete HVAC system', requiresAuth: true, requiresAdmin: true },
  
  // Add-Ons
  { method: 'GET', path: '/api/company/addons', description: 'List all add-ons', requiresAuth: true, requiresAdmin: false },
  { method: 'POST', path: '/api/company/addons', description: 'Create add-on', requiresAuth: true, requiresAdmin: true },
  { method: 'GET', path: '/api/company/addons/[id]', description: 'Get add-on by ID', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/addons/[id]', description: 'Update add-on', requiresAuth: true, requiresAdmin: true },
  { method: 'DELETE', path: '/api/company/addons/[id]', description: 'Delete add-on', requiresAuth: true, requiresAdmin: true },
  
  // Maintenance Plans
  { method: 'GET', path: '/api/company/maintenance-plans', description: 'List all maintenance plans', requiresAuth: true, requiresAdmin: false },
  { method: 'POST', path: '/api/company/maintenance-plans', description: 'Create maintenance plan', requiresAuth: true, requiresAdmin: true },
  { method: 'GET', path: '/api/company/maintenance-plans/[id]', description: 'Get maintenance plan by ID', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/maintenance-plans/[id]', description: 'Update maintenance plan', requiresAuth: true, requiresAdmin: true },
  { method: 'DELETE', path: '/api/company/maintenance-plans/[id]', description: 'Delete maintenance plan', requiresAuth: true, requiresAdmin: true },
  
  // Incentives
  { method: 'GET', path: '/api/company/incentives', description: 'List all incentives', requiresAuth: true, requiresAdmin: false },
  { method: 'POST', path: '/api/company/incentives', description: 'Create incentive', requiresAuth: true, requiresAdmin: true },
  { method: 'GET', path: '/api/company/incentives/[id]', description: 'Get incentive by ID', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/incentives/[id]', description: 'Update incentive', requiresAuth: true, requiresAdmin: true },
  { method: 'DELETE', path: '/api/company/incentives/[id]', description: 'Delete incentive', requiresAuth: true, requiresAdmin: true },
  
  // Financing Options
  { method: 'GET', path: '/api/company/financing-options', description: 'List all financing options', requiresAuth: true, requiresAdmin: false },
  { method: 'POST', path: '/api/company/financing-options', description: 'Create financing option', requiresAuth: true, requiresAdmin: true },
  { method: 'GET', path: '/api/company/financing-options/[id]', description: 'Get financing option by ID', requiresAuth: true, requiresAdmin: false },
  { method: 'PATCH', path: '/api/company/financing-options/[id]', description: 'Update financing option', requiresAuth: true, requiresAdmin: true },
  { method: 'DELETE', path: '/api/company/financing-options/[id]', description: 'Delete financing option', requiresAuth: true, requiresAdmin: true },
  
  // Labor Rates
  { method: 'GET', path: '/api/company/labor-rates', description: 'List all labor rates', requiresAuth: true, requiresAdmin: false },
  
  // Materials
  { method: 'GET', path: '/api/company/materials', description: 'List all materials', requiresAuth: true, requiresAdmin: false },
  { method: 'GET', path: '/api/company/materials/[id]', description: 'Get material by ID', requiresAuth: true, requiresAdmin: false },
  
  // Permits
  { method: 'GET', path: '/api/company/permits', description: 'List all permit fees', requiresAuth: true, requiresAdmin: false },
  
  // Price Book
  { method: 'GET', path: '/api/company/pricebook', description: 'Get price book data', requiresAuth: true, requiresAdmin: false },
]

export function APIRoutesManager() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPath(text)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedPath(null), 2000)
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500'
      case 'POST':
        return 'bg-green-500'
      case 'PATCH':
        return 'bg-yellow-500'
      case 'DELETE':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const groupedRoutes = apiRoutes.reduce((acc, route) => {
    const basePath = route.path.split('/').slice(0, 4).join('/')
    if (!acc[basePath]) {
      acc[basePath] = []
    }
    acc[basePath].push(route)
    return acc
  }, {} as Record<string, APIRoute[]>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Routes Reference
          </CardTitle>
          <CardDescription>
            Complete list of available company configuration API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedRoutes).map(([basePath, routes]) => (
              <div key={basePath} className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">{basePath}</h3>
                <div className="space-y-2">
                  {routes.map((route, idx) => (
                    <div
                      key={`${route.method}-${route.path}-${idx}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Badge className={getMethodColor(route.method)}>
                          {route.method}
                        </Badge>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {route.path}
                        </code>
                        <span className="text-sm text-gray-600">{route.description}</span>
                        {route.requiresAdmin && (
                          <Badge variant="outline" className="text-xs">
                            Admin Only
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(route.path)}
                        className="h-8 w-8"
                      >
                        {copiedPath === route.path ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
