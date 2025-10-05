import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Shield, RefreshCw, X, ExternalLink, Key, Clock, MapPin, Building, Globe } from "lucide-react";

interface ApiStatus {
  status: string;
  version: string;
  timestamp: number;
}

interface AccountData {
  connected: boolean;
  locationId: string;
  companyId?: string;
  name: string;
  address?: string;
  timezone?: string;
  country?: string;
  tokenExpiry: number;
  accessToken: string;
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query API status
  const { data: apiStatus, isLoading: statusLoading } = useQuery<ApiStatus>({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query account data (returns null if not connected)
  const { data: accountData, isLoading: accountLoading, error: accountError } = useQuery<AccountData>({
    queryKey: ['/me'],
    retry: false,
    refetchInterval: false,
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/auth/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/me'] });
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from GoHighLevel",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh account data mutation
  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/me"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/me'] });
      toast({
        title: "Data Refreshed",
        description: "Account data has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnectGHL = () => {
    window.location.href = '/auth/ghl';
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const isConnected = accountData?.connected === true;
  const isApiOnline = apiStatus?.status === "Avalinx API Online";

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Avalinx GHL</h1>
                <p className="text-xs text-muted-foreground">OAuth2 Integration</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs font-mono">
                MVP v{apiStatus?.version || "0.0.1"}
              </Badge>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                <div className={`w-2 h-2 rounded-full ${isApiOnline ? 'bg-accent animate-pulse' : 'bg-muted-foreground'}`}></div>
                <span className={`text-xs font-medium ${isApiOnline ? 'text-accent' : 'text-muted-foreground'}`}>
                  {statusLoading ? 'Checking...' : isApiOnline ? 'API Online' : 'API Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Connection Status Card */}
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">GoHighLevel Connection</h2>
                  <p className="text-muted-foreground text-sm">Connect your GoHighLevel account to get started</p>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
                  isConnected 
                    ? 'bg-accent/10 border-accent/20' 
                    : 'bg-secondary/50 border-border'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    isConnected ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    {accountLoading ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              
              {/* OAuth Flow Diagram */}
              <div className="bg-muted/30 border border-border rounded-lg p-6 mb-6">
                <h3 className="text-sm font-semibold mb-4 text-foreground/90">OAuth2 Flow</h3>
                <div className="flex items-center justify-between space-x-4">
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Key className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Request Auth</p>
                  </div>
                  <ExternalLink className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">User Consent</p>
                  </div>
                  <ExternalLink className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-muted border border-border flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Get Token</p>
                  </div>
                </div>
              </div>
              
              {/* Connection Actions */}
              {!isConnected && (
                <>
                  <Button 
                    onClick={handleConnectGHL}
                    className="w-full shadow-lg hover:shadow-primary/20"
                    size="lg"
                    data-testid="button-connect-ghl"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Connect to GoHighLevel
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    You'll be redirected to GoHighLevel to authorize this application
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Connected State */}
          {isConnected && accountData && (
            <Card className="border-accent/20 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-accent">Successfully Connected</h3>
                      <p className="text-sm text-muted-foreground">Your GoHighLevel account is linked</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                    <span className="text-sm font-medium text-accent">Connected</span>
                  </div>
                </div>
                
                {/* Account Information */}
                <div className="bg-muted/30 border border-border rounded-lg p-5 space-y-4 mb-6">
                  <h4 className="text-sm font-semibold text-foreground/90 mb-3">Account Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Location ID
                      </p>
                      <code className="text-sm font-mono text-foreground bg-background/50 px-2 py-1 rounded block truncate" data-testid="text-location-id">
                        {accountData.locationId}
                      </code>
                    </div>
                    {accountData.companyId && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          Company ID
                        </p>
                        <code className="text-sm font-mono text-foreground bg-background/50 px-2 py-1 rounded block truncate" data-testid="text-company-id">
                          {accountData.companyId}
                        </code>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-business-name">{accountData.name}</p>
                  </div>

                  {accountData.address && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-sm text-foreground" data-testid="text-address">{accountData.address}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {accountData.timezone && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Timezone
                        </p>
                        <p className="text-sm text-foreground" data-testid="text-timezone">{accountData.timezone}</p>
                      </div>
                    )}
                    {accountData.country && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          Country
                        </p>
                        <p className="text-sm text-foreground" data-testid="text-country">{accountData.country}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Access Token</p>
                    <div className="flex items-center space-x-2">
                      <code className="text-sm font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded flex-1 overflow-hidden" data-testid="text-access-token">
                        {accountData.accessToken}
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Token Expires</p>
                    <p className="text-sm font-medium text-foreground" data-testid="text-token-expiry">
                      {accountData.tokenExpiry > 60 
                        ? `${Math.floor(accountData.tokenExpiry / 60)} hours, ${accountData.tokenExpiry % 60} minutes`
                        : `${accountData.tokenExpiry} minutes`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={handleRefresh}
                    disabled={refreshMutation.isPending}
                    className="flex-1"
                    data-testid="button-refresh-data"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                    {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isPending}
                    data-testid="button-disconnect"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Endpoints Info */}
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
              <div className="space-y-3">
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-accent bg-accent/10">GET</Badge>
                      <code className="text-sm font-mono text-foreground/90">/api/status</code>
                    </div>
                    <span className="text-xs text-muted-foreground">Health Check</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-14">Returns API status and version</p>
                </div>
                
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-accent bg-accent/10">GET</Badge>
                      <code className="text-sm font-mono text-foreground/90">/auth/ghl</code>
                    </div>
                    <span className="text-xs text-muted-foreground">OAuth Start</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-14">Initiates OAuth2 flow with GoHighLevel</p>
                </div>
                
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-primary bg-primary/10">GET</Badge>
                      <code className="text-sm font-mono text-foreground/90">/auth/callback</code>
                    </div>
                    <span className="text-xs text-muted-foreground">OAuth Callback</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-14">Receives auth code and exchanges for access token</p>
                </div>
                
                <div className="bg-muted/30 border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-accent bg-accent/10">GET</Badge>
                      <code className="text-sm font-mono text-foreground/90">/me</code>
                    </div>
                    <span className="text-xs text-muted-foreground">Account Info</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-14">Returns connected GHL account details</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Technical Information */}
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Technical Details</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/90">OAuth 2.0 Authorization Code Flow</p>
                    <p className="text-xs text-muted-foreground mt-1">Uses GoHighLevel's secure authentication with refresh token support</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/90">In-Memory Token Storage</p>
                    <p className="text-xs text-muted-foreground mt-1">Tokens stored temporarily (will be replaced with database in production)</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded bg-secondary/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe className="w-4 h-4 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground/90">API Version 2021-07-28</p>
                    <p className="text-xs text-muted-foreground mt-1">Using GoHighLevel V2 API with Location-level access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-muted-foreground">Avalinx GHL MVP - Stage 1</p>
              <span className="text-muted-foreground">•</span>
              <a href="https://marketplace.gohighlevel.com/docs/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">
                GHL API Docs
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
