import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.ts";
import { initializeDatabase } from "../db/initialize.ts";

const secret = "test-secret-that-is-long-enough-123";
const token = jwt.sign({ kind: "STUDENT", id: 1 }, secret);

describe("application state transitions", () => {
  it("withdraws an in-progress candidature and allows it to be submitted again", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });

    const withdrawn = await request(app)
      .delete("/applications/1")
      .set("Authorization", token);
    const reapplied = await request(app)
      .post("/applications")
      .set("Authorization", token)
      .send({ offerId: 1, message: "Nouveau message" });

    expect(withdrawn.status).toBe(200);
    expect(withdrawn.body.status).toBe("WITHDRAWN");
    expect(reapplied.status).toBe(201);
    expect(reapplied.body.id).toBe(1);
    expect(reapplied.body.status).toBe("IN_PROGRESS");
    db.close();
  });

  it("rejects withdrawal of a treated candidature", async () => {
    const { db } = initializeDatabase(":memory:");
    const app = createApp(db, { jwtSecret: secret, demoAuthEnabled: false });
    const mateuszToken = jwt.sign({ kind: "STUDENT", id: 3 }, secret);

    const response = await request(app)
      .delete("/applications/3")
      .set("Authorization", mateuszToken);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_NOT_WITHDRAWABLE");
    db.close();
  });
});
