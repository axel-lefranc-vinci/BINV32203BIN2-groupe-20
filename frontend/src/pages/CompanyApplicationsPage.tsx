import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import StatusBadge from "../components/StatusBadge.tsx";
import { useCompanyApplications } from "../hooks/useCompanyApplications.ts";
import type { Application } from "../models/application.ts";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES } from "../utils/labels.ts";

interface Props {
  token: string;
  onUnauthorized: () => void;
}

const CompanyApplicationsPage = ({ token, onUnauthorized }: Props) => {
  const { applications, isLoading, isUpdating, error, updateStatus } =
    useCompanyApplications(token, onUnauthorized);

  return (
    <section>
      <h1>Candidatures reçues</h1>
      <p>Modifiez l’état des candidatures déposées aux offres de vos entreprises.</p>
      {error ? (
        <ErrorState message={error} />
      ) : isLoading ? (
        <LoadingState />
      ) : applications.length === 0 ? (
        <EmptyState message="Aucune candidature reçue." />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Offre</th>
                <th>Candidat</th>
                <th>Message</th>
                <th>Statut</th>
                <th>Modifier</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.offerTitle}</td>
                  <td>
                    {application.studentFirstName} {application.studentLastName}
                  </td>
                  <td>{application.message ?? "—"}</td>
                  <td>
                    <StatusBadge
                      label={APPLICATION_STATUS_LABELS[application.status]}
                      tone={APPLICATION_STATUS_TONES[application.status]}
                    />
                  </td>
                  <td>
                    <select
                      className="application-status-select"
                      aria-label={`Statut de la candidature ${application.id}`}
                      value={application.status}
                      disabled={isUpdating || application.status === "WITHDRAWN"}
                      onChange={(event) =>
                        void updateStatus(
                          application.id,
                          event.target.value as Application["status"],
                        )
                      }
                    >
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="SELECTED">Retenue</option>
                      <option value="REJECTED">Non retenue</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default CompanyApplicationsPage;
