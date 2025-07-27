import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Insights() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Insights page - Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}