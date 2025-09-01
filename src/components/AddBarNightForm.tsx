import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Users, Euro, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
}

interface AddBarNightFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const mockUsers: User[] = [
  { id: "1", name: "Anna" },
  { id: "2", name: "Ben" },
  { id: "3", name: "Clara" },
  { id: "4", name: "David" },
];

export default function AddBarNightForm({ onClose, onSubmit }: AddBarNightFormProps) {
  const [totalAmount, setTotalAmount] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [paidBy, setPaidBy] = useState<{ [userId: string]: string }>({});
  const [individualItems, setIndividualItems] = useState<Array<{
    description: string;
    amount: string;
    participants: string[];
  }>>([]);
  
  const { toast } = useToast();

  const handleParticipantToggle = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePaidByChange = (userId: string, amount: string) => {
    setPaidBy(prev => ({
      ...prev,
      [userId]: amount
    }));
  };

  const addIndividualItem = () => {
    setIndividualItems(prev => [...prev, {
      description: "",
      amount: "",
      participants: []
    }]);
  };

  const removeIndividualItem = (index: number) => {
    setIndividualItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleIndividualItemChange = (index: number, field: string, value: any) => {
    setIndividualItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!totalAmount || selectedParticipants.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      totalAmount: parseFloat(totalAmount),
      participants: selectedParticipants,
      paidBy: Object.fromEntries(
        Object.entries(paidBy).filter(([_, amount]) => amount && parseFloat(amount) > 0)
          .map(([userId, amount]) => [userId, parseFloat(amount)])
      ),
      individualItems: individualItems.filter(item => 
        item.description && item.amount && item.participants.length > 0
      ).map(item => ({
        ...item,
        amount: parseFloat(item.amount)
      })),
      date: new Date().toISOString()
    };

    onSubmit(data);
    toast({
      title: "Erfolg!",
      description: "Bar-Abend wurde erfolgreich hinzugefügt.",
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md mt-4 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Neuer Bar-Abend
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Total Amount */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount" className="flex items-center gap-2">
                <Euro className="w-4 h-4" />
                Gesamtkosten *
              </Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>

            <Separator />

            {/* Participants */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Teilnehmer auswählen *
              </Label>
              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`participant-${user.id}`}
                      checked={selectedParticipants.includes(user.id)}
                      onCheckedChange={() => handleParticipantToggle(user.id)}
                    />
                    <Label htmlFor={`participant-${user.id}`} className="flex-1">
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Who Paid */}
            {selectedParticipants.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label>Wer hat gezahlt? (Optional)</Label>
                  <div className="space-y-2">
                    {selectedParticipants.map((userId) => {
                      const user = mockUsers.find(u => u.id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-2">
                          <Label className="w-16 text-sm">{user?.name}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paidBy[userId] || ""}
                            onChange={(e) => handlePaidByChange(userId, e.target.value)}
                            className="flex-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Individual Items */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Einzelposten (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIndividualItem}>
                  Hinzufügen
                </Button>
              </div>
              {individualItems.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Beschreibung (z.B. Shot, Snack)"
                        value={item.description}
                        onChange={(e) => handleIndividualItemChange(index, 'description', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIndividualItem(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Preis"
                      value={item.amount}
                      onChange={(e) => handleIndividualItemChange(index, 'amount', e.target.value)}
                    />
                    <div className="space-y-2">
                      <Label className="text-sm">Wer teilt sich das?</Label>
                      {selectedParticipants.map((userId) => {
                        const user = mockUsers.find(u => u.id === userId);
                        return (
                          <div key={userId} className="flex items-center space-x-2">
                            <Checkbox
                              id={`item-${index}-${userId}`}
                              checked={item.participants.includes(userId)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleIndividualItemChange(index, 'participants', [...item.participants, userId]);
                                } else {
                                  handleIndividualItemChange(index, 'participants', item.participants.filter(id => id !== userId));
                                }
                              }}
                            />
                            <Label htmlFor={`item-${index}-${userId}`} className="text-sm">
                              {user?.name}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1">
                Hinzufügen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}