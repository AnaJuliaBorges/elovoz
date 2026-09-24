import type { OngForReview, VerificationStatus } from "@/features/ongs";
import { ACTIONS_BY_STATUS, groupByStatus } from "./review";

function ongWith(id: string, status: VerificationStatus): OngForReview {
  return { id, verification_status: status } as OngForReview;
}

describe("groupByStatus", () => {
  it("separa por status mantendo a ordem de chegada", () => {
    const groups = groupByStatus([
      ongWith("a", "pending"),
      ongWith("b", "approved"),
      ongWith("c", "pending"),
      ongWith("d", "rejected"),
    ]);

    expect(groups.pending.map((ong) => ong.id)).toEqual(["a", "c"]);
    expect(groups.approved.map((ong) => ong.id)).toEqual(["b"]);
    expect(groups.rejected.map((ong) => ong.id)).toEqual(["d"]);
  });

  it("devolve os três grupos mesmo sem ONGs", () => {
    expect(groupByStatus([])).toEqual({
      pending: [],
      approved: [],
      rejected: [],
    });
  });
});

describe("ACTIONS_BY_STATUS", () => {
  it("pendente pode ser aprovada ou recusada, e só recusar pede confirmação", () => {
    const [approve, reject] = ACTIONS_BY_STATUS.pending;

    expect(approve).toMatchObject({ to: "approved" });
    expect(approve.confirm).toBeUndefined();
    expect(reject).toMatchObject({ to: "rejected" });
    expect(reject.confirm).toBeDefined();
  });

  it("aprovada só pode ser revogada, com confirmação", () => {
    expect(ACTIONS_BY_STATUS.approved).toEqual([
      expect.objectContaining({ to: "rejected", confirm: expect.anything() }),
    ]);
  });

  it("recusada pode ser aprovada", () => {
    expect(ACTIONS_BY_STATUS.rejected).toEqual([
      expect.objectContaining({ to: "approved" }),
    ]);
  });
});
