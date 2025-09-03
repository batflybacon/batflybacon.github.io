import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useBarNights, UserBalance, BarNight } from "@/hooks/useBarNights";
import BarNightDetailsModal from "./BarNightDetailsModal";

interface DashboardProps {
  onSignOut: () => void;
}

export default function Dashboard({ onSignOut }: DashboardProps) {
  const { userBalances, barNights, profiles, loading, updateBarNight } = useBarNights();
  const [selectedBarNight, setSelectedBarNight] = useState<BarNight | null>(null);

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

  const handleBarNightUpdate = async (data: any) => {
    try {
      await updateBarNight(data);
      setSelectedBarNight(null);
    } catch (error) {
      console.error('Failed to update bar night:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <img 
          src="/lovable-uploads/931e1ce0-926c-4d1d-8b5a-87400c5aa683.png" 
          alt="Loading..." 
          className="w-16 h-16"
          style={{
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Batfly Bacon
        </h1>
        <button 
          onClick={onSignOut}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Abmelden
        </button>
      </div>

      {/* User Balances */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded-full"></div>
          Aktuelle Salden
        </h2>
        <div className="space-y-3">
          {userBalances.map((userBalance) => (
            <Card key={userBalance.user.id} className="transition-all duration-300 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center font-semibold text-primary">
                      {userBalance.user.display_name.charAt(0)}
                    </div>
                    <span className="font-medium">{userBalance.user.display_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getBalanceColor(userBalance.balance)}`}>
                      {formatCurrency(userBalance.balance)}
                    </span>
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
            <Card 
              key={night.id} 
              className="transition-all duration-300 hover:shadow-md cursor-pointer"
              onClick={() => setSelectedBarNight(night)}
            >
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
                      {formatCurrency(night.total_amount)}
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

      {selectedBarNight && (
        <BarNightDetailsModal
          barNight={selectedBarNight}
          profiles={profiles}
          onClose={() => setSelectedBarNight(null)}
          onUpdate={handleBarNightUpdate}
        />
      )}
    </div>
  );
}