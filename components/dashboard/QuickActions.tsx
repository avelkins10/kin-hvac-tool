"use client"

import { Button } from '@/components/ui/button'
import { Plus, Send, Users, Settings } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>

      <div className="space-y-2">
        <Link href="/builder">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </Link>

        <Link href="/proposals?status=DRAFT">
          <Button className="w-full justify-start" variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send All Drafts
          </Button>
        </Link>

        <Link href="/clients">
          <Button className="w-full justify-start" variant="outline">
            <Users className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Link>

        <Link href="/builder">
          <Button className="w-full justify-start" variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Proposal Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
