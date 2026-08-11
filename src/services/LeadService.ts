import { repositories } from "@/repositories";
import type { InstallmentSelection, Lead, LeadItem, PurchaseMethod } from "@/types/domain";
import { nowIso } from "@/utils/date";
import { createId, createNumber } from "@/utils/id";

export interface CreateLeadInput {
  fullName: string;
  phone: string;
  address: string;
  region: string;
  items: LeadItem[];
  purchaseMethod: PurchaseMethod;
  installment?: InstallmentSelection;
  comment: string;
  source?: Lead["source"];
}

export interface LeadService {
  create(input: CreateLeadInput): Lead;
  reassign(leadId: string, managerId: string, changedByUserId: string, comment?: string): Lead;
  changeStatus(leadId: string, status: Lead["status"], userId: string, comment?: string): Lead;
}

export class LocalLeadService implements LeadService {
  private getNextManagerId(): string {
    const activeManagers = repositories.managers
      .findAll()
      .filter((manager) => manager.status === "active" && manager.acceptsLeads);
    if (!activeManagers.length) return "user-admin";
    const settings = repositories.settings.findAll()[0];
    const index = settings.roundRobinCursor % activeManagers.length;
    const next = activeManagers[index];
    repositories.settings.update(settings.id, {
      roundRobinCursor: (index + 1) % activeManagers.length,
      updatedAt: nowIso(),
    });
    return next.id;
  }

  create(input: CreateLeadInput): Lead {
    const leads = repositories.leads.findAll();
    const now = nowIso();
    const managerId = this.getNextManagerId();
    const lead: Lead = {
      id: createId("lead"),
      number: createNumber("TC2", leads.length),
      ...input,
      source: input.source ?? "site",
      total: input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      managerId,
      status: "new",
      statusHistory: [
        {
          id: createId("history"),
          toStatus: "new",
          changedAt: now,
          changedByUserId: "system",
          comment: "Заявка создана на сайте",
        },
      ],
      reassignmentHistory: [],
      createdAt: now,
      updatedAt: now,
    };
    repositories.leads.create(lead);

    const manager = repositories.managers.findById(managerId);
    if (manager) {
      repositories.managers.update(manager.id, { leadCount: manager.leadCount + 1, updatedAt: now });
    }
    repositories.notifications.create({
      id: createId("notification"),
      userId: manager?.userId ?? "user-admin",
      type: "assignment",
      title: "Новая заявка",
      message: `${lead.number}: ${lead.fullName}`,
      isRead: false,
      link: manager ? "/crm/manager/leads" : "/crm/admin/leads",
      createdAt: now,
      updatedAt: now,
    });
    return lead;
  }

  reassign(leadId: string, managerId: string, changedByUserId: string, comment = "Ручное переназначение"): Lead {
    const lead = repositories.leads.findById(leadId);
    if (!lead) throw new Error("Заявка не найдена");
    return repositories.leads.update(leadId, {
      managerId,
      reassignmentHistory: [
        ...lead.reassignmentHistory,
        {
          id: createId("reassign"),
          fromManagerId: lead.managerId,
          toManagerId: managerId,
          changedByUserId,
          changedAt: nowIso(),
          comment,
        },
      ],
      updatedAt: nowIso(),
    });
  }

  changeStatus(leadId: string, status: Lead["status"], userId: string, comment = "Этап изменён"): Lead {
    const lead = repositories.leads.findById(leadId);
    if (!lead) throw new Error("Заявка не найдена");
    const now = nowIso();
    return repositories.leads.update(leadId, {
      status,
      statusHistory: [
        ...lead.statusHistory,
        {
          id: createId("history"),
          fromStatus: lead.status,
          toStatus: status,
          changedAt: now,
          changedByUserId: userId,
          comment,
        },
      ],
      updatedAt: now,
    });
  }
}

export const leadService: LeadService = new LocalLeadService();
