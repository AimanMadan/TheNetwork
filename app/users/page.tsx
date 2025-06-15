import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card } from "@/components/ui/card"

export default function UserDirectory() {
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
              <Input placeholder="Search by name or email" className="col-span-1 md:col-span-2" />
              <Select>
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
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">John Doe</h3>
              <p className="text-gray-500 dark:text-gray-400">Software Engineer</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">Jane Smith</h3>
              <p className="text-gray-500 dark:text-gray-400">UX Designer</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>MJ</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">Michael Johnson</h3>
              <p className="text-gray-500 dark:text-gray-400">Project Manager</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>EC</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">Emily Carter</h3>
              <p className="text-gray-500 dark:text-gray-400">Data Scientist</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>DB</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">David Brown</h3>
              <p className="text-gray-500 dark:text-gray-400">Marketing Specialist</p>
            </Card>
            <Card className="p-4 flex flex-col items-center">
              <Avatar className="w-20 h-20 mb-4">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OL</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold">Olivia Lee</h3>
              <p className="text-gray-500 dark:text-gray-400">Content Strategist</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 