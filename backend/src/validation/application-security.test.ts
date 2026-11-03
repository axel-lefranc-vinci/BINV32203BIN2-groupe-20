import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { initializeDatabase } from "../db/initialize.ts";

const secret = "test-secret-that-is-long-enough-123";

const tokenFor = (kind: "CONTACT" | "STUDENT", id: number) =>
  jwt.sign({ kind, id }, secret);

describe("application authorization", () => {
  it("rejects non-students and unpublished offers on the server", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });

    const contactResponse = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("CONTACT", 14))
      .send({ offerId: 1 });
    const unpublishedResponse = await request(app)
      .post("/applications")
      .set("Authorization", tokenFor("STUDENT", 8))
      .send({ offerId: 2 });

    expect(contactResponse.status).toBe(403);
    expect(contactResponse.body.error.code).toBe("FORBIDDEN");
    expect(unpublishedResponse.status).toBe(409);
    expect(unpublishedResponse.body.error.code).toBe("OFFER_NOT_PUBLISHED");
    db.close();
  });

  it("keeps the candidature list isolated by student", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });

    const lucas = await request(app)
      .get("/applications/mine")
      .set("Authorization", tokenFor("STUDENT", 1));
    const mateusz = await request(app)
      .get("/applications/mine")
      .set("Authorization", tokenFor("STUDENT", 3));

    expect(lucas.status).toBe(200);
    expect(mateusz.status).toBe(200);
    expect(lucas.body).toEqual([
      expect.objectContaining({ offerId: 1, status: "IN_PROGRESS" }),
    ]);
    expect(mateusz.body).toEqual([
      expect.objectContaining({ offerId: 6, status: "SELECTED" }),
    ]);
    db.close();
  });
});
