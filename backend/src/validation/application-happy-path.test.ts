import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { initializeDatabase } from "../db/initialize.ts";

const secret = "test-secret-that-is-long-enough-123";

const tokenFor = (id: number) => jwt.sign({ kind: "STUDENT", id }, secret);

describe("application happy paths", () => {
  it("creates a candidature with and without a message, then reads it back", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });
    const token = tokenFor(8);

    const withMessage = await request(app)
      .post("/applications")
      .set("Authorization", token)
      .send({ offerId: 7, message: "Projet intéressant" });
    const withoutMessage = await request(app)
      .post("/applications")
      .set("Authorization", token)
      .send({ offerId: 5 });
    const mine = await request(app).get("/applications/mine").set("Authorization", token);

    expect(withMessage.status).toBe(201);
    expect(withMessage.body.message).toBe("Projet intéressant");
    expect(withoutMessage.status).toBe(201);
    expect(withoutMessage.body.message).toBeNull();
    expect(mine.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ offerId: 7, status: "IN_PROGRESS" }),
        expect.objectContaining({ offerId: 5, status: "IN_PROGRESS" }),
      ]),
    );
    db.close();
  });
});
