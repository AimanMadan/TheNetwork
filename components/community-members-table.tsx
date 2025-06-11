import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Profile } from "@/lib/types"

interface CommunityMembersTableProps {
  members: Profile[]
}

export function CommunityMembersTable({ members }: CommunityMembersTableProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Community Members</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">First Name</TableHead>
              <TableHead className="text-gray-300">Last Name</TableHead>
              <TableHead className="text-gray-300">Job Title</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className="border-gray-700">
                <TableCell className="text-gray-200">{member.first_name || "N/A"}</TableCell>
                <TableCell className="text-gray-200">{member.last_name || "N/A"}</TableCell>
                <TableCell className="text-gray-200">{member.job_title || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
