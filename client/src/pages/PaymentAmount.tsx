import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentAmount() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Payment Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Payment amount page - Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}