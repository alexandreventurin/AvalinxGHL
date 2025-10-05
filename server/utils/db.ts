import { EmployeeLink } from "@shared/schema";

export const employeeLinks = new Map<string, EmployeeLink>();

export function createEmployeeLink(data: {
  employeeName: string;
  locationId: string;
  destination: string;
}): EmployeeLink {
  const id = Math.random().toString(36).substring(2, 8);
  const newLink: EmployeeLink = {
    id,
    employeeName: data.employeeName,
    locationId: data.locationId,
    destination: data.destination,
    clicks: 0,
    createdAt: new Date(),
  };
  employeeLinks.set(id, newLink);
  return newLink;
}

export function getAllEmployeeLinks(): EmployeeLink[] {
  return Array.from(employeeLinks.values());
}

export function getEmployeeLinkById(id: string): EmployeeLink | undefined {
  return employeeLinks.get(id);
}

export function registerClick(id: string): EmployeeLink | undefined {
  const link = employeeLinks.get(id);
  if (link) {
    link.clicks++;
  }
  return link;
}
