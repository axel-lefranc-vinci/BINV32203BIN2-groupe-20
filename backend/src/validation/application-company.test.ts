import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { initializeDatabase } from "../db/initialize.ts";

const secret = "test-secret-that-is-long-enough-123";
const tokenFor = (id: number) => jwt.sign({ kind: "CONTACT", id }, secret);

describe("company application management", () => {
  it("allows a company contact to list and update applications for its offers", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });

    const list = await request(app)
      .get("/applications/company")
      .set("Authorization", tokenFor(1));
    const update = await request(app)
      .patch("/applications/1/status")
      .set("Authorization", tokenFor(1))
      .send({ status: "SELECTED" });

    expect(list.status).toBe(200);
    expect(list.body).toEqual([
      expect.objectContaining({ id: 2, offerId: 1, studentFirstName: "Inès" }),
      expect.objectContaining({ id: 1, offerId: 1, studentFirstName: "Lucas" }),
    ]);
    expect(update.status).toBe(200);
    expect(update.body.status).toBe("SELECTED");
    db.close();
  });

  it("does not allow a contact from another company to update the application", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });

    const response = await request(app)
      .patch("/applications/1/status")
      .set("Authorization", tokenFor(2))
      .send({ status: "REJECTED" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");
    db.close();
  });
});
