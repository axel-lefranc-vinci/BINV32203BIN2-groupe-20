import { toApplication } from "../mappers/application.mapper.ts";
import type { Application, CreateApplicationInput } from "../models/application.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import type { User } from "../models/user.ts";
import { HttpError } from "../utils/httpError.ts";
import { isStudent } from "./permissions.ts";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  apply: (viewer: User, input: CreateApplicationInput): Application => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut candidater");
    }

    const offerStatus = repository.findOfferStatus(input.offerId);
    if (offerStatus === undefined) {
      throw new HttpError(404, "OFFER_NOT_FOUND", "Offre introuvable");
    }
    if (offerStatus !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "L'offre n'est pas publiée");
    }

    const existing = repository.findByKey(input.offerId, viewer.id);
    if (existing !== undefined && existing.status !== "WITHDRAWN") {
      throw new HttpError(409, "APPLICATION_EXISTS", "Vous avez déjà candidaté à cette offre");
    }

    const message = input.message?.trim() || null;
    return toApplication(repository.save({ ...input, message }, viewer.id));
  },

  listMine: (viewer: User): Application[] => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut consulter ses candidatures");
    }
    return repository.findByStudent(viewer.id).map(toApplication);
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
