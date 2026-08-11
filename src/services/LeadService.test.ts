import { beforeEach, describe, expect, it } from "vitest";
import { repositories } from "@/repositories";
import { resetTestRepositories } from "@/test/seedRepositories";
import { LocalLeadService, type CreateLeadInput } from "@/services/LeadService";

const input: CreateLeadInput = {
  fullName: "Тестовый Клиент",
  phone: "+996 555 000 111",
  address: "Бишкек, Токтогула 236",
  region: "Бишкек",
  items: [{ productId: "product-1", productName: "Тестовый товар", quantity: 1, unitPrice: 100_000 }],
  purchaseMethod: "full",
  comment: "",
  source: "site",
};

describe("LocalLeadService round-robin", () => {
  beforeEach(() => resetTestRepositories());

  it("распределяет циклически только между активными менеджерами", () => {
    const service = new LocalLeadService();
    const active = repositories.managers.findAll().filter((item) => item.status === "active" && item.acceptsLeads);
    const assigned = Array.from({ length: active.length + 1 }, () => service.create(input).managerId);
    expect(assigned.slice(0, active.length)).toEqual(active.map((item) => item.id));
    expect(assigned.at(-1)).toBe(active[0].id);
  });

  it("назначает управляющему, когда активных менеджеров нет", () => {
    repositories.managers.replaceAll(repositories.managers.findAll().map((item) => ({ ...item, acceptsLeads: false })));
    expect(new LocalLeadService().create(input).managerId).toBe("user-admin");
  });
});
