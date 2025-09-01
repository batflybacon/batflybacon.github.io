import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import FloatingActionButton from "@/components/FloatingActionButton";
import AddBarNightForm from "@/components/AddBarNightForm";

const Index = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddBarNight = (data: any) => {
    console.log("New bar night data:", data);
    setShowAddForm(false);
    // Here we would normally save to Supabase
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-24">
        <Dashboard />
      </div>
      
      <FloatingActionButton onClick={() => setShowAddForm(true)} />
      
      {showAddForm && (
        <AddBarNightForm
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddBarNight}
        />
      )}
    </div>
  );
};

export default Index;
