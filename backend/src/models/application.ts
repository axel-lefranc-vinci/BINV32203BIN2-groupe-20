export const APPLICATION_STATUSES = [
  "IN_PROGRESS",
  "SELECTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface ApplicationDbo {
  id: number;
  offer_id: number;
  student_id: number;
  student_first_name: string;
  student_last_name: string;
  offer_title: string;
  company_short_name: string;
  message: string | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface CreateApplicationInput {
  offerId: number;
  message: string | null;
}

export interface Application {
  id: number;
  offerId: number;
  studentId: number;
  offerTitle: string;
  studentFirstName: string;
  studentLastName: string;
  companyShortName: string;
  message: string | null;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ApplicationDto {
  id: number;
  offerId: number;
  offerTitle: string;
  studentFirstName?: string;
  studentLastName?: string;
  companyShortName: string;
  message: string | null;
  status: ApplicationStatus;
  appliedAt: string;
}
