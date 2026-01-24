'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { TEST_SCENARIOS, type TestDataScenario } from '@/lib/test-data'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, TestTube } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface FinanceApplicationFormProps {
  proposalId: string
  systemPrice: number
  initialData?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }
  onSuccess?: (applicationId: string) => void
  onCancel?: () => void
}

export function FinanceApplicationForm({
  proposalId,
  systemPrice,
  initialData,
  onSuccess,
  onCancel,
}: FinanceApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip: initialData?.zip || '',
    ssn: '', // For testing purposes
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showTestData, setShowTestData] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    } else if (formData.state.length !== 2) {
      newErrors.state = 'State must be a 2-letter code (e.g., CA, NY)'
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'ZIP code must be 5 digits or 9 digits (12345 or 12345-6789)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/finance/lightreach/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalId,
          applicationData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            systemPrice,
            // Include SSN if provided (for testing)
            ...(formData.ssn && { ssn: formData.ssn }),
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit finance application')
      }

      toast.success('Finance application submitted successfully!')
      onSuccess?.(data.id)
    } catch (error) {
      console.error('Error submitting finance application:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit finance application. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const fillTestData = (scenario: TestDataScenario) => {
    setFormData({
      firstName: scenario.data.firstName,
      lastName: scenario.data.lastName,
      email: scenario.data.email,
      phone: scenario.data.phone,
      address: scenario.data.address,
      city: scenario.data.city,
      state: scenario.data.state,
      zip: scenario.data.zip,
      ssn: scenario.data.ssn || '',
    })
    setErrors({})
    toast.success(`Filled test data: ${scenario.name}`)
  }

  const isTestData = TEST_SCENARIOS.some(
    (s) =>
      formData.firstName === s.data.firstName &&
      formData.lastName === s.data.lastName &&
      formData.ssn === s.data.ssn
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Finance Application
          {isTestData && (
            <Badge variant="outline" className="text-xs">
              <TestTube className="size-3 mr-1" />
              Test Data
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Submit your finance application for this proposal. System price: ${systemPrice.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Test Data Helper */}
        <Collapsible open={showTestData} onOpenChange={setShowTestData}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={() => setShowTestData(!showTestData)}
            >
              <TestTube className="size-4 mr-2" />
              Test Data Helper
              <ChevronDown className={`size-4 ml-auto transition-transform ${showTestData ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-3">
                Quick-fill test data for testing different finance application scenarios. Click a scenario to auto-fill the form.
                <span className="block mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  ⚠️ Test mode: Using mock responses when API credentials are not configured
                </span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {TEST_SCENARIOS.map((scenario) => (
                  <Button
                    key={scenario.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2"
                    onClick={() => fillTestData(scenario)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{scenario.name}</div>
                      <div className="text-xs text-muted-foreground">{scenario.description}</div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {scenario.expectedStatus}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                required
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                required
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              aria-invalid={!!errors.phone}
              disabled={isSubmitting}
              required
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              aria-invalid={!!errors.address}
              disabled={isSubmitting}
              required
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                aria-invalid={!!errors.city}
                disabled={isSubmitting}
                required
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                aria-invalid={!!errors.state}
                disabled={isSubmitting}
                maxLength={2}
                placeholder="CA"
                required
              />
              {errors.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip">
                ZIP Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                aria-invalid={!!errors.zip}
                disabled={isSubmitting}
                placeholder="12345"
                required
              />
              {errors.zip && (
                <p className="text-sm text-destructive">{errors.zip}</p>
              )}
            </div>
          </div>

          {/* SSN Field (for testing) */}
          <div className="space-y-2">
            <Label htmlFor="ssn">
              Social Security Number (SSN) <span className="text-muted-foreground text-xs">(for testing only)</span>
            </Label>
            <Input
              id="ssn"
              value={formData.ssn}
              onChange={(e) => handleChange('ssn', e.target.value)}
              disabled={isSubmitting}
              placeholder="123-45-6789 (test scenarios)"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Use test SSNs from the test data helper above to trigger specific credit check responses.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2" />}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
