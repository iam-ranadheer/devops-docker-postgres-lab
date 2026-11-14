const mockQuery = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn(() => ({
    query: mockQuery
  }))
}));

const request = require("supertest");
const app = require("./server");

describe("DevOps application tests", () => {

  beforeEach(() => {
    mockQuery.mockReset();
  });

  test("GET /health returns 200 when database is healthy", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: "healthy"
    });
  });

  test("GET /health returns 503 when database is unavailable", async () => {
    mockQuery.mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(503);
    expect(response.body).toEqual({
      status: "unhealthy"
    });
  });

  test("GET / returns greeting and visit count", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ count: "5" }]
      });

    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "Hello from my DevOps application",
      visits: "5"
    });
  });

});
