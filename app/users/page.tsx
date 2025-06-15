"use client"
import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

export default function UserDirectory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const users = [
    {
      id: 1,
      name: "John Doe",
      role: "Software Engineer",
      avatar: "/placeholder-user.jpg",
      fallback: "JD",
    },
    {
      id: 2,
      name: "Jane Smith",
      role: "UX Designer",
      avatar: "/placeholder-user.jpg",
      fallback: "JS",
    },
    {
      id: 3,
      name: "Michael Johnson",
      role: "Project Manager",
      avatar: "/placeholder-user.jpg",
      fallback: "MJ",
    },
    {
      id: 4,
      name: "Emily Carter",
      role: "Data Scientist",
      avatar: "/placeholder-user.jpg",
      fallback: "EC",
    },
    {
      id: 5,
      name: "David Brown",
      role: "Marketing Specialist",
      avatar: "/placeholder-user.jpg",
      fallback: "DB",
    },
    {
      id: 6,
      name: "Olivia Lee",
      role: "Content Strategist",
      avatar: "/placeholder-user.jpg",
      fallback: "OL",
    },
  ]
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    const nameMatch = user.name.toLowerCase().includes(query)
    const roleMatch = roleFilter === "all" || user.role.toLowerCase() === roleFilter
    return nameMatch && roleMatch
  })
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>UA</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">John Doe</h1>
              <p className="text-gray-400">Software Engineer</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by name or email"
                className="col-span-1 md:col-span-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.fallback}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold">{user.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 