import { useState } from "react";
import { LeadCaptureForm } from "@/components/lead-capture-form";
import { WebhookConfig } from "@/components/webhook-config";

const Index = () => {
  const [webhookUrl, setWebhookUrl] = useState("");

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Transform Your Business
            <span className="bg-gradient-primary bg-clip-text text-transparent block">
              Get Expert Solutions
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Partner with us to solve your biggest challenges and accelerate growth. 
            Our experts are ready to help you achieve your goals.
          </p>
        </div>

        {/* Lead Capture Form */}
        <LeadCaptureForm webhookUrl={webhookUrl} />
        
        {/* Webhook Configuration */}
        <WebhookConfig 
          webhookUrl={webhookUrl} 
          onWebhookChange={setWebhookUrl} 
        />
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-muted-foreground border-t">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
