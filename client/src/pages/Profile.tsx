import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Profile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Profile page - Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}