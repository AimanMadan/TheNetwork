"use client"

import { useAuth } from "@/app/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { FaLinkedin } from "react-icons/fa"

export default function HomePage() {
  const { signInWithLinkedIn } = useAuth()

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
          onClick={signInWithLinkedIn}
          className="bg-[#0077B5] hover:bg-[#006399] text-white px-8 py-6 text-lg"
        >
          <FaLinkedin className="mr-2 h-6 w-6" />
          Sign in with LinkedIn
        </Button>
      </div>
    </div>
  )
}
