import type { Offer } from "../models/offer.ts";
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES, PERIOD_LABELS } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface OfferTableProps {
  offers: Offer[];
  canApply?: boolean;
  appliedOfferIds?: number[];
  blockedOfferIds?: number[];
  withdrawableOfferIds?: number[];
  applicationsLoading?: boolean;
  isSubmitting?: boolean;
  isWithdrawing?: boolean;
  onApply?: (offerId: number, message: string) => Promise<void>;
  onWithdraw?: (offerId: number) => Promise<void>;
}

const OfferTable = ({
  offers,
  canApply = false,
  appliedOfferIds = [],
  blockedOfferIds = [],
  withdrawableOfferIds = [],
  applicationsLoading = false,
  isSubmitting = false,
  isWithdrawing = false,
  onApply,
  onWithdraw,
}: OfferTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Titre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Année</th>
          <th scope="col">Période</th>
          <th scope="col">Statut</th>
          {canApply && <th scope="col">Candidature</th>}
        </tr>
      </thead>
      <tbody>
        {offers.map((offer) => (
          <tr key={offer.id}>
            <td>{offer.title}</td>
            <td>{offer.companyShortName}</td>
            <td>{offer.academicYear}</td>
            <td>{PERIOD_LABELS[offer.period]}</td>
            <td>
              <StatusBadge
                label={OFFER_STATUS_LABELS[offer.status]}
                tone={OFFER_STATUS_TONES[offer.status]}
              />
            </td>
            {canApply && (
              <td>
                {withdrawableOfferIds.includes(offer.id) ? (
                  <div className="application-actions">
                    <button className="button" type="button" disabled>
                      Candidature déjà postulée
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={isWithdrawing}
                      onClick={() => void onWithdraw?.(offer.id)}
                    >
                      Retirer
                    </button>
                  </div>
                ) : appliedOfferIds.includes(offer.id) || blockedOfferIds.includes(offer.id) ? (
                  <button className="button" type="button" disabled>
                    Candidature déjà postulée
                  </button>
                ) : applicationsLoading ? (
                  <button className="button" type="button" disabled>
                    Vérification…
                  </button>
                ) : (
                  <form
                    className="application-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const message = new FormData(form).get("message");
                      void onApply?.(offer.id, typeof message === "string" ? message : "");
                      form.reset();
                    }}
                  >
                    <label>
                      <span className="visually-hidden">Message facultatif</span>
                      <input name="message" type="text" placeholder="Message facultatif" />
                    </label>
                    <button className="button button-primary" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Envoi…" : "Candidater"}
                    </button>
                  </form>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OfferTable;
