import type { Db } from "../db/database.ts";
import type { ApplicationDbo, CreateApplicationInput } from "../models/application.ts";

interface ApplicationKey {
  offerId: number;
  studentId: number;
}

interface OfferStatus {
  status: string;
}

const applicationSelect = `
  SELECT a.id, a.offer_id, a.student_id, o.title AS offer_title,
         c.short_name AS company_short_name, a.message, a.status, a.applied_at
  FROM applications a
  JOIN offers o ON o.id = a.offer_id
  JOIN companies c ON c.id = o.company_id
`;

export const createApplicationsRepository = (db: Db) => {
  const findByKey = db.prepare<ApplicationKey, ApplicationDbo>(`
    ${applicationSelect}
    WHERE a.offer_id = @offerId AND a.student_id = @studentId
  `);
  const findOfferStatus = db.prepare<{ offerId: number }, OfferStatus>(`
    SELECT status FROM offers WHERE id = @offerId
  `);
  const insertApplication = db.prepare(`
    INSERT INTO applications (offer_id, student_id, message)
    VALUES (@offerId, @studentId, @message)
  `);
  const reactivateApplication = db.prepare(`
    UPDATE applications
    SET message = @message, status = 'IN_PROGRESS', applied_at = datetime('now')
    WHERE id = @id AND status = 'WITHDRAWN'
  `);

  const save = db.transaction((input: CreateApplicationInput, studentId: number): ApplicationDbo => {
    const existing = findByKey.get({ offerId: input.offerId, studentId });
    if (existing?.status === "WITHDRAWN") {
      reactivateApplication.run({ id: existing.id, message: input.message });
    } else if (existing === undefined) {
      insertApplication.run({
        offerId: input.offerId,
        studentId,
        message: input.message,
      });
    }

    const application = findByKey.get({ offerId: input.offerId, studentId });
    if (application === undefined) {
      throw new Error("La candidature n'a pas pu être enregistrée");
    }
    return application;
  });

  return {
    findByStudent: (studentId: number): ApplicationDbo[] =>
      db
        .prepare<{ studentId: number }, ApplicationDbo>(`
          ${applicationSelect}
          WHERE a.student_id = @studentId
          ORDER BY a.applied_at DESC, a.id DESC
        `)
        .all({ studentId }),
    findByKey: (offerId: number, studentId: number): ApplicationDbo | undefined =>
      findByKey.get({ offerId, studentId }),
    findOfferStatus: (offerId: number): string | undefined =>
      findOfferStatus.get({ offerId })?.status,
    save,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
