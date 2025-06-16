"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          Welcome to The Network
        </h1>
        <p className="text-xl text-gray-300">
          Connect with professionals and grow your network
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-bold"
        >
          HOP IN
        </Button>
        <p className="text-gray-500 text-sm">No signup logic</p>
      </div>
    </div>
  )
}
