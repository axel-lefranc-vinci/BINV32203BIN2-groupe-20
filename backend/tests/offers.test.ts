import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const listOffersAs = (kind: UserKind, id: number) =>
  request(app).get("/offers").set("Authorization", tokenFor(kind, id));

const offerIds = (body: { id: number }[]): number[] => body.map((offer) => offer.id);

describe("GET /offers : accès", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/offers");

    expect(response.status).toBe(401);
  });

  it.each([
    ["promoteur et signataire", CONTACT.NADIA_CHERIF],
    ["signataire uniquement", CONTACT.NATHALIE_RENARD],
    ["promoteur uniquement", CONTACT.LAURA_SIMON],
  ])("refuse un contact %s (403)", async (_profile, id) => {
    const response = await listOffersAs("CONTACT", id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /offers : visibilité selon le profil", () => {
  it("montre toutes les offres à un administrateur, de la plus récente année à la plus ancienne", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body.at(-1)).toEqual({
      id: OFFER.PDF_REPORTS,
      title: "Module de rapports PDF",
      companyShortName: "Orbis",
      academicYear: "2025-2026",
      period: "P1",
      status: "ARCHIVED",
    });
  });

  describe("POST /applications : parcours étudiant", () => {
    it("crée une candidature avec et sans message, puis la relit", async () => {
      const token = tokenFor("STUDENT", STUDENT.DMYTRO_KOVALENKO);
      const withMessage = await request(app)
        .post("/applications")
        .set("Authorization", token)
        .send({ offerId: OFFER.INTERNAL_CHATBOT, message: "Projet intéressant" });
      const withoutMessage = await request(app)
        .post("/applications")
        .set("Authorization", token)
        .send({ offerId: OFFER.DATA_QUALITY });
      const mine = await request(app).get("/applications/mine").set("Authorization", token);

      expect(withMessage.status).toBe(201);
      expect(withMessage.body.message).toBe("Projet intéressant");
      expect(withoutMessage.status).toBe(201);
      expect(withoutMessage.body.message).toBeNull();
      expect(mine.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ offerId: OFFER.INTERNAL_CHATBOT, status: "IN_PROGRESS" }),
          expect.objectContaining({ offerId: OFFER.DATA_QUALITY, status: "IN_PROGRESS" }),
        ]),
      );
    });

    it("refuse un doublon actif et un corps invalide", async () => {
      const token = tokenFor("STUDENT", STUDENT.LUCAS_DUPONT);
      const duplicate = await request(app)
        .post("/applications")
        .set("Authorization", token)
        .send({ offerId: OFFER.FLEET_APP, message: "Deuxième candidature" });
      const invalid = await request(app)
        .post("/applications")
        .set("Authorization", token)
        .send({ offerId: "1" });

      expect(duplicate.status).toBe(409);
      expect(duplicate.body.error.code).toBe("APPLICATION_EXISTS");
      expect(invalid.status).toBe(400);
      expect(invalid.body.error.code).toBe("INVALID_BODY");
    });
  });

  describe("DELETE /applications et transitions", () => {
    it("retire une candidature en cours puis la réactive", async () => {
      const token = tokenFor("STUDENT", STUDENT.LUCAS_DUPONT);
      const withdrawn = await request(app)
        .delete("/applications/1")
        .set("Authorization", token);
      const reapplied = await request(app)
        .post("/applications")
        .set("Authorization", token)
        .send({ offerId: OFFER.FLEET_APP, message: "Nouveau message" });

      expect(withdrawn.status).toBe(200);
      expect(withdrawn.body.status).toBe("WITHDRAWN");
      expect(reapplied.status).toBe(201);
      expect(reapplied.body.id).toBe(1);
      expect(reapplied.body.status).toBe("IN_PROGRESS");
    });

    it("refuse le retrait d'une candidature traitée", async () => {
      const response = await request(app)
        .delete("/applications/3")
        .set("Authorization", tokenFor("STUDENT", STUDENT.MATEUSZ_KOWALSKI));

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
    });
  });

  describe("GET /offers : filtre de période", () => {
    it("filtre les offres d'un administrateur sans modifier les règles de visibilité", async () => {
      const response = await request(app)
        .get("/offers?period=P1")
        .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((offer: { period: string }) => offer.period === "P1")).toBe(true);
    });

    it("combine le filtre de période avec la visibilité d'un étudiant", async () => {
      const response = await request(app)
        .get("/offers?period=P1")
        .set("Authorization", tokenFor("STUDENT", STUDENT.LUCAS_DUPONT));

      expect(response.status).toBe(200);
      expect(response.body.every((offer: { period: string; status: string }) =>
        offer.period === "P1" && offer.status === "PUBLISHED")).toBe(true);
    });

    it.each(["P3", ""])("refuse une période invalide (%s)", async (period) => {
      const response = await request(app)
        .get(`/offers?period=${period}`)
        .set("Authorization", tokenFor("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_QUERY");
    });
  });

  it("ne montre que les offres publiées à un étudiant", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT);

    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(response.body.every((o: { status: string }) => o.status === "PUBLISHED")).toBe(true);
  });

  it("montre à un déposant toutes ses offres, quel que soit leur statut", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.MARC_LEJEUNE);

    expect(offerIds(response.body)).toEqual([
      OFFER.E2E_TESTS,
      OFFER.BILLING_API,
      OFFER.PDF_REPORTS,
    ]);
  });

  it("ne montre pas à un déposant l'offre d'un collègue de la même entreprise", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.CLAIRE_DUMONT);

    expect(offerIds(response.body)).toEqual([OFFER.FLEET_APP]);
    expect(offerIds(response.body)).not.toContain(OFFER.CLIENT_PORTAL);
  });

  it("montre à un contact multi-entreprises ses offres dans ses deux entreprises", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.JULIEN_LAMBERT);

    expect(response.body.map((o: { companyShortName: string }) => o.companyShortName)).toEqual([
      "Lumen Digital",
      "Lumen Data",
    ]);
    expect(offerIds(response.body)).toEqual([OFFER.CLIENT_PORTAL, OFFER.DATA_QUALITY]);
  });

  it("n'expose que les champs du DTO", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(Object.keys(response.body[0]).sort()).toEqual(
      ["academicYear", "companyShortName", "id", "period", "status", "title"],
    );
  });
});
