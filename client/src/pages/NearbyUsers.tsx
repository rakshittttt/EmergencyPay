import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NearbyUsers() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nearby Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Nearby users page - Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}