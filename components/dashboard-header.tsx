"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface DashboardHeaderProps {
  firstName: string
  onSignOut: () => void
}

export function DashboardHeader({ firstName, onSignOut }: DashboardHeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold text-white">Dashboard</div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {firstName}!</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
