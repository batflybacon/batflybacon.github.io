import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown } from "lucide-react";

interface User {
  id: string;
  name: string;
  balance: number;
}

interface BarNight {
  id: string;
  date: string;
  totalAmount: number;
  participants: string[];
  paidBy: { [userId: string]: number };
}

const mockUsers: User[] = [
  { id: "1", name: "Anna", balance: 15.50 },
  { id: "2", name: "Ben", balance: -8.20 },
  { id: "3", name: "Clara", balance: 3.70 },
  { id: "4", name: "David", balance: -11.00 },
];

const mockBarNights: BarNight[] = [
  {
    id: "1",
    date: "2024-01-15",
    totalAmount: 89.50,
    participants: ["1", "2", "3", "4"],
    paidBy: { "1": 89.50 }
  },
  {
    id: "2", 
    date: "2024-01-08",
    totalAmount: 67.20,
    participants: ["1", "2", "3"],
    paidBy: { "2": 67.20 }
  },
];

export default function Dashboard() {
  const [users] = useState<User[]>(mockUsers);
  const [barNights] = useState<BarNight[]>(mockBarNights);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-success";
    if (balance < 0) return "text-danger";
    return "text-muted-foreground";
  };

  const getBalanceIcon = (balance: number) => {
    if (balance > 0) return <TrendingUp className="w-4 h-4" />;
    if (balance < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Bar Kosten
        </h1>
        <p className="text-muted-foreground mt-2">Freundeskreis Salden</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-card to-secondary/20 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Gesamt-Übersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Teilnehmer</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abende insgesamt</p>
              <p className="text-2xl font-bold">{barNights.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Balances */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          Aktuelle Salden
        </h2>
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center font-semibold text-primary">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBalanceIcon(user.balance)}
                    <span className={`text-lg font-bold ${getBalanceColor(user.balance)}`}>
                      {formatCurrency(user.balance)}
                    </span>
                    {user.balance > 0 && (
                      <Badge variant="secondary" className="bg-success/20 text-success">
                        Guthaben
                      </Badge>
                    )}
                    {user.balance < 0 && (
                      <Badge variant="destructive" className="bg-danger/20 text-danger">
                        Schulden
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Bar Nights */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="w-1 h-6 bg-accent rounded-full"></div>
          Letzte Abende
        </h2>
        <div className="space-y-3">
          {barNights.map((night) => (
            <Card key={night.id} className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{formatDate(night.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {night.participants.length} Teilnehmer
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(night.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gesamt ausgegeben
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}