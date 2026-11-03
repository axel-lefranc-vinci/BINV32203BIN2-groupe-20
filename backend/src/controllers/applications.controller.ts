import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { HttpError } from "../utils/httpError.ts";

interface CreateApplicationBody {
  offerId: number;
  message?: string | null;
}

const parseCreateBody = (value: unknown): CreateApplicationBody => {
  if (typeof value !== "object" || value === null) {
    throw new HttpError(400, "INVALID_BODY", "Le corps de la requête est invalide");
  }
  const body = value as Record<string, unknown>;
  if (
    typeof body.offerId !== "number" ||
    !Number.isInteger(body.offerId) ||
    body.offerId <= 0 ||
    (body.message !== undefined && body.message !== null && typeof body.message !== "string")
  ) {
    throw new HttpError(400, "INVALID_BODY", "Le corps doit contenir offerId et un message facultatif");
  }
  return { offerId: body.offerId, message: body.message as string | null | undefined };
};

const parseApplicationId = (value: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "INVALID_ID", "L'identifiant de candidature est invalide");
  }
  return id;
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  router.get("/mine", (req, res) => {
    res.json(applicationsService.listMine(getCurrentUser(req)).map(toApplicationDto));
  });

  router.post("/", (req, res) => {
    const body = parseCreateBody(req.body);
    const application = applicationsService.apply(getCurrentUser(req), {
      offerId: body.offerId,
      message: body.message ?? null,
    });
    res.status(201).json(toApplicationDto(application));
  });

  router.delete("/:id", (req, res) => {
    const application = applicationsService.withdraw(
      getCurrentUser(req),
      parseApplicationId(req.params.id),
    );
    res.json(toApplicationDto(application));
  });

  return router;
};
