import { useState } from "react";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (offerId: number, message: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createApplication(token, offerId, message);
      return true;
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { apply, isSubmitting, error };
};
