import {
  canDeleteUser,
  countByFilter,
  filterUsers,
  type AdminUser,
} from "./user";

function userWith(overrides: Partial<AdminUser>): AdminUser {
  return {
    id: "u-1",
    email: "ana@teste.com",
    name: "Ana",
    phone: null,
    user_type: "donor",
    created_at: "2026-09-20T12:00:00Z",
    last_sign_in_at: null,
    ong_id: null,
    ong_trade_name: null,
    ong_status: null,
    ...overrides,
  };
}

const donor = userWith({ id: "d", name: "José Lima", email: "jose@x.com" });
const ong = userWith({
  id: "o",
  name: "Maria",
  email: "maria@x.com",
  user_type: "ong",
  ong_trade_name: "Casa Esperança",
});
const admin = userWith({ id: "a", name: "Admin", user_type: "admin" });
const incomplete = userWith({
  id: "i",
  name: null,
  email: "sumiu@x.com",
  user_type: null,
});
const users = [donor, ong, admin, incomplete];

describe("filterUsers", () => {
  it("sem busca e em Todos, devolve todo mundo", () => {
    expect(filterUsers(users, { search: "", filter: "all" })).toEqual(users);
  });

  it("filtra por papel e separa os cadastros incompletos", () => {
    expect(filterUsers(users, { search: "", filter: "ong" })).toEqual([ong]);
    expect(filterUsers(users, { search: "", filter: "incomplete" })).toEqual([
      incomplete,
    ]);
  });

  it("busca por nome sem ligar para acento nem maiúscula", () => {
    expect(filterUsers(users, { search: "jose", filter: "all" })).toEqual([
      donor,
    ]);
  });

  it("busca por e-mail e pelo nome da ONG", () => {
    expect(filterUsers(users, { search: "SUMIU@", filter: "all" })).toEqual([
      incomplete,
    ]);
    expect(filterUsers(users, { search: "esperanca", filter: "all" })).toEqual(
      [ong],
    );
  });

  it("combina busca e filtro", () => {
    expect(filterUsers(users, { search: "maria", filter: "donor" })).toEqual(
      [],
    );
  });
});

describe("countByFilter", () => {
  it("conta por papel, com os incompletos à parte", () => {
    expect(countByFilter(users)).toEqual({
      all: 4,
      donor: 1,
      ong: 1,
      admin: 1,
      incomplete: 1,
    });
  });
});

describe("canDeleteUser", () => {
  it("deixa excluir doador, ONG e cadastro incompleto", () => {
    expect(canDeleteUser(donor, "a")).toBe(true);
    expect(canDeleteUser(ong, "a")).toBe(true);
    expect(canDeleteUser(incomplete, "a")).toBe(true);
  });

  it("não deixa excluir admin nem a própria conta", () => {
    expect(canDeleteUser(admin, "outro-admin")).toBe(false);
    expect(canDeleteUser(donor, "d")).toBe(false);
  });
});
