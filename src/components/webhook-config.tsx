import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Link as LinkIcon } from "lucide-react";

interface WebhookConfigProps {
  webhookUrl: string;
  onWebhookChange: (url: string) => void;
}

export function WebhookConfig({ webhookUrl, onWebhookChange }: WebhookConfigProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(!webhookUrl);
  const [tempUrl, setTempUrl] = useState(webhookUrl);

  const handleSave = () => {
    onWebhookChange(tempUrl);
    setIsConfigOpen(false);
  };

  if (!isConfigOpen && webhookUrl) {
    return (
      <div className="w-full max-w-lg mx-auto mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfigOpen(true)}
          className="w-full"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure Webhook URL
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto mt-8 border-muted">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center">
          <LinkIcon className="h-5 w-5 mr-2" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Add your n8n webhook URL to enable form submissions.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">n8n Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/..."
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={!tempUrl.trim()}
          >
            Save Configuration
          </Button>
          {webhookUrl && (
            <Button 
              variant="outline" 
              onClick={() => {
                setIsConfigOpen(false);
                setTempUrl(webhookUrl);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
        
        {!webhookUrl && (
          <p className="text-sm text-muted-foreground">
            The form will be disabled until you configure your webhook URL.
          </p>
        )}
      </CardContent>
    </Card>
  );
}