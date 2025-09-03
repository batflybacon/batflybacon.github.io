import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Users, Euro, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/hooks/useBarNights";

interface AddBarNightFormProps {
  profiles: Profile[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddBarNightForm({ profiles, onClose, onSubmit }: AddBarNightFormProps) {
  const [name, setName] = useState("");
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
    
    if (!name.trim() || !totalAmount || selectedParticipants.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    // Validate payment amounts don't exceed total
    const totalPaid = Object.values(paidBy)
      .filter(amount => amount && parseFloat(amount) > 0)
      .reduce((sum, amount) => sum + parseFloat(amount), 0);
    
    if (totalPaid > parseFloat(totalAmount)) {
      toast({
        title: "Fehler",
        description: "Die Summe der Zahlungen darf die Gesamtkosten nicht überschreiten.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
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
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Name des Abends *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="z.B. Freitag bei Max"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                  className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`participant-${profile.id}`}
                      checked={selectedParticipants.includes(profile.user_id)}
                      onCheckedChange={() => handleParticipantToggle(profile.user_id)}
                    />
                    <Label htmlFor={`participant-${profile.id}`} className="flex-1">
                      {profile.display_name}
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
                      const profile = profiles.find(u => u.user_id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-2">
                          <Label className="w-16 text-sm">{profile?.display_name}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={paidBy[userId] || ""}
                            onChange={(e) => handlePaidByChange(userId, e.target.value)}
                            className="flex-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                      className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <div className="space-y-2">
                      <Label className="text-sm">Wer teilt sich das?</Label>
                      {selectedParticipants.map((userId) => {
                        const profile = profiles.find(u => u.user_id === userId);
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
                              {profile?.display_name}
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