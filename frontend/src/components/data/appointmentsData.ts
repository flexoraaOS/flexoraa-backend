import { Appointment } from "../dashboard/AppointmentsDialog";

/**
 * Fetch appointments from the API.
 * Replace mock data with real database calls.
 */
export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const response = await fetch("/api/appointments");
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error fetching appointments:", errorData.error || response.statusText);
      throw new Error(errorData.error || "Failed to fetch appointments");
    }

    const data = await response.json();
    return data.appointments || [];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    // Return empty array instead of mock data
    return [];
  }
}

// Export empty array as default - use fetchAppointments() instead
export const mockAppointments: Appointment[] = [];
