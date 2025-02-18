import http from "node:http"
import fs from "node:fs"
import { gunzip as gunzipCb } from "node:zlib"
import { promisify } from "node:util"
import request from "supertest"
import app from "~/index"

const gunzip = promisify(gunzipCb)

test("GET /", async () => {
  const response = await request(app).get("/")

  expect(response.statusCode).toBe(200)
  expect(response.body).toEqual({ code: "ok" })
})

describe("POST /convert", () => {
  const port = 10000 + Math.floor(Math.random() * 10000)
  let testServer: http.Server
  beforeAll(() => {
    testServer = http.createServer((req, res) => {
      const path = req.url?.slice(1)
      if (!path || !fs.existsSync("src/__tests__/assets/" + path)) {
        res.statusCode = 404
        res.end()
        return
      }

      fs.createReadStream("src/__tests__/assets/" + path).pipe(res)
    })

    testServer.listen(port)
  })
  afterAll(() => {
    testServer.close()
  })

  it("can convert sus file", async () => {
    const response = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/test.sus`,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      code: "ok",
      id: expect.any(String),
      type: "sus",
    })
  })
  it("can convert mmws file", async () => {
    const response = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/test.mmws`,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      code: "ok",
      id: expect.any(String),
      type: "mmws",
    })
  })
  it("can convert chs file from Ched 2", async () => {
    const response = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/ched2.chs`,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      code: "ok",
      id: expect.any(String),
      type: "chs",
    })
  })
  it("can convert chs file from Ched 3", async () => {
    const response = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/ched3.chs`,
      })

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      code: "ok",
      id: expect.any(String),
      type: "chs",
    })
  })

  test("GET /download/:id can download converted file", async () => {
    const convertResponse = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/test.sus`,
      })
    const { id } = convertResponse.body

    const response = await request(app).get(`/download/${id}`)

    expect(response.statusCode).toBe(200)

    const buffer = await gunzip(response.body)

    expect(() => JSON.parse(buffer.toString())).not.toThrow()
  })

  test("GET /download/:id deletes file after download", async () => {
    const convertResponse = await request(app)
      .post("/convert")
      .send({
        url: `http://127.0.0.1:${port}/test.sus`,
      })
    const { id } = convertResponse.body

    const response = await request(app).get(`/download/${id}`)

    expect(response.statusCode).toBe(200)

    const response2 = await request(app).get(`/download/${id}`)

    expect(response2.statusCode).toBe(404)
  })
})
