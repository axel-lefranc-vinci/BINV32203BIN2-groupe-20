import { useEffect, useState } from "react";
import type { Application } from "../models/application.ts";
import { getMyApplications } from "../services/applications.service.ts";
import { withdrawApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

export const useMyApplications = (
  token: string,
  onUnauthorized: () => void,
  enabled = true,
) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();

    getMyApplications(token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setApplications(data);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setError(reason instanceof Error ? reason.message : "Erreur inconnue");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [token, onUnauthorized, enabled]);

  const withdraw = async (applicationId: number): Promise<boolean> => {
    setIsWithdrawing(true);
    setError(null);
    try {
      const withdrawn = await withdrawApplication(token, applicationId);
      setApplications((current) =>
        current.map((application) =>
          application.id === withdrawn.id ? withdrawn : application,
        ),
      );
      return true;
    } catch (reason: unknown) {
      if (isUnauthorized(reason)) {
        onUnauthorized();
      } else {
        setError(reason instanceof Error ? reason.message : "Erreur inconnue");
      }
      return false;
    } finally {
      setIsWithdrawing(false);
    }
  };

  const addApplication = (application: Application) => {
    setApplications((current) => [
      application,
      ...current.filter((currentApplication) => currentApplication.id !== application.id),
    ]);
  };

  return { applications, isLoading, error, withdraw, addApplication, isWithdrawing };
};
