/**
 * TypeScript types for applications system (Pattern 3)
 */

export interface Application {
  id: string;
  org_id: string;
  owner_id: string;
  dog_id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  applied_at: string;
  responded_at: string | null;
  response_notes: string | null;

  // Joined relations
  owner: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };

  dog: {
    id: string;
    name: string;
    breed: string | null;
    birth_date: string | null;
  };
}
