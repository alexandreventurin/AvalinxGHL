import { createEmployeeLink, getAllEmployeeLinks, registerClick } from "../utils/db";
import { customValuesService } from "./customValues";
import { EmployeeLink, EmployeeLinkResponse } from "@shared/schema";

const BASE_REDIRECT_DOMAIN = process.env.BASE_REDIRECT_DOMAIN || 
  process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : 'http://localhost:5000';

export async function createLinkForEmployee(data: {
  accessToken: string;
  locationId: string;
  employeeName: string;
}): Promise<EmployeeLinkResponse> {
  // 1️⃣ Busca o link principal salvo no GHL (Custom Value)
  const destination = await customValuesService.getGoogleReviewLink(
    data.accessToken,
    data.locationId
  );

  if (!destination) {
    throw new Error("Google Review link not found for this location. Please save the main review link first.");
  }

  // 2️⃣ Cria o link derivado
  const newLink = createEmployeeLink({
    employeeName: data.employeeName,
    locationId: data.locationId,
    destination,
  });

  // 3️⃣ Monta a URL final
  return {
    ...newLink,
    shortUrl: `${BASE_REDIRECT_DOMAIN}/employee-links/go/${newLink.id}`,
  };
}

export function listEmployeeLinks(): EmployeeLink[] {
  return getAllEmployeeLinks();
}

export function trackEmployeeClick(id: string): EmployeeLink | undefined {
  return registerClick(id);
}
