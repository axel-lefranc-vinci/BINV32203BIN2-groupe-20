import type { Db } from "../db/database.ts";
import type { ApplicationDbo, CreateApplicationInput } from "../models/application.ts";

interface ApplicationKey {
  offerId: number;
  studentId: number;
}

interface ApplicationIdKey {
  id: number;
  studentId: number;
}

interface OfferStatus {
  status: string;
}

const applicationSelect = `
  SELECT a.id, a.offer_id, a.student_id, s.first_name AS student_first_name,
         s.last_name AS student_last_name, o.title AS offer_title,
         c.short_name AS company_short_name, a.message, a.status, a.applied_at
  FROM applications a
  JOIN offers o ON o.id = a.offer_id
  JOIN companies c ON c.id = o.company_id
  JOIN students s ON s.id = a.student_id
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
  const withdrawApplication = db.prepare(`
    UPDATE applications
    SET status = 'WITHDRAWN'
    WHERE id = @id AND student_id = @studentId AND status = 'IN_PROGRESS'
  `);
  const updateApplicationStatus = db.prepare(`
    UPDATE applications SET status = @status
    WHERE id = @id AND status <> 'WITHDRAWN'
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
    findByCompanyContact: (contactId: number): ApplicationDbo[] =>
      db
        .prepare<{ contactId: number }, ApplicationDbo>(`
          ${applicationSelect}
          JOIN company_contacts cc
            ON cc.company_id = o.company_id AND cc.contact_id = @contactId
          ORDER BY a.applied_at DESC, a.id DESC
        `)
        .all({ contactId }),
    findByIdAndCompanyContact: (id: number, contactId: number): ApplicationDbo | undefined =>
      db
        .prepare<{ id: number; contactId: number }, ApplicationDbo>(`
          ${applicationSelect}
          JOIN company_contacts cc
            ON cc.company_id = o.company_id AND cc.contact_id = @contactId
          WHERE a.id = @id
        `)
        .get({ id, contactId }),
    findByKey: (offerId: number, studentId: number): ApplicationDbo | undefined =>
      findByKey.get({ offerId, studentId }),
    findByIdAndStudent: (id: number, studentId: number): ApplicationDbo | undefined =>
      db
        .prepare<ApplicationIdKey, ApplicationDbo>(`
          ${applicationSelect}
          WHERE a.id = @id AND a.student_id = @studentId
        `)
        .get({ id, studentId }),
    withdraw: (id: number, studentId: number): ApplicationDbo | undefined => {
      withdrawApplication.run({ id, studentId });
      return db
        .prepare<ApplicationIdKey, ApplicationDbo>(`
          ${applicationSelect}
          WHERE a.id = @id AND a.student_id = @studentId
        `)
        .get({ id, studentId });
    },
    updateStatus: (id: number, status: ApplicationDbo["status"]): ApplicationDbo | undefined => {
      updateApplicationStatus.run({ id, status });
      return db
        .prepare<{ id: number }, ApplicationDbo>(`
          ${applicationSelect}
          WHERE a.id = @id
        `)
        .get({ id });
    },
    findOfferStatus: (offerId: number): string | undefined =>
      findOfferStatus.get({ offerId })?.status,
    save,
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
