import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import StatusBadge from "../components/StatusBadge.tsx";
import { useMyApplications } from "../hooks/useMyApplications.ts";
import type { Application } from "../models/application.ts";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
} from "../utils/labels.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

interface ApplicationsTableProps {
  applications: Application[];
  isWithdrawing: boolean;
  onWithdraw: (applicationId: number) => void;
}

const ApplicationsTable = ({
  applications,
  isWithdrawing,
  onWithdraw,
}: ApplicationsTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Offre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Message</th>
          <th scope="col">Statut</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {applications.map((application) => (
          <tr key={application.id}>
            <td>{application.offerTitle}</td>
            <td>{application.companyShortName}</td>
            <td>{application.message ?? "—"}</td>
            <td>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[application.status]}
                tone={APPLICATION_STATUS_TONES[application.status]}
              />
            </td>
            <td>
              {application.status === "IN_PROGRESS" && (
                <button
                  className="button"
                  type="button"
                  disabled={isWithdrawing}
                  onClick={() => onWithdraw(application.id)}
                >
                  Retirer
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, withdraw, isWithdrawing } = useMyApplications(
    token,
    onUnauthorized,
  );

  const handleWithdraw = (applicationId: number) => {
    if (window.confirm("Confirmez-vous le retrait de cette candidature ?")) {
      void withdraw(applicationId);
    }
  };

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p>Consultez l’état de vos candidatures aux offres de stage.</p>
      {error ? (
        <ErrorState message={error} />
      ) : isLoading ? (
        <LoadingState />
      ) : applications.length === 0 ? (
        <EmptyState message="Vous n’avez aucune candidature." />
      ) : (
        <ApplicationsTable
          applications={applications}
          isWithdrawing={isWithdrawing}
          onWithdraw={handleWithdraw}
        />
      )}
    </section>
  );
};

export default ApplicationsPage;
