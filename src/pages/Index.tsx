import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/Dashboard";
import FloatingActionButton from "@/components/FloatingActionButton";
import AddBarNightForm from "@/components/AddBarNightForm";
import { useAuth } from "@/hooks/useAuth";
import { useBarNights } from "@/hooks/useBarNights";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const { user, signOut, loading: authLoading } = useAuth();
  const { profiles, createBarNight } = useBarNights();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleAddBarNight = async (data: any) => {
    const { error } = await createBarNight(data);
    if (error) {
      toast({
        title: "Fehler",
        description: "Bar-Abend konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Erfolg!",
        description: "Bar-Abend wurde erfolgreich hinzugefügt.",
      });
      setShowAddForm(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-24">
        <Dashboard onSignOut={handleSignOut} onLoadingChange={setDashboardLoading} />
      </div>
      
      {!authLoading && !dashboardLoading && <FloatingActionButton onClick={() => setShowAddForm(true)} />}
      
      {showAddForm && (
        <AddBarNightForm
          profiles={profiles}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddBarNight}
        />
      )}
    </div>
  );
};

export default Index;
