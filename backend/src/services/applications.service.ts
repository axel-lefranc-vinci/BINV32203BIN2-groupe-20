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

  listForCompanyContact: (viewer: User): Application[] => {
    if (viewer.kind !== "CONTACT" || viewer.companies.length === 0) {
      throw new HttpError(403, "FORBIDDEN", "Seul un contact d'entreprise peut consulter ces candidatures");
    }
    return repository.findByCompanyContact(viewer.id).map(toApplication);
  },

  updateStatus: (viewer: User, applicationId: number, status: Application["status"]): Application => {
    if (viewer.kind !== "CONTACT" || viewer.companies.length === 0) {
      throw new HttpError(403, "FORBIDDEN", "Seul un contact d'entreprise peut modifier une candidature");
    }
    if (status === "WITHDRAWN") {
      throw new HttpError(400, "INVALID_STATUS", "Un contact ne peut pas retirer une candidature");
    }
    const application = repository.findByIdAndCompanyContact(applicationId, viewer.id);
    if (application === undefined) {
      throw new HttpError(404, "APPLICATION_NOT_FOUND", "Candidature introuvable");
    }
    if (application.status === "WITHDRAWN") {
      throw new HttpError(409, "APPLICATION_NOT_MODIFIABLE", "Cette candidature a été retirée");
    }
    const updated = repository.updateStatus(applicationId, status);
    if (updated === undefined) {
      throw new HttpError(409, "APPLICATION_NOT_MODIFIABLE", "Modification impossible");
    }
    return toApplication(updated);
  },

  withdraw: (viewer: User, applicationId: number): Application => {
    if (!isStudent(viewer)) {
      throw new HttpError(403, "FORBIDDEN", "Seul un étudiant peut retirer une candidature");
    }

    const application = repository.findByIdAndStudent(applicationId, viewer.id);
    if (application === undefined) {
      throw new HttpError(404, "APPLICATION_NOT_FOUND", "Candidature introuvable");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(
        409,
        "APPLICATION_NOT_WITHDRAWABLE",
        "Cette candidature ne peut plus être retirée",
      );
    }

    const withdrawn = repository.withdraw(applicationId, viewer.id);
    if (withdrawn === undefined) {
      throw new HttpError(409, "APPLICATION_NOT_WITHDRAWABLE", "Retrait impossible");
    }
    return toApplication(withdrawn);
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
