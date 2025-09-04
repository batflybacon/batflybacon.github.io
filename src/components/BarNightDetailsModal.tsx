
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X, Users, Euro, Receipt, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BarNight, Profile } from "@/hooks/useBarNights";

interface BarNightDetailsModalProps {
  barNight: BarNight;
  profiles: Profile[];
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: (barNightId: string) => void;
}

export default function BarNightDetailsModal({ 
  barNight, 
  profiles, 
  onClose, 
  onUpdate,
  onDelete
}: BarNightDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(barNight.name || "Bar-Abend");
  const [totalAmount, setTotalAmount] = useState(barNight.total_amount.toString());
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    barNight.participants.map(p => p.user_id)
  );
  const [paidBy, setPaidBy] = useState<{ [userId: string]: string }>(
    Object.fromEntries(
      barNight.payments.map(payment => [payment.payer_id, payment.amount.toString()])
    )
  );
  const [individualItems, setIndividualItems] = useState(
    barNight.individual_items.map(item => ({
      description: item.description,
      amount: item.amount.toString(),
      participants: item.participants.map(p => p.user_id)
    }))
  );
  
  const { toast } = useToast();

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
      id: barNight.id,
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
      date: barNight.date
    };

    onUpdate(data);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
        <Card className="w-full max-w-md mt-4 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Bar-Abend Details
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (window.confirm('Bist du sicher, dass du diesen Abend löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                      onDelete(barNight.id);
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Name</Label>
              <p className="font-medium">{barNight.name || "Bar-Abend"}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Datum</Label>
              <p className="font-medium">{formatDate(barNight.date)}</p>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Gesamtkosten</Label>
              <p className="text-xl font-bold text-primary">{formatCurrency(barNight.total_amount)}</p>
            </div>

            <Separator />

            <div>
              <Label className="text-sm text-muted-foreground">Teilnehmer ({barNight.participants.length})</Label>
              <div className="space-y-1 mt-2">
                {barNight.participants.map(participant => (
                  <p key={participant.id} className="text-sm">{participant.display_name}</p>
                ))}
              </div>
            </div>

            {barNight.payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Zahlungen</Label>
                  <div className="space-y-1 mt-2">
                    {barNight.payments.map(payment => (
                      <div key={payment.payer_id} className="flex justify-between text-sm">
                        <span>{payment.payer.display_name}</span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {barNight.individual_items.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Einzelposten</Label>
                  <div className="space-y-2 mt-2">
                    {barNight.individual_items.map(item => (
                      <Card key={item.id} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.participants.map(p => p.display_name).join(', ')}
                            </p>
                          </div>
                          <span className="font-medium text-sm">{formatCurrency(item.amount)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-md mt-4 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Bar-Abend bearbeiten
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
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

            {/* Participants with inline payment fields */}
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
                    {selectedParticipants.includes(profile.user_id) && (
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Bezahlt"
                        value={paidBy[profile.user_id] || ""}
                        onChange={(e) => handlePaidByChange(profile.user_id, e.target.value)}
                        className="w-20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

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
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button type="submit" className="flex-1">
                Speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
