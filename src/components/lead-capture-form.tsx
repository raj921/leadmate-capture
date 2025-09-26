import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional(),
  website: z.string().trim().max(255, "Website URL must be less than 255 characters").optional(),
  problem: z.string().trim().min(1, "Please describe your problem").max(1000, "Problem description must be less than 1000 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
  webhookUrl: string;
}

export function LeadCaptureForm({ webhookUrl }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    website: "",
    problem: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    try {
      formSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof FormData] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!webhookUrl) {
      toast({
        title: "Configuration Required",
        description: "Please add your n8n webhook URL below the form.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Store in database
      const { data: leadData, error: dbError } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          website: formData.website,
          problem_text: formData.problem,
          status: 'new'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Add lead captured event
      await supabase
        .from('lead_events')
        .insert({
          lead_id: leadData.id,
          event_type: 'lead_captured',
          event_data: { source: 'website', form_version: 'v1' }
        });

      // Send to N8N webhook
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          lead_id: leadData.id,
          timestamp: new Date().toISOString(),
          source: window.location.origin,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Thank you!",
          description: "Your information has been submitted successfully.",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-medium border-0">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Thank You!</h2>
          <p className="text-muted-foreground mb-6">
            We've received your information and will get back to you soon.
          </p>
          <Button 
            onClick={() => setIsSuccess(false)}
            variant="outline"
            className="mt-4"
          >
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-medium border-0">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
        <CardDescription className="text-base">
          Tell us about your needs and we'll get back to you within 24 hours.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            id="name"
            label="Full Name"
            required
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(value) => updateField("name", value)}
            error={errors.name}
          />
          
          <FormField
            id="email"
            label="Email Address"
            type="email"
            required
            placeholder="your@email.com"
            value={formData.email}
            onChange={(value) => updateField("email", value)}
            error={errors.email}
          />
          
          <FormField
            id="company"
            label="Company"
            placeholder="Your company name"
            value={formData.company || ""}
            onChange={(value) => updateField("company", value)}
            error={errors.company}
          />
          
          <FormField
            id="website"
            label="Website"
            placeholder="https://yourwebsite.com"
            value={formData.website || ""}
            onChange={(value) => updateField("website", value)}
            error={errors.website}
          />
          
          <FormField
            id="problem"
            label="What problem can we help you solve?"
            type="textarea"
            required
            placeholder="Describe your challenge or what you're looking to achieve..."
            value={formData.problem}
            onChange={(value) => updateField("problem", value)}
            error={errors.problem}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth text-base py-6"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Send My Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}