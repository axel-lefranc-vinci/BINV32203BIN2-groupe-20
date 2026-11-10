import type { Application, ApplicationDbo, ApplicationDto } from "../models/application.ts";

export const toApplication = (dbo: ApplicationDbo): Application => ({
  id: dbo.id,
  offerId: dbo.offer_id,
  studentId: dbo.student_id,
  studentFirstName: dbo.student_first_name,
  studentLastName: dbo.student_last_name,
  offerTitle: dbo.offer_title,
  companyShortName: dbo.company_short_name,
  message: dbo.message,
  status: dbo.status,
  appliedAt: dbo.applied_at,
});

export const toApplicationDto = (application: Application): ApplicationDto => ({
  id: application.id,
  offerId: application.offerId,
  offerTitle: application.offerTitle,
  studentFirstName: application.studentFirstName,
  studentLastName: application.studentLastName,
  companyShortName: application.companyShortName,
  message: application.message,
  status: application.status,
  appliedAt: application.appliedAt,
});
