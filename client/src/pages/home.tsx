import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Zap, Shield, RefreshCw, X, ExternalLink, Key, Clock, MapPin, Building, Globe, Link2, Save, CheckCircle, Users, Copy, Eye, AlertCircle } from "lucide-react";
import { useState } from "react";

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

interface EmployeeLink {
  id: string;
  employeeName: string;
  locationId: string;
  destination: string;
  clicks: number;
  createdAt: string;
  shortUrl: string;
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

  // Review link state and queries
  const [reviewLink, setReviewLink] = useState("");

  // Query to get current review link
  const { data: reviewLinkData, refetch: refetchReviewLink, error: reviewLinkError } = useQuery<{ link: string | null }>({
    queryKey: ['/reviews/get-link', accountData?.locationId],
    enabled: !!accountData?.locationId,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Mutation to save review link
  const saveReviewLinkMutation = useMutation({
    mutationFn: (link: string) => apiRequest("POST", "/reviews/set-link", {
      locationId: accountData?.locationId,
      link,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/reviews/get-link', accountData?.locationId] });
      await refetchReviewLink();
      toast({
        title: "✅ Link Salvo!",
        description: "Google Review link configurado com sucesso",
      });
      setReviewLink("");
    },
    onError: (error) => {
      // Se o erro for "já existe", recarregar a query para mostrar o link
      if (error.message.includes("already exists")) {
        queryClient.invalidateQueries({ queryKey: ['/reviews/get-link', accountData?.locationId] });
        refetchReviewLink();
        toast({
          title: "✅ Link Já Configurado",
          description: "Este link já estava salvo anteriormente",
        });
        setReviewLink("");
      } else {
        toast({
          title: "Erro ao Salvar",
          description: error.message,
          variant: "destructive",
        });
      }
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

  const handleSaveReviewLink = () => {
    if (!reviewLink.trim()) {
      toast({
        title: "Invalid Link",
        description: "Please enter a valid Google Review link",
        variant: "destructive",
      });
      return;
    }
    saveReviewLinkMutation.mutate(reviewLink);
  };

  const handleTestReviewLink = () => {
    if (reviewLinkData?.link) {
      window.open(reviewLinkData.link, '_blank');
    }
  };

  // Employee Links state and queries
  const [employeeName, setEmployeeName] = useState("");

  // Query to get employee links
  const { data: employeeLinks = [], refetch: refetchEmployeeLinks } = useQuery<EmployeeLink[]>({
    queryKey: ['/employee-links/list'],
    enabled: !!accountData?.locationId && !!reviewLinkData?.link,
    retry: false,
  });

  // Mutation to create employee link
  const createEmployeeLinkMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/employee-links/create", {
      employeeName: name,
      locationId: accountData?.locationId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/employee-links/list'] });
      refetchEmployeeLinks();
      toast({
        title: "Link Criado",
        description: "Link de avaliação do funcionário criado com sucesso",
      });
      setEmployeeName("");
    },
    onError: (error) => {
      toast({
        title: "Erro ao Criar Link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateEmployeeLink = () => {
    if (!employeeName.trim()) {
      toast({
        title: "Nome Inválido",
        description: "Por favor, insira o nome do funcionário",
        variant: "destructive",
      });
      return;
    }
    createEmployeeLinkMutation.mutate(employeeName);
  };

  const handleCopyLink = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Link Copiado",
      description: "Link copiado para a área de transferência",
    });
  };

  const handleTestEmployeeLink = (shortUrl: string) => {
    window.open(shortUrl, '_blank');
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
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                      isConnected 
                        ? 'bg-accent/10 border border-accent/20' 
                        : 'bg-muted border border-border'
                    }`}>
                      <Shield className={`w-6 h-6 ${
                        isConnected ? 'text-accent' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">User Consent</p>
                  </div>
                  <ExternalLink className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                      isConnected 
                        ? 'bg-accent/10 border border-accent/20' 
                        : 'bg-muted border border-border'
                    }`}>
                      <RefreshCw className={`w-6 h-6 ${
                        isConnected ? 'text-accent' : 'text-muted-foreground'
                      }`} />
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
            <>
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
                <div className="flex items-center space-x-3 mb-6">
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

                {/* Google Review Link Configuration */}
                <div className="bg-muted/30 border border-border rounded-lg p-5">
                  {/* Connection Lost Warning */}
                  {reviewLinkError && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Conexão perdida. Por favor, reconecte ao GoHighLevel.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Link2 className="w-5 h-5 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">Google Review Link</h4>
                    </div>
                    {reviewLinkData?.link && (
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configurado
                      </Badge>
                    )}
                  </div>
                  
                  {reviewLinkData?.link ? (
                    <div className="space-y-3 mb-4">
                      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-2 flex-1">
                            <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-accent mb-1">✅ Link Configurado!</p>
                              <code className="text-xs font-mono text-foreground bg-background/80 px-2 py-1 rounded block break-all" data-testid="text-current-review-link">
                                {reviewLinkData.link}
                              </code>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTestReviewLink}
                            className="shrink-0"
                            data-testid="button-test-review-link"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Testar
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Para atualizar, insira um novo link abaixo
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3">
                      ➕ Adicione seu link do Google Meu Negócio para começar a coletar avaliações
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Input
                      type="url"
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                      value={reviewLink}
                      onChange={(e) => setReviewLink(e.target.value)}
                      className="flex-1"
                      data-testid="input-review-link"
                    />
                    <Button
                      onClick={handleSaveReviewLink}
                      disabled={saveReviewLinkMutation.isPending || !reviewLink.trim()}
                      data-testid="button-save-review-link"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saveReviewLinkMutation.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                  
                  {/* Helper Links */}
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <p className="text-xs font-semibold text-foreground/90 mb-2">Como encontrar seu link:</p>
                    
                    <div className="space-y-2">
                      <a
                        href={`https://app.gohighlevel.com/v2/location/${accountData.locationId}/reputation/settings?tab=reviewRequestLink`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-background/50 border border-border rounded hover:bg-accent/10 hover:border-accent/20 transition-colors"
                        data-testid="link-ghl-review-settings"
                      >
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-primary" />
                          <span className="text-xs font-medium text-foreground">
                            1. Acessar Review Link no GHL
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">GMB Conectado</Badge>
                      </a>
                      
                      <p className="text-xs text-muted-foreground pl-6">
                        Se o Google Meu Negócio já estiver integrado, copie o link aqui
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <a
                        href={`https://app.gohighlevel.com/v2/location/${accountData.locationId}/settings/integrations/list`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-background/50 border border-border rounded hover:bg-accent/10 hover:border-accent/20 transition-colors"
                        data-testid="link-ghl-integrations"
                      >
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-destructive" />
                          <span className="text-xs font-medium text-foreground">
                            2. Conectar Google Meu Negócio
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-xs">Se não conectado</Badge>
                      </a>
                      
                      <p className="text-xs text-muted-foreground pl-6">
                        Se ainda não conectou o GMB, conecte primeiro nas integrações
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Review Links Section */}
            {reviewLinkData?.link && (
              <Card className="shadow-xl" data-testid="employee-links-card">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Links de Funcionários</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {employeeLinks.length} {employeeLinks.length === 1 ? 'link' : 'links'}
                    </Badge>
                  </div>

                  {/* Create Employee Link Form */}
                  <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
                    <p className="text-xs font-semibold text-foreground/90 mb-3">Criar Novo Link</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Nome do funcionário"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateEmployeeLink()}
                        className="flex-1"
                        data-testid="input-employee-name"
                      />
                      <Button
                        onClick={handleCreateEmployeeLink}
                        disabled={createEmployeeLinkMutation.isPending || !employeeName.trim()}
                        data-testid="button-create-employee-link"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {createEmployeeLinkMutation.isPending ? 'Criando...' : 'Criar Link'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cada funcionário receberá um link único que redireciona para o Google Review
                    </p>
                  </div>

                  {/* Employee Links List */}
                  {employeeLinks.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-foreground/90">Links Criados:</p>
                      {employeeLinks.map((link) => (
                        <div
                          key={link.id}
                          className="bg-background border border-border rounded-lg p-4 hover:border-accent/20 transition-colors"
                          data-testid={`employee-link-${link.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm font-semibold text-foreground" data-testid={`employee-name-${link.id}`}>
                                  {link.employeeName}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {link.clicks} {link.clicks === 1 ? 'clique' : 'cliques'}
                                </Badge>
                              </div>
                              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded block break-all" data-testid={`employee-short-url-${link.id}`}>
                                {link.shortUrl}
                              </code>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(link.shortUrl)}
                                data-testid={`button-copy-${link.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTestEmployeeLink(link.shortUrl)}
                                data-testid={`button-test-${link.id}`}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum link criado ainda
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Crie links personalizados para seus funcionários acima
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            </>
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
