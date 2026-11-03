import { useState } from "react";
import type { Application } from "../models/application.ts";
import { createApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useApplications = (token: string, onUnauthorized: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (offerId: number, message: string): Promise<Application | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await createApplication(token, offerId, message);
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { apply, isSubmitting, error };
};
