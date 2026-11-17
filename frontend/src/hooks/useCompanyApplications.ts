import { useEffect, useState } from "react";
import type { Application } from "../models/application.ts";
import {
  getCompanyApplications,
  updateApplicationStatus,
} from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useCompanyApplications = (token: string, onUnauthorized: () => void) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getCompanyApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setApplications(data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) onUnauthorized();
        else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [token, onUnauthorized]);

  const updateStatus = async (applicationId: number, status: Application["status"]) => {
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateApplicationStatus(token, applicationId, status);
      setApplications((current) =>
        current.map((application) => (application.id === updated.id ? updated : application)),
      );
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) onUnauthorized();
      else setError(reason instanceof Error ? reason.message : "Erreur inconnue");
    } finally {
      setIsUpdating(false);
    }
  };

  return { applications, isLoading, isUpdating, error, updateStatus };
};
