import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { describe, it } from "vitest"

import { prisma } from "~/db.server";

import { getUserById, getUserByName, createUser, deleteUserByName, verifyLogin } from "~/models/user.server"

afterEach(async () => {
  await prisma.user.deleteMany()
})

describe("createUser", async () => {
  it("creates a right record", async () => {
    expect((await prisma.user.findMany()).length).toEqual(0)
    await createUser("Alice", "Alice's_password")
    expect((await prisma.user.findMany()).length).toEqual(1)
    const alice = await prisma.user.findUnique({
      where: { name: "Alice" },
      include: { password: true }
    })
    expect(alice!.name).toEqual("Alice")
    const hashedPassword = await bcrypt.hash("Alice's_password", 10)
    expect(bcrypt.compareSync("Alice's_password", hashedPassword)).toBeTruthy()
  })
})

describe("getUserByName", async () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("Alice", 10)
    for (const u of [
      { name: "Alice", password: { create: { hash: hashedPassword } } },
      { name: "Bob" },
      { name: "Carol" }
    ]) {
      await prisma.user.create({
        data: u
      })
    }
  })
  it("should get a right record", async () => {
    const alice = await getUserByName("Alice")
    expect(alice).not.toBeNull()
    expect((alice as User).name).toEqual("Alice")
  })
})

describe("getUserById", async () => {
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("Alice", 10)
    for (const u of [
      { name: "Alice", password: { create: { hash: hashedPassword } } },
      { name: "Bob" },
      { name: "Carol" }
    ]) {
      await prisma.user.create({
        data: u
      })
    }
  })
  it("should get a right record", async () => {
    const alice = await prisma.user.findUnique({ where: { name: "Alice" } })
    const aliceFromId = await getUserById(alice!.id)
    expect(aliceFromId).toEqual(alice)
  })
})


describe("deleteUserByName", async () => {
  const name = "Alice"
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash("Alice's_password", 10)
    for (const u of [
      { name: name, password: { create: { hash: hashedPassword } } },
      { name: "Bob" },
      { name: "Carol" }
    ]) {
      await prisma.user.create({
        data: u
      })
    }
  })
  it("should delete right record", async () => {
    const alice = await deleteUserByName(name)
    expect(alice.name).toEqual("Alice")
    expect((await prisma.user.findMany()).length).toEqual(2)
  })
})

describe("verifyLogin", async () => {
  const name = "Alice"
  const password = "Alice's_password"
  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash(password, 10)
    for (const u of [
      { name: name, password: { create: { hash: hashedPassword } } },
      { name: "Bob" },
      { name: "Carol" }
    ]) {
      await prisma.user.create({
        data: u
      })
    }
  })
  it("should return user info except the password", async () => {
    const userInfo = await verifyLogin(name, password)
    expect(new Set(Object.keys(userInfo!))).toEqual(new Set([
      "id", "name", "createdAt", "updatedAt"
    ]))
  })
  it("should return null if the password is wrong", async () => {
    const userInfo = await verifyLogin(name, "alice_s'password")
    expect(userInfo).toBe(null)
  })
  it("should return null if the user does not exist", async () => {
    const userInfo = await verifyLogin("Dave", password)
    expect(userInfo).toBe(null)
  })
})