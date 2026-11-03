import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import { useOffers } from "../hooks/useOffers.ts";
import { useApplications } from "../hooks/useApplications.ts";
import { useMyApplications } from "../hooks/useMyApplications.ts";
import type { PeriodCode } from "../models/offer.ts";
import type { User } from "../models/user.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodCode | undefined>();
  const [appliedOfferIds, setAppliedOfferIds] = useState<number[]>([]);
  const { offers, isLoading, error } = useOffers(token, onUnauthorized, period);
  const applications = useApplications(token, onUnauthorized);
  const myApplications = useMyApplications(token, onUnauthorized);
  const blockedOfferIds = myApplications.applications
    .filter((application) => application.status !== "WITHDRAWN")
    .map((application) => application.offerId);

  const handleApply = async (offerId: number, message: string) => {
    const created = await applications.apply(offerId, message);
    if (created !== null) {
      setAppliedOfferIds((ids) => [...ids, offerId]);
      myApplications.addApplication(created);
    }
  };

  const handleWithdraw = async (offerId: number) => {
    const application = myApplications.applications.find(
      (candidate) => candidate.offerId === offerId && candidate.status === "IN_PROGRESS",
    );
    if (
      application !== undefined &&
      window.confirm("Confirmez-vous le retrait de cette candidature ?")
    ) {
      const withdrawn = await myApplications.withdraw(application.id);
      if (withdrawn) setAppliedOfferIds((ids) => ids.filter((id) => id !== offerId));
    }
  };

  const withdrawableOfferIds = myApplications.applications
    .filter((application) => application.status === "IN_PROGRESS")
    .map((application) => application.offerId);

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (applications.error) return <ErrorState message={applications.error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable
          offers={offers}
          canApply={user.kind === "STUDENT"}
          appliedOfferIds={appliedOfferIds}
          blockedOfferIds={blockedOfferIds}
          withdrawableOfferIds={withdrawableOfferIds}
          applicationsLoading={myApplications.isLoading}
          isSubmitting={applications.isSubmitting}
          isWithdrawing={myApplications.isWithdrawing}
          onApply={handleApply}
          onWithdraw={handleWithdraw}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <label className="offers-filter">
        Période
        <select
          aria-label="Période"
          value={period ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            setPeriod(value === "" ? undefined : (value as PeriodCode));
          }}
        >
          <option value="">Toutes les périodes</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="OTHER">Autre</option>
        </select>
      </label>
      {renderContent()}
    </section>
  );
};

export default OffersPage;
