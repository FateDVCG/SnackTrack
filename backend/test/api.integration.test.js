require("dotenv").config();
/**
 * Integration tests for Messenger-Based Ordering System API
 * Covers: /webhook, /api/orders, /api/analytics
 */
const request = require("supertest");
const express = require("express");
const sinon = require("sinon");
const db = require("../config/db");
const messengerAPI = require("../utils/messengerAPI");
const chai = require("chai");
const expect = chai.expect;

// Import the main Express app
const app = require("../index");

describe("API Integration Tests", () => {
  before(async () => {
    // Optionally seed test DB here
  });
  after(async () => {
    // Optionally clean up test DB here
    // Do not close the pool here to avoid breaking other tests
    // await db.pool.end();
  });

  describe("/webhook GET", () => {
    it("should verify webhook with correct token", async () => {
      const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || "test_token";
      const res = await request(app).get("/webhook").query({
        "hub.mode": "subscribe",
        "hub.verify_token": VERIFY_TOKEN,
        "hub.challenge": "12345",
      });
      expect(res.statusCode).to.be.equal(200);
      expect(res.text).to.be.equal("12345");
    });
    it("should reject webhook with incorrect token", async () => {
      const res = await request(app).get("/webhook").query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong_token",
        "hub.challenge": "12345",
      });
      expect(res.statusCode).to.be.equal(403);
    });
  });

  describe("/webhook POST", () => {
    it("should handle valid Messenger payload", async () => {
      const payload = {
        object: "page",
        entry: [
          {
            messaging: [
              {
                sender: { id: "test_sender" },
                message: { text: "I want 1 burger" },
              },
            ],
          },
        ],
      };
      // Mock messengerAPI call
      sinon.stub(messengerAPI, "sendTextMessage").resolves();
      const res = await request(app).post("/webhook").send(payload);
      expect(res.statusCode).to.be.equal(200);
      messengerAPI.sendTextMessage.restore();
    });
    it("should handle invalid Messenger payload", async () => {
      const payload = { invalid: true };
      const res = await request(app).post("/webhook").send(payload);
      expect(res.statusCode).to.be.equal(400);
    });
  });

  describe("/api/orders", () => {
    let createdOrderId;
    it("should create a new order (POST)", async () => {
      const orderData = {
        customerName: "Integration Test",
        customerPhone: "+639123456789",
        items: [
          { id: 1, name: "Burger", price: 120.99, quantity: 2 },
          { id: 2, name: "Fries", price: 40.99, quantity: 1 },
        ],
        totalPrice: 282.97,
        deliveryAddress: "123 Integration St",
        specialInstructions: "No onions",
      };
      const res = await request(app).post("/api/orders").send(orderData);
      expect(res.statusCode).to.be.equal(201);
      expect(res.body.success).to.be.equal(true);
      expect(res.body.data).to.have.property("id");
      createdOrderId = res.body.data.id;
    });
    it("should fetch all orders (GET)", async () => {
      const res = await request(app).get("/api/orders");
      expect(res.statusCode).to.be.equal(200);
      expect(Array.isArray(res.body.data)).to.be.equal(true);
    });
    it("should update order status (PATCH)", async () => {
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}`)
        .send({ status: "accepted" });
      expect(res.statusCode).to.be.equal(200);
      expect(res.body.data.status).to.be.equal("accepted");
    });
    it("should handle invalid order creation", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ customerName: "Missing Items" });
      expect(res.statusCode).to.be.equal(400);
    });
    it("should handle invalid status update", async () => {
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}`)
        .send({ status: "invalid_status" });
      expect(res.statusCode).to.be.equal(400);
    });
  });

  describe("/api/analytics", () => {
    it("should get analytics for day", async () => {
      const res = await request(app).get("/api/analytics?range=day");
      expect(res.statusCode).to.be.equal(200);
      expect(res.body.data).to.have.property("sales");
      expect(res.body.data).to.have.property("topSellingItems");
    });
    it("should get analytics for week", async () => {
      const res = await request(app).get("/api/analytics?range=week");
      expect(res.statusCode).to.be.equal(200);
      expect(res.body.data).to.have.property("revenueOverTime");
    });
    it("should handle invalid range", async () => {
      const res = await request(app).get("/api/analytics?range=invalid");
      expect(res.statusCode).to.be.equal(400);
    });
  });
});
