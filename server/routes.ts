import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ghlService } from "./services/ghl";
import { saveToken, getToken, getAllTokens, deleteToken } from "./utils/tokens";
import { authCallbackResponseSchema, apiStatusSchema, ghlTokenSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/status", async (req, res) => {
    try {
      const status = {
        status: "Avalinx API Online",
        version: "0.0.1",
        timestamp: Date.now(),
      };
      
      const validatedStatus = apiStatusSchema.parse(status);
      res.json(validatedStatus);
    } catch (error) {
      console.error("Status endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Start OAuth flow - redirect to GoHighLevel
  app.get("/auth/ghl", async (req, res) => {
    try {
      const authUrl = ghlService.getAuthUrl();
      res.redirect(authUrl);
    } catch (error) {
      console.error("Auth initiation error:", error);
      res.status(500).json({ error: "Failed to initiate OAuth flow" });
    }
  });

  // OAuth callback - exchange code for token
  app.get("/auth/callback", async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Authorization code is required" });
      }

      console.log("Received authorization code, exchanging for token...");
      
      const tokenData = await ghlService.exchangeCodeForToken(code);
      
      // Save token using utility function
      await saveToken(tokenData.locationId, tokenData);
      
      console.log(`Token saved for location: ${tokenData.locationId}`);
      
      // Redirect back to home page after successful authentication
      res.redirect("/");
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({ 
        error: "Failed to complete OAuth flow",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get authenticated user data
  app.get("/me", async (req, res) => {
    try {
      const tokens = await getAllTokens();
      
      if (tokens.size === 0) {
        return res.status(401).json({ error: "No authenticated session found" });
      }

      // Get the first (and for MVP, only) token
      const tokenEntry = tokens.entries().next().value;
      if (!tokenEntry) {
        return res.status(401).json({ error: "No authenticated session found" });
      }
      const [locationId, rawTokenData] = tokenEntry;
      
      // Validate token data with schema for runtime safety
      const tokenData = ghlTokenSchema.parse(rawTokenData);
      
      // Check if token is expired
      const now = Date.now();
      const tokenAge = now - tokenData.created_at;
      const expiresInMs = tokenData.expires_in * 1000;
      
      if (tokenAge >= expiresInMs) {
        await deleteToken(locationId);
        return res.status(401).json({ error: "Token expired, please re-authenticate" });
      }

      // Get user data from GoHighLevel API
      const userData = await ghlService.getUserData(tokenData.access_token, locationId);
      
      // Save account info
      await storage.saveAccount(locationId, userData);
      
      const response = {
        connected: true,
        locationId: userData.locationId,
        companyId: userData.companyId,
        name: userData.name,
        address: userData.address,
        timezone: userData.timezone,
        country: userData.country,
        tokenExpiry: Math.max(0, Math.floor((expiresInMs - tokenAge) / 1000 / 60)), // minutes remaining
        accessToken: tokenData.access_token.substring(0, 20) + "..." // Masked
      };
      
      res.json(response);
    } catch (error) {
      console.error("Get user data error:", error);
      res.status(500).json({ 
        error: "Failed to fetch user data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Disconnect/logout endpoint
  app.post("/auth/disconnect", async (req, res) => {
    try {
      const tokens = await getAllTokens();
      
      // Clear all tokens and accounts sequentially per location
      const results = { success: 0, failed: 0 };
      
      for (const [locationId] of Array.from(tokens.entries())) {
        try {
          await deleteToken(locationId);
          await storage.deleteAccount(locationId);
          results.success++;
          console.log(`Successfully disconnected location: ${locationId}`);
        } catch (error) {
          results.failed++;
          console.error(`Failed to disconnect location ${locationId}:`, error);
        }
      }
      
      const allSuccessful = results.failed === 0;
      const statusCode = allSuccessful ? 200 : (results.success > 0 ? 207 : 500);
      
      res.status(statusCode).json({ 
        success: allSuccessful, 
        message: allSuccessful ? "Successfully disconnected" : "Disconnect completed with errors",
        details: results 
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      res.status(500).json({ error: "Failed to disconnect" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
