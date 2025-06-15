import { databaseService } from "@/lib/database";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const userId = params.id;
  const profile = await databaseService.getProfile(userId);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
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
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {profile.first_name?.[0]}{profile.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
              <p className="text-gray-400">{profile.job_title || "No job title provided"}</p>
            </div>
          </div>
          
          {profile.linkedin_account && (
            <div>
              <h3 className="font-semibold text-gray-300 mb-2">Contact</h3>
              <a
                href={profile.linkedin_account}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
                <span>LinkedIn Profile</span>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 