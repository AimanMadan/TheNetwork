import { databaseService } from "@/lib/database";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, Mail } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ProfilePageProps {
  params: {
    id: string;
  };
  searchParams: {
    from?: string;
  }
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const userId = params.id;
  const profile = await databaseService.getProfile(userId);
  const backHref = searchParams.from || '/dashboard';

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-4">
        <Link href={backHref} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
        </Link>
      </div>
      <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Profile</CardTitle>
            <span className={`px-3 py-1 rounded-full text-sm ${
                profile.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
            }`}>
                {profile.role}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>
                {`${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
              <p className="text-gray-400">{profile.job_title || "No job title provided"}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Contact</h3>
            <div className="flex items-center gap-4">
              {profile.linkedin_account && (
                <a
                  href={profile.linkedin_account}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  aria-label="LinkedIn Profile"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label="Send an email"
                >
                  <Mail className="h-6 w-6" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 